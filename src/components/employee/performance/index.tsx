"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import type { PerformanceGoal, GoalCategory, PerformanceReview } from "@/src/lib/types/performance";
import { MY_GOALS_INITIAL, MY_NAME, SELF_ASSESSMENT_DRAFT, MY_REVIEW } from "./components/data";
import { useMyGoals } from "./hooks";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { daysUntil } from "./components/helpers";
import {
  PerformanceStatCards,
  GOAL_CARD_FILTER_LABELS,
  type GoalCardFilter,
} from "./components/stat-cards";
import { ReviewBanner } from "./components/review-banner";
import { OverviewTab } from "./components/overview-tab";
import { GoalsTab } from "./components/goals-tab";
import { ReviewsTab } from "./components/reviews-tab";
import { SelfAssessmentTab } from "./components/self-assessment-tab";
import { GoalDetailModal } from "./components/goal-detail-modal";
import { ProgressUpdateModal } from "./components/progress-update-modal";
import { NewGoalModal } from "./components/new-goal-modal";
import { ReviewDetailModal } from "./components/review-detail-modal";
import { PeerFeedbackModal } from "./components/peer-feedback-modal";

export function MyPerformancePage() {
  const { data: localeGoals } = useMyGoals();
  const currentUser = useAppSelector((s) => s.auth.user);
  const myName = currentUser?.name ?? MY_NAME;
  const [tab, setTab] = useState("overview");
  /** Drill-down set by the KPI cards; "all" shows every goal. */
  const [goalFilter, setGoalFilter] = useState<GoalCardFilter>("all");
  const [goals, setGoals] = useState<PerformanceGoal[]>(
    localeGoals && localeGoals.length ? localeGoals : MY_GOALS_INITIAL,
  );

  const [goalDetail, setGoalDetail] = useState<PerformanceGoal | null>(null);
  const [progressGoal, setProgressGoal] = useState<PerformanceGoal | null>(null);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [reviewDetail, setReviewDetail] = useState<PerformanceReview | null>(null);
  const [peerModal, setPeerModal] = useState(false);
  const [assessSubmitted, setAssessSubmitted] = useState(false);

  const [newProgress, setNewProgress] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [assessment, setAssessment] = useState(SELF_ASSESSMENT_DRAFT);

  const activeGoals = goals.filter((g) => g.status !== "completed" && g.status !== "cancelled");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const atRiskGoals = goals.filter((g) => g.status === "at_risk" || g.status === "overdue");
  const avgProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length)
    : 0;
  const reviewDueIn = daysUntil(MY_REVIEW.dueDate);

  // The KPI cards drill into My Goals, narrowing it to the slice they count.
  const shownActiveGoals =
    goalFilter === "completed"
      ? []
      : goalFilter === "at_risk"
        ? atRiskGoals
        : activeGoals;
  const shownCompletedGoals =
    goalFilter === "all" || goalFilter === "completed" ? completedGoals : [];

  function handleProgressSave() {
    if (!progressGoal) return;
    const val = Math.min(100, Math.max(0, Number(newProgress)));
    setGoals((prev) =>
      prev.map((g) =>
        g.id === progressGoal.id
          ? {
              ...g,
              progress: val,
              status: val === 100 ? "completed" : g.status,
              completedAt: val === 100 ? new Date().toISOString().slice(0, 10) : g.completedAt,
            }
          : g,
      ),
    );
    setProgressGoal(null);
    setNewProgress("");
    setProgressNote("");
  }

  function handleAddGoal(data: {
    title: string;
    desc: string;
    category: GoalCategory;
    dueDate: string;
  }) {
    const goal: PerformanceGoal = {
      id: `pg-me-${Date.now()}`,
      employeeName: myName,
      employeeInitials: currentUser?.initials ?? "AO",
      department: "Engineering",
      goalTitle: data.title,
      description: data.desc || undefined,
      category: data.category,
      status: "on_track",
      progress: 0,
      dueDate: data.dueDate,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setGoals((prev) => [goal, ...prev]);
    setNewGoalOpen(false);
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Performance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your goals, review cycles, and submit your self-assessment.
        </p>
      </div>

      <ReviewBanner
        review={MY_REVIEW}
        reviewDueIn={reviewDueIn}
        onStart={() => setTab("self-assessment")}
      />

      <PerformanceStatCards
        activeGoals={activeGoals.length}
        completedGoals={completedGoals.length}
        avgProgress={avgProgress}
        atRiskGoals={atRiskGoals.length}
        goalFilter={goalFilter}
        onDrillDown={(filter) => {
          setGoalFilter(filter);
          setTab("goals");
        }}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <PageTabsList
          tabs={[
            { value: "overview", label: "Overview" },
            { value: "goals", label: "My Goals" },
            { value: "reviews", label: "Reviews" },
            { value: "self-assessment", label: "Self-Assessment" },
          ]}
        />

        <TabsContent value="overview" className="mt-5">
          <OverviewTab
            goals={goals}
            onGoToGoals={() => setTab("goals")}
            onGoalDetail={setGoalDetail}
            onPeerModal={() => setPeerModal(true)}
          />
        </TabsContent>

        <TabsContent value="goals" className="mt-5">
          <GoalsTab
            goals={goals}
            activeGoals={shownActiveGoals}
            completedGoals={shownCompletedGoals}
            filterLabel={
              goalFilter === "all"
                ? undefined
                : GOAL_CARD_FILTER_LABELS[goalFilter]
            }
            onClearFilter={() => setGoalFilter("all")}
            onView={setGoalDetail}
            onUpdateProgress={(g) => {
              setProgressGoal(g);
              setNewProgress(String(g.progress));
            }}
            onNewGoal={() => setNewGoalOpen(true)}
          />
        </TabsContent>

        <TabsContent value="reviews" className="mt-5">
          <ReviewsTab
            onGoToAssessment={() => setTab("self-assessment")}
            onViewReview={setReviewDetail}
          />
        </TabsContent>

        <TabsContent value="self-assessment" className="mt-5">
          <SelfAssessmentTab
            assessment={assessment}
            setAssessment={setAssessment}
            goals={goals}
            assessSubmitted={assessSubmitted}
            onSubmit={() => setAssessSubmitted(true)}
          />
        </TabsContent>
      </Tabs>

      <GoalDetailModal
        goal={goalDetail}
        onClose={() => setGoalDetail(null)}
        onUpdateProgress={(g) => {
          setProgressGoal(g);
          setNewProgress(String(g.progress));
        }}
      />

      <ProgressUpdateModal
        goal={progressGoal}
        newProgress={newProgress}
        progressNote={progressNote}
        setNewProgress={setNewProgress}
        setProgressNote={setProgressNote}
        onSave={handleProgressSave}
        onClose={() => setProgressGoal(null)}
      />

      <NewGoalModal
        open={newGoalOpen}
        onClose={() => setNewGoalOpen(false)}
        onAdd={handleAddGoal}
      />

      <ReviewDetailModal
        review={reviewDetail}
        onClose={() => setReviewDetail(null)}
      />

      <PeerFeedbackModal
        open={peerModal}
        onClose={() => setPeerModal(false)}
      />
    </div>
  );
}


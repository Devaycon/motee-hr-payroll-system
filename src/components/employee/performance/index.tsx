"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import type {
  PerformanceGoal,
  GoalCategory,
  PerformanceRating,
  PerformanceReview,
  SelfAssessment,
} from "@/src/lib/types/performance";
import { EMPTY_SELF_ASSESSMENT } from "./components/data";
import { useMyPerformance, usePerformanceActions } from "./hooks";
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
  const { employeeId, me, data, colleagues, loading } = useMyPerformance();
  const actions = usePerformanceActions();
  const goals = data?.goals ?? [];
  const currentReview = data?.currentReview ?? null;
  const pastReviews = data?.pastReviews ?? [];

  const [tab, setTab] = useState("overview");
  /** Drill-down set by the KPI cards; "all" shows every goal. */
  const [goalFilter, setGoalFilter] = useState<GoalCardFilter>("all");

  // Modals hold an id and read the live record, so they never show stale data.
  const [goalDetailId, setGoalDetailId] = useState<string | null>(null);
  const [progressGoalId, setProgressGoalId] = useState<string | null>(null);
  const goalDetail = goals.find((g) => g.id === goalDetailId) ?? null;
  const progressGoal = goals.find((g) => g.id === progressGoalId) ?? null;
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [reviewDetail, setReviewDetail] = useState<PerformanceReview | null>(null);
  const [peerModal, setPeerModal] = useState(false);

  const [newProgress, setNewProgress] = useState("");
  const [progressNote, setProgressNote] = useState("");

  // The self-assessment form starts from whatever draft the open review holds,
  // and resets when a different review becomes the open one.
  const [assessment, setAssessment] = useState<SelfAssessment>(
    EMPTY_SELF_ASSESSMENT,
  );
  const [selfRating, setSelfRating] = useState<PerformanceRating | null>(null);
  const [loadedReviewId, setLoadedReviewId] = useState<string | null>(null);
  if ((currentReview?.id ?? null) !== loadedReviewId) {
    setLoadedReviewId(currentReview?.id ?? null);
    setAssessment(currentReview?.selfAssessment ?? EMPTY_SELF_ASSESSMENT);
    setSelfRating(currentReview?.selfRating ?? null);
  }

  const activeGoals = goals.filter((g) => g.status !== "completed" && g.status !== "cancelled");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const atRiskGoals = goals.filter((g) => g.status === "at_risk" || g.status === "overdue");
  const avgProgress = activeGoals.length
    ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length)
    : 0;
  const reviewDueIn = currentReview ? daysUntil(currentReview.dueDate) : 0;

  // The KPI cards drill into My Goals, narrowing it to the slice they count.
  const shownActiveGoals =
    goalFilter === "completed"
      ? []
      : goalFilter === "at_risk"
        ? atRiskGoals
        : activeGoals;
  const shownCompletedGoals =
    goalFilter === "all" || goalFilter === "completed" ? completedGoals : [];

  function openProgress(g: PerformanceGoal) {
    setProgressGoalId(g.id);
    setNewProgress(String(g.progress));
    setProgressNote("");
  }

  function handleProgressSave() {
    if (!progressGoal) return;
    const value = Number(newProgress);
    if (Number.isNaN(value)) {
      toast.error("Enter a progress value between 0 and 100.");
      return;
    }
    actions.updateGoalProgress(progressGoal, {
      progress: value,
      note: progressNote,
    });
    toast.success(value >= 100 ? "Goal completed." : "Progress updated.");
    setProgressGoalId(null);
    setNewProgress("");
    setProgressNote("");
  }

  function handleAddGoal(input: {
    title: string;
    desc: string;
    category: GoalCategory;
    dueDate: string;
  }) {
    if (!employeeId) return;
    actions.createGoal({
      employeeId,
      employeeName: me?.fullName ?? "",
      employeeInitials: me?.initials,
      department: me?.departmentName ?? "",
      goalTitle: input.title,
      description: input.desc || undefined,
      category: input.category,
      dueDate: input.dueDate,
    });
    toast.success("Goal added.");
    setNewGoalOpen(false);
  }

  function handleSaveDraft() {
    if (!currentReview) return;
    actions.saveSelfAssessment(currentReview.id, assessment, {
      submit: false,
      selfRating: selfRating ?? undefined,
    });
    toast.success("Draft saved.");
  }

  function handleSubmitAssessment() {
    if (!currentReview || !selfRating) return;
    actions.saveSelfAssessment(currentReview.id, assessment, {
      submit: true,
      selfRating,
    });
    toast.success(`Self-assessment submitted to ${currentReview.reviewer}.`);
  }

  function handleRequestFeedback(fromEmployeeId: string, context: string) {
    if (!employeeId) return;
    actions.requestFeedback({ toEmployeeId: employeeId, fromEmployeeId, context });
  }

  const header = (
    <div className="py-6 w-fit">
      <h1 className="text-4xl font-bold text-foreground">Performance</h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        Track your goals, review cycles, and submit your self-assessment.
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-5 pb-10">
        {header}
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="flex flex-col gap-5 pb-10">
        {header}
        <p className="text-sm text-muted-foreground">
          Your account isn&apos;t linked to an employee record, so there&apos;s
          no performance record to show.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      {header}

      <ReviewBanner
        review={currentReview}
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
            goals={activeGoals}
            currentReview={currentReview}
            lastReview={pastReviews[0] ?? null}
            feedback={data?.feedback ?? []}
            feedbackRequests={data?.feedbackRequests ?? []}
            onGoToGoals={() => setTab("goals")}
            onGoalDetail={(g) => setGoalDetailId(g.id)}
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
            onView={(g) => setGoalDetailId(g.id)}
            onUpdateProgress={openProgress}
            onNewGoal={() => setNewGoalOpen(true)}
          />
        </TabsContent>

        <TabsContent value="reviews" className="mt-5">
          <ReviewsTab
            currentReview={currentReview}
            pastReviews={pastReviews}
            onGoToAssessment={() => setTab("self-assessment")}
            onViewReview={setReviewDetail}
          />
        </TabsContent>

        <TabsContent value="self-assessment" className="mt-5">
          <SelfAssessmentTab
            review={currentReview}
            assessment={assessment}
            setAssessment={setAssessment}
            selfRating={selfRating}
            setSelfRating={setSelfRating}
            goals={goals}
            onSaveDraft={handleSaveDraft}
            onSubmit={handleSubmitAssessment}
          />
        </TabsContent>
      </Tabs>

      <GoalDetailModal
        goal={goalDetail}
        onClose={() => setGoalDetailId(null)}
        onUpdateProgress={openProgress}
      />

      <ProgressUpdateModal
        goal={progressGoal}
        newProgress={newProgress}
        progressNote={progressNote}
        setNewProgress={setNewProgress}
        setProgressNote={setProgressNote}
        onSave={handleProgressSave}
        onClose={() => setProgressGoalId(null)}
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
        colleagues={colleagues}
        onSend={handleRequestFeedback}
      />
    </div>
  );
}

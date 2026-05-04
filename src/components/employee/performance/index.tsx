"use client";

import { useState } from "react";
import {
  Target,
  Star,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  ChevronRight,
  MessageSquare,
  Pencil,
  BarChart3,
  CalendarDays,
  User,
  Send,
  Award,
  Flame,
  BookOpen,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";
import {
  PERFORMANCE_REVIEWS,
  PERFORMANCE_GOALS,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_STYLES,
  REVIEW_TYPE_LABELS,
  REVIEW_TYPE_STYLES,
  GOAL_STATUS_LABELS,
  GOAL_STATUS_STYLES,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_STYLES,
  RATING_LABELS,
} from "@/src/data/performance-demo";
import type {
  PerformanceGoal,
  PerformanceReview,
  GoalCategory,
  GoalStatus,
} from "@/src/lib/types/performance";

// ─── My data (filtered to logged-in employee) ─────────────────────────────────

const MY_NAME = "Adaeze Okonkwo";

const MY_REVIEW: PerformanceReview = {
  id: "pr-me-001",
  employeeName: MY_NAME,
  employeeInitials: "AO",
  jobTitle: "Senior Software Engineer",
  department: "Engineering",
  reviewType: "mid_year",
  period: "H1 2026",
  status: "in_progress",
  reviewer: "Chidinma Okeke",
  dueDate: "2026-04-30",
};

const PAST_REVIEWS: PerformanceReview[] = [
  {
    id: "pr-me-past-001",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    jobTitle: "Senior Software Engineer",
    department: "Engineering",
    reviewType: "annual",
    period: "2025",
    status: "completed",
    reviewer: "Chidinma Okeke",
    rating: 4,
    strengths:
      "Exceptional technical delivery, mentors junior engineers effectively, consistently meets deadlines.",
    improvements: "Could improve stakeholder communication and documentation.",
    comments:
      "A reliable and strong performer. Demonstrates clear growth since joining the engineering team.",
    dueDate: "2025-12-15",
    completedDate: "2025-12-10",
  },
  {
    id: "pr-me-past-002",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    jobTitle: "Software Engineer",
    department: "Engineering",
    reviewType: "mid_year",
    period: "H1 2025",
    status: "completed",
    reviewer: "Chidinma Okeke",
    rating: 4,
    strengths: "Strong problem-solving, self-starter, good team player.",
    improvements: "Take more ownership on high-impact initiatives.",
    comments: "Good first half. Promoted to Senior in Q3.",
    dueDate: "2025-06-30",
    completedDate: "2025-06-28",
  },
];

const MY_GOALS_INITIAL: PerformanceGoal[] = [
  {
    id: "pg-me-001",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    department: "Engineering",
    goalTitle: "Lead the API Gateway refactor project",
    description:
      "Own the architectural design and delivery of the API gateway refactor, reducing latency by 30%.",
    category: "technical",
    status: "on_track",
    progress: 65,
    dueDate: "2026-06-30",
    createdAt: "2026-01-10",
  },
  {
    id: "pg-me-002",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    department: "Engineering",
    goalTitle: "Complete AWS Solutions Architect certification",
    description:
      "Pass the AWS SAA-C03 exam and add the certification to my profile.",
    category: "growth",
    status: "on_track",
    progress: 45,
    dueDate: "2026-07-31",
    createdAt: "2026-02-01",
  },
  {
    id: "pg-me-003",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    department: "Engineering",
    goalTitle: "Mentor 2 junior engineers on code review practices",
    description:
      "Hold bi-weekly sessions and provide structured feedback on PRs for at least 2 junior engineers.",
    category: "leadership",
    status: "on_track",
    progress: 80,
    dueDate: "2026-05-31",
    createdAt: "2026-01-15",
  },
  {
    id: "pg-me-004",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    department: "Engineering",
    goalTitle: "Improve unit test coverage to 85%",
    description:
      "Increase test coverage across all owned services from ~60% to 85%.",
    category: "technical",
    status: "at_risk",
    progress: 38,
    dueDate: "2026-04-30",
    createdAt: "2026-01-10",
  },
  {
    id: "pg-me-005",
    employeeName: MY_NAME,
    employeeInitials: "AO",
    department: "Engineering",
    goalTitle: "Deliver internal React component library v1",
    description:
      "Design, build and document a shared internal component library for all frontend teams.",
    category: "operational",
    status: "completed",
    progress: 100,
    dueDate: "2026-03-31",
    createdAt: "2025-12-01",
    completedAt: "2026-03-22",
  },
];

const SELF_ASSESSMENT_DRAFT = {
  achievements:
    "Led the API Gateway refactor design, onboarded two junior engineers, and shipped the internal React component library ahead of schedule.",
  challenges:
    "Balancing deep-work coding sessions with increased meeting load during Q1. Time management for certification study has been a challenge.",
  developmentAreas:
    "I want to strengthen my public speaking and stakeholder communication skills, and deepen my distributed systems knowledge.",
  managerFeedback: "",
};

const PEER_SUGGESTIONS = [
  { name: "Chukwuemeka Eze", initials: "CE", title: "Backend Engineer" },
  { name: "Kelechi Onyekachi", initials: "KO", title: "Frontend Engineer" },
  { name: "Blessing Okafor", initials: "BO", title: "Finance Analyst" },
];

const CATEGORY_OPTIONS: GoalCategory[] = [
  "technical",
  "leadership",
  "communication",
  "growth",
  "operational",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "w-3.5 h-3.5",
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

function ProgressBar({
  value,
  color = "#7F77DD",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-semibold tabular-nums text-foreground w-7 text-right">
        {value}%
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ActiveTab = "overview" | "goals" | "reviews" | "self-assessment";

export function MyPerformancePage() {
  const [tab, setTab] = useState<ActiveTab>("overview");
  const [goals, setGoals] = useState<PerformanceGoal[]>(MY_GOALS_INITIAL);

  const [goalDetail, setGoalDetail] = useState<PerformanceGoal | null>(null);
  const [progressGoal, setProgressGoal] = useState<PerformanceGoal | null>(
    null,
  );
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [reviewDetail, setReviewDetail] = useState<PerformanceReview | null>(
    null,
  );
  const [peerModal, setPeerModal] = useState(false);
  const [assessSubmitted, setAssessSubmitted] = useState(false);

  const [newProgress, setNewProgress] = useState("");
  const [progressNote, setProgressNote] = useState("");

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalCat, setNewGoalCat] = useState<GoalCategory | "">("");
  const [newGoalDue, setNewGoalDue] = useState("");

  const [peerName, setPeerName] = useState("");
  const [peerContext, setPeerContext] = useState("");
  const [peerSent, setPeerSent] = useState(false);

  const [assessment, setAssessment] = useState(SELF_ASSESSMENT_DRAFT);

  // Derived stats
  const activeGoals = goals.filter(
    (g) => g.status !== "completed" && g.status !== "cancelled",
  );
  const completedGoals = goals.filter((g) => g.status === "completed");
  const atRiskGoals = goals.filter(
    (g) => g.status === "at_risk" || g.status === "overdue",
  );
  const avgProgress = activeGoals.length
    ? Math.round(
        activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length,
      )
    : 0;
  const reviewDueIn = daysUntil(MY_REVIEW.dueDate);

  // ── Handlers ────────────────────────────────────────────────────────────────

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
              completedAt:
                val === 100
                  ? new Date().toISOString().slice(0, 10)
                  : g.completedAt,
            }
          : g,
      ),
    );
    setProgressGoal(null);
    setNewProgress("");
    setProgressNote("");
  }

  function handleAddGoal() {
    if (!newGoalTitle || !newGoalCat || !newGoalDue) return;
    const goal: PerformanceGoal = {
      id: `pg-me-${Date.now()}`,
      employeeName: MY_NAME,
      employeeInitials: "AO",
      department: "Engineering",
      goalTitle: newGoalTitle,
      description: newGoalDesc || undefined,
      category: newGoalCat as GoalCategory,
      status: "on_track",
      progress: 0,
      dueDate: newGoalDue,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setGoals((prev) => [goal, ...prev]);
    setNewGoalOpen(false);
    setNewGoalTitle("");
    setNewGoalDesc("");
    setNewGoalCat("");
    setNewGoalDue("");
  }

  function handlePeerSend() {
    setPeerSent(true);
    setTimeout(() => {
      setPeerSent(false);
      setPeerName("");
      setPeerContext("");
      setPeerModal(false);
    }, 1500);
  }

  function handleAssessmentSubmit() {
    setAssessSubmitted(true);
  }

  const TABS: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "goals", label: "My Goals", icon: Target },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "self-assessment", label: "Self-Assessment", icon: BookOpen },
  ];

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Performance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your goals, review cycles, and submit your self-assessment.
        </p>
      </div>

      {/* Review cycle banner */}
      {MY_REVIEW.status !== "completed" && (
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg border",
            reviewDueIn <= 5
              ? "bg-red-500/10 border-red-500/30"
              : "bg-[#7F77DD]/10 border-[#7F77DD]/30",
          )}
        >
          <Flame
            className={cn(
              "w-4 h-4 shrink-0",
              reviewDueIn <= 5 ? "text-red-500" : "text-[#7F77DD]",
            )}
          />
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-xs font-semibold",
                reviewDueIn <= 5 ? "text-red-600" : "text-[#7F77DD]",
              )}
            >
              {reviewDueIn <= 0
                ? "Self-Assessment Overdue"
                : `Self-Assessment due in ${reviewDueIn} day${reviewDueIn !== 1 ? "s" : ""}`}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {MY_REVIEW.reviewType === "mid_year"
                ? "Mid-Year"
                : REVIEW_TYPE_LABELS[MY_REVIEW.reviewType]}{" "}
              Review · {MY_REVIEW.period} · Reviewer: {MY_REVIEW.reviewer}
            </p>
          </div>
          <Button
            size="sm"
            className={cn(
              "h-8 text-xs gap-1.5 shrink-0",
              reviewDueIn <= 5
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-[#7F77DD] hover:bg-[#6c64cc] text-white",
            )}
            onClick={() => setTab("self-assessment")}
          >
            Start Assessment <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Active Goals",
            value: activeGoals.length,
            icon: Target,
            color: "#7F77DD",
          },
          {
            label: "Goals Completed",
            value: completedGoals.length,
            icon: CheckCircle2,
            color: "#1D9E75",
          },
          {
            label: "Avg. Goal Progress",
            value: `${avgProgress}%`,
            icon: TrendingUp,
            color: "#2563EB",
          },
          {
            label: "At Risk / Overdue",
            value: atRiskGoals.length,
            icon: AlertCircle,
            color: "#EF4444",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${s.color}18` }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">
                  {s.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-[#7F77DD] text-[#7F77DD]"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Overview ── */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          {/* Goal progress summary */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Goal Progress Snapshot
            </p>
            <div className="flex flex-col gap-3">
              {goals.slice(0, 5).map((g) => {
                const statusColors: Record<GoalStatus, string> = {
                  on_track: "#1D9E75",
                  at_risk: "#F59E0B",
                  completed: "#2563EB",
                  overdue: "#EF4444",
                  cancelled: "#6B7280",
                };
                return (
                  <Card
                    key={g.id}
                    className="cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => setGoalDetail(g)}
                  >
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span
                              className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                                GOAL_CATEGORY_STYLES[g.category],
                              )}
                            >
                              {GOAL_CATEGORY_LABELS[g.category]}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-foreground leading-snug">
                            {g.goalTitle}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0",
                            GOAL_STATUS_STYLES[g.status],
                          )}
                        >
                          {GOAL_STATUS_LABELS[g.status]}
                        </span>
                      </div>
                      <ProgressBar
                        value={g.progress}
                        color={statusColors[g.status]}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Due {formatDate(g.dueDate)}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="self-start h-8 text-xs gap-1.5"
              onClick={() => setTab("goals")}
            >
              View all goals <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-4">
            {/* Last rating */}
            {PAST_REVIEWS[0]?.rating && (
              <Card>
                <CardContent className="p-4 flex flex-col gap-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Last Review Rating
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Award className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <StarRating rating={PAST_REVIEWS[0].rating} />
                        <span className="text-sm font-bold text-foreground">
                          {PAST_REVIEWS[0].rating}/5
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground font-medium">
                        {RATING_LABELS[PAST_REVIEWS[0].rating]}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {PAST_REVIEWS[0].period} · by {PAST_REVIEWS[0].reviewer}
                      </p>
                    </div>
                  </div>
                  {PAST_REVIEWS[0].strengths && (
                    <div className="rounded-lg bg-muted/40 border border-border p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">
                        Manager's highlights
                      </p>
                      <p className="text-[11px] text-foreground leading-relaxed">
                        {PAST_REVIEWS[0].strengths}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Peer feedback CTA */}
            <Card>
              <CardContent className="p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Peer Feedback
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Request feedback from a colleague to strengthen your
                  self-assessment.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setPeerModal(true)}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Request Peer
                  Feedback
                </Button>
              </CardContent>
            </Card>

            {/* Review timeline */}
            <Card>
              <CardContent className="p-4 flex flex-col gap-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Review Timeline
                </p>
                <div className="flex flex-col gap-3 relative pl-4">
                  <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
                  {[
                    {
                      label: "H1 2026 Review opened",
                      date: "2026-04-01",
                      done: true,
                    },
                    {
                      label: "Self-assessment due",
                      date: MY_REVIEW.dueDate,
                      done: false,
                    },
                    {
                      label: "Manager review",
                      date: "2026-05-10",
                      done: false,
                    },
                    {
                      label: "Review discussion",
                      date: "2026-05-20",
                      done: false,
                    },
                    {
                      label: "Review finalised",
                      date: "2026-05-31",
                      done: false,
                    },
                  ].map((e, i) => (
                    <div key={i} className="relative flex items-start gap-2.5">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full border-2 shrink-0 mt-0.5 -ml-5",
                          e.done
                            ? "bg-[#1D9E75] border-[#1D9E75]"
                            : "bg-background border-border",
                        )}
                      />
                      <div>
                        <p
                          className={cn(
                            "text-[11px] font-medium",
                            e.done
                              ? "text-muted-foreground line-through"
                              : "text-foreground",
                          )}
                        >
                          {e.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(e.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── TAB: Goals ── */}
      {tab === "goals" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              My Goals ({goals.length})
            </p>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
              onClick={() => setNewGoalOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" /> Add Goal
            </Button>
          </div>

          {/* Active */}
          {activeGoals.length > 0 && (
            <div className="flex flex-col gap-3">
              {activeGoals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onView={setGoalDetail}
                  onUpdateProgress={(g) => {
                    setProgressGoal(g);
                    setNewProgress(String(g.progress));
                  }}
                />
              ))}
            </div>
          )}

          {/* Completed */}
          {completedGoals.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-2 mt-2">
                Completed
              </p>
              <div className="flex flex-col gap-2">
                {completedGoals.map((g) => (
                  <GoalCard key={g.id} goal={g} onView={setGoalDetail} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Reviews ── */}
      {tab === "reviews" && (
        <div className="flex flex-col gap-5">
          {/* Active review */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Active Review
            </p>
            <Card className="border-[#7F77DD]/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#7F77DD]/10 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-[#7F77DD]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                        REVIEW_TYPE_STYLES[MY_REVIEW.reviewType],
                      )}
                    >
                      {REVIEW_TYPE_LABELS[MY_REVIEW.reviewType]}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                        REVIEW_STATUS_STYLES[MY_REVIEW.status],
                      )}
                    >
                      {REVIEW_STATUS_LABELS[MY_REVIEW.status]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {MY_REVIEW.period} Performance Review
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Reviewer: {MY_REVIEW.reviewer} · Due{" "}
                    {formatDate(MY_REVIEW.dueDate)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-[#7F77DD] hover:bg-[#6c64cc] text-white gap-1.5 shrink-0"
                  onClick={() => setTab("self-assessment")}
                >
                  <Pencil className="w-3.5 h-3.5" /> Self-Assessment
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Past reviews */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Review History
            </p>
            <div className="flex flex-col gap-3">
              {PAST_REVIEWS.map((r) => (
                <Card
                  key={r.id}
                  className="cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => setReviewDetail(r)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-[#1D9E75]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                            REVIEW_TYPE_STYLES[r.reviewType],
                          )}
                        >
                          {REVIEW_TYPE_LABELS[r.reviewType]}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {r.period} Performance Review
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Reviewer: {r.reviewer}
                        {r.completedDate
                          ? ` · Completed ${formatDate(r.completedDate)}`
                          : ""}
                      </p>
                    </div>
                    {r.rating && (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StarRating rating={r.rating} />
                        <p className="text-[10px] text-muted-foreground">
                          {RATING_LABELS[r.rating]}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Self-Assessment ── */}
      {tab === "self-assessment" && (
        <div className="max-w-2xl flex flex-col gap-5">
          {assessSubmitted ? (
            <Card>
              <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#1D9E75]" />
                <p className="text-base font-semibold text-foreground">
                  Self-Assessment Submitted
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Your self-assessment for {MY_REVIEW.period} has been submitted
                  to {MY_REVIEW.reviewer}. You'll be notified when the manager
                  review is complete.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Context card */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#7F77DD]/10 border border-[#7F77DD]/30">
                <BookOpen className="w-4 h-4 text-[#7F77DD] shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#7F77DD]">
                    {MY_REVIEW.period} —{" "}
                    {REVIEW_TYPE_LABELS[MY_REVIEW.reviewType]} Review
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Reviewer: {MY_REVIEW.reviewer} · Due{" "}
                    {formatDate(MY_REVIEW.dueDate)}
                  </p>
                </div>
              </div>

              {/* Form sections */}
              {[
                {
                  field: "achievements" as keyof typeof assessment,
                  label: "Key Achievements",
                  placeholder:
                    "Describe your most significant accomplishments this period — projects completed, targets hit, impact delivered…",
                  hint: "Focus on measurable outcomes and business impact.",
                },
                {
                  field: "challenges" as keyof typeof assessment,
                  label: "Challenges & How You Overcame Them",
                  placeholder:
                    "What obstacles did you face? How did you handle them?",
                  hint: "Be honest — this shows self-awareness and growth mindset.",
                },
                {
                  field: "developmentAreas" as keyof typeof assessment,
                  label: "Development Areas",
                  placeholder:
                    "What skills or behaviours would you like to develop further in the next period?",
                  hint: "Tie these to your goals or the competencies expected at your level.",
                },
                {
                  field: "managerFeedback" as keyof typeof assessment,
                  label: "What Support Do You Need From Your Manager?",
                  placeholder:
                    "Training budget, stretch assignments, more frequent 1-1s, clearer priorities…",
                  hint: "This is your opportunity to ask for what you need.",
                },
              ].map((section) => (
                <Card key={section.field}>
                  <CardContent className="p-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-foreground">
                      {section.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {section.hint}
                    </p>
                    <Textarea
                      value={assessment[section.field]}
                      onChange={(e) =>
                        setAssessment((prev) => ({
                          ...prev,
                          [section.field]: e.target.value,
                        }))
                      }
                      placeholder={section.placeholder}
                      className="text-xs min-h-24 resize-none mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground text-right">
                      {assessment[section.field].length} chars
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Goals reference */}
              <Card>
                <CardContent className="p-4 flex flex-col gap-3">
                  <p className="text-xs font-semibold text-foreground">
                    Goal Progress Reference
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Your manager will see these alongside your assessment.
                  </p>
                  <div className="flex flex-col gap-2">
                    {goals.map((g) => (
                      <div key={g.id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-foreground truncate">
                            {g.goalTitle}
                          </p>
                        </div>
                        <ProgressBar
                          value={g.progress}
                          color={
                            g.status === "completed"
                              ? "#1D9E75"
                              : g.status === "at_risk"
                                ? "#F59E0B"
                                : "#7F77DD"
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
                  onClick={handleAssessmentSubmit}
                >
                  <Send className="w-3.5 h-3.5" /> Submit Self-Assessment
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Goal Detail Modal ── */}
      <Dialog open={!!goalDetail} onOpenChange={() => setGoalDetail(null)}>
        <DialogContent className="sm:max-w-md">
          {goalDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                        GOAL_CATEGORY_STYLES[goalDetail.category],
                      )}
                    >
                      {GOAL_CATEGORY_LABELS[goalDetail.category]}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                        GOAL_STATUS_STYLES[goalDetail.status],
                      )}
                    >
                      {GOAL_STATUS_LABELS[goalDetail.status]}
                    </span>
                  </div>
                </div>
                <DialogTitle className="text-sm font-semibold mt-1">
                  {goalDetail.goalTitle}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-1">
                {goalDetail.description && (
                  <p className="text-xs text-muted-foreground">
                    {goalDetail.description}
                  </p>
                )}
                <ProgressBar value={goalDetail.progress} />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Due date",
                      value: formatDate(goalDetail.dueDate),
                    },
                    {
                      label: "Created",
                      value: formatDate(goalDetail.createdAt),
                    },
                    ...(goalDetail.completedAt
                      ? [
                          {
                            label: "Completed",
                            value: formatDate(goalDetail.completedAt),
                          },
                        ]
                      : []),
                  ].map((r) => (
                    <div key={r.label} className="flex flex-col gap-0.5">
                      <p className="text-[10px] text-muted-foreground">
                        {r.label}
                      </p>
                      <p className="text-xs font-medium text-foreground">
                        {r.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setGoalDetail(null)}
                >
                  Close
                </Button>
                {goalDetail.status !== "completed" &&
                  goalDetail.status !== "cancelled" && (
                    <Button
                      size="sm"
                      className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white gap-1"
                      onClick={() => {
                        setProgressGoal(goalDetail);
                        setNewProgress(String(goalDetail.progress));
                        setGoalDetail(null);
                      }}
                    >
                      <Pencil className="w-3 h-3" /> Update Progress
                    </Button>
                  )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Progress Update Modal ── */}
      <Dialog open={!!progressGoal} onOpenChange={() => setProgressGoal(null)}>
        <DialogContent className="sm:max-w-sm">
          {progressGoal && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-[#7F77DD]/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#7F77DD]" />
                  </div>
                  <DialogTitle className="text-sm font-semibold">
                    Update Progress
                  </DialogTitle>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                  {progressGoal.goalTitle}
                </p>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium">Progress (%)</p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newProgress}
                      onChange={(e) => setNewProgress(e.target.value)}
                      className="h-8 text-xs w-24"
                    />
                    <div className="flex-1">
                      <ProgressBar
                        value={Math.min(
                          100,
                          Math.max(0, Number(newProgress) || 0),
                        )}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium">
                    Update note{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </p>
                  <Textarea
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    placeholder="What did you accomplish since the last update?"
                    className="text-xs min-h-16 resize-none"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setProgressGoal(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
                  onClick={handleProgressSave}
                >
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── New Goal Modal ── */}
      <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#7F77DD]/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-[#7F77DD]" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                Add New Goal
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">Goal title</p>
              <Input
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="e.g. Complete AWS certification"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">
                Description{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </p>
              <Textarea
                value={newGoalDesc}
                onChange={(e) => setNewGoalDesc(e.target.value)}
                placeholder="Describe what success looks like…"
                className="text-xs min-h-16 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Category</p>
                <Select
                  value={newGoalCat}
                  onValueChange={(v) => setNewGoalCat(v as GoalCategory)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">
                        {GOAL_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Target date</p>
                <Input
                  type="date"
                  value={newGoalDue}
                  onChange={(e) => setNewGoalDue(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => setNewGoalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
              onClick={handleAddGoal}
              disabled={!newGoalTitle || !newGoalCat || !newGoalDue}
            >
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Review Detail Modal ── */}
      <Dialog open={!!reviewDetail} onOpenChange={() => setReviewDetail(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          {reviewDetail && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                      REVIEW_TYPE_STYLES[reviewDetail.reviewType],
                    )}
                  >
                    {REVIEW_TYPE_LABELS[reviewDetail.reviewType]}
                  </span>
                  <DialogTitle className="text-sm font-semibold">
                    {reviewDetail.period} Review
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-1">
                {reviewDetail.rating && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <StarRating rating={reviewDetail.rating} />
                    <span className="text-sm font-bold text-foreground">
                      {reviewDetail.rating}/5
                    </span>
                    <span className="text-xs text-muted-foreground">
                      — {RATING_LABELS[reviewDetail.rating]}
                    </span>
                  </div>
                )}
                {reviewDetail.completedDate && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    Completed {formatDate(reviewDetail.completedDate)} by{" "}
                    {reviewDetail.reviewer}
                  </p>
                )}
                <Separator />
                {[
                  { label: "Strengths", value: reviewDetail.strengths },
                  {
                    label: "Areas for improvement",
                    value: reviewDetail.improvements,
                  },
                  { label: "Manager comments", value: reviewDetail.comments },
                ]
                  .filter((s) => s.value)
                  .map((s) => (
                    <div key={s.label} className="flex flex-col gap-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {s.label}
                      </p>
                      <p className="text-xs text-foreground leading-relaxed">
                        {s.value}
                      </p>
                    </div>
                  ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Peer Feedback Modal ── */}
      <Dialog open={peerModal} onOpenChange={setPeerModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#7F77DD]/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-[#7F77DD]" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                Request Peer Feedback
              </DialogTitle>
            </div>
          </DialogHeader>
          {peerSent ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#1D9E75] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1D9E75]">
                Feedback request sent
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Select colleague</p>
                <Select value={peerName} onValueChange={setPeerName}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Choose a colleague" />
                  </SelectTrigger>
                  <SelectContent>
                    {PEER_SUGGESTIONS.map((p) => (
                      <SelectItem
                        key={p.name}
                        value={p.name}
                        className="text-xs"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#7F77DD]/20 text-[#7F77DD] text-[9px] font-bold flex items-center justify-center">
                            {p.initials}
                          </span>
                          {p.name} · {p.title}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">
                  Context for reviewer{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </p>
                <Textarea
                  value={peerContext}
                  onChange={(e) => setPeerContext(e.target.value)}
                  placeholder="e.g. We worked together on the API Gateway project — your feedback on my technical communication would be most helpful."
                  className="text-xs min-h-16 resize-none"
                />
              </div>
            </div>
          )}
          {!peerSent && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setPeerModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white gap-1.5"
                onClick={handlePeerSend}
                disabled={!peerName}
              >
                <Send className="w-3.5 h-3.5" /> Send Request
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onView,
  onUpdateProgress,
}: {
  goal: PerformanceGoal;
  onView: (g: PerformanceGoal) => void;
  onUpdateProgress?: (g: PerformanceGoal) => void;
}) {
  const statusColors: Record<GoalStatus, string> = {
    on_track: "#1D9E75",
    at_risk: "#F59E0B",
    completed: "#2563EB",
    overdue: "#EF4444",
    cancelled: "#6B7280",
  };
  const due = daysUntil(goal.dueDate);

  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-sm",
        goal.status === "completed" && "opacity-75",
      )}
    >
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                  GOAL_CATEGORY_STYLES[goal.category],
                )}
              >
                {GOAL_CATEGORY_LABELS[goal.category]}
              </span>
            </div>
            <p className="text-xs font-semibold text-foreground leading-snug">
              {goal.goalTitle}
            </p>
            {goal.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                {goal.description}
              </p>
            )}
          </div>
          <span
            className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-bold border shrink-0",
              GOAL_STATUS_STYLES[goal.status],
            )}
          >
            {GOAL_STATUS_LABELS[goal.status]}
          </span>
        </div>

        <ProgressBar value={goal.progress} color={statusColors[goal.status]} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px]">
            <CalendarDays className="w-3 h-3 text-muted-foreground" />
            <span
              className={cn(
                due < 0
                  ? "text-red-500 font-semibold"
                  : due <= 7
                    ? "text-amber-600 font-semibold"
                    : "text-muted-foreground",
              )}
            >
              {goal.status === "completed" && goal.completedAt
                ? `Completed ${formatDate(goal.completedAt)}`
                : due < 0
                  ? `${Math.abs(due)} days overdue`
                  : `Due in ${due} days`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[10px] px-2 text-muted-foreground"
              onClick={() => onView(goal)}
            >
              Details
            </Button>
            {onUpdateProgress &&
              goal.status !== "completed" &&
              goal.status !== "cancelled" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] px-2 border-[#7F77DD]/30 text-[#7F77DD] hover:bg-[#7F77DD]/10"
                  onClick={() => onUpdateProgress(goal)}
                >
                  <TrendingUp className="w-3 h-3 mr-1" /> Update
                </Button>
              )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

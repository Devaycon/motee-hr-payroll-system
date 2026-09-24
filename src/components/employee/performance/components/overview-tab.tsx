import { ChevronRight, MessageSquare, Award } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  GOAL_CATEGORY_STYLES,
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_STYLES,
  GOAL_STATUS_LABELS,
  RATING_LABELS,
} from "@/src/data/performance-demo";
import type {
  FeedbackRequest,
  FeedbackType,
  GoalStatus,
  PerformanceFeedback,
  PerformanceGoal,
  PerformanceReview,
} from "@/src/lib/types/performance";
import { ProgressBar, StarRating, formatDate } from "./helpers";

const STATUS_COLORS: Record<GoalStatus, string> = {
  on_track: "#1D9E75",
  at_risk: "#F59E0B",
  completed: "#2563EB",
  overdue: "#EF4444",
  cancelled: "#6B7280",
};

const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  peer: "Peer",
  upward: "From a report",
  downward: "From a manager",
  manager: "Manager",
};

interface OverviewTabProps {
  goals: PerformanceGoal[];
  currentReview: PerformanceReview | null;
  lastReview: PerformanceReview | null;
  feedback: PerformanceFeedback[];
  feedbackRequests: FeedbackRequest[];
  onGoToGoals: () => void;
  onGoalDetail: (g: PerformanceGoal) => void;
  onPeerModal: () => void;
}

export function OverviewTab({
  goals,
  currentReview,
  lastReview,
  feedback,
  feedbackRequests,
  onGoToGoals,
  onGoalDetail,
  onPeerModal,
}: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Goal Progress Snapshot
        </p>
        <div className="flex flex-col gap-3">
          {goals.length === 0 && (
            <p className="text-xs text-muted-foreground">
              You have no goals yet.
            </p>
          )}
          {goals.slice(0, 5).map((g) => (
            <Card
              key={g.id}
              className="cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => onGoalDetail(g)}
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
                  color={STATUS_COLORS[g.status]}
                />
                <p className="text-[10px] text-muted-foreground">
                  Due {formatDate(g.dueDate)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="self-start h-8 text-xs gap-1.5"
          onClick={onGoToGoals}
        >
          View all goals <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {lastReview?.rating && (
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
                    <StarRating rating={lastReview.rating} />
                    <span className="text-sm font-bold text-foreground">
                      {lastReview.rating}/5
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground font-medium">
                    {RATING_LABELS[lastReview.rating]}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {lastReview.period} · by {lastReview.reviewer}
                  </p>
                </div>
              </div>
              {(lastReview.strengths || lastReview.comments) && (
                <div className="rounded-lg bg-muted/40 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">
                    Manager&apos;s highlights
                  </p>
                  <p className="text-[11px] text-foreground leading-relaxed">
                    {lastReview.strengths ?? lastReview.comments}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Feedback
            </p>
            {feedback.length === 0 ? (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No feedback yet. Request some from a colleague to strengthen
                your self-assessment.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {feedback.slice(0, 3).map((f) => (
                  <div
                    key={f.id}
                    className="rounded-lg bg-muted/40 border border-border p-2.5"
                  >
                    <p className="text-[11px] text-foreground leading-relaxed">
                      {f.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {f.fromName ?? FEEDBACK_TYPE_LABELS[f.type]} ·{" "}
                      {formatDate(f.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {feedbackRequests.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Requested
                </p>
                {feedbackRequests.slice(0, 3).map((r) => (
                  <p key={r.id} className="text-[11px] text-foreground">
                    {r.fromName}{" "}
                    <span className="text-muted-foreground">
                      · {formatDate(r.createdAt)}
                    </span>
                  </p>
                ))}
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              onClick={onPeerModal}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Request Peer Feedback
            </Button>
          </CardContent>
        </Card>

        {currentReview && (
          <Card>
            <CardContent className="p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {currentReview.period} Review
              </p>
              <div className="flex flex-col gap-3 relative pl-4">
                <div className="absolute left-1.5 top-1 bottom-1 w-px bg-border" />
                {[
                  {
                    label: "Self-assessment",
                    sub: currentReview.selfSubmittedAt
                      ? `Submitted ${formatDate(currentReview.selfSubmittedAt)}`
                      : `Due ${formatDate(currentReview.dueDate)}`,
                    done: Boolean(currentReview.selfSubmittedAt),
                  },
                  {
                    label: `Manager review · ${currentReview.reviewer}`,
                    sub: currentReview.managerRating
                      ? "Rated"
                      : "Waiting on your manager",
                    done: Boolean(currentReview.managerRating),
                  },
                  {
                    label: "Review finalised",
                    sub: "Rating confirmed and shared with you",
                    done: false,
                  },
                ].map((e) => (
                  <div key={e.label} className="relative flex items-start gap-2.5">
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
                        {e.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

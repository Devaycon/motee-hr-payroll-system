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
import type { PerformanceGoal, GoalStatus } from "@/src/lib/types/performance";
import { PAST_REVIEWS, MY_REVIEW } from "./data";
import { ProgressBar, StarRating, formatDate } from "./helpers";

const STATUS_COLORS: Record<GoalStatus, string> = {
  on_track: "#1D9E75",
  at_risk: "#F59E0B",
  completed: "#2563EB",
  overdue: "#EF4444",
  cancelled: "#6B7280",
};

interface OverviewTabProps {
  goals: PerformanceGoal[];
  onGoToGoals: () => void;
  onGoalDetail: (g: PerformanceGoal) => void;
  onPeerModal: () => void;
}

export function OverviewTab({
  goals,
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
                    Manager&apos;s highlights
                  </p>
                  <p className="text-[11px] text-foreground leading-relaxed">
                    {PAST_REVIEWS[0].strengths}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
              onClick={onPeerModal}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Request Peer Feedback
            </Button>
          </CardContent>
        </Card>

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
                { label: "Manager review", date: "2026-05-10", done: false },
                { label: "Review discussion", date: "2026-05-20", done: false },
                { label: "Review finalised", date: "2026-05-31", done: false },
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
  );
}


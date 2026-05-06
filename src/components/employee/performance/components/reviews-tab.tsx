import { Star, CheckCircle2, Pencil } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  REVIEW_TYPE_STYLES,
  REVIEW_TYPE_LABELS,
  REVIEW_STATUS_STYLES,
  REVIEW_STATUS_LABELS,
  RATING_LABELS,
} from "@/src/data/performance-demo";
import type { PerformanceReview } from "@/src/lib/types/performance";
import { MY_REVIEW, PAST_REVIEWS } from "./data";
import { StarRating, formatDate } from "./helpers";

interface ReviewsTabProps {
  onGoToAssessment: () => void;
  onViewReview: (r: PerformanceReview) => void;
}

export function ReviewsTab({
  onGoToAssessment,
  onViewReview,
}: ReviewsTabProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Active Review
        </p>
        <Card className="border-[#4361ee]/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#4361ee]/10 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-[#4361ee]" />
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
              className="h-8 text-xs bg-[#4361ee] hover:bg-[#3451d1] text-white gap-1.5 shrink-0"
              onClick={onGoToAssessment}
            >
              <Pencil className="w-3.5 h-3.5" /> Self-Assessment
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Review History
        </p>
        <div className="flex flex-col gap-3">
          {PAST_REVIEWS.map((r) => (
            <Card
              key={r.id}
              className="cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => onViewReview(r)}
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
  );
}


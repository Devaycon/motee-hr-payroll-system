import { Flame, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { REVIEW_TYPE_LABELS } from "@/src/data/performance-demo";
import type { PerformanceReview } from "@/src/lib/types/performance";

interface ReviewBannerProps {
  review: PerformanceReview;
  reviewDueIn: number;
  onStart: () => void;
}

export function ReviewBanner({
  review,
  reviewDueIn,
  onStart,
}: ReviewBannerProps) {
  if (review.status === "completed") return null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border",
        reviewDueIn <= 5
          ? "bg-red-500/10 border-red-500/30"
          : "bg-[#4361ee]/10 border-[#4361ee]/30",
      )}
    >
      <Flame
        className={cn(
          "w-4 h-4 shrink-0",
          reviewDueIn <= 5 ? "text-red-500" : "text-[#4361ee]",
        )}
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-semibold",
            reviewDueIn <= 5 ? "text-red-600" : "text-[#4361ee]",
          )}
        >
          {reviewDueIn <= 0
            ? "Self-Assessment Overdue"
            : `Self-Assessment due in ${reviewDueIn} day${reviewDueIn !== 1 ? "s" : ""}`}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {review.reviewType === "mid_year"
            ? "Mid-Year"
            : REVIEW_TYPE_LABELS[review.reviewType]}{" "}
          Review · {review.period} · Reviewer: {review.reviewer}
        </p>
      </div>
      <Button
        size="sm"
        className={cn(
          "h-8 text-xs gap-1.5 shrink-0",
          reviewDueIn <= 5
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-[#4361ee] hover:bg-[#3451d1] text-white",
        )}
        onClick={onStart}
      >
        Start Assessment <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}


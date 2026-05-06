import { CalendarDays } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import {
  REVIEW_TYPE_STYLES,
  REVIEW_TYPE_LABELS,
  RATING_LABELS,
} from "@/src/data/performance-demo";
import type { PerformanceReview } from "@/src/lib/types/performance";
import { StarRating, formatDate } from "./helpers";

interface ReviewDetailModalProps {
  review: PerformanceReview | null;
  onClose: () => void;
}

export function ReviewDetailModal({ review, onClose }: ReviewDetailModalProps) {
  return (
    <Dialog open={!!review} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        {review && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-bold border",
                    REVIEW_TYPE_STYLES[review.reviewType],
                  )}
                >
                  {REVIEW_TYPE_LABELS[review.reviewType]}
                </span>
                <DialogTitle className="text-sm font-semibold">
                  {review.period} Review
                </DialogTitle>
              </div>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-1">
              {review.rating && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <StarRating rating={review.rating} />
                  <span className="text-sm font-bold text-foreground">
                    {review.rating}/5
                  </span>
                  <span className="text-xs text-muted-foreground">
                    — {RATING_LABELS[review.rating]}
                  </span>
                </div>
              )}
              {review.completedDate && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Completed {formatDate(review.completedDate)} by{" "}
                  {review.reviewer}
                </p>
              )}
              <Separator />
              {[
                { label: "Strengths", value: review.strengths },
                { label: "Areas for improvement", value: review.improvements },
                { label: "Manager comments", value: review.comments },
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
  );
}


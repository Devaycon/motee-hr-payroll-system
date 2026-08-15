"use client";

import { useState } from "react";
import { CircleCheck, CircleX, MessageSquareWarning, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import {
  reviewOnboarding,
  toggleHrChecklistItem,
} from "@/src/lib/stores/onboarding-records-slice";
import { formatDateTime } from "@/src/lib/utils/format-date";
import {
  HR_CHECKLIST_ITEMS,
  REVIEW_STATUS_LABELS,
  type OnboardingRecord,
} from "@/src/lib/types/onboarding";
import { cn } from "@/src/lib/utils";

interface ReviewPanelProps {
  record: OnboardingRecord;
}

const STATUS_STYLES: Record<string, string> = {
  not_submitted: "border-border bg-muted text-muted-foreground",
  awaiting_review:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  changes_requested:
    "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400",
  approved:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

/**
 * HR's review of a submitted onboarding pack (client feedback §2.8) plus the
 * post-submission checklist (§2.14). Before this the process stopped dead at
 * "submitted" with nobody accountable for checking what came in.
 */
export function ReviewPanel({ record }: ReviewPanelProps) {
  const dispatch = useAppDispatch();
  const [comment, setComment] = useState("");

  const review = record.review ?? { status: "not_submitted" as const };
  const submitted = Boolean(record.selfOnboardingCompletedAt);
  const decided = review.status === "approved" || review.status === "rejected";

  function decide(status: "approved" | "changes_requested" | "rejected") {
    if (status !== "approved" && !comment.trim()) {
      toast.error("Tell the employee what needs changing.");
      return;
    }
    dispatch(
      reviewOnboarding({
        id: record.id,
        status,
        reviewedBy: "You",
        comment: comment.trim() || undefined,
      }),
    );
    setComment("");
    toast.success(
      status === "approved"
        ? "Onboarding pack approved"
        : status === "rejected"
          ? "Onboarding pack rejected"
          : "Changes requested — the employee can now edit and resubmit",
    );
  }

  const checklist = record.hrChecklist ?? {};
  const doneCount = HR_CHECKLIST_ITEMS.filter((i) => checklist[i.key]).length;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                HR Review
              </h3>
              <Badge
                variant="outline"
                className={cn("text-[10px]", STATUS_STYLES[review.status])}
              >
                {REVIEW_STATUS_LABELS[review.status]}
              </Badge>
            </div>
            {review.reviewedAt && (
              <span className="text-[11px] text-muted-foreground">
                {review.reviewedBy} · {formatDateTime(review.reviewedAt)}
              </span>
            )}
          </div>

          {!submitted ? (
            <p className="text-sm text-muted-foreground">
              Nothing to review yet — the employee hasn&apos;t submitted their
              details.
            </p>
          ) : decided ? (
            <p className="text-sm text-muted-foreground">
              {review.comment ??
                (review.status === "approved"
                  ? "Approved. Payroll and onboarding tasks can proceed."
                  : "Rejected.")}
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="review-comment" className="text-xs">
                  Comment
                  {review.status === "awaiting_review" && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      (required when requesting changes)
                    </span>
                  )}
                </Label>
                <Textarea
                  id="review-comment"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. The passport scan is cut off — please re-upload the photo page."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="gap-1.5" onClick={() => decide("approved")}>
                  <CircleCheck className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => decide("changes_requested")}
                >
                  <MessageSquareWarning className="h-3.5 w-3.5" />
                  Request Changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-destructive"
                  onClick={() => decide("rejected")}
                >
                  <CircleX className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* §2.14 — the things HR has to do once the pack is in. */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                HR Completion Checklist
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {doneCount} of {HR_CHECKLIST_ITEMS.length} done
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {HR_CHECKLIST_ITEMS.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2"
              >
                <Checkbox
                  checked={Boolean(checklist[item.key])}
                  onCheckedChange={(v) =>
                    dispatch(
                      toggleHrChecklistItem({
                        id: record.id,
                        key: item.key,
                        done: v === true,
                      }),
                    )
                  }
                />
                <span className="text-xs text-foreground">{item.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

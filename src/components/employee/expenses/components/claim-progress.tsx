"use client";

import { Check, XCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import {
  claimStagesReached,
  expenseTrackBlurb,
  expenseTrackLabels,
  type ExpenseStage,
} from "@/src/lib/expenses/stages";

interface ClaimProgressProps {
  claim: ExpenseClaim;
  /** The active approval chain — the track is derived from it, never fixed. */
  stages: ExpenseStage[];
}

/**
 * Dot-based approval tracker replacing the flat status pill (client feedback
 * §8.4) — it shows not just where a claim is but what is still ahead of it.
 * The positions come from whichever chain HR has made active, so editing the
 * chain re-draws the tracker rather than leaving it lying.
 */
export function ClaimProgress({ claim, stages }: ClaimProgressProps) {
  const track = expenseTrackLabels(stages);
  const reached = claimStagesReached(claim, stages);

  if (claim.status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }

  const currentLabel =
    reached === 0
      ? claim.returned
        ? "Returned"
        : "Draft"
      : track[Math.min(reached - 1, track.length - 1)];

  return (
    <div
      className="flex flex-col gap-1"
      role="img"
      aria-label={`Claim status: ${currentLabel}${
        reached < track.length && reached > 0 ? `, next ${track[reached]}` : ""
      }`}
    >
      <div className="flex items-center gap-1" aria-hidden>
        {track.map((label, i) => (
          <div key={label + i} className="flex items-center gap-1">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                i < reached ? "bg-primary" : "bg-muted-foreground/25",
              )}
            />
            {i < track.length - 1 && (
              <span
                className={cn(
                  "h-px w-4",
                  i < reached - 1 ? "bg-primary" : "bg-muted-foreground/25",
                )}
              />
            )}
          </div>
        ))}
      </div>
      <span className="text-[11px] font-medium text-foreground">
        {currentLabel}
      </span>
    </div>
  );
}

/**
 * The same track drawn vertically with the stage names and what each one
 * means. The row version has to fit a table cell; the detail page has the room
 * to say what is still ahead of the claim.
 */
export function ClaimProgressSteps({ claim, stages }: ClaimProgressProps) {
  const track = expenseTrackLabels(stages);
  const reached = claimStagesReached(claim, stages);
  const rejected = claim.status === "rejected";

  return (
    <ol className="space-y-0">
      {track.map((label, i) => {
        const done = i < reached;
        const current = i === reached - 1;
        // A rejected claim stopped at the stage that rejected it — mark that
        // position, not the first one.
        const halted = rejected && i === reached;
        const isLast = i === track.length - 1;
        return (
          <li key={label + i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                  halted && "border-rose-500/40 bg-rose-500/10 text-rose-600",
                  !halted &&
                    done &&
                    "border-primary bg-primary text-primary-foreground",
                  !halted &&
                    !done &&
                    "border-border bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {halted ? (
                  <XCircle className="h-3.5 w-3.5" />
                ) : done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </span>
              {!isLast && (
                <span
                  className={cn(
                    "w-px flex-1 min-h-6",
                    done && !rejected ? "bg-primary" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
            </div>
            <div className={cn("pb-4", isLast && "pb-0")}>
              <p
                className={cn(
                  "text-xs font-medium",
                  done || halted ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
                {current && !rejected && (
                  <span className="ml-1.5 text-[10px] font-normal text-primary">
                    · current
                  </span>
                )}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {halted ? "Reviewed and rejected" : expenseTrackBlurb(i, stages)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

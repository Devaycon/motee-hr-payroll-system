"use client";

import { XCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { ExpenseStatus } from "@/src/data/employee-expenses-demo";

/** The happy path a claim walks, in order. */
const STAGES = ["Submitted", "Approved", "Finance", "Paid"] as const;

/**
 * How far along each status sits. `draft` has not entered the track yet, and
 * `rejected` leaves it entirely — see the early return below.
 */
const REACHED: Record<Exclude<ExpenseStatus, "rejected">, number> = {
  draft: 0,
  submitted: 1,
  approved: 2,
  reimbursed: 4,
};

interface ClaimProgressProps {
  status: ExpenseStatus;
}

/**
 * Dot-based approval tracker replacing the flat status pill (client feedback
 * §8.4) — it shows not just where a claim is but what is still ahead of it.
 */
export function ClaimProgress({ status }: ClaimProgressProps) {
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }

  const reached = REACHED[status];
  const currentLabel = reached === 0 ? "Draft" : STAGES[reached - 1];

  return (
    <div
      className="flex flex-col gap-1"
      role="img"
      aria-label={`Claim status: ${currentLabel}${
        reached < STAGES.length && reached > 0
          ? `, next ${STAGES[reached]}`
          : ""
      }`}
    >
      <div className="flex items-center gap-1" aria-hidden>
        {STAGES.map((stage, i) => {
          const done = i < reached;
          return (
            <div key={stage} className="flex items-center gap-1">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  done ? "bg-primary" : "bg-muted-foreground/25",
                )}
              />
              {i < STAGES.length - 1 && (
                <span
                  className={cn(
                    "h-px w-4",
                    i < reached - 1 ? "bg-primary" : "bg-muted-foreground/25",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <span className="text-[11px] font-medium text-foreground">
        {currentLabel}
      </span>
    </div>
  );
}

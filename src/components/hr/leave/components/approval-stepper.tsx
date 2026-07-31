"use client";

import { Check, Clock, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { statusPath, type LeaveStage } from "@/src/lib/leave/stages";
import type { LeaveStatus } from "@/src/lib/types/leave";

/**
 * Visualises where a request sits in the approval chain — the client asked to
 * replace the flat Pending/Approved pair with the full path and to highlight
 * the current approver (client feedback round 2, §F4/F7).
 */
export function ApprovalStepper({
  status,
  stages,
  className,
}: {
  status: LeaveStatus;
  stages: LeaveStage[];
  className?: string;
}) {
  if (status === "cancelled") {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        This request was cancelled.
      </p>
    );
  }

  const path = statusPath(stages);
  const currentIndex = path.indexOf(status);
  const rejected = status === "rejected";

  const steps = [
    { label: "Submitted", approver: "" },
    ...stages.map((s) => ({ label: s.label, approver: s.approverLabel })),
    { label: "Approved", approver: "" },
  ];

  return (
    <ol
      className={cn(
        "flex flex-wrap items-start gap-x-1 gap-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5",
        className,
      )}
      aria-label="Approval progress"
    >
      {steps.map((step, i) => {
        // A rejected request stops wherever it was; everything after is dead.
        const done = !rejected && i < currentIndex;
        const current = !rejected && i === currentIndex;
        const isLast = i === steps.length - 1;
        const failed = rejected && i === currentIndex;

        return (
          <li key={`${step.label}-${i}`} className="flex items-center gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  done && "border-emerald-500 bg-emerald-500 text-white",
                  current && "border-primary bg-primary/10 text-primary",
                  failed && "border-rose-500 bg-rose-500 text-white",
                  !done && !current && !failed && "border-border text-transparent",
                )}
              >
                {failed ? (
                  <X className="h-2.5 w-2.5" />
                ) : current ? (
                  <Clock className="h-2.5 w-2.5" />
                ) : (
                  <Check className="h-2.5 w-2.5" />
                )}
              </span>
              <span className="leading-tight">
                <span
                  className={cn(
                    "block text-[11px] font-medium",
                    current && "text-primary",
                    done && "text-foreground",
                    failed && "text-rose-600",
                    !done && !current && !failed && "text-muted-foreground/60",
                  )}
                >
                  {step.label}
                </span>
                {step.approver && (
                  <span className="block text-[9px] text-muted-foreground">
                    {step.approver}
                    {current && " · action needed"}
                  </span>
                )}
              </span>
            </div>
            {!isLast && (
              <span className="text-muted-foreground/30 text-[10px] px-0.5">→</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

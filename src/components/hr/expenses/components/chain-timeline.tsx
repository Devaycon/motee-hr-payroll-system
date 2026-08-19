"use client";

import { Check, Circle, CornerUpLeft, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { formatDateTime } from "@/src/lib/utils/format-date";
import { claimStagesReached, type ExpenseStage } from "@/src/lib/expenses/stages";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";

/**
 * The approval chain with each stage's decision against it. Written against
 * `ExpenseClaim` rather than reusing the approvals hub's `ApprovalChainTimeline`,
 * which is typed to `ApprovalRequest` — synthesising one of those per render
 * would recreate the very duplicate-record problem this module avoids.
 */
export function ExpenseChainTimeline({
  claim,
  stages,
  chainChanged,
}: {
  claim: ExpenseClaim;
  stages: ExpenseStage[];
  /** The active chain differs from the one the claim was filed on. */
  chainChanged?: boolean;
}) {
  // The track counts submission as position 0; stage N is track position N+1.
  const cleared = Math.max(0, claimStagesReached(claim, stages) - 1);
  const rejected = claim.status === "rejected";
  const decisions = claim.decisions ?? [];

  return (
    <Card>
      <CardHeader className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Approval chain
        </h2>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-4">
        {chainChanged && (
          <p className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-700 dark:text-amber-400">
            The approval chain has been edited since this claim was filed, so
            the stages below may not match the ones it started on.
          </p>
        )}

        <ol className="space-y-0">
          {stages.map((stage, i) => {
            const decision = decisions.find((d) => d.stageIndex === i);
            const done = i < cleared;
            const current = i === cleared && !rejected && !decision;
            const halted = decision?.decision === "rejected";
            const returned = decision?.decision === "returned";
            const isLast = i === stages.length - 1;

            return (
              <li key={stage.stepId} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                      halted && "border-rose-500/40 bg-rose-500/10 text-rose-600",
                      returned &&
                        "border-amber-500/40 bg-amber-500/10 text-amber-600",
                      !halted &&
                        !returned &&
                        done &&
                        "border-primary bg-primary text-primary-foreground",
                      !halted &&
                        !returned &&
                        !done &&
                        current &&
                        "border-primary text-primary",
                      !halted &&
                        !returned &&
                        !done &&
                        !current &&
                        "border-border bg-muted text-muted-foreground",
                    )}
                    aria-hidden
                  >
                    {halted ? (
                      <XCircle className="h-4 w-4" />
                    ) : returned ? (
                      <CornerUpLeft className="h-3.5 w-3.5" />
                    ) : done ? (
                      <Check className="h-4 w-4" />
                    ) : current ? (
                      <Circle className="h-2 w-2 fill-current" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  {!isLast && (
                    <span
                      className={cn(
                        "min-h-8 w-px flex-1",
                        done && !rejected ? "bg-primary" : "bg-border",
                      )}
                      aria-hidden
                    />
                  )}
                </div>

                <div className={cn("flex-1 pb-5", isLast && "pb-0")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {stage.label}
                    </p>
                    {current && (
                      <Badge
                        variant="outline"
                        className="border-primary/40 text-[10px] text-primary"
                      >
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {stage.approverLabel}
                    {current && claim.currentApproverName
                      ? ` · ${claim.currentApproverName}`
                      : ""}
                  </p>

                  {decision && (
                    <div className="mt-1.5 space-y-1">
                      <p className="text-[11px] text-muted-foreground">
                        {decision.decision === "approved"
                          ? "Approved"
                          : decision.decision === "rejected"
                            ? "Rejected"
                            : "Returned"}{" "}
                        by{" "}
                        <span className="text-foreground">
                          {decision.actorName}
                        </span>{" "}
                        · {formatDateTime(decision.at)}
                      </p>
                      {decision.note && (
                        <p className="text-xs italic text-muted-foreground">
                          “{decision.note}”
                        </p>
                      )}
                      {decision.signatureDataUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={decision.signatureDataUrl}
                          alt={`Signed by ${decision.actorName}`}
                          className="h-10 rounded border border-border bg-white p-1"
                        />
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}

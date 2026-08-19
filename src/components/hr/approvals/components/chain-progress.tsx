"use client";

import { Check, ChevronRight, CornerUpLeft, Minus, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type {
  ApprovalRequest,
  ApprovalStepInstance,
} from "@/src/lib/types/approvals";

/**
 * Where a submission sits in its approval process — the thing the client said
 * would make this page "significantly more powerful". Everything here is
 * derived from `steps` + `currentStepIndex`, which the engine already
 * maintains; nothing new is stored.
 */

type StepState = "approved" | "current" | "pending" | "rejected" | "returned" | "skipped";

function stepState(
  step: ApprovalStepInstance,
  index: number,
  request: ApprovalRequest,
): StepState {
  if (step.status === "approved") return "approved";
  if (step.status === "rejected") return "rejected";
  if (step.status === "returned") return "returned";
  if (step.status === "skipped") return "skipped";
  if (request.status === "in_progress" && index === request.currentStepIndex)
    return "current";
  return "pending";
}

const STATE_DOT: Record<StepState, string> = {
  approved: "bg-emerald-500 text-white border-emerald-500",
  current: "bg-blue-500 text-white border-blue-500",
  pending: "bg-background text-muted-foreground border-border",
  rejected: "bg-red-500 text-white border-red-500",
  returned: "bg-amber-500 text-white border-amber-500",
  skipped: "bg-muted text-muted-foreground border-border",
};

const STATE_BAR: Record<StepState, string> = {
  approved: "bg-emerald-500",
  current: "bg-blue-500",
  pending: "bg-border",
  rejected: "bg-red-500",
  returned: "bg-amber-500",
  skipped: "bg-muted-foreground/30",
};

function StateIcon({ state }: { state: StepState }) {
  if (state === "approved") return <Check className="size-3" />;
  if (state === "rejected") return <X className="size-3" />;
  if (state === "returned") return <CornerUpLeft className="size-3" />;
  if (state === "skipped") return <Minus className="size-3" />;
  return null;
}

/** "Stage 2 of 4", or what happened instead if the request has closed. */
export function stageCaption(request: ApprovalRequest): string {
  const total = request.steps.length;
  if (total === 0) return "No approval steps";
  switch (request.status) {
    case "approved":
      return `Complete · all ${total} stage${total === 1 ? "" : "s"}`;
    case "rejected":
      return `Rejected at stage ${request.currentStepIndex + 1} of ${total}`;
    case "returned":
      return `Returned at stage ${request.currentStepIndex + 1} of ${total}`;
    case "cancelled":
      return "Withdrawn by submitter";
    case "draft":
      return "Not yet submitted";
    default:
      return `Stage ${request.currentStepIndex + 1} of ${total}`;
  }
}

/**
 * Table-cell variant: the caption over a segmented bar, one segment per stage.
 * Narrow enough to sit beside the other columns and still be read at a glance.
 */
export function ApprovalChainMeter({ request }: { request: ApprovalRequest }) {
  const { steps } = request;
  return (
    <div className="flex min-w-28 flex-col gap-1">
      <span className="text-xs text-foreground">{stageCaption(request)}</span>
      {steps.length > 0 && (
        <div className="flex gap-0.5" aria-hidden>
          {steps.map((step, i) => (
            <span
              key={step.id}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                STATE_BAR[stepState(step, i, request)],
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Full variant: the connected chain, from submission through each approver to
 * the outcome. Used on the detail page and in the queue's row hover card.
 */
export function ApprovalChainProgress({
  request,
  className,
}: {
  request: ApprovalRequest;
  className?: string;
}) {
  const { steps } = request;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <span className="text-xs font-semibold text-foreground">
        {stageCaption(request)}
      </span>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-2">
        <li className="flex items-center gap-1.5">
          <span className="flex size-5 items-center justify-center rounded-full border bg-emerald-500 text-white border-emerald-500">
            <Check className="size-3" />
          </span>
          <span className="text-xs text-muted-foreground">Submitted</span>
        </li>
        {steps.map((step, i) => {
          const state = stepState(step, i, request);
          return (
            <li key={step.id} className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                  STATE_DOT[state],
                )}
              >
                <StateIcon state={state} />
                {state === "pending" || state === "current" ? i + 1 : null}
              </span>
              <span
                className={cn(
                  "text-xs",
                  state === "current"
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.resolvedEmployeeName ?? step.label}
                {state === "current" && " (current)"}
                {state === "skipped" && " (skipped)"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

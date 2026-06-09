"use client";

import {
  Check,
  X,
  CornerUpLeft,
  Circle,
  Dot,
  CalendarOff,
  SkipForward,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import type { ApprovalRequest } from "@/src/lib/types/approvals";
import { formatRelativeDate, STEP_STATUS_STYLES } from "../utils";

/** The chronological activity log (who did what, with notes). */
export function ApprovalActivityLog({ request }: { request: ApprovalRequest }) {
  return (
    <Card>
      <CardHeader className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>
      </CardHeader>
      <CardContent className="px-5 py-4">
        {request.history.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {[...request.history].reverse().map((ev) => (
              <li key={ev.id} className="flex gap-3 text-sm">
                <div className="mt-0.5">
                  <Dot className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-foreground">
                    <span className="font-medium">{ev.actorName}</span>{" "}
                    {ev.type === "submitted"
                      ? "submitted this request"
                      : ev.type === "approved"
                        ? `approved step ${ev.stepOrder}`
                        : ev.type === "rejected"
                          ? `rejected at step ${ev.stepOrder}`
                          : ev.type === "returned"
                            ? `returned to sender from step ${ev.stepOrder}`
                            : ev.type === "resubmitted"
                              ? "resubmitted"
                              : ev.type === "cancelled"
                                ? "withdrew the submission"
                                : "commented"}
                  </span>
                  {ev.note && (
                    <span className="text-xs text-muted-foreground italic mt-0.5">
                      “{ev.note}”
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {formatRelativeDate(ev.at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** The approval-chain timeline showing each desk's status and who holds it. */
export function ApprovalChainTimeline({
  request,
}: {
  request: ApprovalRequest;
}) {
  return (
    <Card>
      <CardHeader className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">Approval chain</h2>
      </CardHeader>
      <CardContent className="px-5 py-4">
        <ol className="space-y-4">
          {request.steps.map((step, i) => {
            const isCurrent =
              request.status === "in_progress" &&
              i === request.currentStepIndex;
            const isTerminal =
              request.status === "rejected" ||
              request.status === "returned" ||
              request.status === "cancelled";
            const isNotReached =
              isTerminal &&
              step.status === "pending" &&
              i > request.currentStepIndex;
            const stepSignature = step.signatureId
              ? request.signatures.find((s) => s.id === step.signatureId)
              : undefined;
            return (
              <li key={step.id} className="relative pl-7">
                <span
                  className={cn(
                    "absolute left-0 top-1 flex items-center justify-center w-5 h-5 rounded-full border text-[10px] font-semibold",
                    step.status === "approved"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : step.status === "rejected"
                        ? "bg-red-500 border-red-500 text-white"
                        : step.status === "returned"
                          ? "bg-amber-500 border-amber-500 text-white"
                          : step.status === "skipped"
                            ? "bg-muted border-border text-muted-foreground"
                            : isNotReached
                              ? "bg-muted/40 border-dashed border-border text-muted-foreground/60"
                              : isCurrent
                                ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                                : "bg-muted border-border text-muted-foreground",
                  )}
                >
                  {step.status === "approved" ? (
                    <Check className="w-3 h-3" />
                  ) : step.status === "rejected" ? (
                    <X className="w-3 h-3" />
                  ) : step.status === "returned" ? (
                    <CornerUpLeft className="w-3 h-3" />
                  ) : step.status === "skipped" ? (
                    <SkipForward className="w-3 h-3" />
                  ) : (
                    <Circle className="w-2.5 h-2.5" />
                  )}
                </span>
                <div className={cn("flex flex-col", isNotReached && "opacity-60")}>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      step.status === "skipped"
                        ? "text-muted-foreground line-through"
                        : isNotReached
                          ? "text-muted-foreground"
                          : "text-foreground",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {step.status === "skipped"
                      ? `Skipped${step.reassignedFromName ? ` — ${step.reassignedFromName} was on leave` : ""}`
                      : isNotReached
                        ? "Not reached — workflow stopped earlier"
                        : `Reviewer: ${step.resolvedEmployeeName ?? "Unassigned"}`}
                  </span>
                  {step.reassignedFromName && step.status !== "skipped" && (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                      <CalendarOff className="w-3 h-3" />
                      Rerouted from {step.reassignedFromName} (on leave)
                    </span>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "mt-1 self-start text-[10px] px-2 py-0.5",
                      isNotReached
                        ? "bg-muted/40 text-muted-foreground/60 border-dashed"
                        : STEP_STATUS_STYLES[step.status],
                    )}
                  >
                    {isNotReached ? "not reached" : step.status}
                  </Badge>
                  {step.decidedAt && step.status !== "skipped" && (
                    <span className="text-[11px] text-muted-foreground mt-1">
                      {formatRelativeDate(step.decidedAt)}
                    </span>
                  )}
                  {step.note && (
                    <span className="text-xs text-muted-foreground italic mt-1">
                      “{step.note}”
                    </span>
                  )}
                  {stepSignature && (
                    <div className="mt-2 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={stepSignature.dataUrl}
                        alt="Signature"
                        className="h-10 max-w-[8rem] object-contain bg-white border border-border rounded-sm p-1"
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Signed by {stepSignature.signerName}
                      </span>
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

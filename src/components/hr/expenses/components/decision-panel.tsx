"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, CornerUpLeft, ShieldAlert, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  advanceClaim,
  rejectClaim,
  returnClaim,
} from "@/src/lib/stores/expenses-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { resolveDeskFrom } from "@/src/lib/expenses/desk";
import {
  currentExpenseStage,
  statusForStageIndex,
  type ExpenseStage,
} from "@/src/lib/expenses/stages";
import { SignatureDialog } from "@/src/components/hr/approvals/components/signature-dialog";
import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";
import type { ApprovalChainTemplate } from "@/src/lib/types/approvals";

interface DecisionPanelProps {
  claim: ExpenseClaim;
  stages: ExpenseStage[];
  template: ApprovalChainTemplate | undefined;
  actor: { name: string; employeeId?: string };
  /** The claim's current stage resolves to this user. */
  onMyDesk: boolean;
  canApprove: boolean;
  /** May act even when the claim isn't on their desk. */
  canOverride: boolean;
  /** Called after a decision that takes the claim off this user's desk. */
  onDecided?: () => void;
}

/**
 * Approve / Reject / Return for one claim. The decision writes straight to the
 * claim — there is no mirrored approval record to keep in step — and the next
 * approver is resolved from the same chain the employee's tracker draws.
 */
export function DecisionPanel({
  claim,
  stages,
  template,
  actor,
  onMyDesk,
  canApprove,
  canOverride,
  onDecided,
}: DecisionPanelProps) {
  const dispatch = useAppDispatch();
  const bundle = useAppSelector((s) => s.locale.data);
  const [note, setNote] = useState("");
  const [signatureOpen, setSignatureOpen] = useState(false);

  const stage = currentExpenseStage(claim, stages);
  const acting = onMyDesk || canOverride;
  const overriding = !onMyDesk && canOverride;
  // The seeded chain requires the reviewer to sign an approval.
  const needsSignature = template?.signatures.reviewerSigns ?? false;

  const submitter = {
    employeeId: claim.employeeId ?? "",
    name: claim.employeeName ?? "",
    initials: claim.employeeInitials ?? "",
    departmentName: claim.department ?? "",
  };

  /** Adds the override to the audit note, so the trail says who really acted. */
  function withOverride(text: string): string {
    if (!overriding) return text;
    const prefix = `Acting on behalf of ${
      claim.currentApproverName ?? "the assigned approver"
    }`;
    return text ? `${prefix} — ${text}` : prefix;
  }

  function notify(title: string, description: string) {
    dispatch(pushNotification({ title, description }));
  }

  function doApprove(signatureDataUrl?: string, noteOverride?: string) {
    // The signature dialog carries its own note field; take it directly rather
    // than round-tripping through state, which wouldn't have updated yet.
    const text = (noteOverride ?? note).trim();
    const fromIndex = claim.stageIndex ?? 0;
    // Who the claim lands with next — resolved now so the desk survives a
    // later change to the approver's availability.
    const desk = resolveDeskFrom(
      fromIndex + 1,
      stages,
      template?.steps ?? [],
      submitter,
      bundle,
    );
    // Status follows the stage actually landed on, not the one merely next in
    // line — the resolver may have walked past a stage nobody can action.
    const toStatus = statusForStageIndex(desk.stageIndex, stages.length);

    dispatch(
      advanceClaim({
        id: claim.id,
        toStatus,
        toStageIndex: desk.stageIndex,
        stageLabel: stage?.label ?? "Review",
        stepId: stage?.stepId,
        nextApprover: {
          employeeId: desk.approverEmployeeId,
          name: desk.approverName,
        },
        actor: actor.name,
        actorEmployeeId: actor.employeeId,
        note: withOverride(text) || undefined,
        signatureDataUrl,
      }),
    );

    const nextStage = stages[desk.stageIndex];
    if (toStatus === "reimbursed") {
      toast.success("Claim reimbursed");
      notify(
        "Expense claim reimbursed",
        `${claim.reference ?? claim.title} has been approved for payment.`,
      );
    } else {
      toast.success(
        `Moved to ${nextStage?.label ?? "the next stage"}${
          nextStage ? ` — ${desk.approverName ?? nextStage.approverLabel}` : ""
        }`,
      );
      notify(
        "Expense claim approved",
        `${claim.reference ?? claim.title} now awaits ${
          desk.approverName ?? nextStage?.approverLabel ?? "the next approver"
        }.`,
      );
    }

    setNote("");
    setSignatureOpen(false);
    onDecided?.();
  }

  function handleApprove() {
    if (needsSignature) {
      setSignatureOpen(true);
      return;
    }
    doApprove();
  }

  function handleReject() {
    if (!note.trim()) {
      toast.error("Add a reason before rejecting.");
      return;
    }
    dispatch(
      rejectClaim({
        id: claim.id,
        reason: withOverride(note.trim()),
        stageLabel: stage?.label,
        stepId: stage?.stepId,
        actor: actor.name,
        actorEmployeeId: actor.employeeId,
      }),
    );
    toast.success("Claim rejected");
    notify(
      "Expense claim rejected",
      `${claim.reference ?? claim.title} was rejected: ${note.trim()}`,
    );
    setNote("");
    onDecided?.();
  }

  function handleReturn() {
    if (!note.trim()) {
      toast.error("Say what needs correcting before sending it back.");
      return;
    }
    dispatch(
      returnClaim({
        id: claim.id,
        reason: withOverride(note.trim()),
        stageLabel: stage?.label,
        stepId: stage?.stepId,
        actor: actor.name,
        actorEmployeeId: actor.employeeId,
      }),
    );
    toast.success("Sent back to the employee");
    notify(
      "Expense claim returned",
      `${claim.reference ?? claim.title} was sent back for correction: ${note.trim()}`,
    );
    setNote("");
    onDecided?.();
  }

  return (
    <Card>
      <CardHeader className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          {stage ? `Your decision — ${stage.label}` : "Your decision"}
        </h2>
      </CardHeader>
      <CardContent className="space-y-3 px-5 py-4">
        {!acting ? (
          // Say why the buttons aren't there, rather than showing live-looking
          // controls that would no-op.
          <p className="text-xs text-muted-foreground">
            {canApprove
              ? `This claim is with ${
                  claim.currentApproverName ?? stage?.approverLabel ?? "another approver"
                }. You'll see it here when it reaches your stage.`
              : "You don't have permission to decide expense claims."}
          </p>
        ) : (
          <>
            {overriding && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Acting on behalf of{" "}
                  {claim.currentApproverName ?? "the assigned approver"}. Your
                  decision is recorded against your name.
                </span>
              </div>
            )}

            <Textarea
              rows={3}
              placeholder="Add a note for the employee or the next approver…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="gap-1.5"
                onClick={handleApprove}
                disabled={!canApprove}
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                className={cn(
                  "gap-1.5 border-amber-500/30 text-amber-600",
                  "hover:bg-amber-500/10 hover:text-amber-600",
                )}
                onClick={handleReturn}
                disabled={!canApprove}
              >
                <CornerUpLeft className="h-4 w-4" />
                Return for correction
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleReject}
                disabled={!canApprove}
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>

            {(claim.attachments?.length ?? 0) === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                This claim has no receipt attached
                {template?.attachments.required
                  ? " and the chain requires one."
                  : "."}
              </p>
            )}
          </>
        )}
      </CardContent>

      {/* placeOnDocument is false for expense claims, so the dialog never
          reads the attachments — it only collects the signature. */}
      <SignatureDialog
        open={signatureOpen}
        onOpenChange={setSignatureOpen}
        attachments={[]}
        placeOnDocument={false}
        onConfirm={(payload) => doApprove(payload.dataUrl, payload.note)}
      />
    </Card>
  );
}

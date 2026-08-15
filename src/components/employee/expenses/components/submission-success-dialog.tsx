"use client";

import { CircleCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";

interface SubmissionSuccessDialogProps {
  open: boolean;
  /** Human-facing claim reference, e.g. EXP-2026-00124. */
  reference: string;
  attachmentCount: number;
  onViewClaim: () => void;
  onSubmitAnother: () => void;
  onClose: () => void;
}

/**
 * Post-submit confirmation (client feedback §9.17). A toast said "Success" and
 * vanished; this states what happens next and offers the obvious follow-on
 * actions, so the employee is not left wondering whether to chase anyone.
 */
export function SubmissionSuccessDialog({
  open,
  reference,
  attachmentCount,
  onViewClaim,
  onSubmitAnother,
  onClose,
}: SubmissionSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CircleCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Expense Submitted
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Your expense claim has been submitted successfully.
          </p>

          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
            <dt className="text-xs text-muted-foreground">Reference ID</dt>
            <dd className="font-mono text-xs text-foreground">{reference}</dd>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="text-xs text-foreground">Pending Approval</dd>
            <dt className="text-xs text-muted-foreground">Receipts</dt>
            <dd className="text-xs text-foreground">
              {attachmentCount === 0
                ? "None attached"
                : `${attachmentCount} attached`}
            </dd>
          </dl>

          <div>
            <p className="text-xs font-medium text-foreground">Next steps</p>
            <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
              <li>· Your approver has been notified.</li>
              <li>· You&apos;ll receive an email when the status changes.</li>
              {attachmentCount === 0 && (
                <li className="text-amber-600 dark:text-amber-400">
                  · No receipt attached — the claim may be returned for one.
                </li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline" onClick={onSubmitAnother}>
            Submit Another
          </Button>
          <Button onClick={onViewClaim}>View Claim</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

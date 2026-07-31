"use client";

import * as React from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateRecord } from "@/src/lib/stores/collection-edits-slice";
import type { RawDocument } from "./hooks";

/**
 * The decision this dialog records is where a rejection reason comes from —
 * without it, a document could sit at "Rejected" with nothing explaining why,
 * which is exactly the dead end the detail view is meant to resolve.
 */
type Decision = "verified" | "rejected" | "pending";

/** Common grounds for refusing a document, so reasons stay consistent. */
const REJECTION_PRESETS = [
  "Image is unreadable or partially cut off",
  "Document has expired",
  "Name does not match the employee record",
  "Wrong document type for this category",
  "Dated more than three months ago",
  "Missing a required page or signature",
];

export function DocumentReviewModal({
  document: doc,
  onClose,
}: {
  document: RawDocument | null;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const [decision, setDecision] = React.useState<Decision>("verified");
  const [preset, setPreset] = React.useState("");
  const [note, setNote] = React.useState("");
  const [prevId, setPrevId] = React.useState<string | null>(null);

  // Reset whenever the dialog opens against a different document.
  if (doc && doc.id !== prevId) {
    setPrevId(doc.id);
    setDecision(doc.status === "rejected" ? "rejected" : "verified");
    setPreset("");
    setNote("");
  }

  if (!doc) return null;

  const reason = [preset, note.trim()].filter(Boolean).join(" — ");
  const needsReason = decision === "rejected";
  const canSubmit = !needsReason || reason.length > 0;

  function submit() {
    if (!doc) return;
    if (needsReason && !reason) {
      toast.error("Give a reason so the employee knows what to fix.");
      return;
    }
    dispatch(
      updateRecord({
        key: "documents",
        id: doc.id,
        patch: {
          status: decision,
          // Cleared on approval so a re-approved document doesn't keep showing
          // the reason it was once refused.
          rejectionReason: decision === "rejected" ? reason : undefined,
          reviewedBy: decision === "pending" ? undefined : actor,
          reviewedAt:
            decision === "pending" ? undefined : new Date().toISOString().slice(0, 10),
        },
      }),
    );
    toast.success(
      decision === "verified"
        ? "Document verified"
        : decision === "rejected"
          ? "Document rejected — the employee can see why"
          : "Document returned to pending",
    );
    onClose();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary/10">
              <ShieldCheck className="size-4 text-primary" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold">Review document</DialogTitle>
              <DialogDescription className="text-xs wrap-break-word">
                {doc.name}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Decision</Label>
            <Select value={decision} onValueChange={(v) => setDecision(v as Decision)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified" className="text-sm">
                  Verify — accepted
                </SelectItem>
                <SelectItem value="rejected" className="text-sm">
                  Reject — needs replacing
                </SelectItem>
                <SelectItem value="pending" className="text-sm">
                  Return to pending
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsReason && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Reason <span className="text-destructive">*</span>
                </Label>
                <Select value={preset} onValueChange={setPreset}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Pick a common reason…" />
                  </SelectTrigger>
                  <SelectContent>
                    {REJECTION_PRESETS.map((r) => (
                      <SelectItem key={r} value={r} className="text-sm">
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Detail{" "}
                  <span className="font-normal text-muted-foreground">
                    (shown to the employee)
                  </span>
                </Label>
                <Textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What exactly needs to change before this can be accepted?"
                  className="text-sm"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            variant={decision === "rejected" ? "destructive" : "default"}
            disabled={!canSubmit}
            onClick={submit}
          >
            Save decision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { PencilLine } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import type { DailyEntry } from "@/src/lib/types/attendance";

export interface CorrectionDraft {
  clockIn: string;
  clockOut: string;
  reason: string;
}

interface CorrectionModalProps {
  entry: DailyEntry | null;
  onClose: () => void;
  onSubmit: (entry: DailyEntry, draft: CorrectionDraft) => void;
}

/**
 * Ask for a past punch to be amended.
 *
 * The employee never edits the record directly — a forgotten clock-out is a
 * claim about what happened, and it should carry a reason and be approved
 * rather than silently overwrite the original reading.
 */
export function CorrectionModal({
  entry,
  onClose,
  onSubmit,
}: CorrectionModalProps) {
  return (
    <Dialog open={!!entry} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-sm">
        {/* Keyed on the day so switching rows remounts the form with that day's
            times, instead of syncing props into state through an effect. */}
        {entry && (
          <CorrectionForm
            key={entry.date}
            entry={entry}
            onClose={onClose}
            onSubmit={onSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CorrectionForm({
  entry,
  onClose,
  onSubmit,
}: {
  entry: DailyEntry;
  onClose: () => void;
  onSubmit: (entry: DailyEntry, draft: CorrectionDraft) => void;
}) {
  const [draft, setDraft] = useState<CorrectionDraft>({
    clockIn: entry.clockIn ?? "",
    clockOut: entry.clockOut ?? "",
    reason: "",
  });

  const unchanged =
    draft.clockIn === (entry.clockIn ?? "") &&
    draft.clockOut === (entry.clockOut ?? "");
  const canSubmit = Boolean(draft.reason.trim()) && !unchanged;

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-[#7F77DD]/10 flex items-center justify-center">
            <PencilLine className="w-4 h-4 text-[#7F77DD]" />
          </div>
          <div>
            <DialogTitle className="text-sm font-semibold">
              Request a correction
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {new Date(entry.date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </div>
      </DialogHeader>

      <div className="flex flex-col gap-3 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correction-in" className="text-xs">
              Clock in
            </Label>
            <Input
              id="correction-in"
              type="time"
              value={draft.clockIn}
              onChange={(e) =>
                setDraft((d) => ({ ...d, clockIn: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="correction-out" className="text-xs">
              Clock out
            </Label>
            <Input
              id="correction-out"
              type="time"
              value={draft.clockOut}
              onChange={(e) =>
                setDraft((d) => ({ ...d, clockOut: e.target.value }))
              }
              className="h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/50 border border-border px-3 py-2">
          <span className="text-[10px] text-muted-foreground">
            Currently recorded
          </span>
          <span className="text-[11px] font-semibold text-foreground tabular-nums">
            {entry.clockIn ?? "—"} → {entry.clockOut ?? "—"}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="correction-reason" className="text-xs">
            Reason
          </Label>
          <Textarea
            id="correction-reason"
            value={draft.reason}
            onChange={(e) =>
              setDraft((d) => ({ ...d, reason: e.target.value }))
            }
            placeholder="e.g. Forgot to clock out before leaving for the client site."
            className="text-xs min-h-16 resize-none"
          />
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white gap-1.5"
          disabled={!canSubmit}
          onClick={() => onSubmit(entry, draft)}
        >
          <PencilLine className="w-3.5 h-3.5" /> Send request
        </Button>
      </DialogFooter>
    </>
  );
}

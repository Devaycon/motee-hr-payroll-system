"use client";

import { BadgeCheck, Radio } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Progress } from "@/src/components/ui/progress";

interface PresenceCheckDialogProps {
  open: boolean;
  /** Seconds remaining before this prompt counts as missed. */
  secondsRemaining: number;
  /** Total response window, for the progress bar. */
  responseWindowSeconds: number;
  onConfirm: () => void;
}

/**
 * "Are you still there?" prompt shown to a clocked-in employee. Deliberately
 * has no dismiss path other than the confirm button — an outside click or
 * Escape would defeat the point of the check.
 */
export function PresenceCheckDialog({
  open,
  secondsRemaining,
  responseWindowSeconds,
  onConfirm,
}: PresenceCheckDialogProps) {
  const pct = responseWindowSeconds
    ? Math.max(0, Math.min(100, (secondsRemaining / responseWindowSeconds) * 100))
    : 0;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-xs"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#4361ee]/10 flex items-center justify-center">
              <Radio className="w-4 h-4 text-[#4361ee]" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              Still there?
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          <p className="text-xs text-muted-foreground">
            Confirm you&apos;re active to keep this clocked-in session marked
            as productive time.
          </p>
          <Progress value={pct} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {secondsRemaining}s remaining
          </p>
        </div>
        <Button
          size="sm"
          className="w-full text-xs h-9 bg-[#4361ee] hover:bg-[#3451d1] text-white gap-1.5"
          onClick={onConfirm}
        >
          <BadgeCheck className="w-3.5 h-3.5" /> I&apos;m here
        </Button>
      </DialogContent>
    </Dialog>
  );
}

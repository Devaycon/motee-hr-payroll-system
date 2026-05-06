"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import { secondsToHHMMSS, secondsToHHMM } from "./helpers";

interface ClockOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workedSeconds: number;
  totalBreakSeconds: number;
  noteOut: string;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
}

export function ClockOutDialog({
  open,
  onOpenChange,
  workedSeconds,
  totalBreakSeconds,
  noteOut,
  onNoteChange,
  onConfirm,
}: ClockOutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-red-500/10 flex items-center justify-center">
              <LogOut className="w-4 h-4 text-red-600" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              Clock Out
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
            <div>
              <p className="text-[10px] text-muted-foreground">
                Time worked so far
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">
                {secondsToHHMMSS(workedSeconds)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Break taken</p>
              <p className="text-sm font-semibold text-foreground tabular-nums">
                {secondsToHHMM(totalBreakSeconds)}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium">
              End-of-day note{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </p>
            <Textarea
              value={noteOut}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Any notes for your manager about today's work…"
              className="text-xs min-h-16 resize-none"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white gap-1.5"
            onClick={onConfirm}
          >
            <LogOut className="w-3.5 h-3.5" /> Confirm Clock Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

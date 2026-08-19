"use client";

import { AlertCircle, Send } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import type { WeeklyTotals } from "@/src/lib/types/attendance";
import { hoursToHHMM } from "@/src/lib/utils/format-duration";

interface SubmitTimesheetDialogProps {
  open: boolean;
  weekLabel: string;
  totals: WeeklyTotals;
  contractedWeekly: number;
  /** Days in the week with no clock-in — worth warning about before submitting. */
  missingDays: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function SubmitTimesheetDialog({
  open,
  weekLabel,
  totals,
  contractedWeekly,
  missingDays,
  onOpenChange,
  onConfirm,
}: SubmitTimesheetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#7F77DD]/10 flex items-center justify-center">
              <Send className="w-4 h-4 text-[#7F77DD]" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold">
                Submit timesheet
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {weekLabel}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total hours", value: `${totals.totalHours}h` },
              { label: "Days present", value: totals.daysPresent },
              {
                label: "Overtime",
                value:
                  totals.overtimeHours > 0
                    ? hoursToHHMM(totals.overtimeHours)
                    : "None",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col gap-0.5 rounded-lg bg-muted/40 border border-border p-3"
              >
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className="text-base font-bold text-foreground tabular-nums">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {contractedWeekly > 0 && totals.totalHours < contractedWeekly && (
            <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                This week is {hoursToHHMM(contractedWeekly - totals.totalHours)}{" "}
                short of your contracted {contractedWeekly}h
                {missingDays > 0
                  ? ` — ${missingDays} day${missingDays === 1 ? "" : "s"} have no clock-in.`
                  : "."}
              </span>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            Once submitted, this week is locked until your manager approves or
            returns it.
          </p>
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
            className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white gap-1.5"
            onClick={onConfirm}
          >
            <Send className="w-3.5 h-3.5" /> Submit for approval
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

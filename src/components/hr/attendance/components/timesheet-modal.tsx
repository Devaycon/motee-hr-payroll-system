"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_STYLES,
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_STYLES,
} from "../data";
import type { TimesheetRecord } from "../types";

interface TimesheetModalProps {
  open: boolean;
  onClose: () => void;
  viewingTimesheet: TimesheetRecord | null;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export function TimesheetModal({
  open,
  onClose,
  viewingTimesheet,
  onApprove,
  onReject,
}: TimesheetModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevTs, setPrevTs] = useState<TimesheetRecord | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  if (open !== prevOpen || viewingTimesheet !== prevTs) {
    setPrevOpen(open);
    setPrevTs(viewingTimesheet);
    if (open) {
      setShowReject(false);
      setRejectReason("");
      setRejectError("");
    }
  }

  if (!viewingTimesheet) return null;

  function formatWeekRange(weekStart: string, weekEnd: string) {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    const startStr = start.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
    });
    const endStr = end.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${startStr} – ${endStr}`;
  }

  function handleConfirmReject() {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a rejection reason");
      return;
    }
    onReject(viewingTimesheet!.id, rejectReason.trim());
    onClose();
  }

  const ts = viewingTimesheet;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                {ts.employeeInitials}
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold leading-tight">
                  {ts.employeeName}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {ts.department} · {formatWeekRange(ts.weekStart, ts.weekEnd)}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium shrink-0 ${TIMESHEET_STATUS_STYLES[ts.status]}`}
            >
              {TIMESHEET_STATUS_LABELS[ts.status]}
            </span>
          </div>
        </DialogHeader>

        {ts.status === "rejected" && ts.rejectionReason && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3.5 py-2.5 text-xs text-destructive">
            <span className="font-semibold">Rejection Reason: </span>
            {ts.rejectionReason}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 py-1">
          {[
            { label: "Total Hours", value: `${ts.totalHours}h` },
            {
              label: "Overtime",
              value: ts.overtimeHours > 0 ? `+${ts.overtimeHours}h` : "—",
            },
            { label: "Days Present", value: ts.daysPresent },
            { label: "Days Absent", value: ts.daysAbsent },
          ].map((item) => (
            <div key={item.label} className="bg-muted/40 rounded-lg px-3 py-2">
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
              <p className="text-sm font-semibold mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">Daily Breakdown</p>
          <ScrollArea className="h-56 rounded-md border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Day
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Date
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Clock In
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Clock Out
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Break
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Hours
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-3 py-2">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {ts.dailyEntries.map((entry, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium">{entry.day}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {entry.clockIn ?? "—"}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {entry.clockOut ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {entry.breakMinutes} min
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {entry.totalHours != null ? `${entry.totalHours}h` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${ATTENDANCE_STATUS_STYLES[entry.status]}`}
                      >
                        {ATTENDANCE_STATUS_LABELS[entry.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/30 font-semibold">
                  <td colSpan={5} className="px-3 py-2 text-xs">
                    Totals
                  </td>
                  <td className="px-3 py-2 text-xs">{ts.totalHours}h</td>
                  <td className="px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                    {ts.overtimeHours > 0 ? `+${ts.overtimeHours}h OT` : ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </ScrollArea>
        </div>

        {ts.status === "submitted" && (
          <div className="space-y-2.5 pt-1">
            {showReject ? (
              <div className="space-y-2">
                <Textarea
                  className="text-xs min-h-16 resize-none"
                  placeholder="Enter rejection reason..."
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError("");
                  }}
                />
                {rejectError && (
                  <p className="text-[10px] text-destructive">{rejectError}</p>
                )}
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => {
                      setShowReject(false);
                      setRejectReason("");
                      setRejectError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs h-8"
                    onClick={handleConfirmReject}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setShowReject(true)}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    onApprove(ts.id);
                    onClose();
                  }}
                >
                  Approve Timesheet
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

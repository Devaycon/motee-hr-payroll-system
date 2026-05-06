"use client";

import { FileCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_STYLES,
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_STYLES,
} from "@/src/data/attendance-demo";
import type { TimesheetRecord } from "@/src/lib/types/attendance";

interface TimesheetDetailModalProps {
  detailTs: TimesheetRecord | null;
  onClose: () => void;
}

export function TimesheetDetailModal({
  detailTs,
  onClose,
}: TimesheetDetailModalProps) {
  return (
    <Dialog open={!!detailTs} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {detailTs && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <DialogTitle className="text-sm font-semibold">
                    Timesheet Details
                  </DialogTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(detailTs.weekStart).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    –{" "}
                    {new Date(detailTs.weekEnd).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border font-bold shrink-0",
                    TIMESHEET_STATUS_STYLES[detailTs.status],
                  )}
                >
                  {TIMESHEET_STATUS_LABELS[detailTs.status]}
                </span>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-3 py-1">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Hours", value: `${detailTs.totalHours}h` },
                  { label: "Days Present", value: detailTs.daysPresent },
                  { label: "Days Late", value: detailTs.daysLate },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col gap-0.5 rounded-lg bg-muted/40 border border-border p-3"
                  >
                    <p className="text-[10px] text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="text-base font-bold text-foreground">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="grid grid-cols-[48px_1fr_72px_72px_56px_88px] bg-muted/30 border-b border-border">
                  {["Day", "Date", "In", "Out", "Hrs", "Status"].map((h) => (
                    <div
                      key={h}
                      className="px-2.5 py-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {detailTs.dailyEntries.map((e) => (
                  <div
                    key={e.date}
                    className="grid grid-cols-[48px_1fr_72px_72px_56px_88px] items-center border-b border-border/50 last:border-0 hover:bg-muted/20"
                  >
                    <div className="px-2.5 py-2.5 text-[11px] font-semibold text-foreground">
                      {e.day}
                    </div>
                    <div className="px-2.5 py-2.5 text-[10px] text-muted-foreground">
                      {new Date(e.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                    <div className="px-2.5 py-2.5 text-[11px] tabular-nums text-foreground">
                      {e.clockIn ?? "—"}
                    </div>
                    <div className="px-2.5 py-2.5 text-[11px] tabular-nums text-foreground">
                      {e.clockOut ?? "—"}
                    </div>
                    <div className="px-2.5 py-2.5 text-[11px] font-semibold text-foreground">
                      {e.totalHours != null ? `${e.totalHours}h` : "—"}
                    </div>
                    <div className="px-2.5 py-2.5">
                      <span
                        className={cn(
                          "text-[9px] px-1.5 py-0.5 rounded-full border font-bold",
                          ATTENDANCE_STATUS_STYLES[e.status],
                        )}
                      >
                        {ATTENDANCE_STATUS_LABELS[e.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {detailTs.approvedBy && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <FileCheck className="w-3 h-3" />
                  Approved by{" "}
                  <span className="font-medium text-foreground">
                    {detailTs.approvedBy}
                  </span>
                  {detailTs.approvedAt
                    ? ` on ${new Date(detailTs.approvedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                    : ""}
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

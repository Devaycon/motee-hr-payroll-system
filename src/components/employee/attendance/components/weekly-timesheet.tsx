"use client";

import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_STYLES,
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_STYLES,
} from "@/src/data/attendance-demo";
import type {
  AttendanceStatus,
  TimesheetRecord,
} from "@/src/lib/types/attendance";
import type { ClockState, WeekItem, WeekEntry } from "./types";
import { formatTimeHHMM } from "./helpers";

interface WeeklyTimesheetProps {
  weekOffset: number;
  weeksCount: number;
  activeWeek: WeekItem;
  activeEntries: WeekEntry[];
  clockInTime: Date | null;
  clockOutTime: Date | null;
  clockState: ClockState;
  workedHours: number;
  todayStatus: AttendanceStatus;
  onWeekOffsetChange: (updater: (o: number) => number) => void;
  onDetailTs: (ts: TimesheetRecord) => void;
}

export function WeeklyTimesheet({
  weekOffset,
  weeksCount,
  activeWeek,
  activeEntries,
  clockInTime,
  clockOutTime,
  clockState,
  workedHours,
  todayStatus,
  onWeekOffsetChange,
  onDetailTs,
}: WeeklyTimesheetProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Weekly Timesheet
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onWeekOffsetChange((o) => o - 1)}
            disabled={weekOffset <= -(weeksCount - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[11px] text-muted-foreground min-w-22.5 text-center">
            {weekOffset === 0 ? "This Week" : activeWeek.label}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() => onWeekOffsetChange((o) => o + 1)}
            disabled={weekOffset >= 0}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-[56px_1fr_80px_80px_64px_100px] gap-0 border-b border-border bg-muted/30">
            {["Day", "Date", "Clock In", "Clock Out", "Hours", "Status"].map(
              (h) => (
                <div
                  key={h}
                  className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </div>
              ),
            )}
          </div>

          {activeEntries.map((entry) => {
            const isToday = entry.date === "2026-04-23" && weekOffset === 0;
            return (
              <div
                key={entry.date}
                className={cn(
                  "grid grid-cols-[56px_1fr_80px_80px_64px_100px] items-center border-b border-border/50 last:border-0",
                  isToday ? "bg-[#7F77DD]/5" : "hover:bg-muted/20",
                )}
              >
                <div
                  className={cn(
                    "px-3 py-3 text-xs font-semibold",
                    isToday ? "text-[#7F77DD]" : "text-foreground",
                  )}
                >
                  {entry.day}
                  {isToday && (
                    <span className="block text-[9px] font-medium text-[#7F77DD]">
                      Today
                    </span>
                  )}
                </div>
                <div className="px-3 py-3 text-[11px] text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <div className="px-3 py-3 text-[11px] font-medium text-foreground tabular-nums">
                  {isToday && clockInTime
                    ? formatTimeHHMM(clockInTime)
                    : (entry.clockIn ?? "—")}
                </div>
                <div className="px-3 py-3 text-[11px] font-medium text-foreground tabular-nums">
                  {isToday && clockOutTime ? (
                    formatTimeHHMM(clockOutTime)
                  ) : isToday && clockState === "clocked_in" ? (
                    <span className="text-[#7F77DD]">Live</span>
                  ) : (
                    (entry.clockOut ?? "—")
                  )}
                </div>
                <div className="px-3 py-3 text-[11px] font-semibold text-foreground tabular-nums">
                  {isToday && clockInTime
                    ? `${workedHours.toFixed(1)}h`
                    : entry.totalHours != null
                      ? `${entry.totalHours}h`
                      : "—"}
                </div>
                <div className="px-3 py-3">
                  <span
                    className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full border font-bold whitespace-nowrap inline-block",
                      ATTENDANCE_STATUS_STYLES[
                        isToday ? todayStatus : entry.status
                      ],
                    )}
                  >
                    {
                      ATTENDANCE_STATUS_LABELS[
                        isToday ? todayStatus : entry.status
                      ]
                    }
                  </span>
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-[56px_1fr_80px_80px_64px_100px] border-t border-border bg-muted/20">
            <div className="px-3 py-2 col-span-4 text-[10px] font-semibold text-muted-foreground">
              Weekly Total
            </div>
            <div className="px-3 py-2 text-[11px] font-bold text-foreground">
              {weekOffset === 0
                ? `${(activeEntries.reduce((s, e) => s + (e.totalHours ?? 0), 0) + workedHours).toFixed(1)}h`
                : `${activeEntries.reduce((s, e) => s + (e.totalHours ?? 0), 0).toFixed(1)}h`}
            </div>
            <div className="px-3 py-2">
              {activeWeek.ts ? (
                <button
                  className={cn(
                    "text-[9px] px-2 py-0.5 rounded-full border font-bold cursor-pointer hover:opacity-80",
                    TIMESHEET_STATUS_STYLES[activeWeek.ts.status],
                  )}
                  onClick={() => onDetailTs(activeWeek.ts!)}
                >
                  {TIMESHEET_STATUS_LABELS[activeWeek.ts.status]}
                </button>
              ) : (
                <Button
                  size="sm"
                  className="h-6 text-[9px] px-2 bg-[#7F77DD] hover:bg-[#6c64cc] text-white gap-1"
                >
                  <Send className="w-2.5 h-2.5" /> Submit
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

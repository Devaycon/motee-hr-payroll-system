"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileCheck,
  PencilLine,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_STYLES,
} from "@/src/data/attendance-demo";
import type {
  DailyEntry,
  TimesheetRecord,
  WeeklyTotals,
} from "@/src/lib/types/attendance";
import { hoursToHHMM } from "@/src/lib/utils/format-duration";
import { STATUS_BADGE, STATUS_LABEL } from "./constants";
import {
  ATTENDANCE_CARD_FILTER_LABELS,
  type AttendanceCardFilter,
} from "./stat-cards";

const GRID = "grid-cols-[56px_1fr_80px_80px_64px_72px_104px_40px]";

interface WeeklyTimesheetProps {
  weekLabel: string;
  entries: DailyEntry[];
  totals: WeeklyTotals;
  contractedWeekly: number;
  todayIso: string;
  weekOffset: number;
  canGoBack: boolean;
  timesheet: TimesheetRecord | null;
  filter: AttendanceCardFilter;
  onWeekOffsetChange: (offset: number) => void;
  onClearFilter: () => void;
  onRequestCorrection: (entry: DailyEntry) => void;
  onSubmit: () => void;
  onViewTimesheet: (ts: TimesheetRecord) => void;
}

export function WeeklyTimesheet({
  weekLabel,
  entries,
  totals,
  contractedWeekly,
  todayIso,
  weekOffset,
  canGoBack,
  timesheet,
  filter,
  onWeekOffsetChange,
  onClearFilter,
  onRequestCorrection,
  onSubmit,
  onViewTimesheet,
}: WeeklyTimesheetProps) {
  const submitted = timesheet?.status === "submitted";
  const approved = timesheet?.status === "approved";
  const locked = submitted || approved;

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={!canGoBack}
              onClick={() => onWeekOffsetChange(weekOffset - 1)}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <div className="min-w-40 text-center">
              <p className="text-xs font-semibold text-foreground">
                {weekOffset === 0 ? "This week" : weekLabel}
              </p>
              {weekOffset !== 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {Math.abs(weekOffset)} week
                  {Math.abs(weekOffset) === 1 ? "" : "s"} ago
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={weekOffset >= 0}
              onClick={() => onWeekOffsetChange(weekOffset + 1)}
              aria-label="Next week"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {timesheet && (
              <button
                type="button"
                onClick={() => onViewTimesheet(timesheet)}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-bold",
                  TIMESHEET_STATUS_STYLES[timesheet.status],
                )}
              >
                {TIMESHEET_STATUS_LABELS[timesheet.status]}
              </button>
            )}
            <Button
              size="sm"
              className="h-7 text-[11px] gap-1.5 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
              disabled={locked || !entries.length}
              onClick={onSubmit}
            >
              <Send className="w-3 h-3" />
              {approved
                ? "Approved"
                : submitted
                  ? "Awaiting approval"
                  : "Submit for approval"}
            </Button>
          </div>
        </div>

        {filter !== "all" && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {ATTENDANCE_CARD_FILTER_LABELS[filter]}
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={onClearFilter}
            >
              ← All days
            </Button>
          </div>
        )}

        {timesheet?.status === "rejected" && timesheet.rejectionReason && (
          <div className="flex items-start gap-2 text-[11px] text-red-700 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <FileCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Returned by your manager:{" "}
              <span className="font-medium">{timesheet.rejectionReason}</span>
            </span>
          </div>
        )}

        <div className="rounded-lg border border-border overflow-hidden">
          <div
            className={cn(
              "grid bg-muted/30 border-b border-border",
              GRID,
            )}
          >
            {["Day", "Date", "In", "Out", "Hrs", "Break", "Status", ""].map(
              (h, i) => (
                <div
                  key={`${h}-${i}`}
                  className="px-2.5 py-2 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </div>
              ),
            )}
          </div>

          {entries.length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-6 text-center">
              No working days recorded for this week.
            </p>
          ) : (
            entries.map((e) => {
              const isToday = e.date === todayIso;
              return (
                <div
                  key={e.date}
                  className={cn(
                    "grid items-center border-b border-border/50 last:border-0 hover:bg-muted/20",
                    GRID,
                    isToday && "bg-[#7F77DD]/5",
                  )}
                >
                  <div className="px-2.5 py-2.5 text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                    {e.day}
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7F77DD] animate-pulse" />
                    )}
                  </div>
                  <div className="px-2.5 py-2.5 text-[10px] text-muted-foreground">
                    {new Date(e.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                    })}
                  </div>
                  <div className="px-2.5 py-2.5 text-[11px] tabular-nums text-foreground">
                    {e.clockIn ?? "—"}
                  </div>
                  <div className="px-2.5 py-2.5 text-[11px] tabular-nums text-foreground">
                    {e.clockOut ?? "—"}
                  </div>
                  <div className="px-2.5 py-2.5 text-[11px] font-semibold text-foreground tabular-nums">
                    {e.totalHours != null ? `${e.totalHours}h` : "—"}
                  </div>
                  <div className="px-2.5 py-2.5 text-[10px] text-muted-foreground tabular-nums">
                    {e.breakMinutes ? `${e.breakMinutes}m` : "—"}
                  </div>
                  <div className="px-2.5 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold",
                        STATUS_BADGE[e.status],
                      )}
                    >
                      {STATUS_LABEL[e.status]}
                    </span>
                  </div>
                  <div className="px-1 py-2.5">
                    {!locked && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => onRequestCorrection(e)}
                        aria-label={`Request a correction for ${e.date}`}
                        title="Request a correction"
                      >
                        <PencilLine className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {entries.length > 0 && (
            <div
              className={cn(
                "grid items-center bg-muted/30 border-t border-border",
                GRID,
              )}
            >
              <div className="px-2.5 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide col-span-4">
                Week total
              </div>
              <div className="px-2.5 py-2.5 text-[11px] font-bold text-foreground tabular-nums">
                {totals.totalHours}h
              </div>
              <div className="px-2.5 py-2.5" />
              <div className="px-2.5 py-2.5 text-[10px] text-muted-foreground tabular-nums">
                {contractedWeekly ? `of ${contractedWeekly}h` : "—"}
              </div>
              <div className="px-1 py-2.5" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
          <span>
            Present:{" "}
            <span className="font-semibold text-foreground">
              {totals.daysPresent}
            </span>
          </span>
          <span>
            Late:{" "}
            <span className="font-semibold text-foreground">
              {totals.daysLate}
            </span>
          </span>
          <span>
            Absent:{" "}
            <span className="font-semibold text-foreground">
              {totals.daysAbsent}
            </span>
          </span>
          <span>
            Overtime:{" "}
            <span className="font-semibold text-foreground">
              {totals.overtimeHours > 0
                ? hoursToHHMM(totals.overtimeHours)
                : "None"}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

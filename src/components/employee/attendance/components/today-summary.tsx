"use client";

import { Clock, LogIn, LogOut, Timer, Coffee, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { ClockState } from "./types";
import { MY_SCHEDULE, SCHEDULED_HOURS } from "./constants";
import { formatTimeHHMM, secondsToHHMM, addMinutesToTime } from "./helpers";

interface TodaySummaryProps {
  clockInTime: Date | null;
  clockOutTime: Date | null;
  clockState: ClockState;
  workedSeconds: number;
  totalBreakSeconds: number;
  expectedEndTime: Date | null;
  workedHours: number;
}

export function TodaySummary({
  clockInTime,
  clockOutTime,
  clockState,
  workedSeconds,
  totalBreakSeconds,
  expectedEndTime,
  workedHours,
}: TodaySummaryProps) {
  const rows = [
    {
      label: "Clock In",
      value: clockInTime ? formatTimeHHMM(clockInTime) : "—",
      icon: LogIn,
      color: "#1D9E75",
    },
    {
      label: "Clock Out",
      value: clockOutTime
        ? formatTimeHHMM(clockOutTime)
        : clockState !== "idle"
          ? "In progress"
          : "—",
      icon: LogOut,
      color: "#EF4444",
    },
    {
      label: "Time Worked",
      value: clockInTime ? secondsToHHMM(workedSeconds) : "—",
      icon: Timer,
      color: "#7F77DD",
    },
    {
      label: "Break Time",
      value: totalBreakSeconds > 0 ? secondsToHHMM(totalBreakSeconds) : "—",
      icon: Coffee,
      color: "#F59E0B",
    },
    {
      label: "Expected End",
      value: expectedEndTime
        ? formatTimeHHMM(expectedEndTime)
        : addMinutesToTime(
            MY_SCHEDULE.startTime,
            SCHEDULED_HOURS * 60 + MY_SCHEDULE.breakMinutes,
          ),
      icon: Clock,
      color: "#2563EB",
    },
    {
      label: "Overtime",
      value:
        workedHours > SCHEDULED_HOURS
          ? secondsToHHMM(Math.max(0, workedSeconds - SCHEDULED_HOURS * 3600))
          : "None",
      icon: TrendingUp,
      color: "#1D9E75",
    },
  ];

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Today&apos;s Summary
        </p>
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <r.icon className="w-3.5 h-3.5" style={{ color: r.color }} />
              {r.label}
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums">
              {r.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

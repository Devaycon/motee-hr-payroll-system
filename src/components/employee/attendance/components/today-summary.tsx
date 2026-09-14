"use client";

import { Clock, Coffee, LogIn, LogOut, MapPin, Timer } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import type { ClockState, DaySchedule } from "@/src/lib/types/attendance";
import {
  formatTimeHHMM,
  secondsToHHMM,
} from "@/src/lib/utils/format-duration";
import { MapsLink } from "@/src/components/shared/maps-link";

interface TodaySummaryProps {
  clockInTime: Date | null;
  clockOutTime: Date | null;
  clockState: ClockState;
  workedSeconds: number;
  totalBreakSeconds: number;
  expectedEndTime: Date | null;
  schedule: DaySchedule | null;
  locationLabel: string;
  /** "lat,lng" the device reported for the most recent punch, if any. */
  locationCoords?: string;
}

export function TodaySummary({
  clockInTime,
  clockOutTime,
  clockState,
  workedSeconds,
  totalBreakSeconds,
  expectedEndTime,
  schedule,
  locationLabel,
  locationCoords,
}: TodaySummaryProps) {
  const rows = [
    {
      label: "Clock in",
      value: clockInTime ? formatTimeHHMM(clockInTime) : "—",
      icon: LogIn,
      color: "#1D9E75",
    },
    {
      label: "Clock out",
      value: clockOutTime
        ? formatTimeHHMM(clockOutTime)
        : clockState !== "idle"
          ? "In progress"
          : "—",
      icon: LogOut,
      color: "#EF4444",
    },
    {
      label: "Time worked",
      value: clockInTime ? secondsToHHMM(workedSeconds) : "—",
      icon: Timer,
      color: "#7F77DD",
    },
    {
      label: "Break taken",
      value: totalBreakSeconds > 0 ? secondsToHHMM(totalBreakSeconds) : "—",
      icon: Coffee,
      color: "#F59E0B",
    },
    {
      label: "Expected end",
      value: expectedEndTime
        ? formatTimeHHMM(expectedEndTime)
        : (schedule?.end ?? "—"),
      icon: Clock,
      color: "#2563EB",
    },
  ];

  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Today&apos;s summary
        </p>
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <r.icon className="w-3.5 h-3.5 shrink-0" style={{ color: r.color }} />
              {r.label}
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums truncate">
              {r.value}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "#1D9E75" }} />
            Location
          </div>
          {clockState === "idle" ? (
            <span className="text-xs font-semibold text-foreground truncate">—</span>
          ) : locationCoords ? (
            <MapsLink address={locationCoords} className="text-xs font-semibold" />
          ) : (
            <span className="text-xs font-semibold text-foreground truncate">
              {locationLabel}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

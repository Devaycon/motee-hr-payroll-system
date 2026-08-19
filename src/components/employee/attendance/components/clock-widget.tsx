"use client";

import {
  AlertCircle,
  CheckCircle2,
  Coffee,
  LogIn,
  LogOut,
  MapPin,
  Timer,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import type {
  AttendanceStatus,
  ClockState,
  DaySchedule,
} from "@/src/lib/types/attendance";
import type { LocaleLocationBooking } from "@/src/lib/types/locale";
import { secondsToHHMMSS } from "@/src/lib/utils/format-duration";
import { LOCATION_CONFIG, STATUS_BADGE, STATUS_LABEL } from "./constants";
import { LocationPicker, type LocationChoice } from "./location-picker";

interface ClockWidgetProps {
  now: Date;
  clockState: ClockState;
  schedule: DaySchedule | null;
  scheduledHours: number;
  choice: LocationChoice;
  bookings: LocaleLocationBooking[];
  workedSeconds: number;
  progressPct: number;
  currentBreakSeconds: number;
  todayStatus: AttendanceStatus;
  isLateNow: boolean;
  onClockIn: () => void;
  onBreakStart: () => void;
  onBreakEnd: () => void;
  onClockOutOpen: () => void;
  onLocationChange: (choice: LocationChoice) => void;
  onBookDesk: (name: string) => string;
}

export function ClockWidget({
  now,
  clockState,
  schedule,
  scheduledHours,
  choice,
  bookings,
  workedSeconds,
  progressPct,
  currentBreakSeconds,
  todayStatus,
  isLateNow,
  onClockIn,
  onBreakStart,
  onBreakEnd,
  onClockOutOpen,
  onLocationChange,
  onBookDesk,
}: ClockWidgetProps) {
  const locationCfg = LOCATION_CONFIG[choice.location];
  const LocationIcon = choice.bookingId ? MapPin : locationCfg.icon;
  const locationLabel = choice.locationName ?? locationCfg.label;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Today
            </p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {now.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <span
            className={cn(
              "text-[10px] px-2.5 py-1 rounded-full font-bold",
              STATUS_BADGE[todayStatus],
            )}
          >
            {STATUS_LABEL[todayStatus]}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 py-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
            Current time
          </p>
          <p className="text-5xl font-bold tabular-nums text-foreground tracking-tight">
            {now.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {schedule
              ? `Scheduled ${schedule.start} – ${schedule.end}`
              : "Not a scheduled working day"}
          </p>
        </div>

        {clockState !== "idle" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Timer className="w-3 h-3" /> Time worked
              </span>
              {scheduledHours > 0 && (
                <span className="tabular-nums">
                  {Math.round(progressPct)}% of {scheduledHours}h day
                </span>
              )}
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  progressPct >= 100 ? "bg-[#1D9E75]" : "bg-[#7F77DD]",
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-center">
              <div
                className={cn(
                  "px-4 py-2 rounded-xl tabular-nums text-3xl font-bold tracking-tight",
                  clockState === "on_break" ? "text-amber-500" : "text-[#7F77DD]",
                )}
              >
                {secondsToHHMMSS(workedSeconds)}
              </div>
            </div>
            {clockState === "on_break" && (
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <Coffee className="w-3.5 h-3.5" />
                <span className="text-xs font-medium tabular-nums">
                  On break · {secondsToHHMMSS(currentBreakSeconds)}
                </span>
              </div>
            )}
          </div>
        )}

        <Separator />

        {clockState === "idle" ? (
          <LocationPicker
            choice={choice}
            bookings={bookings}
            onChange={onLocationChange}
            onBookDesk={onBookDesk}
          />
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LocationIcon
              className="w-3.5 h-3.5"
              style={{ color: locationCfg.color }}
            />
            <span>
              {clockState === "clocked_out" ? "Worked from " : "Working from "}
              <span className="font-medium text-foreground">{locationLabel}</span>
            </span>
          </div>
        )}

        <div className="flex gap-3">
          {clockState === "idle" && (
            <Button
              className="flex-1 h-11 text-sm gap-2 bg-[#7F77DD] hover:bg-[#6c64cc] text-white font-semibold"
              onClick={onClockIn}
            >
              <LogIn className="w-4 h-4" /> Clock In
            </Button>
          )}
          {clockState === "clocked_in" && (
            <>
              <Button
                variant="outline"
                className="flex-1 h-10 text-xs gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                onClick={onBreakStart}
              >
                <Coffee className="w-3.5 h-3.5" /> Start Break
              </Button>
              <Button
                className="flex-1 h-10 text-xs gap-2 bg-red-600 hover:bg-red-700 text-white"
                onClick={onClockOutOpen}
              >
                <LogOut className="w-3.5 h-3.5" /> Clock Out
              </Button>
            </>
          )}
          {clockState === "on_break" && (
            <Button
              className="flex-1 h-10 text-xs gap-2 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={onBreakEnd}
            >
              <Coffee className="w-3.5 h-3.5" /> End Break
            </Button>
          )}
          {clockState === "clocked_out" && (
            <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1D9E75]/10 border border-[#1D9E75]/30">
              <CheckCircle2 className="w-4 h-4 text-[#1D9E75]" />
              <span className="text-sm font-medium text-[#1D9E75]">
                You&apos;ve clocked out for today
              </span>
            </div>
          )}
        </div>

        {clockState === "idle" && isLateNow && schedule && (
          <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Scheduled start was {schedule.start}. Clocking in now will be marked
            as late.
          </div>
        )}

        {clockState === "idle" && !schedule && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 border border-border rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            You&apos;re not scheduled to work today. Any time you record will
            count as additional hours.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import {
  Coffee,
  LogOut,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Timer,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { cn } from "@/src/lib/utils";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_STYLES,
} from "@/src/data/attendance-demo";
import type { AttendanceStatus } from "@/src/lib/types/attendance";
import type { ClockState, WorkLocation } from "./types";
import { LOCATION_CONFIG, MY_SCHEDULE, SCHEDULED_HOURS } from "./constants";
import { secondsToHHMMSS } from "./helpers";

interface ClockWidgetProps {
  now: Date;
  clockState: ClockState;
  location: WorkLocation;
  workedSeconds: number;
  progressPct: number;
  currentBreakSeconds: number;
  todayStatus: AttendanceStatus;
  onClockIn: () => void;
  onBreakStart: () => void;
  onBreakEnd: () => void;
  onClockOutOpen: () => void;
  onLocationChange: (loc: WorkLocation) => void;
}

export function ClockWidget({
  now,
  clockState,
  location,
  workedSeconds,
  progressPct,
  currentBreakSeconds,
  todayStatus,
  onClockIn,
  onBreakStart,
  onBreakEnd,
  onClockOutOpen,
  onLocationChange,
}: ClockWidgetProps) {
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
              "text-[10px] px-2.5 py-1 rounded-full border font-bold",
              ATTENDANCE_STATUS_STYLES[todayStatus],
            )}
          >
            {ATTENDANCE_STATUS_LABELS[todayStatus]}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 py-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-medium">
            Current Time
          </p>
          <p className="text-5xl font-bold tabular-nums text-foreground tracking-tight">
            {now.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {now
              .toLocaleTimeString("en-US", { hour12: true })
              .split(":")
              .slice(0, 2)
              .join(":")}{" "}
            {now.getHours() >= 12 ? "PM" : "AM"} · Scheduled{" "}
            {MY_SCHEDULE.startTime} – {MY_SCHEDULE.endTime}
          </p>
        </div>

        {clockState !== "idle" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Timer className="w-3 h-3" /> Time worked
              </span>
              <span>
                {Math.round(progressPct)}% of {SCHEDULED_HOURS}h shift
              </span>
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
                  clockState === "on_break"
                    ? "text-amber-500"
                    : "text-[#7F77DD]",
                )}
              >
                {secondsToHHMMSS(clockState === "on_break" ? 0 : workedSeconds)}
              </div>
            </div>
            {clockState === "on_break" && (
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <Coffee className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">
                  On break · {secondsToHHMMSS(currentBreakSeconds)}
                </span>
              </div>
            )}
          </div>
        )}

        <Separator />

        {clockState === "idle" && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-foreground">Work location</p>
            <div className="flex gap-2">
              {(Object.keys(LOCATION_CONFIG) as WorkLocation[]).map((loc) => {
                const cfg = LOCATION_CONFIG[loc];
                const Icon = cfg.icon;
                return (
                  <button
                    key={loc}
                    onClick={() => onLocationChange(loc)}
                    className={cn(
                      "flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[10px] font-semibold transition-all",
                      location === loc
                        ? "border-[#7F77DD] bg-[#7F77DD]/10 text-[#7F77DD]"
                        : "border-border text-muted-foreground hover:border-[#7F77DD]/40",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {clockState !== "idle" && clockState !== "clocked_out" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {(() => {
              const cfg = LOCATION_CONFIG[location];
              const Icon = cfg.icon;
              return (
                <>
                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                  <span>
                    Working from{" "}
                    <span className="font-medium text-foreground">
                      {cfg.label}
                    </span>
                  </span>
                </>
              );
            })()}
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

        {clockState === "idle" &&
          (() => {
            const [sh, sm] = MY_SCHEDULE.startTime.split(":").map(Number);
            const sched = new Date();
            sched.setHours(sh, sm, 0, 0);
            return now > sched;
          })() && (
            <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Scheduled start was {MY_SCHEDULE.startTime}. Clocking in now will
              be marked as late.
            </div>
          )}
      </CardContent>
    </Card>
  );
}

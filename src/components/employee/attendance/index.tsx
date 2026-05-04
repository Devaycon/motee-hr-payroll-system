"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  MapPin,
  Coffee,
  LogOut,
  LogIn,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Timer,
  TrendingUp,
  Moon,
  Wifi,
  Building2,
  Laptop,
  Users,
  FileCheck,
  Send,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_STYLES,
  TIMESHEET_STATUS_LABELS,
  TIMESHEET_STATUS_STYLES,
  TIMESHEETS,
} from "@/src/data/attendance-demo";
import type { AttendanceStatus } from "@/src/lib/types/attendance";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClockState = "idle" | "clocked_in" | "on_break" | "clocked_out";
type WorkLocation = "office" | "remote" | "client_site";

interface BreakEntry {
  start: Date;
  end?: Date;
}

interface ActivityEvent {
  time: string;
  label: string;
  type: "clock_in" | "clock_out" | "break_start" | "break_end";
}

// ─── My schedule (demo — normally from API) ───────────────────────────────────

const MY_SCHEDULE = { startTime: "09:00", endTime: "17:00", breakMinutes: 30 };
const SCHEDULED_HOURS = 7.5; // 9:00 → 17:00 minus 30 min break

// ─── Demo weekly timesheet (current week) ─────────────────────────────────────

const CURRENT_WEEK_ENTRIES: {
  date: string;
  day: string;
  clockIn?: string;
  clockOut?: string;
  breakMinutes: number;
  totalHours?: number;
  status: AttendanceStatus;
}[] = [
  {
    date: "2026-04-20",
    day: "Mon",
    clockIn: "08:55",
    clockOut: "17:10",
    breakMinutes: 30,
    totalHours: 7.75,
    status: "present",
  },
  {
    date: "2026-04-21",
    day: "Tue",
    clockIn: "09:18",
    clockOut: "17:00",
    breakMinutes: 30,
    totalHours: 7.2,
    status: "late",
  },
  {
    date: "2026-04-22",
    day: "Wed",
    clockIn: "08:50",
    clockOut: "17:05",
    breakMinutes: 30,
    totalHours: 7.75,
    status: "present",
  },
  {
    date: "2026-04-23",
    day: "Thu",
    clockIn: undefined,
    clockOut: undefined,
    breakMinutes: 0,
    totalHours: undefined,
    status: "not_clocked_in",
  },
  {
    date: "2026-04-24",
    day: "Fri",
    clockIn: undefined,
    clockOut: undefined,
    breakMinutes: 0,
    totalHours: undefined,
    status: "not_clocked_in",
  },
];

const PAST_TIMESHEETS = TIMESHEETS.filter(
  (t) => t.employeeName === "Adaeze Okonkwo",
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number) {
  return String(Math.floor(n)).padStart(2, "0");
}

function secondsToHHMMSS(s: number) {
  const hrs = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
}

function secondsToHHMM(s: number) {
  const hrs = Math.floor(s / 3600);
  const min = Math.floor((s % 3600) / 60);
  if (hrs === 0) return `${min}m`;
  if (min === 0) return `${hrs}h`;
  return `${hrs}h ${min}m`;
}

function formatTimeAMPM(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatTimeHHMM(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function addMinutesToTime(timeStr: string, minutes: number) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${pad(total / 60)}:${pad(total % 60)}`;
}

function isLate(clockInDate: Date) {
  const [sh, sm] = MY_SCHEDULE.startTime.split(":").map(Number);
  const graceMinutes = 10;
  const scheduled = new Date(clockInDate);
  scheduled.setHours(sh, sm + graceMinutes, 0, 0);
  return clockInDate > scheduled;
}

const LOCATION_CONFIG: Record<
  WorkLocation,
  { label: string; icon: React.ElementType; color: string }
> = {
  office: { label: "Office", icon: Building2, color: "#2563EB" },
  remote: { label: "Remote", icon: Laptop, color: "#7F77DD" },
  client_site: { label: "Client Site", icon: Users, color: "#1D9E75" },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function MyAttendancePage() {
  const [now, setNow] = useState(new Date());
  const [clockState, setClockState] = useState<ClockState>("idle");
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [clockOutTime, setClockOutTime] = useState<Date | null>(null);
  const [breaks, setBreaks] = useState<BreakEntry[]>([]);
  const [location, setLocation] = useState<WorkLocation>("office");
  const [noteOut, setNoteOut] = useState("");
  const [noteDialog, setNoteDialog] = useState(false);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [detailTs, setDetailTs] = useState<(typeof PAST_TIMESHEETS)[0] | null>(
    null,
  );

  // Live clock tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Computed durations ────────────────────────────────────────────────────

  const totalBreakSeconds = breaks.reduce((acc, b) => {
    const end = b.end ?? now;
    return acc + Math.floor((end.getTime() - b.start.getTime()) / 1000);
  }, 0);

  const workedSeconds = clockInTime
    ? Math.max(
        0,
        Math.floor((now.getTime() - clockInTime.getTime()) / 1000) -
          totalBreakSeconds,
      )
    : 0;

  const workedHours = workedSeconds / 3600;
  const progressPct = Math.min((workedHours / SCHEDULED_HOURS) * 100, 100);

  const currentBreakSeconds =
    clockState === "on_break" && breaks.length > 0
      ? Math.floor(
          (now.getTime() - breaks[breaks.length - 1].start.getTime()) / 1000,
        )
      : 0;

  // Expected end time
  const expectedEndTime = clockInTime
    ? new Date(
        clockInTime.getTime() +
          (SCHEDULED_HOURS * 3600 + totalBreakSeconds) * 1000,
      )
    : null;

  // ── Actions ───────────────────────────────────────────────────────────────

  function handleClockIn() {
    const t = new Date();
    setClockInTime(t);
    setClockState("clocked_in");
    setActivity((prev) => [
      {
        time: formatTimeAMPM(t),
        label: `Clocked In · ${LOCATION_CONFIG[location].label}`,
        type: "clock_in",
      },
      ...prev,
    ]);
  }

  function handleBreakStart() {
    const t = new Date();
    setBreaks((prev) => [...prev, { start: t }]);
    setClockState("on_break");
    setActivity((prev) => [
      { time: formatTimeAMPM(t), label: "Break Started", type: "break_start" },
      ...prev,
    ]);
  }

  function handleBreakEnd() {
    const t = new Date();
    setBreaks((prev) =>
      prev.map((b, i) => (i === prev.length - 1 ? { ...b, end: t } : b)),
    );
    setClockState("clocked_in");
    setActivity((prev) => [
      { time: formatTimeAMPM(t), label: "Break Ended", type: "break_end" },
      ...prev,
    ]);
  }

  function handleClockOutConfirm() {
    const t = new Date();
    setClockOutTime(t);
    setClockState("clocked_out");
    setActivity((prev) => [
      {
        time: formatTimeAMPM(t),
        label: `Clocked Out${noteOut ? ` · "${noteOut}"` : ""}`,
        type: "clock_out",
      },
      ...prev,
    ]);
    setNoteDialog(false);
    setNoteOut("");
  }

  // ── Status badge derived ──────────────────────────────────────────────────

  const todayStatus: AttendanceStatus =
    clockState === "idle"
      ? "not_clocked_in"
      : clockState === "clocked_out"
        ? isLate(clockInTime!)
          ? "late"
          : "present"
        : clockState === "on_break"
          ? isLate(clockInTime!)
            ? "late"
            : "present"
          : isLate(clockInTime!)
            ? "late"
            : "present";

  // ── Timesheet week nav ────────────────────────────────────────────────────

  const weeksToShow = [
    { offset: 0, label: "Current Week", entries: CURRENT_WEEK_ENTRIES },
    ...PAST_TIMESHEETS.map((ts, i) => ({
      offset: -(i + 1),
      label: `${ts.weekStart} – ${ts.weekEnd}`,
      entries: ts.dailyEntries,
      ts,
    })),
  ];
  const activeWeek =
    weeksToShow.find((w) => w.offset === weekOffset) ?? weeksToShow[0];
  const activeEntries = activeWeek.entries;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Attendance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track your time, manage your breaks, and review your timesheet.
        </p>
      </div>

      {/* ── Top grid: Clock Widget + Today Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Clock Widget */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 flex flex-col gap-5">
            {/* Header row */}
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

            {/* Live wall clock */}
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

            {/* Elapsed work timer */}
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
                    {secondsToHHMMSS(
                      clockState === "on_break" ? 0 : workedSeconds,
                    )}
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

            {/* Location selector */}
            {clockState === "idle" && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-foreground">
                  Work location
                </p>
                <div className="flex gap-2">
                  {(Object.keys(LOCATION_CONFIG) as WorkLocation[]).map(
                    (loc) => {
                      const cfg = LOCATION_CONFIG[loc];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={loc}
                          onClick={() => setLocation(loc)}
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
                    },
                  )}
                </div>
              </div>
            )}

            {/* Active location chip */}
            {clockState !== "idle" && clockState !== "clocked_out" && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {(() => {
                  const cfg = LOCATION_CONFIG[location];
                  const Icon = cfg.icon;
                  return (
                    <>
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color: cfg.color }}
                      />
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

            {/* Action buttons */}
            <div className="flex gap-3">
              {clockState === "idle" && (
                <Button
                  className="flex-1 h-11 text-sm gap-2 bg-[#7F77DD] hover:bg-[#6c64cc] text-white font-semibold"
                  onClick={handleClockIn}
                >
                  <LogIn className="w-4 h-4" /> Clock In
                </Button>
              )}
              {clockState === "clocked_in" && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 h-10 text-xs gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                    onClick={handleBreakStart}
                  >
                    <Coffee className="w-3.5 h-3.5" /> Start Break
                  </Button>
                  <Button
                    className="flex-1 h-10 text-xs gap-2 bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setNoteDialog(true)}
                  >
                    <LogOut className="w-3.5 h-3.5" /> Clock Out
                  </Button>
                </>
              )}
              {clockState === "on_break" && (
                <Button
                  className="flex-1 h-10 text-xs gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleBreakEnd}
                >
                  <Coffee className="w-3.5 h-3.5" /> End Break
                </Button>
              )}
              {clockState === "clocked_out" && (
                <div className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1D9E75]/10 border border-[#1D9E75]/30">
                  <CheckCircle2 className="w-4 h-4 text-[#1D9E75]" />
                  <span className="text-sm font-medium text-[#1D9E75]">
                    You've clocked out for today
                  </span>
                </div>
              )}
            </div>

            {/* Late warning */}
            {clockState === "idle" &&
              (() => {
                const [sh, sm] = MY_SCHEDULE.startTime.split(":").map(Number);
                const sched = new Date();
                sched.setHours(sh, sm, 0, 0);
                return now > sched;
              })() && (
                <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Scheduled start was {MY_SCHEDULE.startTime}. Clocking in now
                  will be marked as late.
                </div>
              )}
          </CardContent>
        </Card>

        {/* Today Summary + Activity */}
        <div className="flex flex-col gap-4">
          {/* Today summary */}
          <Card>
            <CardContent className="p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Today's Summary
              </p>
              {[
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
                  value:
                    totalBreakSeconds > 0
                      ? secondsToHHMM(totalBreakSeconds)
                      : "—",
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
                      ? secondsToHHMM(
                          Math.max(0, workedSeconds - SCHEDULED_HOURS * 3600),
                        )
                      : "None",
                  icon: TrendingUp,
                  color: "#1D9E75",
                },
              ].map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <r.icon
                      className="w-3.5 h-3.5"
                      style={{ color: r.color }}
                    />
                    {r.label}
                  </div>
                  <span className="text-xs font-semibold text-foreground tabular-nums">
                    {r.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity log */}
          <Card>
            <CardContent className="p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Activity Log
              </p>
              {activity.length === 0 ? (
                <p className="text-[11px] text-muted-foreground py-3 text-center">
                  No activity recorded yet today.
                </p>
              ) : (
                <div className="flex flex-col">
                  {activity.map((ev, i) => {
                    const iconMap = {
                      clock_in: { icon: LogIn, color: "#1D9E75" },
                      clock_out: { icon: LogOut, color: "#EF4444" },
                      break_start: { icon: Coffee, color: "#F59E0B" },
                      break_end: { icon: Coffee, color: "#7F77DD" },
                    };
                    const { icon: Icon, color } = iconMap[ev.type];
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 py-2 border-b border-border/50 last:border-0"
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${color}18` }}
                        >
                          <Icon className="w-3 h-3" style={{ color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium text-foreground">
                            {ev.label}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {ev.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Weekly Timesheet ── */}
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
              onClick={() => setWeekOffset((o) => o - 1)}
              disabled={weekOffset <= -(weeksToShow.length - 1)}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[11px] text-muted-foreground min-w-[90px] text-center">
              {weekOffset === 0 ? "This Week" : activeWeek.label}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => setWeekOffset((o) => o + 1)}
              disabled={weekOffset >= 0}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {/* Header */}
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
            {activeEntries.map((entry, i) => {
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
                        "text-[9px] px-2 py-0.5 rounded-full border font-bold",
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

            {/* Week totals footer */}
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
                {"ts" in activeWeek && activeWeek.ts ? (
                  <button
                    className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full border font-bold cursor-pointer hover:opacity-80",
                      TIMESHEET_STATUS_STYLES[activeWeek.ts.status],
                    )}
                    onClick={() => setDetailTs(activeWeek.ts!)}
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

      {/* ── Month attendance calendar ── */}
      <MonthCalendar />

      {/* ── Clock Out Note Dialog ── */}
      <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
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
                onChange={(e) => setNoteOut(e.target.value)}
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
              onClick={() => setNoteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white gap-1.5"
              onClick={handleClockOutConfirm}
            >
              <LogOut className="w-3.5 h-3.5" /> Confirm Clock Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Timesheet Detail Modal ── */}
      <Dialog open={!!detailTs} onOpenChange={() => setDetailTs(null)}>
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
                      {new Date(detailTs.weekStart).toLocaleDateString(
                        "en-GB",
                        { day: "numeric", month: "short" },
                      )}{" "}
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
    </div>
  );
}

// ─── Month Calendar ───────────────────────────────────────────────────────────

const MONTH_DEMO: Record<string, AttendanceStatus> = {
  "2026-04-01": "present",
  "2026-04-02": "present",
  "2026-04-03": "present",
  "2026-04-06": "present",
  "2026-04-07": "late",
  "2026-04-08": "present",
  "2026-04-09": "present",
  "2026-04-10": "present",
  "2026-04-13": "present",
  "2026-04-14": "present",
  "2026-04-15": "on_leave",
  "2026-04-16": "on_leave",
  "2026-04-17": "on_leave",
  "2026-04-20": "present",
  "2026-04-21": "late",
  "2026-04-22": "present",
};

const STATUS_DOT: Partial<Record<AttendanceStatus, string>> = {
  present: "bg-[#1D9E75]",
  late: "bg-amber-500",
  absent: "bg-red-500",
  on_leave: "bg-violet-500",
  early_departure: "bg-orange-500",
};

function MonthCalendar() {
  const [month, setMonth] = useState(new Date(2026, 3, 1));

  const year = month.getFullYear();
  const mon = month.getMonth();
  const first = new Date(year, mon, 1).getDay();
  const days = new Date(year, mon + 1, 0).getDate();
  const startOffset = first === 0 ? 6 : first - 1;
  const today = "2026-04-23";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Monthly Overview
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() =>
              setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[11px] text-muted-foreground min-w-[96px] text-center font-medium">
            {month.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7"
            onClick={() =>
              setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="text-[10px] font-semibold text-muted-foreground text-center py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const d = i + 1;
              const iso = `${year}-${String(mon + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const status = MONTH_DEMO[iso];
              const dotColor = status ? STATUS_DOT[status] : null;
              const isToday = iso === today;
              const dayOfWeek = new Date(iso).getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isFuture = iso > today;
              return (
                <div
                  key={d}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium relative transition-colors",
                    isToday
                      ? "bg-[#7F77DD] text-white"
                      : isWeekend
                        ? "text-muted-foreground/40"
                        : isFuture
                          ? "text-muted-foreground/60"
                          : "text-foreground hover:bg-muted/50",
                  )}
                >
                  {d}
                  {dotColor && !isToday && (
                    <div
                      className={cn(
                        "w-1 h-1 rounded-full absolute bottom-1",
                        dotColor,
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="flex items-center flex-wrap gap-3 mt-4 pt-3 border-t border-border/50">
            {[
              { label: "Present", color: "bg-[#1D9E75]" },
              { label: "Late", color: "bg-amber-500" },
              { label: "On Leave", color: "bg-violet-500" },
              { label: "Absent", color: "bg-red-500" },
            ].map((l) => (
              <div
                key={l.label}
                className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
              >
                <div className={cn("w-2 h-2 rounded-full", l.color)} />{" "}
                {l.label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

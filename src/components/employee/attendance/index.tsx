"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import type {
  AttendanceStatus,
  TimesheetRecord,
} from "@/src/lib/types/attendance";
import type {
  BreakEntry,
  ActivityEvent,
  ClockState,
  WorkLocation,
  WeekItem,
} from "./components/types";
import {
  LOCATION_CONFIG,
  SCHEDULED_HOURS,
  CURRENT_WEEK_ENTRIES,
  PAST_TIMESHEETS,
} from "./components/constants";
import { isLate, formatTimeAMPM } from "./components/helpers";
import { ClockWidget } from "./components/clock-widget";
import { TodaySummary } from "./components/today-summary";
import { ActivityLog } from "./components/activity-log";
import { WeeklyTimesheet } from "./components/weekly-timesheet";
import { MonthCalendar } from "./components/month-calendar";
import { ClockOutDialog } from "./components/clock-out-dialog";
import { TimesheetDetailModal } from "./components/timesheet-detail-modal";

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
  const [detailTs, setDetailTs] = useState<TimesheetRecord | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const totalBreakSeconds = breaks.reduce((acc, b) => {
    const end = b.end ?? (clockState === "clocked_out" ? clockOutTime! : now);
    return acc + Math.floor((end.getTime() - b.start.getTime()) / 1000);
  }, 0);

  const effectiveNow =
    clockState === "clocked_out" && clockOutTime ? clockOutTime : now;

  const workedSeconds = clockInTime
    ? Math.max(
        0,
        Math.floor((effectiveNow.getTime() - clockInTime.getTime()) / 1000) -
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

  const expectedEndTime = clockInTime
    ? new Date(
        clockInTime.getTime() +
          (SCHEDULED_HOURS * 3600 + totalBreakSeconds) * 1000,
      )
    : null;

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

  const weeksToShow: WeekItem[] = [
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <ClockWidget
          now={now}
          clockState={clockState}
          location={location}
          workedSeconds={workedSeconds}
          progressPct={progressPct}
          currentBreakSeconds={currentBreakSeconds}
          todayStatus={todayStatus}
          onClockIn={handleClockIn}
          onBreakStart={handleBreakStart}
          onBreakEnd={handleBreakEnd}
          onClockOutOpen={() => setNoteDialog(true)}
          onLocationChange={setLocation}
        />

        <div className="flex flex-col gap-4 h-full">
          <TodaySummary
            clockInTime={clockInTime}
            clockOutTime={clockOutTime}
            clockState={clockState}
            workedSeconds={workedSeconds}
            totalBreakSeconds={totalBreakSeconds}
            expectedEndTime={expectedEndTime}
            workedHours={workedHours}
          />
          <ActivityLog activity={activity} />
        </div>
      </div>

      <Tabs defaultValue="timesheet">
        <PageTabsList
          tabs={[
            { value: "timesheet", label: "Weekly Timesheet" },
            { value: "calendar", label: "Monthly Overview" },
          ]}
        />

        <TabsContent value="timesheet" className="mt-4">
          <WeeklyTimesheet
            weekOffset={weekOffset}
            weeksCount={weeksToShow.length}
            activeWeek={activeWeek}
            activeEntries={activeEntries}
            clockInTime={clockInTime}
            clockOutTime={clockOutTime}
            clockState={clockState}
            workedHours={workedHours}
            todayStatus={todayStatus}
            onWeekOffsetChange={setWeekOffset}
            onDetailTs={setDetailTs}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <MonthCalendar />
        </TabsContent>
      </Tabs>

      <ClockOutDialog
        open={noteDialog}
        onOpenChange={setNoteDialog}
        workedSeconds={workedSeconds}
        totalBreakSeconds={totalBreakSeconds}
        noteOut={noteOut}
        onNoteChange={setNoteOut}
        onConfirm={handleClockOutConfirm}
      />

      <TimesheetDetailModal
        detailTs={detailTs}
        onClose={() => setDetailTs(null)}
      />
    </div>
  );
}

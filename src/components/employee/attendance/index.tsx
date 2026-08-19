"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  clockIn as clockInAction,
  clockOut as clockOutAction,
  endBreak as endBreakAction,
  requestCorrection as requestCorrectionAction,
  setLocation as setLocationAction,
  startBreak as startBreakAction,
  submitTimesheet as submitTimesheetAction,
} from "@/src/lib/stores/attendance-slice";
import type { DailyEntry, TimesheetRecord } from "@/src/lib/types/attendance";
import {
  breakCompliance,
  breakSeconds,
  contractedWeeklyHours,
  isoDateOf,
  overtimeHours,
  punchStatus,
  punctualityRate,
  scheduleForDay,
  scheduledHours as scheduledHoursOf,
  weekStartOf,
  weeklyTotals,
  workedSeconds,
} from "@/src/lib/types/attendance";
import { formatTimeHHMM } from "@/src/lib/utils/format-duration";
import {
  buildWeek,
  recentWeekStarts,
  useBookingWriter,
  useMyAttendanceIdentity,
  useMyTimeLogs,
  useTimeLogWriter,
  useTodayBookings,
} from "./hooks";
import { LATE_GRACE_MINUTES, LOCATION_CONFIG, TIMESHEET_WEEKS } from "./components/constants";
import type { ActivityEvent } from "./components/types";
import type { LocationChoice } from "./components/location-picker";
import {
  AttendanceStatCards,
  matchesAttendanceCardFilter,
  type AttendanceCardFilter,
} from "./components/stat-cards";
import { ClockWidget } from "./components/clock-widget";
import { TodaySummary } from "./components/today-summary";
import { ActivityLog } from "./components/activity-log";
import { ComplianceStrip } from "./components/compliance-strip";
import { WeeklyTimesheet } from "./components/weekly-timesheet";
import { MonthCalendar } from "./components/month-calendar";
import { InsightsTab } from "./components/insights-tab";
import { ClockOutDialog } from "./components/clock-out-dialog";
import { CorrectionModal, type CorrectionDraft } from "./components/correction-modal";
import { SubmitTimesheetDialog } from "./components/submit-timesheet-dialog";
import { TimesheetDetailModal } from "./components/timesheet-detail-modal";

export function MyAttendancePage() {
  const dispatch = useAppDispatch();
  const { employeeId, employee, workPattern } = useMyAttendanceIdentity();

  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState("today");
  const [filter, setFilter] = useState<AttendanceCardFilter>("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [choice, setChoice] = useState<LocationChoice>({
    location: "office",
    locationName: "Office",
  });
  const [noteOut, setNoteOut] = useState("");
  const [clockOutOpen, setClockOutOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [correcting, setCorrecting] = useState<DailyEntry | null>(null);
  const [detailTs, setDetailTs] = useState<TimesheetRecord | null>(null);

  // The clock is the only thing that needs a tick; everything else derives.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayIso = isoDateOf(now);
  const session = useAppSelector((s) =>
    employeeId ? s.attendance.sessions[employeeId] : undefined,
  );
  const timesheets = useAppSelector((s) => s.attendance.timesheets);

  const { data: logs } = useMyTimeLogs(employeeId);
  const bookings = useTodayBookings(employeeId, todayIso);
  const { openDay, closeDay } = useTimeLogWriter();
  const bookDesk = useBookingWriter();

  // A session from a previous day is history, not today's clock.
  const activeSession =
    session && session.date === todayIso ? session : undefined;
  const clockState = activeSession?.state ?? "idle";

  const schedule = scheduleForDay(workPattern, todayIso);
  const scheduledHours = scheduledHoursOf(schedule);
  const contractedWeekly = contractedWeeklyHours(workPattern);

  // ── derived time ──────────────────────────────────────────────────────────

  const worked = activeSession ? workedSeconds(activeSession, now) : 0;
  const totalBreak = activeSession ? breakSeconds(activeSession, now) : 0;
  const workedHours = worked / 3600;
  const progressPct = scheduledHours
    ? Math.min((workedHours / scheduledHours) * 100, 100)
    : 0;

  const currentBreakSeconds = useMemo(() => {
    if (!activeSession || activeSession.state !== "on_break") return 0;
    const open = activeSession.breaks[activeSession.breaks.length - 1];
    if (!open) return 0;
    return Math.max(
      0,
      Math.floor((now.getTime() - new Date(open.start).getTime()) / 1000),
    );
  }, [activeSession, now]);

  const clockInTime = activeSession?.clockInAt
    ? new Date(activeSession.clockInAt)
    : null;
  const clockOutTime = activeSession?.clockOutAt
    ? new Date(activeSession.clockOutAt)
    : null;

  const expectedEndTime =
    clockInTime && scheduledHours
      ? new Date(
          clockInTime.getTime() + (scheduledHours * 3600 + totalBreak) * 1000,
        )
      : null;

  const todayStatus = clockInTime
    ? punchStatus(clockInTime, schedule?.start ?? "09:00", LATE_GRACE_MINUTES)
    : "not_clocked_in";

  const isLateNow = Boolean(
    schedule &&
      punchStatus(now, schedule.start, LATE_GRACE_MINUTES) === "late",
  );

  const compliance = breakCompliance(
    totalBreak / 60,
    schedule?.breakMinutes ?? 0,
  );

  // ── week assembly ─────────────────────────────────────────────────────────

  const weekStarts = useMemo(
    () => recentWeekStarts(todayIso, TIMESHEET_WEEKS),
    [todayIso],
  );
  const activeWeekStart =
    weekStarts[Math.min(Math.abs(weekOffset), weekStarts.length - 1)];

  const activeWeek = useMemo(
    () => buildWeek(logs ?? [], activeWeekStart, workPattern),
    [logs, activeWeekStart, workPattern],
  );

  const totals = useMemo(
    () => weeklyTotals(activeWeek.entries, contractedWeekly),
    [activeWeek.entries, contractedWeekly],
  );

  const visibleEntries = useMemo(
    () =>
      activeWeek.entries.filter((e) =>
        matchesAttendanceCardFilter(
          e,
          filter,
          scheduledHours || contractedWeekly / 5,
        ),
      ),
    [activeWeek.entries, filter, scheduledHours, contractedWeekly],
  );

  const currentWeek = useMemo(
    () => buildWeek(logs ?? [], weekStartOf(todayIso), workPattern),
    [logs, todayIso, workPattern],
  );
  const currentWeekTotals = weeklyTotals(currentWeek.entries, contractedWeekly);

  const activeTimesheet =
    timesheets.find(
      (t) => t.weekStart === activeWeekStart && t.employeeName === employee?.fullName,
    ) ?? null;

  const missingDays = activeWeek.entries.filter((e) => !e.clockIn).length;

  // ── activity feed ─────────────────────────────────────────────────────────

  const activity = useMemo<ActivityEvent[]>(() => {
    if (!activeSession) return [];
    const events: ActivityEvent[] = [];
    if (activeSession.clockInAt) {
      events.push({
        at: activeSession.clockInAt,
        label: `Clocked in · ${
          activeSession.locationName ??
          LOCATION_CONFIG[activeSession.location].label
        }`,
        type: "clock_in",
      });
    }
    for (const b of activeSession.breaks) {
      events.push({ at: b.start, label: "Break started", type: "break_start" });
      if (b.end) {
        events.push({ at: b.end, label: "Break ended", type: "break_end" });
      }
    }
    if (activeSession.clockOutAt) {
      events.push({
        at: activeSession.clockOutAt,
        label: `Clocked out${activeSession.note ? ` · "${activeSession.note}"` : ""}`,
        type: "clock_out",
      });
    }
    // Newest first.
    return events.sort((a, b) => b.at.localeCompare(a.at));
  }, [activeSession]);

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleClockIn() {
    if (!employeeId) return;
    const at = new Date();
    const status = punchStatus(
      at,
      schedule?.start ?? "09:00",
      LATE_GRACE_MINUTES,
    );
    // Open the day on the shared collection straight away, so an in-progress
    // day is visible on the profile's Time Logs tab rather than only at close.
    const logId = openDay({
      employeeId,
      date: todayIso,
      clockIn: formatTimeHHMM(at),
      clockOut: null,
      status: choice.location === "remote" ? "remote" : status,
      location: choice.locationName ?? LOCATION_CONFIG[choice.location].label,
      source: "web",
    });
    dispatch(
      clockInAction({
        employeeId,
        date: todayIso,
        at: at.toISOString(),
        location: choice.location,
        locationName: choice.locationName,
        bookingId: choice.bookingId,
        source: "web",
        logId,
      }),
    );
    toast.success(
      status === "late" ? "Clocked in — marked as late" : "Clocked in",
      { description: `${formatTimeHHMM(at)} · ${choice.locationName ?? LOCATION_CONFIG[choice.location].label}` },
    );
  }

  function handleBreakStart() {
    if (!employeeId) return;
    dispatch(startBreakAction({ employeeId, at: new Date().toISOString() }));
  }

  function handleBreakEnd() {
    if (!employeeId) return;
    dispatch(endBreakAction({ employeeId, at: new Date().toISOString() }));
  }

  function handleClockOutConfirm() {
    if (!employeeId || !activeSession) return;
    const at = new Date();
    const finalWorked = Math.max(
      0,
      Math.floor(
        (at.getTime() - new Date(activeSession.clockInAt ?? at).getTime()) /
          1000,
      ) - breakSeconds(activeSession, at),
    );
    dispatch(
      clockOutAction({
        employeeId,
        at: at.toISOString(),
        note: noteOut.trim() || undefined,
      }),
    );
    if (activeSession.logId) {
      closeDay(activeSession.logId, {
        clockOut: formatTimeHHMM(at),
        hoursWorked: Math.round((finalWorked / 3600) * 100) / 100,
      });
    }
    setClockOutOpen(false);
    setNoteOut("");
    toast.success("Clocked out", {
      description: `${Math.round((finalWorked / 3600) * 10) / 10}h recorded for today.`,
    });
  }

  function handleLocationChange(next: LocationChoice) {
    setChoice(next);
    if (employeeId && activeSession) {
      dispatch(
        setLocationAction({
          employeeId,
          location: next.location,
          locationName: next.locationName,
          bookingId: next.bookingId,
        }),
      );
    }
  }

  function handleBookDesk(name: string): string {
    if (!employeeId) return "";
    const id = bookDesk({
      employeeId,
      locationType: "desk",
      locationName: name,
      date: todayIso,
      startTime: schedule?.start ?? "09:00",
      endTime: schedule?.end ?? "17:00",
      status: "confirmed",
      notes: "Booked from the attendance clock",
    });
    toast.success("Desk booked", {
      description: `${name} for today — visible on your profile's Location Bookings.`,
    });
    return id;
  }

  function handleDrillDown(next: Exclude<AttendanceCardFilter, "all">) {
    setFilter((prev) => (prev === next ? "all" : next));
    setTab("timesheet");
  }

  function handleSubmitTimesheet() {
    if (!employee) return;
    const record: TimesheetRecord = {
      id: `ts-${employee.id}-${activeWeekStart}`,
      employeeName: employee.fullName,
      employeeInitials: employee.initials,
      department: employee.departmentName,
      weekStart: activeWeek.weekStart,
      weekEnd: activeWeek.weekEnd,
      totalHours: totals.totalHours,
      overtimeHours: totals.overtimeHours,
      daysPresent: totals.daysPresent,
      daysAbsent: totals.daysAbsent,
      daysLate: totals.daysLate,
      status: "submitted",
      dailyEntries: activeWeek.entries,
    };
    dispatch(
      submitTimesheetAction({
        timesheet: record,
        submittedAt: new Date().toISOString(),
      }),
    );
    setSubmitOpen(false);
    toast.success("Timesheet submitted", {
      description: "Your manager will see it in the attendance approval queue.",
    });
  }

  function handleCorrectionSubmit(entry: DailyEntry, draft: CorrectionDraft) {
    if (!employeeId) return;
    const log = (logs ?? []).find((l) => l.date === entry.date);
    dispatch(
      requestCorrectionAction({
        employeeId,
        logId: log?.id ?? entry.date,
        date: entry.date,
        requestedClockIn: draft.clockIn || undefined,
        requestedClockOut: draft.clockOut || undefined,
        reason: draft.reason.trim(),
      }),
    );
    setCorrecting(null);
    toast.success("Correction requested", {
      description: "Sent to your manager for review.",
    });
  }

  const locationLabel =
    activeSession?.locationName ??
    (activeSession
      ? LOCATION_CONFIG[activeSession.location].label
      : (choice.locationName ?? LOCATION_CONFIG[choice.location].label));

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Time &amp; Attendance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Clock in and out, manage your breaks, and submit your timesheet.
        </p>
      </div>

      <AttendanceStatCards
        hoursToday={workedHours}
        weekHours={currentWeekTotals.totalHours}
        contractedWeekly={contractedWeekly}
        overtimeHours={overtimeHours(
          currentWeekTotals.totalHours,
          contractedWeekly,
        )}
        punctuality={punctualityRate(currentWeek.entries)}
        filter={filter}
        onDrillDown={handleDrillDown}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <PageTabsList
          tabs={[
            { value: "today", label: "Today" },
            { value: "timesheet", label: "Weekly Timesheet" },
            { value: "calendar", label: "Monthly Overview" },
            { value: "insights", label: "Insights" },
          ]}
        />

        <TabsContent value="today" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <div className="flex flex-col gap-4">
              <ClockWidget
                now={now}
                clockState={clockState}
                schedule={schedule}
                scheduledHours={scheduledHours}
                choice={
                  activeSession
                    ? {
                        location: activeSession.location,
                        locationName: activeSession.locationName,
                        bookingId: activeSession.bookingId,
                      }
                    : choice
                }
                bookings={bookings}
                workedSeconds={worked}
                progressPct={progressPct}
                currentBreakSeconds={currentBreakSeconds}
                todayStatus={todayStatus}
                isLateNow={isLateNow}
                onClockIn={handleClockIn}
                onBreakStart={handleBreakStart}
                onBreakEnd={handleBreakEnd}
                onClockOutOpen={() => setClockOutOpen(true)}
                onLocationChange={handleLocationChange}
                onBookDesk={handleBookDesk}
              />
              <ComplianceStrip
                breaks={compliance}
                overtimeToday={overtimeHours(workedHours, scheduledHours)}
                weekOvertime={overtimeHours(
                  currentWeekTotals.totalHours,
                  contractedWeekly,
                )}
                active={clockState !== "idle"}
              />
            </div>

            <div className="flex flex-col gap-4 h-full">
              <TodaySummary
                clockInTime={clockInTime}
                clockOutTime={clockOutTime}
                clockState={clockState}
                workedSeconds={worked}
                totalBreakSeconds={totalBreak}
                expectedEndTime={expectedEndTime}
                schedule={schedule}
                locationLabel={locationLabel}
              />
              <ActivityLog activity={activity} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timesheet" className="mt-4">
          <WeeklyTimesheet
            weekLabel={activeWeek.label}
            entries={visibleEntries}
            totals={totals}
            contractedWeekly={contractedWeekly}
            todayIso={todayIso}
            weekOffset={weekOffset}
            canGoBack={Math.abs(weekOffset) < weekStarts.length - 1}
            timesheet={activeTimesheet}
            filter={filter}
            onWeekOffsetChange={setWeekOffset}
            onClearFilter={() => setFilter("all")}
            onRequestCorrection={setCorrecting}
            onSubmit={() => setSubmitOpen(true)}
            onViewTimesheet={setDetailTs}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <MonthCalendar
            logs={logs ?? []}
            workPattern={workPattern}
            todayIso={todayIso}
          />
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <InsightsTab
            logs={logs ?? []}
            workPattern={workPattern}
            todayIso={todayIso}
          />
        </TabsContent>
      </Tabs>

      <ClockOutDialog
        open={clockOutOpen}
        onOpenChange={setClockOutOpen}
        workedSeconds={worked}
        totalBreakSeconds={totalBreak}
        noteOut={noteOut}
        onNoteChange={setNoteOut}
        onConfirm={handleClockOutConfirm}
      />

      <SubmitTimesheetDialog
        open={submitOpen}
        weekLabel={activeWeek.label}
        totals={totals}
        contractedWeekly={contractedWeekly}
        missingDays={missingDays}
        onOpenChange={setSubmitOpen}
        onConfirm={handleSubmitTimesheet}
      />

      <CorrectionModal
        entry={correcting}
        onClose={() => setCorrecting(null)}
        onSubmit={handleCorrectionSubmit}
      />

      <TimesheetDetailModal
        detailTs={detailTs}
        onClose={() => setDetailTs(null)}
      />
    </div>
  );
}

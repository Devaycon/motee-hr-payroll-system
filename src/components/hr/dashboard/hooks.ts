"use client";

import {
  Users,
  UserRoundPlus,
  Home,
  Cake,
  UserMinus,
  CalendarCheck,
  HeartPulse,
  CalendarDays,
  TrendingDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { employmentTypeFromName } from "@/src/lib/constants/employment-types";
import { sicknessReasonCategory } from "@/src/lib/constants/sickness";
import { TURNOVER_RECORDS, buildTurnoverTrends } from "@/src/data/workforce-demo";
import type { ChartConfig } from "@/src/components/ui/chart";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  EmployeeRow,
  AttendanceRow,
  LeaveRow,
} from "@/src/lib/types/dashboard";
import {
  employmentLabel,
  getInitials,
} from "@/src/lib/types/dashboard";
import type {
  LocaleEmployee,
  LocaleLeaveRequest,
} from "@/src/lib/types/locale";

/**
 * Stable identifiers for the KPI tiles. The dashboard tabs each render a subset,
 * so they select by key rather than by matching the display label — renaming a
 * card must not silently empty a tab.
 */
export type StatCardKey =
  | "total"
  | "new-hires"
  | "leavers"
  | "remote"
  | "birthdays"
  | "annual-leave"
  | "sick-leave"
  | "other-leave"
  | "turnover";

interface StatCard {
  key: StatCardKey;
  label: string;
  value: string | number;
  sub: string;
  /** Replaces `sub` when the value is zero, so "0" still reads as a sentence. */
  zeroSub?: string;
  link: string;
  icon: LucideIcon;
  /** Omitted when there is no sound basis for a comparison. */
  trend?: string;
  up?: boolean;
  /**
   * A plain-language line shown in place of the trend. Some figures have no
   * meaningful percentage change to report, and a made-up or wildly-scaled one
   * is worse than a concrete fact about the same number.
   */
  note?: string;
  /** What `trend` is measured against; defaults to "vs last month". */
  trendPeriod?: string;
}

function isUpcomingWithinDays(dateStr: string | undefined, days: number) {
  if (!dateStr) return false;
  const today = new Date();
  const [, month, day] = dateStr.split("-").map((n) => Number(n));
  if (!month || !day) return false;
  const thisYear = new Date(today.getFullYear(), month - 1, day);
  const ms = thisYear.getTime() - today.getTime();
  const daysUntil = ms / (1000 * 60 * 60 * 24);
  return daysUntil >= 0 && daysUntil <= days;
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Which kind of leave a request is.
 *
 * The locale bundles carry `leaveType: "Sick Leave"` while the older typings
 * describe a lowercase `type: "sick"`. Matching only the latter is why every
 * leave KPI read zero, so this reads whichever the record actually has and
 * normalises it.
 */
export type LeaveKind = "annual" | "sick" | "other";

export function leaveKindOf(request: LocaleLeaveRequest): LeaveKind {
  const raw = (
    (request as LocaleLeaveRequest & { leaveType?: string }).leaveType ??
    request.type ??
    ""
  ).toLowerCase();
  if (raw.includes("annual")) return "annual";
  if (raw.includes("sick")) return "sick";
  return "other";
}

/** A request that is live: approved, or still waiting on someone. */
function isOpenLeave(request: LocaleLeaveRequest): boolean {
  const status = (request.status ?? "").toLowerCase();
  return status === "approved" || status === "pending" || status === "in_progress";
}

/** Months of leave history the KPI tiles count. */
export const LEAVE_WINDOW_MONTHS = 12;

function shiftMonths(iso: string, months: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * Open leave requests inside the rolling window, counted three ways: how many
 * requests, how many days they add up to, and how many are still pending.
 *
 * A request and a day are not the same thing — one booking can be ten days —
 * so the tiles state which they mean rather than leaving the reader to guess.
 */
function countLeaveByKind(
  requests: LocaleLeaveRequest[],
  refDate: string,
): {
  current: Record<LeaveKind, number>;
  days: Record<LeaveKind, number>;
  pending: Record<LeaveKind, number>;
} {
  const windowStart = shiftMonths(refDate, -LEAVE_WINDOW_MONTHS);

  const current: Record<LeaveKind, number> = { annual: 0, sick: 0, other: 0 };
  const days: Record<LeaveKind, number> = { annual: 0, sick: 0, other: 0 };
  const pending: Record<LeaveKind, number> = { annual: 0, sick: 0, other: 0 };

  for (const r of requests) {
    if (!isOpenLeave(r) || !r.startDate) continue;
    if (r.startDate > refDate || r.startDate < windowStart) continue;
    const kind = leaveKindOf(r);
    current[kind] += 1;
    days[kind] += r.days ?? 1;
    if ((r.status ?? "").toLowerCase() === "pending") pending[kind] += 1;
  }

  return { current, days, pending };
}

export interface LeaveBreakdown {
  requests: Record<LeaveKind, number>;
  days: Record<LeaveKind, number>;
  pending: Record<LeaveKind, number>;
}

/**
 * Leave over the rolling window, split by kind and measured three ways.
 *
 * Shared with `useStatCards` through `countLeaveByKind`, so the tile's headline
 * and the pie beside it can never be computed from different windows.
 */
export function useLeaveBreakdown() {
  return useLocaleSection<LeaveBreakdown>((bundle) => {
    const refDate = bundle._meta.referenceDate ?? isoToday();
    const { current, days, pending } = countLeaveByKind(
      bundle.leaveRequests,
      refDate,
    );
    return { requests: current, days, pending };
  });
}

/**
 * The secondary line on a leave tile: how many of those requests still need
 * someone to act. A count a person can check against the leave screen, rather
 * than a percentage change against a period the data barely covers.
 *
 * The day total lives on in `useLeaveBreakdown` — the pie beside the tile is a
 * share of days — it is just no longer repeated in the text.
 */
function leaveNote(pending: number): string {
  return pending === 0 ? "All approved" : `${pending} still to approve`;
}

/**
 * Org-wide turnover: latest period rate and the delta against the prior period.
 * Read by both the KPI tile and the Turnover gauge, so the two can never drift.
 * `TURNOVER_RECORDS` is static demo data, not locale data, so this is a plain
 * function rather than a `useLocaleSection` hook — there is nothing to load.
 */
export function getTurnoverRate(): {
  rate: number;
  delta: number;
  /** Resignations in the latest period. */
  voluntary: number;
  /** Employer-initiated exits in the latest period. */
  involuntary: number;
} {
  const trends = buildTurnoverTrends(TURNOVER_RECORDS);
  const latest = trends[trends.length - 1];
  const prior = trends[trends.length - 2];
  return {
    rate: latest?.rate ?? 0,
    delta:
      latest && prior ? Math.round((latest.rate - prior.rate) * 10) / 10 : 0,
    voluntary: latest?.voluntary ?? 0,
    involuntary: latest?.involuntary ?? 0,
  };
}

export function useStatCards() {
  return useLocaleSection<StatCard[]>((bundle) => {
    const employees = bundle.employees;
    const refDate = bundle._meta.referenceDate ?? isoToday();
    const refMonth = refDate.slice(0, 7);

    const total = employees.length;
    const newHires = employees.filter((e) =>
      e.startDate?.startsWith(refMonth),
    ).length;
    const remote = employees.filter((e) => e.workMode === "remote").length;
    const birthdays = employees.filter((e) =>
      isUpcomingWithinDays(e.dateOfBirth, 7),
    ).length;
    const leaverStatuses = ["terminated", "resigned", "offboarded", "left"];
    const leaversThisMonth = employees.filter((e) => {
      const leftThisMonth = e.dateOfLeaving?.startsWith(refMonth) ?? false;
      const isLeaver = leaverStatuses.includes(e.status ?? "");
      return isLeaver || leftThisMonth;
    }).length;

    // Leave is counted over a rolling 12 months ending at the reference date,
    // the same window the Sickness tab uses. Without a window the count swept
    // in every record in the bundle — which runs a year past the reference
    // date — so it was reporting leave that hasn't happened yet.
    const leave = countLeaveByKind(bundle.leaveRequests, refDate);
    const { annual, sick, other } = leave.current;

    const { rate: turnoverRate, delta: turnoverDelta } = getTurnoverRate();

    return [
      {
        key: "total",
        label: "Total Employees",
        link: "/organization/employees",
        icon: Users,
        value: total,
        sub: "Active employees",
        trend: "4.2%",
        up: true,
      },
      {
        key: "new-hires",
        label: "New Hires This Month",
        link: "/talent/onboarding",
        icon: UserRoundPlus,
        value: newHires,
        sub: "Employees hired this month",
        zeroSub: "No new hires this month",
        trend: "12%",
        up: true,
      },
      {
        key: "leavers",
        label: "Leavers This Month",
        link: "/talent/offboarding",
        icon: UserMinus,
        value: leaversThisMonth,
        sub: "Employees who left this month",
        zeroSub: "No leavers this month",
        trend: "2.1%",
        up: false,
      },
      {
        key: "remote",
        label: "Employees Working Remotely Today",
        // Lands on the employee directory pre-filtered to remote workers — the
        // data this card actually counts. Previously pointed at Attendance,
        // which has no work-mode view (client feedback round 2, §E1).
        link: "/organization/employees?workMode=remote",
        icon: Home,
        value: remote,
        sub: "Remote today",
        zeroSub: "Nobody is working remotely today",
        trend: "6.5%",
        trendPeriod: "vs last week",
        up: true,
      },
      {
        key: "birthdays",
        label: "Upcoming Birthdays",
        // Scoped to birthdays rather than dumping the user on the generic
        // Calendar page (client feedback round 2, §E2).
        link: "/hr-action-center/events?type=birthday",
        icon: Cake,
        value: birthdays,
        sub: "Celebrating within the next 7 days",
        zeroSub: "No birthdays in the next 7 days",
        trend: "1.0%",
        trendPeriod: "vs last week",
        up: true,
      },
      {
        key: "annual-leave",
        label: "Annual Leave Requests",
        link: "/time-payroll/leave",
        icon: CalendarCheck,
        value: annual,
        sub: "Requests in the last 12 months",
        zeroSub: "No requests in the last 12 months",
        note: leaveNote(leave.pending.annual),
      },
      {
        key: "sick-leave",
        label: "Sick Leave Requests",
        link: "/time-payroll/leave",
        icon: HeartPulse,
        value: sick,
        sub: "Requests in the last 12 months",
        zeroSub: "No requests in the last 12 months",
        note: leaveNote(leave.pending.sick),
      },
      {
        key: "other-leave",
        label: "Other Leave Requests",
        link: "/time-payroll/leave",
        icon: CalendarDays,
        value: Math.max(0, other),
        sub: "Requests in the last 12 months",
        zeroSub: "No requests in the last 12 months",
        note: leaveNote(leave.pending.other),
      },
      {
        key: "turnover",
        label: "Employee Turnover Rate",
        link: "/operations/workforce",
        icon: TrendingDown,
        value: `${turnoverRate}%`,
        // The badge carries the comparison, so the sub says what the number is
        // rather than repeating the delta in different words.
        sub: "Latest quarter, org-wide",
        trend: `${Math.abs(turnoverDelta)}%`,
        trendPeriod: "vs last quarter",
        up: turnoverDelta > 0,
      },
    ];
  });
}

interface AttendancePoint {
  date: string;
  present: number;
  late: number;
  absent: number;
}

export const ATTENDANCE_CONFIG: ChartConfig = {
  present: { label: "Present", color: "#4ED251" },
  late: { label: "Late arrivals", color: "#ff8b2d" },
  absent: { label: "Absent", color: "#6366f1" },
};

export function useAttendanceSeries() {
  return useLocaleSection<AttendancePoint[]>((bundle) => {
    const byDate = new Map<
      string,
      { present: number; late: number; absent: number }
    >();
    for (const row of bundle.attendance) {
      if (!byDate.has(row.date)) {
        byDate.set(row.date, { present: 0, late: 0, absent: 0 });
      }
      const bucket = byDate.get(row.date)!;
      if (row.status === "present") bucket.present += 1;
      else if (row.status === "late") bucket.late += 1;
      else if (row.status === "absent") bucket.absent += 1;
    }
    const sortedDates = Array.from(byDate.keys()).sort();
    const last30 = sortedDates.slice(-30);
    return last30.map((date) => {
      const b = byDate.get(date)!;
      const short = new Date(date).toLocaleDateString("en-GB", {
        month: "short",
        day: "2-digit",
      });
      return { date: short, present: b.present, late: b.late, absent: b.absent };
    });
  });
}

export interface WeeklyAttendancePoint {
  /** "Wk1" … "Wk3", oldest first. */
  week: string;
  present: number;
  late: number;
  absent: number;
}

/** How many trailing weeks the Attendance tab's summary tiles show. */
const ATTENDANCE_WEEKS = 3;

/**
 * The last few weeks of attendance as an average per day, which is what the
 * Attendance tab's three summary tiles compare. Averaged rather than totalled
 * so a short week (a bank holiday, or the partial week the data ends on) does
 * not read as a collapse in attendance.
 */
export function useWeeklyAttendance() {
  return useLocaleSection<WeeklyAttendancePoint[]>((bundle) => {
    const byDate = new Map<
      string,
      { present: number; late: number; absent: number }
    >();
    for (const row of bundle.attendance) {
      if (!byDate.has(row.date)) {
        byDate.set(row.date, { present: 0, late: 0, absent: 0 });
      }
      const bucket = byDate.get(row.date)!;
      if (row.status === "present") bucket.present += 1;
      else if (row.status === "late") bucket.late += 1;
      else if (row.status === "absent") bucket.absent += 1;
    }

    // Walk back from the most recent date in 7-day blocks so the last block is
    // always the current week, regardless of which weekday the data ends on.
    const dates = Array.from(byDate.keys()).sort();
    const recent = dates.slice(-ATTENDANCE_WEEKS * 7);

    const points: WeeklyAttendancePoint[] = [];
    for (let i = 0; i < ATTENDANCE_WEEKS; i += 1) {
      const start = recent.length - (ATTENDANCE_WEEKS - i) * 7;
      const block = recent.slice(Math.max(0, start), Math.max(0, start + 7));
      if (block.length === 0) continue;
      let present = 0;
      let late = 0;
      let absent = 0;
      for (const date of block) {
        const b = byDate.get(date)!;
        present += b.present;
        late += b.late;
        absent += b.absent;
      }
      points.push({
        week: `Wk${points.length + 1}`,
        present: Math.round(present / block.length),
        late: Math.round(late / block.length),
        absent: Math.round(absent / block.length),
      });
    }
    return points;
  });
}

export interface MonthlyCount {
  /** Short month name, e.g. "Sep". */
  month: string;
  value: number;
}

/** Trailing months shown by the small leave trend tile. */
const LEAVE_TREND_MONTHS = 3;

/**
 * Requests per month for each kind of leave, so the KPI tiles can carry a
 * sparkline alongside the headline count — a bare "22" says nothing about
 * whether that is rising.
 *
 * Months after the reference date are dropped: the demo bundle runs a year
 * ahead of it, and a trend that includes leave which hasn't happened yet is
 * misleading.
 */
export function useLeaveTrends() {
  return useLocaleSection<Record<LeaveKind, MonthlyCount[]>>((bundle) => {
    const refMonth = (bundle._meta.referenceDate ?? isoToday()).slice(0, 7);

    const byKind: Record<LeaveKind, Map<string, number>> = {
      annual: new Map(),
      sick: new Map(),
      other: new Map(),
    };

    for (const r of bundle.leaveRequests) {
      const month = r.startDate?.slice(0, 7);
      if (!month || month > refMonth) continue;
      const months = byKind[leaveKindOf(r)];
      months.set(month, (months.get(month) ?? 0) + 1);
    }

    const toSeries = (months: Map<string, number>): MonthlyCount[] =>
      Array.from(months.keys())
        .sort()
        .slice(-LEAVE_TREND_MONTHS)
        .map((month) => ({
          month: new Date(`${month}-01T00:00:00`).toLocaleDateString("en-GB", {
            month: "short",
          }),
          value: months.get(month) ?? 0,
        }));

    return {
      annual: toSeries(byKind.annual),
      sick: toSeries(byKind.sick),
      other: toSeries(byKind.other),
    };
  });
}

export interface SicknessAbsentee {
  employeeId: string;
  name: string;
  initials: string;
  department: string;
  days: number;
  spells: number;
}

export interface SicknessData {
  /** Sick days recorded over the rolling window. */
  daysInWindow: number;
  /** Distinct employees with a sick spell in the window. */
  peopleInWindow: number;
  /** Sick days as a share of available working days, as a percentage. */
  absenceRate: number;
  /** Average length of a sick spell, in days. */
  averageSpell: number;
  /** Sick days per month, oldest first, ending at the reference month. */
  trend: MonthlyCount[];
  /** Clinical categories, most days first. */
  byReason: { label: string; value: number }[];
  /** Highest total sick days over the window, most first. */
  topAbsentees: SicknessAbsentee[];
}

/** Months of sickness history the trend tile shows. */
const SICKNESS_TREND_MONTHS = 6;

/**
 * Absence is reported on a rolling 12 months rather than the calendar month —
 * the standard HR measure, and the only one that stays meaningful when a given
 * month happens to have no absence in it.
 */
const SICKNESS_WINDOW_MONTHS = 12;

/** Working days in a year, for the absence-rate denominator. */
const WORKING_DAYS_PER_YEAR = 260;

/**
 * Sickness absence, read off the same `leaveRequests` the Sickness & Absence
 * module writes to (see `lib/profile/collections.ts`), classified through the
 * shared clinical taxonomy so the dashboard and the module agree on categories.
 */
export function useSickness() {
  return useLocaleSection<SicknessData>((bundle) => {
    const refDate = bundle._meta.referenceDate ?? isoToday();
    const refMonth = refDate.slice(0, 7);

    const sick = bundle.leaveRequests.filter((r) => leaveKindOf(r) === "sick");
    const headcount = bundle.employees.length || 1;

    const daysOf = (r: LocaleLeaveRequest) => r.days ?? 1;

    // Rolling window, ending at the reference date so nothing counted is in
    // the future.
    const windowStart = new Date(`${refDate}T00:00:00`);
    windowStart.setMonth(windowStart.getMonth() - SICKNESS_WINDOW_MONTHS);
    const windowStartIso = windowStart.toISOString().slice(0, 10);

    const inWindow = sick.filter(
      (r) =>
        r.startDate && r.startDate >= windowStartIso && r.startDate <= refDate,
    );
    const daysInWindow = inWindow.reduce((sum, r) => sum + daysOf(r), 0);
    const peopleInWindow = new Set(inWindow.map((r) => r.employeeId)).size;

    const absenceRate =
      Math.round(
        (daysInWindow / (headcount * WORKING_DAYS_PER_YEAR)) * 1000,
      ) / 10;

    const averageSpell =
      inWindow.length === 0
        ? 0
        : Math.round((daysInWindow / inWindow.length) * 10) / 10;

    // Trend — the months up to and including the reference month, so the tile
    // never shows absence that hasn't happened yet.
    const byMonth = new Map<string, number>();
    for (const r of sick) {
      const month = r.startDate?.slice(0, 7);
      if (!month || month > refMonth) continue;
      byMonth.set(month, (byMonth.get(month) ?? 0) + daysOf(r));
    }
    const trend: MonthlyCount[] = Array.from(byMonth.keys())
      .sort()
      .slice(-SICKNESS_TREND_MONTHS)
      .map((month) => ({
        month: new Date(`${month}-01T00:00:00`).toLocaleDateString("en-GB", {
          month: "short",
        }),
        value: byMonth.get(month) ?? 0,
      }));

    // Reasons, by days lost rather than spell count — a fortnight off matters
    // more than a single afternoon.
    const byReasonMap = new Map<string, number>();
    for (const r of inWindow) {
      const category = sicknessReasonCategory(r.reason);
      byReasonMap.set(category, (byReasonMap.get(category) ?? 0) + daysOf(r));
    }
    const byReason = Array.from(byReasonMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);

    // Who is carrying the most absence.
    const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
    const perEmployee = new Map<string, { days: number; spells: number }>();
    for (const r of inWindow) {
      const entry = perEmployee.get(r.employeeId) ?? { days: 0, spells: 0 };
      entry.days += daysOf(r);
      entry.spells += 1;
      perEmployee.set(r.employeeId, entry);
    }
    const topAbsentees: SicknessAbsentee[] = Array.from(perEmployee.entries())
      .map(([employeeId, entry]) => {
        const emp = employeesById.get(employeeId);
        return {
          employeeId,
          name: emp?.fullName ?? employeeId,
          initials: emp?.initials || getInitials(emp?.fullName ?? employeeId),
          department: emp?.departmentName ?? "—",
          days: entry.days,
          spells: entry.spells,
        };
      })
      .sort((a, b) => b.days - a.days);

    return {
      daysInWindow,
      peopleInWindow,
      absenceRate,
      averageSpell,
      trend,
      byReason,
      topAbsentees,
    };
  });
}

interface HeadcountPoint {
  month: string;
  headcount: number;
  joiners: number;
  leavers: number;
  /** joiners − leavers for the month. */
  net: number;
}

export const HEADCOUNT_CONFIG: ChartConfig = {
  headcount: { label: "Headcount", color: "#4ED251" },
};

export function useHeadcountTrend() {
  return useLocaleSection<HeadcountPoint[]>((bundle) =>
    bundle.headcountSnapshots.map((s) => {
      const month = s.date.slice(0, 7);
      // Counted off the roster rather than read from the snapshot: the
      // snapshots carry joiners/leavers of 0 for every month even though the
      // employee records show people starting and leaving, and the roster is
      // what the Employees module and the New Hires / Leavers KPI cards count.
      const joiners = bundle.employees.filter((e) =>
        e.startDate?.startsWith(month),
      ).length;
      const leavers = bundle.employees.filter((e) =>
        e.dateOfLeaving?.startsWith(month),
      ).length;
      return {
        month: new Date(`${s.date}T00:00:00`).toLocaleDateString("en-GB", {
          month: "short",
        }),
        headcount: s.total,
        joiners,
        leavers,
        net: joiners - leavers,
      };
    }),
  );
}

/**
 * When the underlying data was generated, so the dashboard can say how fresh
 * it is rather than leaving the user to guess (client feedback — data freshness).
 */
export function useLocaleFreshness() {
  return useLocaleSection<{ generatedAt: string }>((bundle) => ({
    generatedAt: bundle._meta.generatedAt,
  }));
}

interface GenderSplitData {
  series: { key: string; label: string; value: number; color: string }[];
  config: ChartConfig;
}

export function useGenderSplit() {
  return useLocaleSection<GenderSplitData>((bundle) => {
    let male = 0;
    let female = 0;
    let other = 0;
    for (const e of bundle.employees) {
      if (e.gender === "male") male += 1;
      else if (e.gender === "female") female += 1;
      else other += 1;
    }
    return {
      series: [
        { key: "male", label: "Male", value: male, color: "#4ED251" },
        { key: "female", label: "Female", value: female, color: "#6366f1" },
        { key: "other", label: "Other", value: other, color: "#ff8b2d" },
      ],
      config: {
        male: { label: "Male", color: "#4ED251" },
        female: { label: "Female", color: "#6366f1" },
        other: { label: "Other", color: "#ff8b2d" },
      },
    };
  });
}

interface DeptHeadcountPoint {
  category: string;
  value: number;
}

const DEPT_PALETTE = [
  "#4ED251",
  "#ff8b2d",
  "#6366f1",
  "#06b6d4",
  "#a78bfa",
  "#f59e0b",
  "#f43f5e",
  "#3b82f6",
  "#84cc16",
  "#ec4899",
];

interface DeptHeadcountData {
  data: DeptHeadcountPoint[];
  config: ChartConfig;
}

export function useDepartmentHeadcount() {
  return useLocaleSection<DeptHeadcountData>((bundle) => {
    const counts = new Map<string, number>();
    for (const emp of bundle.employees) {
      counts.set(emp.departmentName, (counts.get(emp.departmentName) ?? 0) + 1);
    }
    const data: DeptHeadcountPoint[] = [];
    const config: ChartConfig = {};
    let i = 0;
    for (const [category, value] of counts) {
      const color = DEPT_PALETTE[i % DEPT_PALETTE.length];
      data.push({ category, value });
      config[category] = { label: category, color };
      i += 1;
    }
    return { data, config };
  });
}

interface EmploymentTypeData {
  data: { key: string; label: string; value: number; fill: string }[];
  config: Record<string, { label: string; color: string }>;
}

const EMPLOYMENT_TYPE_PALETTE: Record<string, string> = {
  "Full-time": "#4ED251",
  "Part-time": "#ff8b2d",
  Contract: "#6366f1",
  Intern: "#06b6d4",
  "NYSC Corps Member": "#a78bfa",
};

export function useEmploymentTypeBreakdown() {
  return useLocaleSection<EmploymentTypeData>((bundle) => {
    const byType = new Map<string, number>();
    const typeNameById = new Map(
      bundle.employmentTypes.map((t) => [t.id, t.name]),
    );
    for (const emp of bundle.employees) {
      const name = typeNameById.get(emp.employmentTypeId) ?? emp.employmentTypeId;
      byType.set(name, (byType.get(name) ?? 0) + 1);
    }
    const data: EmploymentTypeData["data"] = [];
    const config: EmploymentTypeData["config"] = {};
    for (const [name, value] of byType) {
      const color =
        EMPLOYMENT_TYPE_PALETTE[name] ?? DEPT_PALETTE[data.length % DEPT_PALETTE.length];
      const key = name.toLowerCase().replace(/\s+/g, "_");
      data.push({ key, label: name, value, fill: color });
      config[key] = { label: name, color };
    }
    return { data, config };
  });
}

function buildEmployeeRow(
  emp: LocaleEmployee,
  index: number,
  byId: Map<string, LocaleEmployee>,
  empTypeName: string | undefined,
): EmployeeRow {
  const manager = emp.managerId ? byId.get(emp.managerId) ?? null : null;
  return {
    id: index + 1,
    empId: emp.id,
    name: emp.fullName,
    initials: emp.initials || getInitials(emp.fullName),
    email: emp.email,
    city: emp.workLocation ?? "—",
    title: emp.jobTitle,
    department: emp.departmentName,
    workMode:
      emp.workMode === "remote"
        ? "Remotely"
        : emp.workMode === "hybrid"
          ? "Hybrid"
          : "At Office",
    teamLead: manager?.fullName ?? "—",
    employmentType: employmentTypeFromName(empTypeName),
    status: emp.status,
    startDate: emp.startDate,
    managerName: manager?.fullName ?? null,
  };
}

interface DashboardTableData {
  employees: EmployeeRow[];
  absent: AttendanceRow[];
  onLeave: AttendanceRow[];
  late: AttendanceRow[];
  leaveRequests: LeaveRow[];
}

export function useDashboardTableData() {
  return useLocaleSection<DashboardTableData>((bundle) => {
    const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
    const empTypeNameById = new Map(
      bundle.employmentTypes.map((t) => [t.id, t.name]),
    );

    const employees = bundle.employees.map((e, i) =>
      buildEmployeeRow(
        e,
        i,
        employeesById,
        empTypeNameById.get(e.employmentTypeId),
      ),
    );

    const todayIso = bundle._meta.referenceDate ?? isoToday();
    const todayRows = bundle.attendance.filter((r) => r.date === todayIso);

    const absent: AttendanceRow[] = todayRows
      .filter((r) => r.status === "absent")
      .map((r, i) => {
        const emp = employeesById.get(r.employeeId);
        return {
          id: i + 1,
          name: emp?.fullName ?? r.employeeId,
          status: "absent",
          clockIn: "—",
          department: emp?.departmentName ?? "—",
        };
      });

    const late: AttendanceRow[] = todayRows
      .filter((r) => r.status === "late")
      .map((r, i) => {
        const emp = employeesById.get(r.employeeId);
        return {
          id: i + 1,
          name: emp?.fullName ?? r.employeeId,
          status: "late",
          clockIn: r.clockIn ?? "—",
          department: emp?.departmentName ?? "—",
        };
      });

    const onLeave: AttendanceRow[] = bundle.employees
      .filter((e) => e.status === "on_leave")
      .map((e, i) => ({
        id: i + 1,
        name: e.fullName,
        status: "on_leave",
        clockIn: "—",
        department: e.departmentName,
      }));

    const leaveRequests: LeaveRow[] = bundle.leaveRequests.slice(0, 30).map((lr, i) => {
      const emp = employeesById.get(lr.employeeId);
      return {
        id: i + 1,
        name: emp?.fullName ?? lr.employeeId,
        leaveType: lr.type,
        startDate: lr.startDate,
        endDate: lr.endDate,
        days: lr.days ?? 1,
        status: lr.status,
      };
    });

    return { employees, absent, onLeave, late, leaveRequests };
  });
}

export function useDashboardGreeting() {
  return useLocaleSection<{ employeeCount: number; tenantName: string }>(
    (bundle) => ({
      employeeCount: bundle.employees.length,
      tenantName: bundle.tenant.name,
    }),
  );
}

// Re-export for backwards compatibility with chart configs used elsewhere.
export type { StatCard, AttendancePoint, HeadcountPoint };
export { employmentLabel };

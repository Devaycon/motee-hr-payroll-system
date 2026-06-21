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
import type { LocaleEmployee } from "@/src/lib/types/locale";

interface StatCard {
  label: string;
  value: string | number;
  sub: string;
  link: string;
  icon: LucideIcon;
  trend: string;
  up: boolean;
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

    const activeLeave = bundle.leaveRequests.filter(
      (r) => r.status === "approved" || r.status === "in_progress",
    );
    const annual = activeLeave.filter((r) => r.type === "annual").length;
    const sick = activeLeave.filter((r) => r.type === "sick").length;
    const other = activeLeave.length - annual - sick;

    // Org-wide turnover: latest period rate and delta vs the prior period.
    const turnoverTrends = buildTurnoverTrends(TURNOVER_RECORDS);
    const latestTurnover = turnoverTrends[turnoverTrends.length - 1];
    const priorTurnover = turnoverTrends[turnoverTrends.length - 2];
    const turnoverRate = latestTurnover?.rate ?? 0;
    const turnoverDelta =
      latestTurnover && priorTurnover
        ? Math.round((latestTurnover.rate - priorTurnover.rate) * 10) / 10
        : 0;

    return [
      {
        label: "Total Employees",
        link: "/organization/employees",
        icon: Users,
        value: total,
        sub: "Active headcount",
        trend: "4.2%",
        up: true,
      },
      {
        label: "New Hire This Month",
        link: "/talent/onboarding",
        icon: UserRoundPlus,
        value: newHires,
        sub: "Joined this month",
        trend: "12%",
        up: true,
      },
      {
        label: "Leavers This Month",
        link: "/talent/offboarding",
        icon: UserMinus,
        value: leaversThisMonth,
        sub: "Left this month",
        trend: "2.1%",
        up: false,
      },
      {
        label: "Remote Employees Today",
        link: "/time-payroll/attendance",
        icon: Home,
        value: remote,
        sub: "Remote today",
        trend: "6.5%",
        up: true,
      },
      {
        label: "Birthdays (Next 7 Days)",
        link: "/hr-action-center/events",
        icon: Cake,
        value: birthdays,
        sub: "Within next 7 days",
        trend: "1.0%",
        up: true,
      },
      {
        label: "Annual Leave",
        link: "/time-payroll/leave",
        icon: CalendarCheck,
        value: annual,
        sub: "Active annual leave requests",
        trend: "3.4%",
        up: true,
      },
      {
        label: "Sick Leave",
        link: "/time-payroll/leave",
        icon: HeartPulse,
        value: sick,
        sub: "Active sick leave requests",
        trend: "1.8%",
        up: false,
      },
      {
        label: "Other Leave Types",
        link: "/time-payroll/leave",
        icon: CalendarDays,
        value: Math.max(0, other),
        sub: "Other active leave types",
        trend: "0.9%",
        up: true,
      },
      {
        label: "Turnover Rate",
        link: "/operations/workforce",
        icon: TrendingDown,
        value: `${turnoverRate}%`,
        sub: `${turnoverDelta <= 0 ? "↓" : "↑"} ${Math.abs(turnoverDelta)}% vs last quarter`,
        trend: `${Math.abs(turnoverDelta)}%`,
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

interface HeadcountPoint {
  month: string;
  headcount: number;
}

export const HEADCOUNT_CONFIG: ChartConfig = {
  headcount: { label: "Headcount", color: "#4ED251" },
};

export function useHeadcountTrend() {
  return useLocaleSection<HeadcountPoint[]>((bundle) =>
    bundle.headcountSnapshots.map((s) => ({
      month: new Date(`${s.month}-01`).toLocaleDateString("en-US", {
        month: "short",
      }),
      headcount: s.total,
    })),
  );
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

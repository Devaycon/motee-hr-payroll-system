import {
  Users,
  Clock,
  CalendarDays,
  UserCheck,
  Wallet,
  Building2,
  Timer,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Scale,
} from "lucide-react";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { defineReport, type AnyReportDef } from "../types";
import {
  countBy,
  sumBy,
  avgBy,
  byMonth,
  monthLabel,
  paletteColor,
  barSpec,
  pieSpec,
  lineSpec,
  radialSpec,
} from "../charts";
import { buildCases } from "@/src/components/hr/grievance/build-cases";
import {
  SLA_LABELS,
  daysOpen,
  slaState,
  type CaseOutcome,
} from "@/src/lib/types/grievance";
import {
  CASE_OUTCOME_CONFIG,
  CASE_STAGE_CONFIG,
  CASE_TYPE_CONFIG,
  CONFIDENTIALITY_CONFIG,
  PRIORITY_CONFIG,
} from "@/src/data/grievance-demo";

function empLookup(b: LocaleBundle) {
  return new Map(b.employees.map((e) => [e.id, e]));
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Employees / Headcount ───────────────────────────────────────────────────
interface EmpRow {
  employeeNumber: string;
  fullName: string;
  department: string;
  jobTitle: string;
  employmentType: string;
  status: string;
  gender: string;
  grade: string;
  age: number;
  startDate: string;
  tenureYears: number;
  manager: string;
  directReports: number;
  salary: number;
}

function ageBucket(age: number): string {
  if (age < 25) return "Under 25";
  if (age < 35) return "25–34";
  if (age < 45) return "35–44";
  if (age < 55) return "45–54";
  return "55+";
}

const employeesReport = defineReport<EmpRow>({
  id: "employees",
  label: "Employees / Headcount",
  description: "Workforce roster, headcount and pay by department.",
  icon: Users,
  group: "People",
  permission: "organization.employees",
  select: (b) => {
    const types = new Map(b.employmentTypes.map((t) => [t.id, t.name]));
    const names = new Map(b.employees.map((e) => [e.id, e.fullName]));
    const reportCounts = new Map<string, number>();
    for (const e of b.employees) {
      if (e.managerId)
        reportCounts.set(e.managerId, (reportCounts.get(e.managerId) ?? 0) + 1);
    }
    const ref = b._meta?.referenceDate
      ? new Date(b._meta.referenceDate)
      : new Date();
    const YEAR_MS = 365.25 * 24 * 3600 * 1000;
    return b.employees.map((e) => {
      const dob = e.dateOfBirth ? new Date(e.dateOfBirth) : null;
      const age = dob
        ? Math.max(0, Math.floor((ref.getTime() - dob.getTime()) / YEAR_MS))
        : 0;
      const tenureYears = e.startDate
        ? Math.max(
            0,
            Math.round(
              ((ref.getTime() - new Date(e.startDate).getTime()) / YEAR_MS) * 10,
            ) / 10,
          )
        : 0;
      return {
        employeeNumber: e.employeeNumber,
        fullName: e.fullName,
        department: e.departmentName,
        jobTitle: e.jobTitle,
        employmentType: types.get(e.employmentTypeId) ?? e.employmentTypeId,
        status: e.status,
        gender: e.gender ?? "—",
        grade: e.grade ?? "—",
        age,
        startDate: e.startDate,
        tenureYears,
        manager: e.managerId ? names.get(e.managerId) ?? "—" : "—",
        directReports: reportCounts.get(e.id) ?? 0,
        salary: e.salary?.amount ?? 0,
      };
    });
  },
  columns: [
    { key: "employeeNumber", header: "Employee ID", value: (r) => r.employeeNumber },
    { key: "fullName", header: "Name", value: (r) => r.fullName },
    { key: "department", header: "Department", value: (r) => r.department },
    { key: "jobTitle", header: "Job Title", value: (r) => r.jobTitle },
    { key: "employmentType", header: "Type", value: (r) => r.employmentType },
    { key: "grade", header: "Grade", value: (r) => r.grade },
    { key: "status", header: "Status", value: (r) => r.status },
    { key: "manager", header: "Manager", value: (r) => r.manager },
    { key: "directReports", header: "Direct Reports", value: (r) => r.directReports },
    { key: "age", header: "Age", value: (r) => r.age },
    { key: "tenureYears", header: "Tenure (yrs)", value: (r) => r.tenureYears },
    { key: "startDate", header: "Start Date", value: (r) => r.startDate },
    { key: "salary", header: "Annual Salary", value: (r) => r.salary, money: true },
  ],
  filters: [
    {
      key: "department",
      label: "Department",
      options: (rows) => [...new Set(rows.map((r) => r.department))],
      match: (r, v) => r.department === v,
    },
    {
      key: "employmentType",
      label: "Employment type",
      options: (rows) => [...new Set(rows.map((r) => r.employmentType))],
      match: (r, v) => r.employmentType === v,
    },
  ],
  exportParams: [
    {
      key: "lineManagers",
      label: "Line managers only",
      description: "Employees with at least one direct report.",
      predicate: (r) => r.directReports > 0,
    },
    {
      key: "individualContributors",
      label: "Individual contributors only",
      description: "Employees with no direct reports.",
      predicate: (r) => r.directReports === 0,
    },
    {
      key: "active",
      label: "Active employees only",
      description: "Exclude probation, leave and exited staff.",
      predicate: (r) => r.status === "active",
    },
    {
      key: "recentHires",
      label: "Recent hires (≤ 1 year)",
      description: "Joined within the last year.",
      predicate: (r) => r.tenureYears <= 1,
    },
  ],
  searchText: (r) => `${r.fullName} ${r.department} ${r.jobTitle}`,
  analytics: (rows) => {
    const active = rows.filter((r) => r.status === "active").length;
    const payroll = rows.reduce((s, r) => s + r.salary, 0);
    const avgSalary = Math.round(payroll / (rows.length || 1));
    const hires = byMonth(rows, (r) => r.startDate).slice(-12);
    return {
      stats: [
        {
          label: "Headcount",
          value: rows.length,
          sub: "Employees on record",
          icon: Users,
        },
        {
          label: "Active",
          value: active,
          sub: `${Math.round((active / (rows.length || 1)) * 100)}% of workforce`,
          icon: UserCheck,
          trend: `${Math.round((active / (rows.length || 1)) * 100)}%`,
          up: true,
        },
        {
          label: "Total Annual Payroll",
          value: payroll,
          money: true,
          sub: `Avg ${"≈"} per role`,
          icon: Wallet,
        },
        {
          label: "Departments",
          value: new Set(rows.map((r) => r.department)).size,
          sub: `Avg salary ${avgSalary.toLocaleString()}`,
          icon: Building2,
        },
      ],
      charts: [
        barSpec("Headcount by Department", countBy(rows, (r) => r.department), {
          valueLabel: "Employees",
          description: "Employees in each department, largest first.",
        }),
        pieSpec("emp-type", "Employment Mix", countBy(rows, (r) => r.employmentType), {
          centerLabel: "Staff",
          description: "Composition of contract / employment types.",
        }),
        pieSpec("emp-gender", "Gender Representation", countBy(rows, (r) => r.gender), {
          centerLabel: "Staff",
          description: "Gender split across the active roster.",
        }),
        barSpec(
          "Annual Payroll by Department",
          sumBy(rows, (r) => r.department, (r) => r.salary),
          {
            valueLabel: "Payroll",
            money: true,
            description: "Total annual salary cost per department.",
          },
        ),
        barSpec("Headcount by Grade", countBy(rows, (r) => r.grade), {
          valueLabel: "Employees",
          layout: "horizontal",
          description: "Distribution across pay grades / bands.",
        }),
        barSpec("Age Distribution", countBy(rows, (r) => ageBucket(r.age)), {
          valueLabel: "Employees",
          layout: "horizontal",
          description: "Workforce age profile by band.",
        }),
        lineSpec(
          "Hires by Month",
          hires.map((m) => ({ month: monthLabel(m.label), hires: m.value })),
          [{ key: "hires", label: "Hires", color: "#4ED251" }],
          "month",
          "area",
          {
            fullWidth: true,
            description: "New joiners per month over the last year.",
            footer: `${hires.reduce((s, m) => s + m.value, 0)} hires across ${hires.length} months.`,
          },
        ),
        radialSpec(
          "Workforce Status",
          [
            { key: "active", label: "Active", value: active, color: "#4ED251" },
            {
              key: "inactive",
              label: "Inactive / Left",
              value: rows.length - active,
              color: "#64748b",
            },
          ],
          {
            centerLabel: "Headcount",
            description: "Active vs inactive / terminated employees.",
          },
        ),
      ],
    };
  },
});

// ── Attendance ────────────────────────────────────────────────────────────--
interface AttRow {
  date: string;
  employee: string;
  department: string;
  status: string;
  clockIn: string;
  clockOut: string;
  hours: number;
}

const attendanceReport = defineReport<AttRow>({
  id: "attendance",
  label: "Attendance",
  description: "Daily attendance, punctuality and hours worked.",
  icon: Clock,
  group: "People",
  permission: "time-payroll.attendance",
  select: (b) => {
    const emp = empLookup(b);
    return b.attendance.map((a) => {
      const e = emp.get(a.employeeId);
      return {
        date: a.date,
        employee: e?.fullName ?? a.employeeId,
        department: e?.departmentName ?? "—",
        status: a.status,
        clockIn: a.clockIn ? a.clockIn.slice(11, 16) : "—",
        clockOut: a.clockOut ? a.clockOut.slice(11, 16) : "—",
        hours: a.hoursWorked ?? 0,
      };
    });
  },
  columns: [
    { key: "date", header: "Date", value: (r) => r.date },
    { key: "employee", header: "Employee", value: (r) => r.employee },
    { key: "department", header: "Department", value: (r) => r.department },
    { key: "status", header: "Status", value: (r) => r.status },
    { key: "clockIn", header: "Clock In", value: (r) => r.clockIn },
    { key: "clockOut", header: "Clock Out", value: (r) => r.clockOut },
    { key: "hours", header: "Hours", value: (r) => r.hours },
  ],
  filters: [
    {
      key: "status",
      label: "Status",
      options: (rows) => [...new Set(rows.map((r) => r.status))],
      match: (r, v) => r.status === v,
    },
    {
      key: "department",
      label: "Department",
      options: (rows) => [...new Set(rows.map((r) => r.department))],
      match: (r, v) => r.department === v,
    },
  ],
  searchText: (r) => `${r.employee} ${r.department} ${r.status}`,
  analytics: (rows) => {
    const scheduled = rows.filter((r) => r.status !== "holiday").length || 1;
    const attended = rows.filter((r) =>
      ["present", "late", "remote", "early_departure"].includes(r.status),
    ).length;
    const late = rows.filter((r) => r.status === "late").length;
    const rate = Math.round((attended / scheduled) * 100);
    const avgHours =
      Math.round((rows.reduce((s, r) => s + r.hours, 0) / (rows.length || 1)) * 10) /
      10;
    const byDate = sumBy(rows, (r) => r.date, (r) => r.hours)
      .sort((a, z) => a.label.localeCompare(z.label))
      .slice(-14);
    return {
      stats: [
        { label: "Records", value: rows.length, sub: "Attendance entries", icon: Clock },
        {
          label: "Attendance Rate",
          value: `${rate}%`,
          sub: "Present of scheduled",
          icon: UserCheck,
          trend: `${rate}%`,
          up: rate >= 90,
        },
        { label: "Avg Hours", value: avgHours, sub: "Per logged day", icon: Timer },
        {
          label: "Late Arrivals",
          value: late,
          sub: `${Math.round((late / (rows.length || 1)) * 100)}% of entries`,
          icon: CalendarClock,
          trend: `${late}`,
          up: false,
        },
      ],
      charts: [
        pieSpec("att-status", "Status Split", countBy(rows, (r) => r.status), {
          centerLabel: "Records",
          description: "Breakdown of every attendance status.",
        }),
        barSpec(
          "Late Arrivals by Department",
          countBy(rows.filter((r) => r.status === "late"), (r) => r.department),
          { valueLabel: "Late", description: "Where lateness concentrates." },
        ),
        barSpec(
          "Avg Hours by Department",
          avgBy(rows, (r) => r.department, (r) => r.hours),
          { valueLabel: "Hours", description: "Mean hours logged per department." },
        ),
        barSpec("Records by Weekday", countBy(rows, (r) => WEEKDAYS[new Date(r.date).getDay()]), {
          valueLabel: "Records",
          layout: "horizontal",
          description: "Activity spread across the week.",
        }),
        lineSpec(
          "Hours Worked (recent)",
          byDate.map((d) => ({ date: d.label.slice(5), hours: Math.round(d.value) })),
          [{ key: "hours", label: "Hours", color: "#4ED251" }],
          "date",
          "area",
          {
            fullWidth: true,
            description: "Total hours logged per day (last 14 days).",
            footer: `Peaks at ${Math.max(0, ...byDate.map((d) => Math.round(d.value)))} hours in a single day.`,
          },
        ),
        radialSpec(
          "Attendance Rate",
          [
            {
              key: "rate",
              label: "Attendance Rate",
              value: rate,
              total: 100,
              color: "#4ED251",
            },
          ],
          {
            centerLabel: "Attendance Rate",
            description: "Attended as a share of scheduled days.",
            details: [
              { label: "Attended", value: attended, color: "#4ED251" },
              {
                label: "Absent / Leave",
                value: Math.max(0, scheduled - attended),
                color: "#f43f5e",
              },
            ],
          },
        ),
      ],
    };
  },
});

// ── Leave ─────────────────────────────────────────────────────────────────--
interface LeaveRow {
  employee: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  days: number;
}

const leaveReport = defineReport<LeaveRow>({
  id: "leave",
  label: "Leave",
  description: "Leave requests by type, status and duration.",
  icon: CalendarDays,
  group: "People",
  permission: "time-payroll.leave",
  select: (b) => {
    const emp = empLookup(b);
    return b.leaveRequests.map((l) => ({
      employee: emp.get(l.employeeId)?.fullName ?? l.employeeId,
      type: l.type,
      status: l.status,
      startDate: l.startDate,
      endDate: l.endDate,
      days: l.days ?? 0,
    }));
  },
  columns: [
    { key: "employee", header: "Employee", value: (r) => r.employee },
    { key: "type", header: "Leave Type", value: (r) => r.type },
    { key: "status", header: "Status", value: (r) => r.status },
    { key: "startDate", header: "Start", value: (r) => r.startDate },
    { key: "endDate", header: "End", value: (r) => r.endDate },
    { key: "days", header: "Days", value: (r) => r.days },
  ],
  filters: [
    {
      key: "type",
      label: "Type",
      options: (rows) => [...new Set(rows.map((r) => r.type))],
      match: (r, v) => r.type === v,
    },
    {
      key: "status",
      label: "Status",
      options: (rows) => [...new Set(rows.map((r) => r.status))],
      match: (r, v) => r.status === v,
    },
  ],
  searchText: (r) => `${r.employee} ${r.type} ${r.status}`,
  analytics: (rows) => {
    const approved = rows.filter((r) => r.status === "approved").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const totalDays = rows.reduce((s, r) => s + r.days, 0);
    const months = byMonth(rows, (r) => r.startDate);
    return {
      stats: [
        { label: "Requests", value: rows.length, sub: "Leave applications", icon: CalendarDays },
        {
          label: "Approved",
          value: approved,
          sub: `${Math.round((approved / (rows.length || 1)) * 100)}% approval rate`,
          icon: CheckCircle2,
          trend: `${approved}`,
          up: true,
        },
        { label: "Pending", value: pending, sub: "Awaiting decision", icon: CalendarClock, trend: `${pending}`, up: false },
        { label: "Total Days", value: totalDays, sub: "Days requested", icon: CalendarCheck },
      ],
      charts: [
        pieSpec("leave-type", "By Leave Type", countBy(rows, (r) => r.type), {
          centerLabel: "Requests",
          description: "Share of requests by leave category.",
        }),
        barSpec("By Status", countBy(rows, (r) => r.status), {
          valueLabel: "Requests",
          layout: "horizontal",
          description: "Approval workflow distribution.",
        }),
        barSpec(
          "Total Days by Type",
          sumBy(rows, (r) => r.type, (r) => r.days),
          { valueLabel: "Days", description: "Total days consumed per leave type." },
        ),
        barSpec(
          "Top Leave Takers",
          countBy(rows, (r) => r.employee).slice(0, 8),
          { valueLabel: "Requests", description: "Employees with the most requests." },
        ),
        lineSpec(
          "Requests by Month",
          months.map((m) => ({ month: monthLabel(m.label), requests: m.value })),
          [{ key: "requests", label: "Requests", color: "#3b82f6" }],
          "month",
          "area",
          { fullWidth: true, description: "Leave demand trend over time." },
        ),
        radialSpec(
          "Approval Status",
          [
            { key: "approved", label: "Approved", value: approved, color: "#4ED251" },
            { key: "pending", label: "Pending", value: pending, color: "#ff8b2d" },
            {
              key: "other",
              label: "Rejected / Other",
              value: Math.max(0, rows.length - approved - pending),
              color: "#f43f5e",
            },
          ],
          { centerLabel: "Requests", description: "Where requests sit in the workflow." },
        ),
      ],
    };
  },
});

// ── Employee Relations Cases (§5.10) ────────────────────────────────────────
/**
 * The client asked to report on cases by type, department, outcome, resolution
 * time and overdue count. Every one of those is already on the `ERCase` model
 * after the §5.1/§5.3/§5.6 schema work, so this is a report definition rather
 * than a new screen — filtering, search, CSV/PNG export and permission gating
 * all come from the registry.
 */
interface CaseRow {
  caseNumber: string;
  type: string;
  employee: string;
  department: string;
  stage: string;
  priority: string;
  confidentiality: string;
  assignedTo: string;
  dateRaised: string;
  targetDate: string;
  daysOpen: number;
  sla: string;
  outcome: string;
  closureDate: string;
  isOpen: boolean;
  isOverdue: boolean;
  hasAppeal: boolean;
}

const erCasesReport = defineReport<CaseRow>({
  id: "er-cases",
  label: "Employee Relations Cases",
  description:
    "Grievance and disciplinary caseload by type, department, outcome and SLA.",
  icon: Scale,
  group: "People",
  permission: "admin.grievance",
  select: (b) =>
    buildCases(b).map((c) => {
      const state = slaState(c);
      return {
        caseNumber: c.caseNumber,
        type: CASE_TYPE_CONFIG[c.complaintType]?.label ?? c.complaintType,
        employee: c.employeeName,
        department: c.employeeDept,
        stage: CASE_STAGE_CONFIG[c.stage]?.label ?? c.stage,
        priority: PRIORITY_CONFIG[c.priority]?.label ?? c.priority,
        confidentiality:
          CONFIDENTIALITY_CONFIG[c.confidentialityLevel]?.label ??
          c.confidentialityLevel,
        assignedTo: c.assignedTo ?? "Unassigned",
        dateRaised: c.dateRaised,
        targetDate: c.targetResolutionDate ?? "—",
        daysOpen: daysOpen(c),
        sla: SLA_LABELS[state],
        outcome: c.outcome
          ? (CASE_OUTCOME_CONFIG[c.outcome as CaseOutcome]?.label ?? c.outcome)
          : "—",
        closureDate: c.closureDate ?? "—",
        isOpen: c.stage !== "closed",
        isOverdue: state === "overdue",
        hasAppeal: c.hasAppeal || c.stage === "appeal",
      };
    }),
  columns: [
    { key: "caseNumber", header: "Case No.", value: (r) => r.caseNumber },
    { key: "type", header: "Type", value: (r) => r.type },
    { key: "employee", header: "Employee", value: (r) => r.employee },
    { key: "department", header: "Department", value: (r) => r.department },
    { key: "stage", header: "Stage", value: (r) => r.stage },
    { key: "priority", header: "Priority", value: (r) => r.priority },
    {
      key: "confidentiality",
      header: "Confidentiality",
      value: (r) => r.confidentiality,
    },
    { key: "assignedTo", header: "Assigned To", value: (r) => r.assignedTo },
    { key: "dateRaised", header: "Date Raised", value: (r) => r.dateRaised },
    { key: "targetDate", header: "Target Date", value: (r) => r.targetDate },
    { key: "daysOpen", header: "Days Open", value: (r) => r.daysOpen },
    { key: "sla", header: "SLA", value: (r) => r.sla },
    { key: "outcome", header: "Outcome", value: (r) => r.outcome },
    { key: "closureDate", header: "Closed", value: (r) => r.closureDate },
  ],
  filters: [
    {
      key: "type",
      label: "Case type",
      options: (rows) => [...new Set(rows.map((r) => r.type))],
      match: (r, v) => r.type === v,
    },
    {
      key: "department",
      label: "Department",
      options: (rows) => [...new Set(rows.map((r) => r.department))],
      match: (r, v) => r.department === v,
    },
    {
      key: "stage",
      label: "Stage",
      options: (rows) => [...new Set(rows.map((r) => r.stage))],
      match: (r, v) => r.stage === v,
    },
    {
      key: "outcome",
      label: "Outcome",
      options: (rows) => [...new Set(rows.map((r) => r.outcome))],
      match: (r, v) => r.outcome === v,
    },
  ],
  exportParams: [
    {
      key: "openOnly",
      label: "Open cases only",
      description: "Exclude cases that have been closed.",
      predicate: (r) => r.isOpen,
    },
    {
      key: "overdueOnly",
      label: "Overdue only",
      description: "Cases past their target resolution date.",
      predicate: (r) => r.isOverdue,
    },
    {
      key: "appeals",
      label: "Appeals only",
      description: "Cases that went to appeal.",
      predicate: (r) => r.hasAppeal,
    },
  ],
  searchText: (r) =>
    `${r.caseNumber} ${r.employee} ${r.department} ${r.type} ${r.assignedTo}`,
  analytics: (rows) => {
    const open = rows.filter((r) => r.isOpen);
    const overdue = rows.filter((r) => r.isOverdue);
    const closed = rows.filter((r) => !r.isOpen);
    // Resolution time only means anything for cases that actually closed —
    // averaging in the open ones would report the backlog, not the throughput.
    const avgResolution = closed.length
      ? Math.round(
          closed.reduce((s, r) => s + r.daysOpen, 0) / closed.length,
        )
      : 0;
    const appeals = rows.filter((r) => r.hasAppeal).length;
    const appealRate = rows.length
      ? Math.round((appeals / rows.length) * 100)
      : 0;
    const raised = byMonth(rows, (r) => r.dateRaised).slice(-12);

    return {
      stats: [
        {
          label: "Open Cases",
          value: open.length,
          sub: `${rows.length} raised in total`,
          icon: Scale,
        },
        {
          label: "Overdue",
          value: overdue.length,
          sub: overdue.length
            ? "Past target resolution date"
            : "All open cases on track",
          icon: Timer,
          trend: `${overdue.length}`,
          up: overdue.length === 0,
        },
        {
          label: "Avg Resolution",
          value: `${avgResolution} days`,
          sub: `Across ${closed.length} closed case(s)`,
          icon: CalendarCheck,
        },
        {
          label: "Appeal Rate",
          value: `${appealRate}%`,
          sub: `${appeals} case(s) appealed`,
          icon: CheckCircle2,
        },
      ],
      charts: [
        barSpec("Cases by Type", countBy(rows, (r) => r.type), {
          valueLabel: "Cases",
          description: "Which issues are actually coming through.",
        }),
        barSpec("Cases by Department", countBy(rows, (r) => r.department), {
          valueLabel: "Cases",
          description:
            "Concentration by department — a cluster is worth investigating.",
        }),
        pieSpec(
          "case-outcome",
          "Outcomes",
          countBy(
            rows.filter((r) => r.outcome !== "—"),
            (r) => r.outcome,
          ),
          {
            centerLabel: "Decided",
            description: "How concluded cases were resolved.",
          },
        ),
        pieSpec("case-stage", "Current Stage", countBy(rows, (r) => r.stage), {
          centerLabel: "Cases",
          description: "Where the caseload is sitting right now.",
        }),
        lineSpec(
          "Cases Raised by Month",
          raised.map((t) => ({ month: monthLabel(t.label), cases: t.value })),
          [{ key: "cases", label: "Cases raised", color: paletteColor(0) }],
          "month",
          "area",
          {
            fullWidth: true,
            description: "Volume trend over the last 12 months.",
          },
        ),
        barSpec(
          "Avg Days Open by Type",
          avgBy(rows, (r) => r.type, (r) => r.daysOpen),
          {
            valueLabel: "Days",
            description: "Which case types take longest to resolve.",
          },
        ),
      ],
    };
  },
});

export const PEOPLE_REPORTS: AnyReportDef[] = [
  employeesReport,
  attendanceReport,
  leaveReport,
  erCasesReport,
];

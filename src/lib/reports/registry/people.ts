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
  VenusAndMars,
  Cake,
  UserPlus,
} from "lucide-react";
import type { LocaleBundle } from "@/src/lib/types/locale";
import {
  defineReport,
  type AnyReportDef,
  type ReportChartSpec,
  type ReportColumn,
  type ReportFilterDef,
} from "../types";
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
  multiBarSpec,
  crossTab,
  byMonthCross,
  lastMonths,
  fillMonths,
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
  region: string;
}

/**
 * Shared by every Employees-derived report — the roster itself and each
 * single-dimension deep-dive (Gender Split, Age Demographics, Department
 * Breakdown, Hiring Trend) that used to live under it as a "breakdown" and
 * now stands on its own on the analytics hub. All five read the same roster,
 * so the row shape, columns and filters are defined once here rather than
 * risking the reports drifting apart from each other.
 */
function selectEmployeeRows(b: LocaleBundle): EmpRow[] {
  const types = new Map(b.employmentTypes.map((t) => [t.id, t.name]));
  const names = new Map(b.employees.map((e) => [e.id, e.fullName]));
  const reportCounts = new Map<string, number>();
  for (const e of b.employees) {
    if (e.managerId)
      reportCounts.set(e.managerId, (reportCounts.get(e.managerId) ?? 0) + 1);
  }
  // `region` prefers the branch's own region, falls back to the branch's
  // city, then to the employee's free-text work location — `branches` is
  // optional on the bundle, so this degrades gracefully when it's absent.
  const branchRegion = new Map(
    (b.branches ?? []).map((br) => [br.id, br.region ?? br.city]),
  );
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
      region:
        (e.branchId ? branchRegion.get(e.branchId) : undefined) ??
        e.workLocation ??
        "Unspecified",
    };
  });
}

const EMPLOYEE_COLUMNS: ReportColumn<EmpRow>[] = [
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
];

const EMPLOYEE_FILTERS: ReportFilterDef<EmpRow>[] = [
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
];

function employeeSearchText(r: EmpRow): string {
  return `${r.fullName} ${r.department} ${r.jobTitle}`;
}

function ageBucket(age: number): string {
  if (age < 25) return "Under 25";
  if (age < 35) return "25–34";
  if (age < 45) return "35–44";
  if (age < 55) return "45–54";
  return "55+";
}
const AGE_BUCKET_ORDER = ["Under 25", "25–34", "35–44", "45–54", "55+"];

// Gender is stored raw ("male" / "female" / …); every chart in the Gender
// Split breakdown re-labels and re-colors through these so the palette always
// matches the dashboard's Gender Split card (male=green, female=indigo) no
// matter which gender happens to sort first in the data.
const GENDER_RANK: Record<string, number> = { male: 0, female: 1 };
const GENDER_HEX: Record<string, string> = { male: "#50D34C", female: "#6366f1" };
function genderLabel(raw: string): string {
  const k = raw.trim().toLowerCase();
  if (k === "male") return "Male";
  if (k === "female") return "Female";
  if (k === "non_binary" || k === "non-binary") return "Non-binary";
  if (k === "prefer_not_to_say") return "Prefer not to say";
  if (!raw || raw === "—") return "Unspecified";
  // Any other raw enum value: humanize snake_case/kebab-case instead of
  // leaking it verbatim into charts (e.g. "some_new_value" -> "Some new value").
  const spaced = raw.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
function genderRank(label: string): number {
  return GENDER_RANK[label.toLowerCase()] ?? 2;
}
function genderColor(label: string): string {
  return GENDER_HEX[label.toLowerCase()] ?? "#64748b";
}
function byGenderOrder<T extends { label: string }>(items: T[]): T[] {
  return [...items].sort((a, z) => genderRank(a.label) - genderRank(z.label));
}

type PieSpec = Extract<ReportChartSpec, { kind: "pie" }>;
type BarSpec = Extract<ReportChartSpec, { kind: "bar" }>;

/** Recolors a pie built by the generic `pieSpec()` helper (which colors by
 * slice position, not meaning) to the same male/female/other palette every
 * other chart on the Gender Split page uses — otherwise a third category
 * (e.g. "Unspecified") lands on whatever the palette's third color happens
 * to be. */
function recolorByGender(spec: PieSpec): PieSpec {
  return {
    ...spec,
    data: spec.data.map((d) => ({ ...d, fill: genderColor(d.label) })),
    details: spec.details?.map((d) => ({ ...d, color: genderColor(d.label) })),
  };
}

/** Same recolor, for the `barSpec()`-built gender comparison bars. */
function recolorBarByGender(spec: BarSpec): BarSpec {
  return {
    ...spec,
    data: spec.data.map((d) => ({ ...d, fill: genderColor(d.category) })),
    details: spec.details?.map((d) => ({ ...d, color: genderColor(d.label) })),
  };
}

/** Non-orange palette for charts with no inherent gender/semantic color. */
const NEUTRAL_PALETTE = ["#5192FA", "#50D34C", "#a855f7", "#14b8a6", "#64748b", "#0ea5e9"];
function neutralColor(i: number): string {
  return NEUTRAL_PALETTE[i % NEUTRAL_PALETTE.length];
}
function recolorNeutral(spec: PieSpec): PieSpec {
  return { ...spec, data: spec.data.map((d, i) => ({ ...d, fill: neutralColor(i) })) };
}

// ── Employee demographics: single-dimension reports over the same roster ───
const genderSplitReport = defineReport<EmpRow>({
  id: "gender",
  label: "Gender Split",
  description: "Representation, pay and tenure by gender across the workforce.",
  icon: VenusAndMars,
  group: "People",
  permission: "organization.employees",
  select: selectEmployeeRows,
  columns: EMPLOYEE_COLUMNS,
  filters: EMPLOYEE_FILTERS,
  searchText: employeeSearchText,
  analytics: (rows) => {
    const total = rows.length || 1;
    const genderOf = (r: EmpRow) => genderLabel(r.gender);

    const distribution = byGenderOrder(countBy(rows, genderOf));
    const male = distribution.find((t) => t.label === "Male")?.value ?? 0;
    const female = distribution.find((t) => t.label === "Female")?.value ?? 0;
    const malePct = Math.round((male / total) * 100);
    const femalePct = Math.round((female / total) * 100);

    const deptCross = crossTab(rows, (r) => r.department, genderOf);
    const deptSeries = byGenderOrder(deptCross.series).map((s) => ({
      ...s,
      color: genderColor(s.label),
    }));

    const gradeCross = crossTab(rows, (r) => r.grade, genderOf);
    const gradeSeries = byGenderOrder(gradeCross.series).map((s) => ({
      ...s,
      color: genderColor(s.label),
    }));

    const ageCross = crossTab(rows, (r) => ageBucket(r.age), genderOf);
    const ageSeries = byGenderOrder(ageCross.series).map((s) => ({
      ...s,
      color: genderColor(s.label),
    }));
    const ageData = [...ageCross.data].sort(
      (a, z) =>
        AGE_BUCKET_ORDER.indexOf(String(a.group)) -
        AGE_BUCKET_ORDER.indexOf(String(z.group)),
    );

    const hiresCross = byMonthCross(rows, (r) => r.startDate, genderOf, lastMonths(12));
    const hiresSeries = byGenderOrder(hiresCross.series).map((s) => ({
      ...s,
      color: genderColor(s.label),
    }));
    const hiresData = hiresCross.data;

    const avgTenure = byGenderOrder(avgBy(rows, genderOf, (r) => r.tenureYears));
    const avgSalary = byGenderOrder(avgBy(rows, genderOf, (r) => r.salary));
    const maleSalary = avgSalary.find((t) => t.label === "Male")?.value ?? 0;
    const femaleSalary = avgSalary.find((t) => t.label === "Female")?.value ?? 0;
    const payGapPct = maleSalary
      ? Math.round(((maleSalary - femaleSalary) / maleSalary) * 100)
      : 0;

    // "Leavers" mirrors the same active/inactive split the Employees
    // report's own "Workforce Status" ring already uses — no new status
    // semantics introduced, just the same cut read through gender.
    const leavers = byGenderOrder(
      countBy(
        rows.filter((r) => r.status !== "active"),
        genderOf,
      ),
    );
    const recentHires = rows.filter((r) => r.tenureYears <= 1);
    const byRegion = countBy(recentHires, (r) => r.region);

    return {
      stats: [
        {
          label: "Female Representation",
          value: `${femalePct}%`,
          sub: `${female} of ${total} employees`,
          icon: VenusAndMars,
          tone: "violet",
        },
        {
          label: "Male Representation",
          value: `${malePct}%`,
          sub: `${male} of ${total} employees`,
          icon: VenusAndMars,
          tone: "emerald",
        },
        {
          label: "Avg Tenure Gap",
          value: `${Math.abs(
            (avgTenure.find((t) => t.label === "Male")?.value ?? 0) -
              (avgTenure.find((t) => t.label === "Female")?.value ?? 0),
          ).toFixed(1)} yrs`,
          sub: "Difference in average years served",
          icon: Timer,
        },
        {
          label: "Gender Pay Gap",
          value: `${Math.abs(payGapPct)}%`,
          sub:
            payGapPct > 0
              ? "Female average trails male average"
              : payGapPct < 0
                ? "Female average leads male average"
                : "No measurable gap",
          icon: Wallet,
          trend: `${payGapPct}%`,
          up: payGapPct <= 0,
          tone: payGapPct > 0 ? "amber" : "emerald",
        },
      ],
      charts: [
        recolorByGender(
          pieSpec("gender-split-donut", "Gender Distribution", distribution, {
            centerLabel: "Employees",
            description: "Overall workforce composition by gender.",
          }) as PieSpec,
        ),
        recolorByGender(
          pieSpec("leavers-by-gender", "Leavers by Gender", leavers, {
            centerLabel: "Leavers",
            description: "Gender mix of employees who have left.",
          }) as PieSpec,
        ),
        recolorNeutral(
          pieSpec("new-hires-by-region", "New Hires by Region", byRegion, {
            centerLabel: "New Hires",
            description: "Where employees hired in the last year are based.",
          }) as PieSpec,
        ),
        multiBarSpec("Gender by Department", deptCross.data, deptSeries, "group", {
          stacked: true,
          description: "Where representation skews by department.",
        }),
        multiBarSpec("Gender by Grade", gradeCross.data, gradeSeries, "group", {
          stacked: true,
          description: "Representation across pay grades / bands.",
        }),
        multiBarSpec("Gender by Age Band", ageData, ageSeries, "group", {
          stacked: true,
          description: "Age profile split by gender.",
        }),
        lineSpec(
          "Hires by Gender (last 12 months)",
          hiresData,
          hiresSeries,
          "month",
          "area",
          {
            fullWidth: true,
            description: "New joiners per month, split by gender.",
          },
        ),
        recolorBarByGender(
          barSpec("Avg Tenure by Gender", avgTenure, {
            valueLabel: "Years",
            layout: "horizontal",
            description: "Average years of service by gender.",
          }) as BarSpec,
        ),
        recolorBarByGender(
          barSpec("Avg Salary by Gender", avgSalary, {
            valueLabel: "Salary",
            money: true,
            layout: "horizontal",
            description: "Average annual salary by gender — a quick pay-equity check.",
          }) as BarSpec,
        ),
      ],
    };
  },
});

const ageDemographicsReport = defineReport<EmpRow>({
  id: "age",
  label: "Age Demographics",
  description: "Workforce age profile, tenure and pay by age band.",
  icon: Cake,
  group: "People",
  permission: "organization.employees",
  select: selectEmployeeRows,
  columns: EMPLOYEE_COLUMNS,
  filters: EMPLOYEE_FILTERS,
  searchText: employeeSearchText,
  analytics: (rows) => {
    const total = rows.length || 1;
    const buckets = [...countBy(rows, (r) => ageBucket(r.age))].sort(
      (a, z) => AGE_BUCKET_ORDER.indexOf(a.label) - AGE_BUCKET_ORDER.indexOf(z.label),
    );
    const avgAge = Math.round((rows.reduce((s, r) => s + r.age, 0) / total) * 10) / 10;
    const under35 = rows.filter((r) => r.age < 35).length;
    const over55 = rows.filter((r) => r.age >= 55).length;
    const widest = [...buckets].sort((a, z) => z.value - a.value)[0];

    const deptCross = crossTab(rows, (r) => r.department, (r) => ageBucket(r.age));
    const deptSeries = [...deptCross.series].sort(
      (a, z) => AGE_BUCKET_ORDER.indexOf(a.label) - AGE_BUCKET_ORDER.indexOf(z.label),
    );

    const genderCross = crossTab(rows, (r) => ageBucket(r.age), (r) => genderLabel(r.gender));
    const genderData = [...genderCross.data].sort(
      (a, z) =>
        AGE_BUCKET_ORDER.indexOf(String(a.group)) -
        AGE_BUCKET_ORDER.indexOf(String(z.group)),
    );
    const genderSeries = byGenderOrder(genderCross.series).map((s) => ({
      ...s,
      color: genderColor(s.label),
    }));

    const avgTenureByAge = [...avgBy(rows, (r) => ageBucket(r.age), (r) => r.tenureYears)].sort(
      (a, z) => AGE_BUCKET_ORDER.indexOf(a.label) - AGE_BUCKET_ORDER.indexOf(z.label),
    );
    const avgSalaryByAge = [...avgBy(rows, (r) => ageBucket(r.age), (r) => r.salary)].sort(
      (a, z) => AGE_BUCKET_ORDER.indexOf(a.label) - AGE_BUCKET_ORDER.indexOf(z.label),
    );

    return {
      stats: [
        { label: "Average Age", value: avgAge, sub: "Years, across the roster", icon: Cake },
        {
          label: "Under 35",
          value: under35,
          sub: `${Math.round((under35 / total) * 100)}% of workforce`,
          icon: Users,
          tone: "blue",
        },
        {
          label: "55 and Over",
          value: over55,
          sub: `${Math.round((over55 / total) * 100)}% of workforce`,
          icon: Users,
          tone: "amber",
        },
        {
          label: "Widest Age Band",
          value: widest?.label ?? "—",
          sub: `${widest?.value ?? 0} employees`,
          icon: Users,
        },
      ],
      charts: [
        barSpec("Age Distribution", buckets, {
          valueLabel: "Employees",
          layout: "horizontal",
          description: "Headcount by age band.",
        }),
        multiBarSpec("Age Band by Department", deptCross.data, deptSeries, "group", {
          stacked: true,
          description: "Where each age group concentrates.",
        }),
        multiBarSpec("Age Band by Gender", genderData, genderSeries, "group", {
          stacked: true,
          description: "Gender mix within each age band.",
        }),
        barSpec("Avg Tenure by Age Band", avgTenureByAge, {
          valueLabel: "Years",
          layout: "horizontal",
          description: "Longer-serving age bands vs newer ones.",
        }),
        barSpec("Avg Salary by Age Band", avgSalaryByAge, {
          valueLabel: "Salary",
          money: true,
          layout: "horizontal",
          description: "Average annual salary by age band.",
        }),
        radialSpec(
          "Workforce Age Mix",
          [
            { key: "under35", label: "Under 35", value: under35, color: "#5192FA" },
            { key: "over35", label: "35 and Over", value: total - under35, color: "#64748b" },
          ],
          {
            centerLabel: "Under 35",
            description: "Share of the workforce younger than 35.",
          },
        ),
      ],
    };
  },
});

const departmentReport = defineReport<EmpRow>({
  id: "department",
  label: "Department Breakdown",
  description: "Headcount, pay, tenure and gender mix by department.",
  icon: Building2,
  group: "People",
  permission: "organization.employees",
  select: selectEmployeeRows,
  columns: EMPLOYEE_COLUMNS,
  filters: EMPLOYEE_FILTERS,
  searchText: employeeSearchText,
  analytics: (rows) => {
    const deptHeadcount = countBy(rows, (r) => r.department);
    const totalDepts = deptHeadcount.length;
    const totalPayroll = rows.reduce((s, r) => s + r.salary, 0);
    const largest = deptHeadcount[0];
    const avgDeptSize = Math.round((rows.length / (totalDepts || 1)) * 10) / 10;

    const payrollByDept = sumBy(rows, (r) => r.department, (r) => r.salary);
    const genderCross = crossTab(rows, (r) => r.department, (r) => genderLabel(r.gender));
    const genderSeries = byGenderOrder(genderCross.series).map((s) => ({
      ...s,
      color: genderColor(s.label),
    }));
    const avgTenureByDept = avgBy(rows, (r) => r.department, (r) => r.tenureYears);
    const avgSalaryByDept = avgBy(rows, (r) => r.department, (r) => r.salary);

    return {
      stats: [
        { label: "Departments", value: totalDepts, sub: "Distinct department units", icon: Building2 },
        {
          label: "Largest Department",
          value: largest?.label ?? "—",
          sub: `${largest?.value ?? 0} employees`,
          icon: Users,
        },
        { label: "Avg Department Size", value: avgDeptSize, sub: "Employees per department", icon: Users },
        {
          label: "Total Payroll",
          value: totalPayroll,
          money: true,
          sub: "Across all departments",
          icon: Wallet,
        },
      ],
      charts: [
        barSpec("Headcount by Department", deptHeadcount, {
          valueLabel: "Employees",
          description: "Team size, largest first.",
        }),
        barSpec("Payroll by Department", payrollByDept, {
          valueLabel: "Payroll",
          money: true,
          description: "Total annual salary cost per department.",
        }),
        multiBarSpec("Gender Mix by Department", genderCross.data, genderSeries, "group", {
          stacked: true,
          description: "Representation within each department.",
        }),
        barSpec("Avg Tenure by Department", avgTenureByDept, {
          valueLabel: "Years",
          description: "Average years of service by team.",
        }),
        barSpec("Avg Salary by Department", avgSalaryByDept, {
          valueLabel: "Salary",
          money: true,
          description: "Average annual salary by department.",
        }),
        pieSpec("dept-share", "Headcount Share", deptHeadcount, {
          centerLabel: "Employees",
          description: "Each department's share of total headcount.",
        }),
      ],
    };
  },
});

const hiringTrendReport = defineReport<EmpRow>({
  id: "hiring-trend",
  label: "Hiring Trend",
  description: "New-hire volume, source mix and growth pace over time.",
  icon: UserPlus,
  group: "People",
  permission: "organization.employees",
  select: selectEmployeeRows,
  columns: EMPLOYEE_COLUMNS,
  filters: EMPLOYEE_FILTERS,
  searchText: employeeSearchText,
  analytics: (rows) => {
    const months12 = lastMonths(12);
    const hires12 = fillMonths(byMonth(rows, (r) => r.startDate), months12);
    const hires3 = hires12.slice(-3);
    const totalHires12 = hires12.reduce((s, m) => s + m.value, 0);
    const totalHires3 = hires3.reduce((s, m) => s + m.value, 0);
    const avgPerMonth = Math.round((totalHires12 / (hires12.length || 1)) * 10) / 10;
    const busiest = [...hires12].sort((a, z) => z.value - a.value)[0];

    const recentHireRows = rows.filter((r) => r.tenureYears <= 1);
    const deptHiresRecent = countBy(recentHireRows, (r) => r.department);
    const typeHiresRecent = countBy(recentHireRows, (r) => r.employmentType);

    const genderCross = byMonthCross(
      rows,
      (r) => r.startDate,
      (r) => genderLabel(r.gender),
      months12,
    );
    const genderSeries = byGenderOrder(genderCross.series).map((s) => ({
      ...s,
      color: genderColor(s.label),
    }));
    const genderData = genderCross.data;

    return {
      stats: [
        {
          label: "Hires (12 months)",
          value: totalHires12,
          sub: `${avgPerMonth} per month average`,
          icon: UserPlus,
          tone: "emerald",
        },
        { label: "Hires (3 months)", value: totalHires3, sub: "Most recent quarter", icon: UserPlus },
        {
          label: "Recent Hires",
          value: recentHireRows.length,
          sub: `${Math.round((recentHireRows.length / (rows.length || 1)) * 100)}% of current workforce`,
          icon: Users,
        },
        {
          label: "Busiest Hiring Month",
          value: busiest ? monthLabel(busiest.label) : "—",
          sub: busiest ? `${busiest.value} hires that month` : "No hires on record",
          icon: CalendarDays,
        },
      ],
      charts: [
        lineSpec(
          "Hires by Month",
          hires12.map((m) => ({ month: monthLabel(m.label), hires: m.value })),
          [{ key: "hires", label: "Hires", color: "#50D34C" }],
          "month",
          "area",
          {
            fullWidth: true,
            description: "New joiners per month over the last year.",
            footer: `${totalHires12} hires across ${hires12.length} months.`,
          },
        ),
        lineSpec("Hires by Gender (last 12 months)", genderData, genderSeries, "month", "area", {
          fullWidth: true,
          description: "New-hire volume split by gender.",
        }),
        barSpec("Recent Hires by Department", deptHiresRecent, {
          valueLabel: "Hires",
          description: "Where the last year's hiring concentrated.",
        }),
        barSpec("Recent Hires by Employment Type", typeHiresRecent, {
          valueLabel: "Hires",
          layout: "horizontal",
          description: "Contract mix among recent joiners.",
        }),
        radialSpec(
          "Workforce Freshness",
          [
            {
              key: "recent",
              label: "Hired ≤ 1 year ago",
              value: recentHireRows.length,
              color: "#50D34C",
            },
            {
              key: "tenured",
              label: "Tenured (> 1 year)",
              value: rows.length - recentHireRows.length,
              color: "#64748b",
            },
          ],
          {
            centerLabel: "Recent Hires",
            description: "Share of the workforce hired within the last year.",
          },
        ),
      ],
    };
  },
});

const employeesReport = defineReport<EmpRow>({
  id: "employees",
  label: "Employees / Headcount",
  description: "Workforce roster, headcount and pay by department.",
  icon: Users,
  group: "People",
  permission: "organization.employees",
  select: selectEmployeeRows,
  columns: EMPLOYEE_COLUMNS,
  filters: EMPLOYEE_FILTERS,
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
  searchText: employeeSearchText,
  analytics: (rows) => {
    const active = rows.filter((r) => r.status === "active").length;
    const payroll = rows.reduce((s, r) => s + r.salary, 0);
    const avgSalary = Math.round(payroll / (rows.length || 1));
    const hires = fillMonths(byMonth(rows, (r) => r.startDate), lastMonths(12));
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
        barSpec(
          "Age Distribution",
          [...countBy(rows, (r) => ageBucket(r.age))].sort(
            (a, z) =>
              AGE_BUCKET_ORDER.indexOf(a.label) - AGE_BUCKET_ORDER.indexOf(z.label),
          ),
          {
            valueLabel: "Employees",
            layout: "horizontal",
            description: "Workforce age profile by band.",
          },
        ),
        lineSpec(
          "Hires by Month",
          hires.map((m) => ({ month: monthLabel(m.label), hires: m.value })),
          [{ key: "hires", label: "Hires", color: "#50D34C" }],
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
            { key: "active", label: "Active", value: active, color: "#50D34C" },
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
          [{ key: "hours", label: "Hours", color: "#50D34C" }],
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
              color: "#50D34C",
            },
          ],
          {
            centerLabel: "Attendance Rate",
            description: "Attended as a share of scheduled days.",
            details: [
              { label: "Attended", value: attended, color: "#50D34C" },
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
          [{ key: "requests", label: "Requests", color: "#5192FA" }],
          "month",
          "area",
          { fullWidth: true, description: "Leave demand trend over time." },
        ),
        radialSpec(
          "Approval Status",
          [
            { key: "approved", label: "Approved", value: approved, color: "#50D34C" },
            { key: "pending", label: "Pending", value: pending, color: "#FE8F44" },
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
  genderSplitReport,
  ageDemographicsReport,
  departmentReport,
  hiringTrendReport,
  attendanceReport,
  leaveReport,
  erCasesReport,
];

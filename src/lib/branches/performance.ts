/**
 * Branch performance engine.
 *
 * Every indicator here is derived from records Motee already holds for the
 * people posted to a branch — tasks, attendance, learning, documents/DBS
 * checks, sickness absence, helpdesk tickets, grievances and reviews — so no
 * figure is invented (client brief: "do not introduce metrics that cannot be
 * supported by existing or planned system data").
 *
 * Pure functions only: the hooks feed them the bundle, the PDF/Excel/email
 * reports and the dashboard all read the same numbers.
 */

import {
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isWeekend,
  parseISO,
  startOfQuarter,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";

export type KpiId =
  | "taskCompletion"
  | "overdueTasks"
  | "attendance"
  | "punctuality"
  | "training"
  | "compliance"
  | "sicknessRate"
  | "issues"
  | "staffing"
  | "rating";

export type KpiUnit = "pct" | "count" | "rating";

export interface KpiDef {
  id: KpiId;
  label: string;
  unit: KpiUnit;
  higherIsBetter: boolean;
  /** Where the number comes from — shown in tooltips and printed reports. */
  source: string;
  defaultTarget: number;
}

export const KPI_DEFS: KpiDef[] = [
  { id: "taskCompletion", label: "Task completion", unit: "pct", higherIsBetter: true, source: "Tasks due in the period that are done", defaultTarget: 90 },
  { id: "compliance", label: "Compliance score", unit: "pct", higherIsBetter: true, source: "Verified, in-date employee documents and clear DBS checks", defaultTarget: 90 },
  { id: "overdueTasks", label: "Overdue tasks", unit: "count", higherIsBetter: false, source: "Tasks past their due date and not done", defaultTarget: 2 },
  { id: "training", label: "Employee training completion", unit: "pct", higherIsBetter: true, source: "Learning enrolments completed", defaultTarget: 85 },
  { id: "issues", label: "Outstanding issues", unit: "count", higherIsBetter: false, source: "Open helpdesk tickets and open grievances", defaultTarget: 2 },
  { id: "attendance", label: "Attendance rate", unit: "pct", higherIsBetter: true, source: "Clock-in records attended vs scheduled (leave excluded)", defaultTarget: 95 },
  { id: "punctuality", label: "Punctuality", unit: "pct", higherIsBetter: true, source: "Attended days without a late clock-in", defaultTarget: 85 },
  { id: "sicknessRate", label: "Sickness absence rate", unit: "pct", higherIsBetter: false, source: "Sickness days as a share of working days", defaultTarget: 3 },
  { id: "staffing", label: "Staffing vs target", unit: "pct", higherIsBetter: true, source: "People posted vs the branch headcount target", defaultTarget: 100 },
  { id: "rating", label: "Average performance rating", unit: "rating", higherIsBetter: true, source: "Latest calibrated review rating (1–5)", defaultTarget: 3.5 },
];

export const KPI_BY_ID = Object.fromEntries(KPI_DEFS.map((k) => [k.id, k])) as Record<KpiId, KpiDef>;

/** Indicators that count towards the headline performance score by default. */
export const DEFAULT_SCORE_KPIS: KpiId[] = ["taskCompletion", "compliance", "training", "attendance"];

export type KpiValues = Record<KpiId, number | null>;

// ── Inputs ───────────────────────────────────────────────────────────────────

export interface PerfEmployee {
  id: string;
  fullName: string;
  branchId?: string;
}
export interface PerfBranch {
  id: string;
  name: string;
  code: string;
  region?: string;
  city: string;
  status: string;
  headcountTarget?: number;
  managerEmployeeId?: string | null;
}
export interface PerfTask {
  id: string;
  title: string;
  assigneeId: string;
  dueDate: string;
  status: string;
  priority?: string;
}
export interface PerfAttendance {
  employeeId: string;
  date: string;
  status: string;
}
export interface PerfEnrollment {
  employeeId: string;
  courseTitle?: string;
  status: string;
  enrolledAt?: string;
  completedAt?: string | null;
}
export interface PerfDocument {
  employeeId: string;
  name: string;
  status: string;
  expiresAt?: string | null;
}
export interface PerfDbs {
  employeeId: string;
  status: string;
  expiryDate?: string;
}
export interface PerfSickness {
  employeeId: string;
  startDate: string;
  endDate: string;
}
export interface PerfTicket {
  id: string;
  subject: string;
  requesterId: string;
  status: string;
  openedAt: string;
  resolvedAt?: string | null;
}
export interface PerfGrievance {
  id: string;
  raisedBy: string;
  status: string;
  openedAt: string;
}
export interface PerfReview {
  employeeId: string;
  calibratedRating?: number | null;
  managerRating?: number | null;
  completedAt?: string | null;
}

export interface PerfInput {
  asOf: string;
  branches: PerfBranch[];
  employees: PerfEmployee[];
  tasks: PerfTask[];
  attendance: PerfAttendance[];
  enrollments: PerfEnrollment[];
  documents: PerfDocument[];
  dbsChecks: PerfDbs[];
  sickness: PerfSickness[];
  tickets: PerfTicket[];
  grievances: PerfGrievance[];
  reviews: PerfReview[];
}

// ── Periods ──────────────────────────────────────────────────────────────────

export type PeriodPreset = "7d" | "30d" | "90d" | "qtd" | "ytd";

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  qtd: "Quarter to date",
  ytd: "Year to date",
};

/** Report cadences and the period each one covers. */
export type ReportFrequency = "weekly" | "monthly" | "quarterly";
export const FREQUENCY_PERIOD: Record<ReportFrequency, PeriodPreset> = {
  weekly: "7d",
  monthly: "30d",
  quarterly: "90d",
};
export const FREQUENCY_LABELS: Record<ReportFrequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
};

export interface PeriodRange {
  start: string;
  end: string;
  label: string;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

export function periodRange(preset: PeriodPreset, asOf: string): PeriodRange {
  const end = parseISO(asOf);
  let start: Date;
  switch (preset) {
    case "7d":
      start = subDays(end, 6);
      break;
    case "30d":
      start = subDays(end, 29);
      break;
    case "90d":
      start = subDays(end, 89);
      break;
    case "qtd":
      start = startOfQuarter(end);
      break;
    case "ytd":
      start = startOfYear(end);
      break;
  }
  return {
    start: iso(start),
    end: asOf,
    label: `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`,
  };
}

/** The same-length window immediately before `range`, for period-on-period change. */
export function previousRange(range: PeriodRange): PeriodRange {
  const start = parseISO(range.start);
  const days = differenceInCalendarDays(parseISO(range.end), start) + 1;
  const prevEnd = subDays(start, 1);
  const prevStart = subDays(prevEnd, days - 1);
  return {
    start: iso(prevStart),
    end: iso(prevEnd),
    label: `${format(prevStart, "d MMM")} – ${format(prevEnd, "d MMM yyyy")}`,
  };
}

/** Trend buckets ending at `asOf`: 12 weeks or 6 months. */
export function trendBuckets(asOf: string, grain: "week" | "month"): PeriodRange[] {
  const end = parseISO(asOf);
  const out: PeriodRange[] = [];
  if (grain === "week") {
    for (let i = 11; i >= 0; i--) {
      const e = subDays(end, i * 7);
      const s = subDays(e, 6);
      out.push({ start: iso(s), end: iso(e), label: format(e, "d MMM") });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const e = subMonths(end, i);
      const s = subDays(e, 29);
      out.push({ start: iso(s), end: iso(e), label: format(e, "MMM yy") });
    }
  }
  return out;
}

// ── Computation ──────────────────────────────────────────────────────────────

const ATTENDED = new Set(["present", "late", "remote", "early_departure"]);
const OPEN_TICKET = new Set(["open", "in_progress"]);
const OPEN_GRIEVANCE = new Set(["open", "investigating"]);

function within(d: string | undefined | null, r: PeriodRange): boolean {
  if (!d) return false;
  const day = d.slice(0, 10);
  return day >= r.start && day <= r.end;
}

function pct(n: number, d: number): number | null {
  return d > 0 ? Math.round((n / d) * 1000) / 10 : null;
}

function workingDays(r: PeriodRange): number {
  return eachDayOfInterval({ start: parseISO(r.start), end: parseISO(r.end) }).filter(
    (d) => !isWeekend(d),
  ).length;
}

/** Working days of a sickness spell that fall inside the period. */
function sickDaysIn(s: PerfSickness, r: PeriodRange): number {
  const start = s.startDate.slice(0, 10) > r.start ? s.startDate.slice(0, 10) : r.start;
  const end = (s.endDate || s.startDate).slice(0, 10) < r.end ? (s.endDate || s.startDate).slice(0, 10) : r.end;
  if (start > end) return 0;
  return eachDayOfInterval({ start: parseISO(start), end: parseISO(end) }).filter((d) => !isWeekend(d)).length;
}

/**
 * KPIs for one branch, or the whole company when `branchId` is null. `scope`
 * narrows to a set of branches (e.g. the ones a manager can see) for the
 * company figure.
 */
export function computeKpis(
  input: PerfInput,
  branchId: string | null,
  range: PeriodRange,
  scope?: string[],
): KpiValues {
  const inScope = (b?: string) =>
    branchId ? b === branchId : scope ? !!b && scope.includes(b) : true;
  const people = input.employees.filter((e) => inScope(e.branchId));
  const ids = new Set(people.map((e) => e.id));

  const tasksDue = input.tasks.filter((t) => ids.has(t.assigneeId) && within(t.dueDate, range));
  const done = tasksDue.filter((t) => t.status === "done").length;
  const overdue = input.tasks.filter(
    (t) => ids.has(t.assigneeId) && t.dueDate.slice(0, 10) < range.end && t.status !== "done",
  ).length;

  const att = input.attendance.filter(
    (a) => ids.has(a.employeeId) && within(a.date, range) && a.status !== "on_leave",
  );
  const attended = att.filter((a) => ATTENDED.has(a.status));
  const onTime = attended.filter((a) => a.status !== "late").length;

  const enr = input.enrollments.filter(
    (e) => ids.has(e.employeeId) && (!e.enrolledAt || e.enrolledAt.slice(0, 10) <= range.end),
  );
  // The current period trusts the enrolment's status; earlier trend buckets
  // also need the completion date to have passed (some seeded completions
  // are dated after the bundle's reference date).
  const current = range.end >= input.asOf;
  const completed = enr.filter(
    (e) =>
      e.status === "completed" &&
      (current || !e.completedAt || e.completedAt.slice(0, 10) <= range.end),
  ).length;

  const docs = input.documents.filter((d) => ids.has(d.employeeId));
  const dbs = input.dbsChecks.filter((d) => ids.has(d.employeeId));
  const compliantDocs = docs.filter(
    (d) => d.status === "verified" && (!d.expiresAt || d.expiresAt.slice(0, 10) >= range.end),
  ).length;
  const compliantDbs = dbs.filter(
    (d) => d.status === "clear" && (!d.expiryDate || d.expiryDate.slice(0, 10) >= range.end),
  ).length;

  const sickDays = input.sickness
    .filter((s) => ids.has(s.employeeId))
    .reduce((sum, s) => sum + sickDaysIn(s, range), 0);
  const capacity = people.length * workingDays(range);

  const openTickets = input.tickets.filter(
    (t) =>
      ids.has(t.requesterId) &&
      t.openedAt.slice(0, 10) <= range.end &&
      (OPEN_TICKET.has(t.status) || (t.resolvedAt && t.resolvedAt.slice(0, 10) > range.end)),
  ).length;
  const openGrievances = input.grievances.filter(
    (g) => ids.has(g.raisedBy) && g.openedAt.slice(0, 10) <= range.end && OPEN_GRIEVANCE.has(g.status),
  ).length;

  const latestReview = new Map<string, PerfReview>();
  for (const r of input.reviews) {
    if (!ids.has(r.employeeId) || !r.completedAt || r.completedAt.slice(0, 10) > range.end) continue;
    const prev = latestReview.get(r.employeeId);
    if (!prev || (prev.completedAt ?? "") < r.completedAt) latestReview.set(r.employeeId, r);
  }
  const ratings = [...latestReview.values()]
    .map((r) => r.calibratedRating ?? r.managerRating)
    .filter((n): n is number => typeof n === "number");

  const branches = input.branches.filter((b) => (branchId ? b.id === branchId : inScope(b.id)));
  const target = branches.reduce((s, b) => s + (b.headcountTarget ?? 0), 0);

  return {
    taskCompletion: pct(done, tasksDue.length),
    overdueTasks: overdue,
    attendance: pct(attended.length, att.length),
    punctuality: pct(onTime, attended.length),
    training: pct(completed, enr.length),
    compliance: pct(compliantDocs + compliantDbs, docs.length + dbs.length),
    sicknessRate: capacity > 0 ? pct(sickDays, capacity) : null,
    issues: openTickets + openGrievances,
    staffing: target > 0 ? Math.min(100, Math.round((people.length / target) * 1000) / 10) : null,
    rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100 : null,
  };
}

/**
 * Headline score (0–100): the mean attainment of the chosen percentage and
 * rating indicators. Lower-is-better percentages (sickness) are inverted;
 * count indicators are left out because they have no natural 0–100 scale.
 */
export function performanceScore(values: KpiValues, kpis: KpiId[]): number | null {
  const parts: number[] = [];
  for (const id of kpis) {
    const def = KPI_BY_ID[id];
    const v = values[id];
    if (v == null || def.unit === "count") continue;
    if (def.unit === "rating") parts.push((v / 5) * 100);
    else parts.push(def.higherIsBetter ? v : Math.max(0, 100 - v * 10));
  }
  if (parts.length === 0) return null;
  return Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 10) / 10;
}

/** Whether a value meets its target, honouring the indicator's direction. */
export function meetsTarget(id: KpiId, value: number | null, target: number): boolean | null {
  if (value == null) return null;
  return KPI_BY_ID[id].higherIsBetter ? value >= target : value <= target;
}

/** Is `a` better than `b` for this indicator? */
export function isBetter(id: KpiId, a: number, b: number): boolean {
  return KPI_BY_ID[id].higherIsBetter ? a > b : a < b;
}

export function formatKpi(id: KpiId | "score", v: number | null | undefined): string {
  if (v == null) return "—";
  if (id === "score") return `${v.toFixed(0)}%`;
  const unit = KPI_BY_ID[id].unit;
  if (unit === "pct") return `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
  if (unit === "rating") return v.toFixed(2);
  return String(v);
}

export type PerformanceBand = "strong" | "on_track" | "needs_support";

export function bandFor(score: number | null): PerformanceBand | null {
  if (score == null) return null;
  if (score >= 85) return "strong";
  if (score >= 70) return "on_track";
  return "needs_support";
}

export const BAND_LABELS: Record<PerformanceBand, string> = {
  strong: "High performing",
  on_track: "On track",
  needs_support: "Needs support",
};

export const BAND_STYLES: Record<PerformanceBand, string> = {
  strong: "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
  on_track: "border-sky-500/30 bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400",
  needs_support: "border-amber-500/30 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
};

// ── Branch rows, ranking, attention items ────────────────────────────────────

export interface BranchPerformanceRow {
  branch: PerfBranch;
  region: string;
  headcount: number;
  values: KpiValues;
  previous: KpiValues;
  score: number | null;
  previousScore: number | null;
  rank: number;
}

export function regionOf(b: Pick<PerfBranch, "region" | "city">): string {
  return b.region?.trim() || b.city;
}

export function buildRows(
  input: PerfInput,
  branchIds: string[],
  range: PeriodRange,
  scoreKpis: KpiId[],
  rankBy: KpiId | "score" = "score",
): BranchPerformanceRow[] {
  const prev = previousRange(range);
  const rows = input.branches
    .filter((b) => branchIds.includes(b.id))
    .map((b) => {
      const values = computeKpis(input, b.id, range);
      const previous = computeKpis(input, b.id, prev);
      return {
        branch: b,
        region: regionOf(b),
        headcount: input.employees.filter((e) => e.branchId === b.id).length,
        values,
        previous,
        score: performanceScore(values, scoreKpis),
        previousScore: performanceScore(previous, scoreKpis),
        rank: 0,
      };
    });
  const key = (r: BranchPerformanceRow) => (rankBy === "score" ? r.score : r.values[rankBy]);
  const higher = rankBy === "score" ? true : KPI_BY_ID[rankBy].higherIsBetter;
  rows.sort((a, b) => {
    const va = key(a);
    const vb = key(b);
    if (va == null && vb == null) return a.branch.name.localeCompare(b.branch.name);
    if (va == null) return 1;
    if (vb == null) return -1;
    return higher ? vb - va : va - vb;
  });
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows;
}

export interface AttentionItem {
  branchId: string;
  branchName: string;
  kpi: KpiId;
  severity: "high" | "medium";
  message: string;
}

/** Indicators that missed target — the "Management attention required" list. */
export function attentionItems(
  rows: BranchPerformanceRow[],
  targets: Record<KpiId, number>,
  kpis: KpiId[],
): AttentionItem[] {
  const out: AttentionItem[] = [];
  for (const r of rows) {
    for (const id of kpis) {
      const v = r.values[id];
      const t = targets[id];
      if (meetsTarget(id, v, t) !== false || v == null) continue;
      const def = KPI_BY_ID[id];
      const gap = def.higherIsBetter ? t - v : v - t;
      const severity: AttentionItem["severity"] =
        def.unit === "count" ? (gap >= t ? "high" : "medium") : gap >= 10 ? "high" : "medium";
      const message =
        def.unit === "count"
          ? `${r.branch.name} has ${v} ${def.label.toLowerCase()} (target ${t} or fewer)`
          : `${r.branch.name} ${def.label.toLowerCase()} is ${formatKpi(id, v)} against a ${formatKpi(id, t)} target`;
      out.push({ branchId: r.branch.id, branchName: r.branch.name, kpi: id, severity, message });
    }
  }
  return out.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));
}

/** One indicator over trend buckets for a branch (or the company when null). */
export function kpiTrend(
  input: PerfInput,
  branchId: string | null,
  kpi: KpiId | "score",
  buckets: PeriodRange[],
  scoreKpis: KpiId[],
  scope?: string[],
): Array<{ x: string; y: number | null }> {
  return buckets.map((b) => {
    const v = computeKpis(input, branchId, b, scope);
    return { x: b.label, y: kpi === "score" ? performanceScore(v, scoreKpis) : v[kpi] };
  });
}

/** Outstanding actions for one branch — what a manager should chase. */
export interface OutstandingAction {
  kind: "overdue_task" | "open_ticket" | "open_grievance" | "document" | "training";
  title: string;
  owner: string;
  date?: string;
}

export function outstandingActions(input: PerfInput, branchId: string): OutstandingAction[] {
  const people = input.employees.filter((e) => e.branchId === branchId);
  const name = new Map(people.map((e) => [e.id, e.fullName]));
  const asOf = input.asOf;
  const out: OutstandingAction[] = [];
  for (const t of input.tasks) {
    if (name.has(t.assigneeId) && t.dueDate.slice(0, 10) < asOf && t.status !== "done") {
      out.push({ kind: "overdue_task", title: t.title, owner: name.get(t.assigneeId)!, date: t.dueDate });
    }
  }
  for (const t of input.tickets) {
    if (name.has(t.requesterId) && OPEN_TICKET.has(t.status)) {
      out.push({ kind: "open_ticket", title: t.subject, owner: name.get(t.requesterId)!, date: t.openedAt.slice(0, 10) });
    }
  }
  for (const g of input.grievances) {
    if (name.has(g.raisedBy) && OPEN_GRIEVANCE.has(g.status)) {
      // Grievances are confidential — never surface the complainant here.
      out.push({ kind: "open_grievance", title: "Open grievance case", owner: "HR (confidential)", date: g.openedAt });
    }
  }
  for (const d of input.documents) {
    if (!name.has(d.employeeId)) continue;
    const expired = d.expiresAt && d.expiresAt.slice(0, 10) < asOf;
    if (d.status === "expired" || d.status === "rejected" || expired) {
      out.push({ kind: "document", title: `${d.name} — ${expired || d.status === "expired" ? "expired" : d.status}`, owner: name.get(d.employeeId)!, date: d.expiresAt ?? undefined });
    }
  }
  return out.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
}

export const ACTION_KIND_LABELS: Record<OutstandingAction["kind"], string> = {
  overdue_task: "Overdue task",
  open_ticket: "Open helpdesk ticket",
  open_grievance: "Grievance",
  document: "Compliance document",
  training: "Training",
};

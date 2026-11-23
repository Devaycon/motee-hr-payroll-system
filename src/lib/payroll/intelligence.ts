import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";
import { compareRuns, naira2, REASON_LABELS, type ComparisonCtx, type RunComparison, type VarianceReason } from "./comparison";
import { round2 } from "./ng/engine";
import type { PayComputation, PayrollAuditEntry, PayrollRun, PayrollSettings, PayElement, SalaryStructure, VarianceInvestigation, YtdTotals } from "./types";

/**
 * Payroll Intelligence: the analytics behind the Intelligence tab and the
 * Control Centre. Pure functions over runs, so every figure here can be
 * traced back to a run and its payslip lines.
 */

const amt = (c: PayComputation, codes: string[]) => c.lines.filter((l) => codes.includes(l.code)).reduce((s, l) => s + l.amount, 0);
const inc = (r: PayrollRun) => r.employees.filter((e) => e.included && e.computation);
const mk = (r: Pick<PayrollRun, "period">) => `${r.period.year}-${String(r.period.month).padStart(2, "0")}`;
const short = (label: string) => label.split(" ")[0].slice(0, 3);
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const days = (a?: string, b?: string) => (a && b ? Math.max(0, (Date.parse(b) - Date.parse(a)) / 86_400_000) : null);

export interface MonthBucket {
  month: string;
  label: string;
  runs: PayrollRun[];
  /** True when every run in the month is finalized / paid. */
  final: boolean;
}

/** Runs grouped by pay month (regular + off-cycle + adjustments), oldest first. Drafts count as "in progress". */
export function monthsOf(runs: PayrollRun[]): MonthBucket[] {
  const m = new Map<string, PayrollRun[]>();
  for (const r of runs) if (inc(r).length) m.set(mk(r), [...(m.get(mk(r)) ?? []), r]);
  return [...m.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, rs]) => {
      const reg = rs.find((r) => r.type === "regular") ?? rs[0];
      return { month, label: reg.period.label, runs: rs, final: rs.every((r) => r.status === "finalized" || r.status === "disbursed") };
    });
}

// 1 · Gross to net by month ──────────────────────────────────────────────────

export interface GrossToNet {
  month: string;
  label: string;
  short: string;
  final: boolean;
  gross: number;
  paye: number;
  pension: number;
  nhf: number;
  other: number;
  net: number;
  employerCost: number;
  employees: number;
}

export function grossToNet(months: MonthBucket[]): GrossToNet[] {
  return months.map((b) => {
    const t = { gross: 0, paye: 0, pension: 0, nhf: 0, other: 0, net: 0, employerCost: 0 };
    const people = new Set<string>();
    for (const r of b.runs)
      for (const e of inc(r)) {
        const c = e.computation!;
        people.add(e.employeeId);
        t.gross += c.gross;
        t.paye += amt(c, ["PAYE", "WHT"]);
        t.pension += amt(c, ["PENSION_EE", "VOL_PENSION"]);
        t.nhf += amt(c, ["NHF"]);
        t.net += c.net;
        t.employerCost += c.employerCost;
      }
    t.other = t.gross - t.net - t.paye - t.pension - t.nhf;
    return { month: b.month, label: b.label, short: short(b.label), final: b.final, employees: people.size, ...(Object.fromEntries(Object.entries(t).map(([k, v]) => [k, round2(v)])) as typeof t) };
  });
}

// 2 · Cost by dimension ──────────────────────────────────────────────────────

export type CostDimension = "department" | "branch" | "costCentre" | "location";
export const COST_DIMENSIONS: { key: CostDimension; label: string }[] = [
  { key: "department", label: "Department" },
  { key: "branch", label: "Branch" },
  { key: "costCentre", label: "Cost centre" },
  { key: "location", label: "Location (state)" },
];

export interface CostRow {
  key: string;
  employees: number;
  gross: number;
  employerCost: number;
  total: number;
  share: number;
}

export function costBy(bucket: MonthBucket | undefined, dim: CostDimension, bundle: LocaleBundle, states: Map<string, string>): CostRow[] {
  if (!bucket) return [];
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const branches = new Map((bundle.branches ?? []).map((b) => [b.id, b.name]));
  const cc = new Map(bundle.departments.map((d) => [d.name, `${d.costCenter} · ${d.name}`]));
  const keyOf = (e: LocaleEmployee | undefined, id: string) => {
    if (dim === "department") return e?.departmentName ?? "Unassigned";
    if (dim === "branch") return (e?.branchId && branches.get(e.branchId)) || e?.workLocation || "No branch";
    if (dim === "costCentre") return cc.get(e?.departmentName ?? "") ?? "No cost centre";
    return states.get(id) || "Unknown";
  };
  const m = new Map<string, { ids: Set<string>; gross: number; er: number }>();
  for (const r of bucket.runs)
    for (const e of inc(r)) {
      const k = keyOf(people.get(e.employeeId), e.employeeId);
      const row = m.get(k) ?? { ids: new Set(), gross: 0, er: 0 };
      row.ids.add(e.employeeId);
      row.gross += e.computation!.gross;
      row.er += e.computation!.employerCost;
      m.set(k, row);
    }
  const total = [...m.values()].reduce((s, r) => s + r.gross + r.er, 0) || 1;
  return [...m.entries()]
    .map(([key, r]) => ({ key, employees: r.ids.size, gross: round2(r.gross), employerCost: round2(r.er), total: round2(r.gross + r.er), share: round2(((r.gross + r.er) / total) * 100) }))
    .sort((a, b) => b.total - a.total);
}

// 3 · Headcount movement ─────────────────────────────────────────────────────

export interface HeadcountRow {
  month: string;
  short: string;
  headcount: number;
  joiners: number;
  leavers: number;
}

export function headcountMovement(months: MonthBucket[]): HeadcountRow[] {
  let prev: Set<string> | null = null;
  const out: HeadcountRow[] = [];
  for (const b of months) {
    const reg = b.runs.find((r) => r.type === "regular");
    if (!reg) continue;
    const now = new Set(inc(reg).map((e) => e.employeeId));
    out.push({
      month: b.month,
      short: short(b.label),
      headcount: now.size,
      joiners: prev ? [...now].filter((id) => !prev!.has(id)).length : 0,
      leavers: prev ? [...prev].filter((id) => !now.has(id)).length : 0,
    });
    prev = now;
  }
  return out;
}

// 4 · Overtime ───────────────────────────────────────────────────────────────

export interface OvertimeRow {
  month: string;
  short: string;
  cost: number;
  hours: number;
  employees: number;
  pctOfGross: number;
}

export function overtimeCost(months: MonthBucket[], elements: PayElement[]): OvertimeRow[] {
  const ot = new Set(elements.filter((e) => e.group === "overtime" || e.group === "manufacturing").map((e) => e.code));
  return months.map((b) => {
    let cost = 0, hours = 0, gross = 0;
    const ids = new Set<string>();
    for (const r of b.runs)
      for (const e of inc(r)) {
        gross += e.computation!.gross;
        for (const l of e.computation!.lines)
          if (ot.has(l.code) && l.category === "earning") {
            cost += l.amount;
            hours += l.units ?? 0;
            ids.add(e.employeeId);
          }
      }
    return { month: b.month, short: short(b.label), cost: round2(cost), hours: round2(hours), employees: ids.size, pctOfGross: gross ? round2((cost / gross) * 100) : 0 };
  });
}

/** Overtime by department for one month — where the hours are going. */
export function overtimeByDepartment(bucket: MonthBucket | undefined, elements: PayElement[], people: Map<string, LocaleEmployee>) {
  const ot = new Set(elements.filter((e) => e.group === "overtime" || e.group === "manufacturing").map((e) => e.code));
  const m = new Map<string, number>();
  for (const r of bucket?.runs ?? [])
    for (const e of inc(r)) {
      const v = e.computation!.lines.filter((l) => ot.has(l.code) && l.category === "earning").reduce((s, l) => s + l.amount, 0);
      if (!v) continue;
      const d = people.get(e.employeeId)?.departmentName ?? "Unassigned";
      m.set(d, (m.get(d) ?? 0) + v);
    }
  return [...m.entries()].map(([department, cost]) => ({ department, cost: round2(cost) })).sort((a, b) => b.cost - a.cost);
}

// 5 · Employer statutory contributions ───────────────────────────────────────

export const EMPLOYER_LINES = [
  { key: "PENSION_ER", label: "Employer pension" },
  { key: "NSITF", label: "NSITF" },
  { key: "ITF", label: "ITF" },
  { key: "NHIS_ER", label: "Health insurance" },
  { key: "GROUP_LIFE", label: "Group life" },
] as const;

export function employerTrends(months: MonthBucket[]) {
  return months.map((b) => {
    const row: Record<string, number | string> = { month: b.month, short: short(b.label) };
    let total = 0;
    for (const { key } of EMPLOYER_LINES) {
      const v = b.runs.reduce((s, r) => s + inc(r).reduce((x, e) => x + amt(e.computation!, [key]), 0), 0);
      row[key] = round2(v);
      total += v;
    }
    row.total = round2(total);
    return row as { month: string; short: string; total: number } & Record<string, number>;
  });
}

// 6 · Salary distribution & pay equity ───────────────────────────────────────

export interface DistributionBand {
  label: string;
  from: number;
  to: number | null;
  count: number;
}

const BANDS = [0, 100_000, 250_000, 500_000, 1_000_000, 2_000_000, 5_000_000];

export function salaryDistribution(run: PayrollRun | undefined, structures: SalaryStructure[]): { bands: DistributionBand[]; median: number; p10: number; p90: number; ratio: number } {
  const monthly = inc(run ?? ({ employees: [] } as unknown as PayrollRun)).map((e) => {
    const s = structures.find((x) => x.employeeId === e.employeeId && (x.status ?? "approved") === "approved" && x.effectiveFrom <= run!.period.end && (!x.effectiveTo || x.effectiveTo >= run!.period.end));
    return s ? s.lines.reduce((t, l) => t + l.amount, 0) : e.computation!.gross;
  });
  const sorted = [...monthly].sort((a, b) => a - b);
  const pick = (q: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0);
  const k = (n: number) => (n >= 1_000_000 ? `₦${n / 1_000_000}m` : `₦${n / 1000}k`);
  const bands = BANDS.map((from, i) => {
    const to = BANDS[i + 1] ?? null;
    return { label: to ? `${k(from)}–${k(to)}` : `${k(from)}+`, from, to, count: monthly.filter((v) => v >= from && (to === null || v < to)).length };
  });
  const p10 = pick(0.1);
  const p90 = pick(0.9);
  return { bands, median: round2(median(monthly)), p10: round2(p10), p90: round2(p90), ratio: p10 ? round2(p90 / p10) : 0 };
}

export interface EquityRow {
  group: string;
  count: number;
  median: number;
  average: number;
}

/** Median and average monthly salary by gender and by grade; the gender gap is the difference in medians. */
export function payEquity(run: PayrollRun | undefined, people: Map<string, LocaleEmployee>, structures: SalaryStructure[]) {
  const rows = inc(run ?? ({ employees: [] } as unknown as PayrollRun)).map((e) => {
    const s = structures.find((x) => x.employeeId === e.employeeId && (x.status ?? "approved") === "approved" && x.effectiveFrom <= run!.period.end && (!x.effectiveTo || x.effectiveTo >= run!.period.end));
    const p = people.get(e.employeeId);
    return { gender: p?.gender ? p.gender[0].toUpperCase() + p.gender.slice(1).toLowerCase() : "Not stated", grade: p?.grade || "Ungraded", pay: s ? s.lines.reduce((t, l) => t + l.amount, 0) : e.computation!.gross };
  });
  const by = (k: "gender" | "grade"): EquityRow[] => {
    const m = new Map<string, number[]>();
    for (const r of rows) m.set(r[k], [...(m.get(r[k]) ?? []), r.pay]);
    return [...m.entries()].map(([group, xs]) => ({ group, count: xs.length, median: round2(median(xs)), average: round2(xs.reduce((a, b) => a + b, 0) / xs.length) })).sort((a, b) => b.median - a.median);
  };
  const gender = by("gender");
  const male = gender.find((g) => g.group.startsWith("M"));
  const female = gender.find((g) => g.group.startsWith("F"));
  const gap = male && female && male.median ? round2(((male.median - female.median) / male.median) * 100) : null;
  return { gender, grade: by("grade"), genderGapPct: gap };
}

// 7 · Errors & corrections ───────────────────────────────────────────────────

export interface QualityRow {
  month: string;
  short: string;
  employees: number;
  errors: number;
  warnings: number;
  acknowledged: number;
  corrections: number;
  /** Exceptions per 100 employees paid. */
  rate: number;
  recalculations: number;
}

export function errorRates(months: MonthBucket[], audit: PayrollAuditEntry[]): QualityRow[] {
  return months.map((b) => {
    const reg = b.runs.find((r) => r.type === "regular");
    const ex = b.runs.flatMap((r) => r.exceptions);
    const employees = reg ? inc(reg).length : 0;
    const ids = new Set(b.runs.map((r) => r.id));
    return {
      month: b.month,
      short: short(b.label),
      employees,
      errors: ex.filter((e) => e.severity === "error").length,
      warnings: ex.filter((e) => e.severity === "warning").length,
      acknowledged: ex.filter((e) => e.acknowledged).length,
      corrections: b.runs.filter((r) => r.type === "adjustment").length,
      rate: employees ? round2((ex.length / employees) * 100) : 0,
      recalculations: audit.filter((a) => a.runId && ids.has(a.runId) && /recalculat/i.test(a.action)).length,
    };
  });
}

/** Share of finalized runs that later needed an adjustment run. */
export function correctionRate(runs: PayrollRun[]): { corrected: number; finalized: number; pct: number } {
  const finalized = runs.filter((r) => r.type === "regular" && (r.status === "finalized" || r.status === "disbursed"));
  const corrected = new Set(runs.filter((r) => r.type === "adjustment" && r.parentRunId).map((r) => r.parentRunId));
  const n = finalized.filter((r) => corrected.has(r.id)).length;
  return { corrected: n, finalized: finalized.length, pct: finalized.length ? round2((n / finalized.length) * 100) : 0 };
}

// 8 · Processing time & approval performance ─────────────────────────────────

export interface ProcessingRow {
  id: string;
  title: string;
  short: string;
  prepare: number | null;
  approve: number | null;
  finalize: number | null;
  pay: number | null;
  total: number | null;
  onTime: boolean | null;
}

export function processingTimes(runs: PayrollRun[]): { rows: ProcessingRow[]; avgApprovalDays: number | null; onTimePct: number | null } {
  const rows = runs
    .filter((r) => r.type === "regular")
    .sort((a, b) => a.period.year * 100 + a.period.month - (b.period.year * 100 + b.period.month))
    .map((r) => ({
      id: r.id,
      title: r.title,
      short: short(r.period.label),
      prepare: days(r.createdAt, r.submittedAt),
      approve: days(r.submittedAt, r.approvedAt),
      finalize: days(r.approvedAt, r.finalizedAt),
      pay: days(r.finalizedAt, r.disbursedAt),
      total: days(r.createdAt, r.disbursedAt ?? r.finalizedAt),
      onTime: r.disbursedAt ? r.disbursedAt.slice(0, 10) <= r.period.payDate : null,
    }));
  const appr = rows.map((r) => r.approve).filter((x): x is number => x !== null);
  const paid = rows.filter((r) => r.onTime !== null);
  return {
    rows,
    avgApprovalDays: appr.length ? round2(appr.reduce((a, b) => a + b, 0) / appr.length) : null,
    onTimePct: paid.length ? round2((paid.filter((r) => r.onTime).length / paid.length) * 100) : null,
  };
}

// 9 · Year to date ───────────────────────────────────────────────────────────

export interface YtdSummary {
  year: number;
  gross: number;
  paye: number;
  pensionEmployee: number;
  pensionEmployer: number;
  nhf: number;
  net: number;
  employees: number;
  /** Brought forward from the previous payroll (opening balances). */
  openingGross: number;
}

export function yearToDate(year: number, payslips: { status: string; period: { year: number }; employeeId: string; computation: PayComputation }[], opening: Record<string, YtdTotals>): YtdSummary {
  const t: YtdSummary = { year, gross: 0, paye: 0, pensionEmployee: 0, pensionEmployer: 0, nhf: 0, net: 0, employees: 0, openingGross: 0 };
  const ids = new Set<string>();
  for (const [id, y] of Object.entries(opening)) {
    if (y.year !== year) continue;
    ids.add(id);
    t.gross += y.gross;
    t.openingGross += y.gross;
    t.paye += y.paye;
    t.pensionEmployee += y.pensionEmployee;
    t.pensionEmployer += y.pensionEmployer;
    t.nhf += y.nhf;
    t.net += y.net;
  }
  for (const p of payslips) {
    if (p.status !== "final" || p.period.year !== year || !p.computation.period) continue;
    const f = p.computation.period;
    ids.add(p.employeeId);
    t.gross += f.gross;
    t.paye += f.paye;
    t.pensionEmployee += f.pensionEmployee;
    t.pensionEmployer += f.pensionEmployer;
    t.nhf += f.nhf;
    t.net += f.net;
  }
  t.employees = ids.size;
  for (const k of ["gross", "paye", "pensionEmployee", "pensionEmployer", "nhf", "net", "openingGross"] as const) t[k] = round2(t[k]);
  return t;
}

// 10 · Forecast against budget ───────────────────────────────────────────────

export interface ForecastRow {
  month: string;
  short: string;
  actual: number | null;
  forecast: number | null;
  budget: number | null;
  variance: number | null;
}

/**
 * Actual cost (gross + employer contributions) for paid months; for the rest
 * of the year, the latest run's cost plus the monthly effect of approved and
 * pending salary changes from their effective month.
 */
export function forecastVsBudget(months: MonthBucket[], structures: SalaryStructure[], settings: PayrollSettings, year: number): { rows: ForecastRow[]; actualYtd: number; forecastYear: number; budgetYear: number | null } {
  const g2n = grossToNet(months.filter((m) => m.month.startsWith(String(year))));
  const actual = new Map(g2n.filter((m) => m.final).map((m) => [m.month, m.gross + m.employerCost]));
  const latest = [...g2n].reverse().find((m) => m.gross > 0);
  const base = latest ? latest.gross + latest.employerCost : 0;
  const budgetOf = (month: string) => (settings.budget ? settings.budget.months[month] ?? (settings.budget.monthly || null) : null);
  const rows: ForecastRow[] = [];
  for (let m = 1; m <= 12; m++) {
    const month = `${year}-${String(m).padStart(2, "0")}`;
    const a = actual.get(month) ?? null;
    const draft = g2n.find((x) => x.month === month && !x.final);
    // Salary changes taking effect after the latest run's month add their monthly cost from their effective month.
    const uplift = structures
      .filter((s) => s.impact && s.status !== "rejected" && s.effectiveFrom.slice(0, 7) <= month && latest && s.effectiveFrom.slice(0, 7) > latest.month)
      .reduce((t, s) => t + (s.impact!.after.employerCost - s.impact!.before.employerCost), 0);
    // Only months still to come are forecast; months before MOTEE ran payroll have no figure.
    const future = !!latest && month > latest.month;
    const f = a !== null ? null : draft ? draft.gross + draft.employerCost : future && base ? base + uplift : null;
    const b = budgetOf(month);
    const shown = a ?? f;
    rows.push({ month, short: new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }), actual: a !== null ? round2(a) : null, forecast: f !== null ? round2(f) : null, budget: b, variance: b !== null && shown !== null ? round2(shown - b) : null });
  }
  const sum = (xs: (number | null)[]) => round2(xs.reduce<number>((s, x) => s + (x ?? 0), 0));
  const budgets = rows.map((r) => r.budget);
  return { rows, actualYtd: sum(rows.map((r) => r.actual)), forecastYear: sum(rows.map((r) => r.actual ?? r.forecast)), budgetYear: budgets.every((b) => b === null) ? null : sum(budgets) };
}

// Variance explanation ───────────────────────────────────────────────────────

export interface VarianceStory {
  comparison: RunComparison;
  /** Professional, figure-exact paragraph explaining the gross movement. */
  headline: string;
  drivers: { reason: VarianceReason; label: string; amount: number; employees: number }[];
  topEmployees: { employeeId: string; name: string; change: number; why: string }[];
  topElements: { label: string; change: number }[];
}

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
/** Counts up to ten in words ("five employees"), digits above. */
export const countWords = (n: number, noun: string) => `${n <= 10 ? WORDS[n] : n} ${noun}${n === 1 ? "" : "s"}`;
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const andList = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** What a reason's movement means, for the narrative ("the non-recurrence of one-off payments"). */
function driverPhrase(reason: VarianceReason, amount: number): string {
  const up = amount > 0;
  switch (reason) {
    case "one_off":
      return up ? "new one-off payments" : "the non-recurrence of one-off payments";
    case "joiner":
      return "new joiners";
    case "leaver":
      return "leavers";
    case "salary_change":
      return up ? "salary increases" : "salary reductions";
    case "proration":
      return "part-month (pro-rated) pay";
    case "overtime":
      return up ? "higher overtime and shift pay" : "lower overtime and shift pay";
    case "attendance":
      return up ? "lower unpaid leave and lateness deductions" : "unpaid leave and lateness deductions";
    case "expenses":
      return "expense reimbursements";
    default:
      return "movements with no confirmed source";
  }
}

/**
 * The narrative a finance reader expects. Every figure comes from the
 * bridge, which reconciles to the register; nothing is inferred beyond it.
 */
export function varianceNarrative(cmp: RunComparison): string {
  const g = cmp.totals.find((t) => t.key === "gross");
  const change = g?.change ?? 0;
  const prevLabel = cmp.previous.period.label;
  if (Math.abs(change) < 0.005) return `Gross payroll is unchanged from ${prevLabel} at ${naira2(g?.current ?? 0)}.`;
  const up = change > 0;
  const pct = g && g.pct !== null ? ` (${Math.abs(g.pct).toFixed(2)}%)` : "";
  const parts = [`Gross payroll ${up ? "increased" : "decreased"} by ${naira2(change)}${pct} compared with ${prevLabel}.`];
  const steps = [...cmp.bridge].filter((b) => b.reason !== "other").sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  const same = steps.filter((b) => Math.sign(b.amount) === Math.sign(change));
  const against = steps.filter((b) => Math.sign(b.amount) !== Math.sign(change) && Math.abs(b.amount) >= 0.005);
  const primary = same[0];
  if (primary) {
    parts.push(
      `The primary driver was ${driverPhrase(primary.reason, primary.amount)} affecting ${countWords(primary.employees, "employee")}, accounting for ${primary.amount < 0 ? "a reduction" : "an increase"} of ${naira2(primary.amount)}.`,
    );
  }
  if (same.length > 1) {
    const rest = same.slice(1).map((b) => `${driverPhrase(b.reason, b.amount)} (${naira2(b.amount)}, ${countWords(b.employees, "employee")})`);
    parts.push(`Further ${up ? "increases" : "reductions"} came from ${andList(rest)}.`);
  }
  if (against.length) {
    const offs = against.map((b) => `${b.amount > 0 ? "an increase" : "a reduction"} of ${naira2(b.amount)} relating to ${REASON_LABELS[b.reason].toLowerCase().replace(" & ", " and ")} (${countWords(b.employees, "employee")})`);
    parts.push(`This was partially offset by ${andList(offs)}.`);
  }
  const r = cmp.reconciliation;
  if (Math.abs(r.unexplained) >= 0.005) {
    parts.push(`${naira2(r.unexplained)} across ${countWords(r.unexplainedEmployees, "employee")} could not be traced to a confirmed source and requires investigation.`);
  }
  parts.push(r.balanced ? "The identified movements reconcile in full to the payroll register." : `An unreconciled difference of ${naira2(r.difference)} remains against the payroll register.`);
  return parts.join(" ");
}

/**
 * Explains a month-on-month payroll change: rather than "₦4.5m more", which
 * reasons, employees and pay elements made up the difference.
 */
export function explainVariance(current: PayrollRun, previous: PayrollRun, ctx: ComparisonCtx): VarianceStory {
  const comparison = compareRuns(current, previous, ctx);
  const drivers = comparison.bridge
    .filter((b) => Math.abs(b.amount) >= 1)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .map((b) => ({ reason: b.reason, label: REASON_LABELS[b.reason], amount: b.amount, employees: b.employees }));
  return {
    comparison,
    headline: varianceNarrative(comparison),
    drivers,
    topEmployees: [...comparison.employees]
      .filter((e) => Math.abs(e.change) >= 1)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 6)
      .map((e) => ({ employeeId: e.employeeId, name: e.name, change: e.change, why: e.explanation })),
    topElements: [...comparison.earnings].filter((e) => Math.abs(e.change) >= 1).sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 6).map((e) => ({ label: e.label, change: e.change })),
  };
}

// Intelligence summary ───────────────────────────────────────────────────────

export interface Insight {
  tone: "down" | "up" | "info" | "ok" | "warn";
  title: string;
  text: string;
}

export interface IntelligenceSummary {
  grossChange: number;
  grossPct: number | null;
  employeesAffected: number;
  categories: number;
  balanced: boolean;
  unexplained: number;
  openInvestigations: number;
  insights: Insight[];
}

/** The headline tiles and the "intelligence generated" list for one comparison. */
export function intelligenceSummary(cmp: RunComparison, investigations: VarianceInvestigation[] = []): IntelligenceSummary {
  const g = cmp.totals.find((t) => t.key === "gross");
  const change = g?.change ?? 0;
  const steps = [...cmp.bridge].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  const primary = steps.find((b) => Math.sign(b.amount) === Math.sign(change) && b.reason !== "other");
  const offset = steps.find((b) => Math.sign(b.amount) !== Math.sign(change) && b.reason !== "other" && Math.abs(b.amount) >= 0.005);
  const r = cmp.reconciliation;
  const open = investigations.filter((i) => i.runId === cmp.current.id && i.status !== "resolved");
  const insights: Insight[] = [];
  if (primary) {
    insights.push({
      tone: primary.amount < 0 ? "down" : "up",
      title: `Primary driver: ${REASON_LABELS[primary.reason]}`,
      text: `${capitalise(countWords(primary.employees, "employee"))} account for ${naira2(primary.amount)} of the ${change < 0 ? "reduction" : "increase"}.`,
    });
  }
  if (offset) {
    insights.push({
      tone: "info",
      title: `Offsetting movement: ${REASON_LABELS[offset.reason]}`,
      text: `${capitalise(countWords(offset.employees, "employee"))} account for ${offset.amount > 0 ? "an increase" : "a reduction"} of ${naira2(offset.amount)}.`,
    });
  }
  const recurring = cmp.bridge.filter((b) => b.nature === "recurring").reduce((s, b) => s + b.amount, 0);
  if (Math.abs(recurring) >= 1) {
    insights.push({ tone: "info", title: "Recurring effect", text: `${naira2(recurring)} of the movement ${recurring > 0 ? "adds to" : "comes off"} every future month (joiners, leavers, salary changes).` });
  } else if (Math.abs(change) >= 1) {
    insights.push({ tone: "info", title: "No recurring effect", text: "Every movement this month is non-recurring, so next month's base payroll is unchanged." });
  }
  if (Math.abs(r.unexplained) >= 0.005) {
    insights.push({ tone: "warn", title: "Unclassified movement", text: `${naira2(r.unexplained)} across ${countWords(r.unexplainedEmployees, "employee")} has no confirmed source and requires investigation.` });
  }
  if (open.length) insights.push({ tone: "warn", title: "Open investigations", text: `${capitalise(countWords(open.length, "investigation"))} still open for ${cmp.current.period.label}.` });
  insights.push(
    r.balanced
      ? { tone: "ok", title: "Reconciliation check", text: "The identified movements reconcile to the reported gross payroll difference." }
      : { tone: "warn", title: "Reconciliation check", text: `${naira2(r.difference)} of the gross difference is not attributed to a reason.` },
  );
  return {
    grossChange: change,
    grossPct: g?.pct ?? null,
    employeesAffected: cmp.employees.filter((e) => Math.abs(e.change) >= 0.005).length,
    categories: cmp.bridge.length,
    balanced: r.balanced,
    unexplained: r.unexplained,
    openInvestigations: open.length,
    insights,
  };
}


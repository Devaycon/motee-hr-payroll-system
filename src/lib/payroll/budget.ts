import type { LocaleBundle } from "@/src/lib/types/locale";
import { monthsOf } from "./intelligence";
import { round2 } from "./ng/engine";
import { structureOn, type TenantPayrollData } from "./run-builder";
import { EMPTY_SCENARIO, latestBaseRun, simulate, type SavedScenario, type Scenario, type SimPromotion, type SimStarter } from "./simulation";
import type { PayrollRun, PayrollSettings } from "./types";

/**
 * Payroll Budget & Forecasting: approved budgets by department, a rolling
 * forecast built from the payroll engine, and budget against actual against
 * forecast. The forecast is a simulation of what is already committed —
 * leavers with a leaving date, salary changes on record, planned recruitment
 * — optionally with a saved scenario on top. Nothing here changes payroll.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type BudgetDimension = "department" | "costCentre";

export interface BudgetLine {
  /** Department name, or cost centre code. */
  key: string;
  /** "YYYY-MM" → budgeted cost to employer (gross + employer contributions). */
  months: Record<string, number>;
}

export type BudgetStatus = "draft" | "submitted" | "approved" | "superseded";

export interface BudgetVersion {
  id: string;
  name: string;
  fiscalYear: number;
  dimension: BudgetDimension;
  lines: BudgetLine[];
  status: BudgetStatus;
  createdBy: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  submittedBy?: string;
  submittedById?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedById?: string;
  approvedAt?: string;
  history: { at: string; actor: string; action: string; note?: string }[];
}

export const BUDGET_STATUS_LABELS: Record<BudgetStatus, string> = { draft: "Draft", submitted: "Awaiting approval", approved: "Approved", superseded: "Superseded" };

/** A hire Finance plans that isn't (yet) a requisition in Recruitment. */
export interface PlannedHire {
  id: string;
  title: string;
  department: string;
  count: number;
  monthlyGross: number;
  /** "YYYY-MM". */
  startMonth: string;
  addedBy: string;
  addedAt: string;
}

/** The bits of a recruitment requisition the forecast needs. */
export interface RequisitionRef {
  id: string;
  title: string;
  department: string;
  numberOfPositions: number;
  /** Annual salary band. */
  salaryMin: number;
  salaryMax: number;
  startDate: string;
}

/** A frozen copy of the forecast, kept for comparison and audit. */
export interface ForecastSnapshot {
  id: string;
  takenAt: string;
  takenBy: string;
  trigger: "month_closed" | "manual";
  label: string;
  fiscalYear: number;
  months: { month: string; value: number; kind: "actual" | "in_progress" | "forecast" }[];
  /** Department → projected fiscal-year cost. */
  departments: Record<string, number>;
  total: number;
}

// ── Months & budget lookup ──────────────────────────────────────────────────

export const yearMonths = (year: number) => Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
export const monthShort = (key: string) => new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1)).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
export const monthLong = (key: string) => new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const runMonth = (r: Pick<PayrollRun, "period">) => `${r.period.year}-${String(r.period.month).padStart(2, "0")}`;

/** The approved version covering a month's fiscal year. */
export function approvedVersionFor(budgets: BudgetVersion[] | undefined, month: string): BudgetVersion | null {
  const y = Number(month.slice(0, 4));
  return (budgets ?? []).find((b) => b.status === "approved" && b.fiscalYear === y) ?? null;
}

/**
 * Budget for a month — company-wide, or for one department. Falls back to
 * the simple monthly budget in settings (company-wide only) when no version
 * is approved.
 */
export function budgetFor(budgets: BudgetVersion[] | undefined, settings: Pick<PayrollSettings, "budget">, month: string, department?: string, costCentreOf?: (dept: string) => string): number | null {
  const v = approvedVersionFor(budgets, month);
  if (v) {
    if (!department) return round2(v.lines.reduce((s, l) => s + (l.months[month] ?? 0), 0));
    const key = v.dimension === "costCentre" ? costCentreOf?.(department) ?? department : department;
    const line = v.lines.find((l) => l.key === key);
    return line ? line.months[month] ?? 0 : null;
  }
  if (department) return null;
  return settings.budget ? settings.budget.months[month] ?? (settings.budget.monthly || null) : null;
}

/** Twelve equal months. */
export const spreadEvenly = (annual: number, year: number): Record<string, number> => Object.fromEntries(yearMonths(year).map((m) => [m, round2(annual / 12)]));

// ── Forecast ────────────────────────────────────────────────────────────────

export interface ForecastDriver {
  kind: "hires" | "exits" | "salary_changes" | "scenario";
  label: string;
  /** Change to fiscal-year cost from this driver alone, by department. */
  byDepartment: Record<string, number>;
  total: number;
}

export interface YearMonthRow {
  month: string;
  short: string;
  kind: "actual" | "in_progress" | "forecast" | "none";
  value: number | null;
  budget: number | null;
  variance: number | null;
}

export interface DepartmentForecast {
  department: string;
  costCentre: string;
  actualYtd: number;
  /** Actual + in progress + forecast over the fiscal year's covered months. */
  projected: number;
  /** Budget over the same months (null = no budget line). */
  budget: number | null;
  variance: number | null;
  variancePct: number | null;
  status: "over" | "under" | "on_track" | "no_budget";
  drivers: { label: string; amount: number }[];
  plannedPositions: number;
  employees: { employeeId: string; name: string; current: number; projected: number; changes: string[] }[];
}

export interface WindowMonth {
  month: string;
  label: string;
  short: string;
  value: number;
  budget: number | null;
  kind: "in_progress" | "forecast";
}

export interface BudgetForecast {
  fiscalYear: number;
  baseRunId: string;
  baseLabel: string;
  year: YearMonthRow[];
  /** Fiscal-year months that have a figure (paid on MOTEE, in progress or forecast). */
  coveredMonths: string[];
  departments: DepartmentForecast[];
  drivers: ForecastDriver[];
  window: WindowMonth[];
  totals: { actualYtd: number; projected: number; budget: number | null; variance: number | null; variancePct: number | null };
  next12: { spend: number; budget: number | null; budgetMonths: number; over: number | null };
  hires: { id: string; title: string; department: string; count: number; monthlyGross: number; startMonth: string; source: "requisition" | "planned"; late: boolean }[];
}

export interface ForecastInput {
  data: TenantPayrollData & { budgets?: BudgetVersion[]; plannedHires?: PlannedHire[]; scenarios?: SavedScenario[] };
  bundle: LocaleBundle;
  requisitions?: RequisitionRef[];
  /** Saved scenario to lay on top of the committed forecast. */
  scenarioId?: string | null;
  fiscalYear?: number;
  /** Months in the rolling window (3, 6 or 12). */
  horizon?: number;
  /** Variance % that counts as over / under budget. */
  alertPct?: number;
}

const merge = (a: Scenario, b: Partial<Scenario>): Scenario => ({
  ...a,
  increasePct: b.increasePct ?? a.increasePct,
  increaseDepartment: b.increaseDepartment ?? a.increaseDepartment,
  increaseFrom: b.increaseFrom ?? a.increaseFrom,
  bonusPct: b.bonusPct ?? a.bonusPct,
  bonusDepartment: b.bonusDepartment ?? a.bonusDepartment,
  bonusMonth: b.bonusMonth ?? a.bonusMonth,
  payeBandDeltaPp: b.payeBandDeltaPp ?? a.payeBandDeltaPp,
  employerPensionPct: b.employerPensionPct ?? a.employerPensionPct,
  minimumWage: b.minimumWage ?? a.minimumWage,
  employeePensionPct: b.employeePensionPct ?? a.employeePensionPct,
  nhfPct: b.nhfPct ?? a.nhfPct,
  nhfBasis: b.nhfBasis ?? a.nhfBasis,
  nsitfPct: b.nsitfPct ?? a.nsitfPct,
  itf: b.itf ?? a.itf,
  groupLife: b.groupLife ?? a.groupLife,
  unpaidDays: b.unpaidDays || a.unpaidDays,
  unpaidScope: b.unpaidScope ?? a.unpaidScope,
  starters: [...a.starters, ...(b.starters ?? [])],
  leavers: [...new Set([...a.leavers, ...(b.leavers ?? [])])],
  exitMonths: { ...a.exitMonths, ...b.exitMonths },
  adjustments: [...(a.adjustments ?? []), ...(b.adjustments ?? [])],
  variable: [...(a.variable ?? []), ...(b.variable ?? [])],
  promotions: [...(a.promotions ?? []), ...(b.promotions ?? [])],
  transfers: [...(a.transfers ?? []), ...(b.transfers ?? [])],
  deductions: [...(a.deductions ?? []), ...(b.deductions ?? [])],
});

const nextMonth = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
};

/** What payroll has already committed to, as simulation inputs. */
export function commitments(input: ForecastInput, base: PayrollRun, first: string) {
  const { data, bundle } = input;
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const inRun = base.employees.filter((e) => e.included && e.computation);

  const exits: Partial<Scenario> = { leavers: [], exitMonths: {} };
  for (const re of inRun) {
    const leave = people.get(re.employeeId)?.dateOfLeaving;
    if (leave && leave > base.period.end) {
      exits.leavers!.push(re.employeeId);
      exits.exitMonths![re.employeeId] = nextMonth(leave.slice(0, 7));
    }
  }

  const fixedTotal = (lines: { code: string; amount: number }[]) => lines.filter((l) => data.elements.find((e) => e.code === l.code)?.calculationType === "fixed").reduce((s, l) => s + l.amount, 0);
  const promotions: SimPromotion[] = [];
  for (const s of data.structures) {
    if (s.status === "rejected" || s.effectiveFrom <= base.period.end || !inRun.some((e) => e.employeeId === s.employeeId)) continue;
    const now = structureOn(data.structures, s.employeeId, base.period.end);
    const before = now ? fixedTotal(now.lines) : 0;
    const after = fixedTotal(s.lines);
    if (!before || Math.abs(after - before) < 1) continue;
    promotions.push({ id: `SC-${s.id}`, employeeId: s.employeeId, pct: round2(((after - before) / before) * 100), fromMonth: s.effectiveFrom.slice(0, 7) < first ? first : s.effectiveFrom.slice(0, 7) });
  }

  const hires: BudgetForecast["hires"] = [
    ...(data.plannedHires ?? []).map((h) => ({ id: h.id, title: h.title, department: h.department, count: h.count, monthlyGross: h.monthlyGross, startMonth: h.startMonth < first ? first : h.startMonth, source: "planned" as const, late: h.startMonth < first })),
    ...(input.requisitions ?? []).map((r) => {
      const start = r.startDate.slice(0, 7);
      return { id: r.id, title: r.title, department: r.department, count: r.numberOfPositions, monthlyGross: round2((r.salaryMin + r.salaryMax) / 2 / 12), startMonth: start < first ? first : start, source: "requisition" as const, late: start < first };
    }),
  ];
  const starters: SimStarter[] = hires.map((h) => ({ id: h.id, department: h.department, count: h.count, monthlyGross: h.monthlyGross, startMonth: h.startMonth }));
  return { exits, promotions, starters, hires };
}

export function buildForecast(input: ForecastInput): BudgetForecast | null {
  const { data, bundle } = input;
  const base = latestBaseRun(data.runs);
  if (!base) return null;
  const alertPct = input.alertPct ?? 5;
  const horizon = input.horizon ?? 12;
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const ccOf = new Map(bundle.departments.map((d) => [d.name, d.costCenter]));
  const costCentreOf = (d: string) => ccOf.get(d) ?? d;
  const deptOf = (id: string) => people.get(id)?.departmentName ?? "Unassigned";
  const fiscalYear = input.fiscalYear ?? base.period.year;
  const months = yearMonths(fiscalYear);

  // Paid and in-progress months come from the runs themselves.
  const buckets = monthsOf(data.runs);
  const runCost = (runs: PayrollRun[]) => {
    const byDept: Record<string, number> = {};
    let total = 0;
    for (const r of runs)
      for (const e of r.employees) {
        if (!e.included || !e.computation) continue;
        const v = e.computation.gross + e.computation.employerCost;
        total += v;
        byDept[deptOf(e.employeeId)] = (byDept[deptOf(e.employeeId)] ?? 0) + v;
      }
    return { total: round2(total), byDept };
  };
  const known = new Map(buckets.map((b) => [b.month, { final: b.final, ...runCost(b.runs) }]));

  // Forecast: the committed scenario simulated from the latest run.
  const probe = simulate(data, bundle, base, EMPTY_SCENARIO, { forecast: false });
  const first = probe.months[0].key;
  const c = commitments(input, base, first);
  const overlay = input.scenarioId ? data.scenarios?.find((s) => s.id === input.scenarioId)?.scenario : undefined;
  const committed = merge(merge(merge({ ...EMPTY_SCENARIO }, c.exits), { promotions: c.promotions }), { starters: c.starters });
  const full = overlay ? merge(committed, overlay) : committed;
  const sim = simulate(data, bundle, base, full);
  const fc = new Map(sim.forecast.map((m) => [m.month, m]));

  // Each driver alone, for "why" — fiscal-year months only.
  const drivers: ForecastDriver[] = [];
  const baseByDept: Record<string, number> = {};
  for (const r of probe.rows) baseByDept[r.baseDepartment] = (baseByDept[r.baseDepartment] ?? 0) + r.base.employerCost;
  const driver = (kind: ForecastDriver["kind"], label: string, sc: Partial<Scenario>) => {
    const r = simulate(data, bundle, base, merge({ ...EMPTY_SCENARIO }, sc));
    const byDepartment: Record<string, number> = {};
    for (const m of r.forecast) {
      // Only months still to forecast in the fiscal year (paid months are actuals).
      if (!months.includes(m.month) || known.has(m.month)) continue;
      for (const d of new Set([...Object.keys(m.byDepartment), ...Object.keys(baseByDept)])) {
        byDepartment[d] = round2((byDepartment[d] ?? 0) + (m.byDepartment[d] ?? 0) - (baseByDept[d] ?? 0));
      }
    }
    for (const k of Object.keys(byDepartment)) if (Math.abs(byDepartment[k]) < 1) delete byDepartment[k];
    const total = round2(Object.values(byDepartment).reduce((s, v) => s + v, 0));
    if (Object.keys(byDepartment).length) drivers.push({ kind, label, byDepartment, total });
  };
  if (c.starters.length) driver("hires", "Planned recruitment", { starters: c.starters });
  if (c.exits.leavers!.length) driver("exits", "Leavers", c.exits);
  if (c.promotions.length) driver("salary_changes", "Salary changes on record", { promotions: c.promotions });
  if (overlay) driver("scenario", `Scenario: ${data.scenarios?.find((s) => s.id === input.scenarioId)?.name ?? ""}`, overlay);

  // The fiscal year, month by month.
  const year: YearMonthRow[] = months.map((m) => {
    const k = known.get(m);
    const f = fc.get(m);
    const kind: YearMonthRow["kind"] = k ? (k.final ? "actual" : "in_progress") : f ? "forecast" : "none";
    const value = k ? k.total : f ? f.scenario : null;
    const budget = budgetFor(data.budgets, data.settings, m);
    return { month: m, short: monthShort(m), kind, value, budget, variance: value !== null && budget !== null ? round2(value - budget) : null };
  });
  const covered = year.filter((r) => r.value !== null).map((r) => r.month);
  const deptValue = (m: string, d: string) => {
    const k = known.get(m);
    if (k) return k.byDept[d] ?? 0;
    return fc.get(m)?.byDepartment[d] ?? 0;
  };

  const deptNames = [...new Set([...bundle.departments.map((d) => d.name), ...[...known.values()].flatMap((k) => Object.keys(k.byDept)), ...sim.forecast.flatMap((m) => Object.keys(m.byDepartment))])].filter((d) =>
    covered.some((m) => deptValue(m, d) > 0) || covered.some((m) => (budgetFor(data.budgets, data.settings, m, d, costCentreOf) ?? 0) > 0),
  );
  const departments: DepartmentForecast[] = deptNames
    .map((d) => {
      const projected = round2(covered.reduce((s, m) => s + deptValue(m, d), 0));
      const actualYtd = round2(covered.filter((m) => known.get(m)?.final).reduce((s, m) => s + deptValue(m, d), 0));
      const budgets = covered.map((m) => budgetFor(data.budgets, data.settings, m, d, costCentreOf));
      const budget = budgets.every((b) => b === null) ? null : round2(budgets.reduce<number>((s, b) => s + (b ?? 0), 0));
      const variance = budget === null ? null : round2(projected - budget);
      const variancePct = budget ? round2((variance! / budget) * 100) : null;
      const status: DepartmentForecast["status"] = budget === null ? "no_budget" : variancePct! > alertPct ? "over" : variancePct! < -alertPct ? "under" : "on_track";
      const ds = drivers
        .filter((x) => x.byDepartment[d])
        .map((x) => ({ label: x.label, amount: x.byDepartment[d] }))
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      return {
        department: d,
        costCentre: costCentreOf(d),
        actualYtd,
        projected,
        budget,
        variance,
        variancePct,
        status,
        drivers: ds,
        plannedPositions: c.hires.filter((h) => h.department === d).reduce((s, h) => s + h.count, 0),
        employees: sim.rows
          .filter((r) => r.department === d || r.baseDepartment === d)
          .map((r) => ({ employeeId: r.employeeId, name: r.name, current: r.base.employerCost, projected: r.sim.employerCost, changes: r.changes }))
          .sort((a, b) => b.projected - a.projected),
      };
    })
    .sort((a, b) => (b.variance ?? -Infinity) - (a.variance ?? -Infinity));

  // Rolling window: from the first month not yet closed.
  const open = [...buckets].filter((b) => !b.final).map((b) => b.month);
  const startAt = open[0] ?? first;
  const window: WindowMonth[] = [];
  for (let m = startAt; window.length < horizon; m = nextMonth(m)) {
    const k = known.get(m);
    const f = fc.get(m);
    if (!k && !f) break;
    window.push({ month: m, label: monthLong(m), short: `${monthShort(m)} ${m.slice(2, 4)}`, value: k ? k.total : f!.scenario, budget: budgetFor(data.budgets, data.settings, m), kind: k ? "in_progress" : "forecast" });
  }
  const twelve: WindowMonth[] = [];
  for (let m = startAt; twelve.length < 12; m = nextMonth(m)) {
    const k = known.get(m);
    const f = fc.get(m);
    if (!k && !f) break;
    twelve.push({ month: m, label: monthLong(m), short: monthShort(m), value: k ? k.total : f!.scenario, budget: budgetFor(data.budgets, data.settings, m), kind: k ? "in_progress" : "forecast" });
  }
  const budgeted = twelve.filter((w) => w.budget !== null);
  const spend = round2(twelve.reduce((s, w) => s + w.value, 0));
  const budget12 = budgeted.length ? round2(budgeted.reduce((s, w) => s + (w.budget ?? 0), 0)) : null;

  const totalBudget = year.filter((r) => covered.includes(r.month)).map((r) => r.budget);
  const tb = totalBudget.every((b) => b === null) ? null : round2(totalBudget.reduce<number>((s, b) => s + (b ?? 0), 0));
  const projected = round2(year.reduce((s, r) => s + (r.value ?? 0), 0));
  return {
    fiscalYear,
    baseRunId: base.id,
    baseLabel: base.period.label,
    year,
    coveredMonths: covered,
    departments,
    drivers,
    window,
    totals: {
      actualYtd: round2(year.filter((r) => r.kind === "actual").reduce((s, r) => s + (r.value ?? 0), 0)),
      projected,
      budget: tb,
      variance: tb === null ? null : round2(projected - tb),
      variancePct: tb ? round2(((projected - tb) / tb) * 100) : null,
    },
    // Over/under compares like with like: only the months that have a budget.
    next12: { spend, budget: budget12, budgetMonths: budgeted.length, over: budget12 === null ? null : round2(budgeted.reduce((s, w) => s + w.value, 0) - budget12) },
    hires: c.hires,
  };
}

/** Departments whose projected cost breaches the alert threshold — one alert key per version, department and month checked. */
export function budgetAlerts(f: BudgetForecast, versionId: string | null): { key: string; department: string; variance: number; variancePct: number }[] {
  return f.departments
    .filter((d) => d.status === "over" && d.variance !== null && d.variancePct !== null)
    .map((d) => ({ key: `${versionId ?? "settings"}:${f.fiscalYear}:${d.department}:${f.baseRunId}`, department: d.department, variance: d.variance!, variancePct: d.variancePct! }));
}

/** Freeze the forecast as it stands. */
export function snapshotOf(f: BudgetForecast, trigger: ForecastSnapshot["trigger"], actor: string, now = new Date()): ForecastSnapshot {
  return {
    id: `FS-${now.getTime().toString(36).toUpperCase()}`,
    takenAt: now.toISOString(),
    takenBy: actor,
    trigger,
    label: trigger === "month_closed" ? `After ${f.baseLabel} closed` : `Manual — ${now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`,
    fiscalYear: f.fiscalYear,
    months: f.year.filter((r) => r.value !== null && r.kind !== "none").map((r) => ({ month: r.month, value: r.value!, kind: r.kind as "actual" | "in_progress" | "forecast" })),
    departments: Object.fromEntries(f.departments.map((d) => [d.department, d.projected])),
    total: f.totals.projected,
  };
}

/** A budget version from the latest month's cost by department, with an uplift. */
export function budgetFromCurrent(f: BudgetForecast, fiscalYear: number, upliftPct: number, data: TenantPayrollData, bundle: LocaleBundle): BudgetLine[] {
  const base = data.runs.find((r) => r.id === f.baseRunId);
  if (!base) return [];
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const byDept: Record<string, number> = {};
  for (const e of base.employees) {
    if (!e.included || !e.computation) continue;
    const d = people.get(e.employeeId)?.departmentName ?? "Unassigned";
    byDept[d] = (byDept[d] ?? 0) + e.computation.gross + e.computation.employerCost;
  }
  return Object.entries(byDept)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({ key, months: Object.fromEntries(yearMonths(fiscalYear).map((m) => [m, round2(v * (1 + upliftPct / 100))])) }));
}

export { runMonth };

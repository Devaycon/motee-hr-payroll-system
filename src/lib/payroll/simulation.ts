import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";
import { elementMapOn, settingsOn } from "./config";
import { componentsOf, COMPONENT_ROWS, type ComponentKey } from "./comparison";
import { computeEmployeePay, round2, splitSalary } from "./ng/engine";
import { groupLifeOf, resolveRateSet } from "./ng/rate-sets";
import { engineEmployee, structureOn, type TenantPayrollData } from "./run-builder";
import { adjustLines, figuresOf } from "./salary-impact";
import type { NhfBasis, PayComputation, PayFigures, PayrollRun, PayrollSettings, PeriodInput, SalaryLine, StatutoryRateSet } from "./types";

/**
 * Payroll simulation: model a change against a real month before anything is
 * committed — salary adjustments, variable pay, workforce changes, attendance,
 * statutory changes and custom deductions. Every employee is calculated by
 * the same engine as a live run (annualised PAYE, so year-to-date catch-up
 * doesn't blur the comparison). Nothing here writes to payroll.
 *
 * Every change has an effective month, so the same scenario drives both the
 * "full effect" view and a month-by-month 12-month forecast — and a one-off
 * payment is counted once, never annualised.
 */

// ── Scenario ────────────────────────────────────────────────────────────────

/** Who a change applies to. Empty fields mean "everyone". */
export interface Scope {
  department: string;
  grade: string;
  employeeIds: string[];
}

export const EVERYONE: Scope = { department: "", grade: "", employeeIds: [] };

export type SalaryComponent = "fixed" | "basic" | "housing" | "transport" | "other_allowances";

export const SALARY_COMPONENT_LABELS: Record<SalaryComponent, string> = {
  fixed: "All fixed pay",
  basic: "Basic salary",
  housing: "Housing allowance",
  transport: "Transport allowance",
  other_allowances: "Other allowances",
};

export interface SalaryAdjustment {
  id: string;
  component: SalaryComponent;
  mode: "percent" | "fixed";
  /** % for percent; ₦ per month per employee for fixed. */
  value: number;
  scope: Scope;
  /** "YYYY-MM" the new pay starts. */
  fromMonth: string;
}

export type VariableKind = "bonus" | "commission" | "overtime" | "arrears" | "one_off";

export const VARIABLE_LABELS: Record<VariableKind, string> = {
  bonus: "Bonus",
  commission: "Commission",
  overtime: "Overtime",
  arrears: "Arrears",
  one_off: "One-off payment",
};

const VARIABLE_CODE: Record<VariableKind, string> = { bonus: "PERFORMANCE_BONUS", commission: "COMMISSION", overtime: "OT_NORMAL", arrears: "BACK_PAY", one_off: "ONE_OFF" };

export interface VariablePayment {
  id: string;
  kind: VariableKind;
  /** % of monthly basic, ₦ per employee, or overtime hours per employee. */
  basis: "percent_basic" | "fixed" | "hours";
  value: number;
  scope: Scope;
  /** Pay month ("YYYY-MM"); for recurring payments, the first month. */
  month: string;
  recurring: boolean;
}

export interface SimStarter {
  id: string;
  department: string;
  count: number;
  /** Monthly gross per starter, split by the default salary split. */
  monthlyGross: number;
  /** First month paid ("YYYY-MM"); blank = the first forecast month. */
  startMonth?: string;
}

export interface SimPromotion {
  id: string;
  employeeId: string;
  /** % increase to fixed recurring pay. */
  pct: number;
  fromMonth: string;
}

export interface SimTransfer {
  id: string;
  employeeId: string;
  department: string;
  fromMonth: string;
}

export interface CustomDeduction {
  id: string;
  kind: "loan" | "voluntary" | "other";
  /** ₦ per employee per month. */
  amount: number;
  scope: Scope;
  fromMonth: string;
}

export const DEDUCTION_LABELS: Record<CustomDeduction["kind"], string> = { loan: "Loan repayment", voluntary: "Voluntary contribution", other: "Other deduction" };
const DEDUCTION_CODE: Record<CustomDeduction["kind"], string> = { loan: "STAFF_LOAN", voluntary: "COOP_CONTRIB", other: "OTHER_DED" };

export interface Scenario {
  /** Quick salary increase, % of recurring fixed pay. */
  increasePct: number;
  /** Department the increase applies to ("" = everyone). */
  increaseDepartment: string;
  /** Month the quick increase starts (blank = first forecast month). */
  increaseFrom?: string;
  /** Quick one-off bonus as % of monthly basic. */
  bonusPct: number;
  bonusDepartment: string;
  /** Month the quick bonus is paid (blank = first forecast month). */
  bonusMonth?: string;
  starters: SimStarter[];
  /** Employees modelled as having left. */
  leavers: string[];
  /** employeeId → first month NOT paid ("YYYY-MM"); blank = first forecast month. */
  exitMonths?: Record<string, string>;
  /** Percentage-point change to every PAYE band rate. */
  payeBandDeltaPp: number;
  /** Employer pension rate, % (null = current). */
  employerPensionPct: number | null;
  /** Monthly minimum wage (null = current). */
  minimumWage: number | null;
  // ── Expanded inputs ──
  adjustments?: SalaryAdjustment[];
  variable?: VariablePayment[];
  promotions?: SimPromotion[];
  transfers?: SimTransfer[];
  /** Unpaid leave days per employee per month. */
  unpaidDays?: number;
  unpaidScope?: Scope;
  deductions?: CustomDeduction[];
  employeePensionPct?: number | null;
  nhfPct?: number | null;
  nhfBasis?: NhfBasis | null;
  nsitfPct?: number | null;
  itf?: boolean | null;
  groupLife?: boolean | null;
}

export const EMPTY_SCENARIO: Scenario = {
  increasePct: 0,
  increaseDepartment: "",
  bonusPct: 0,
  bonusDepartment: "",
  starters: [],
  leavers: [],
  payeBandDeltaPp: 0,
  employerPensionPct: null,
  minimumWage: null,
  adjustments: [],
  variable: [],
  promotions: [],
  transfers: [],
  unpaidDays: 0,
  unpaidScope: EVERYONE,
  deductions: [],
  employeePensionPct: null,
  nhfPct: null,
  nhfBasis: null,
  nsitfPct: null,
  itf: null,
  groupLife: null,
};

/** Fill fields a scenario saved by an older version doesn't have. */
export const normalizeScenario = (s: Partial<Scenario>): Scenario => ({ ...EMPTY_SCENARIO, ...s });

export const isEmptyScenario = (s: Scenario) => JSON.stringify(normalizeScenario(s)) === JSON.stringify(EMPTY_SCENARIO);

// ── Figures ─────────────────────────────────────────────────────────────────

export const EMPLOYER_KEYS = ["PENSION_ER", "NSITF", "ITF", "NHIS_ER", "GROUP_LIFE"] as const;
export type EmployerKey = (typeof EMPLOYER_KEYS)[number];
export const EMPLOYER_KEY_LABELS: Record<EmployerKey, string> = { PENSION_ER: "Employer pension", NSITF: "NSITF", ITF: "ITF", NHIS_ER: "Health insurance (employer)", GROUP_LIFE: "Group life assurance" };

/**
 * One employee-month, broken down the way finance reads it: earnings by
 * component, employee deductions (which reduce net pay and are NOT an
 * employer cost), and employer contributions (which are).
 */
export type SimFigures = PayFigures & Record<ComponentKey, number> & Record<EmployerKey, number>;

const SIM_KEYS = [...new Set([...(["gross", "paye", "pension", "nhf", "net", "employerCost"] as const), ...COMPONENT_ROWS.map((r) => r.key), ...EMPLOYER_KEYS])] as (keyof SimFigures)[];

export const ZERO_SIM = Object.fromEntries(SIM_KEYS.map((k) => [k, 0])) as unknown as SimFigures;
export const addSim = (a: SimFigures, b: SimFigures) => Object.fromEntries(SIM_KEYS.map((k) => [k, round2(a[k] + b[k])])) as unknown as SimFigures;
const scaleSim = (a: SimFigures, n: number) => Object.fromEntries(SIM_KEYS.map((k) => [k, round2(a[k] * n)])) as unknown as SimFigures;
const subSim = (a: SimFigures, b: SimFigures) => Object.fromEntries(SIM_KEYS.map((k) => [k, round2(a[k] - b[k])])) as unknown as SimFigures;

function simFiguresOf(c: PayComputation, groupOf: Map<string, string>, recurringOf: (code: string) => boolean): SimFigures {
  const comp = componentsOf(c, groupOf, recurringOf);
  const er = Object.fromEntries(EMPLOYER_KEYS.map((k) => [k, round2(c.lines.filter((l) => l.code === k).reduce((s, l) => s + l.amount, 0))])) as Record<EmployerKey, number>;
  return { ...comp, ...er, ...figuresOf(c) };
}

// ── Results ─────────────────────────────────────────────────────────────────

export interface SimRow {
  employeeId: string;
  name: string;
  /** Department in the scenario (after any transfer). */
  department: string;
  baseDepartment: string;
  grade: string;
  status: "existing" | "starter" | "leaver";
  base: SimFigures;
  sim: SimFigures;
  /** What changed for this person, in words. */
  changes: string[];
}

export interface ForecastMonth {
  month: string;
  label: string;
  short: string;
  base: number;
  scenario: number;
  delta: number;
  headcount: number;
  oneOff: number;
  /** Scenario cost to employer by department (after transfers). */
  byDepartment: Record<string, number>;
}

export interface CostMeasures {
  /** Change to the monthly cost once every recurring change is in force. */
  monthlyRecurringChange: number;
  /** Cost of one-off payments (bonus, arrears…), counted once. */
  oneOffImpact: number;
  /** The recurring change over a full year. */
  annualisedRecurring: number;
  /** What the next 12 months cost under the scenario, month by month. */
  total12Scenario: number;
  total12Base: number;
  total12Change: number;
}

export interface SimResult {
  base: SimFigures;
  sim: SimFigures;
  delta: SimFigures;
  baseHeadcount: number;
  simHeadcount: number;
  rows: SimRow[];
  /** Legacy: recurring change × 12 plus one-offs once. */
  annualCostDelta: number;
  byDepartment: { department: string; base: number; sim: number; delta: number }[];
  measures: CostMeasures;
  forecast: ForecastMonth[];
  /** The months a scenario can schedule changes in (the forecast window). */
  months: { key: string; label: string }[];
}

// ── Engine ──────────────────────────────────────────────────────────────────

const FIXED_GROUPS = new Set(["core", "allowances"]);

export function scenarioRateSet(rs: StatutoryRateSet, s: Scenario): StatutoryRateSet {
  return {
    ...rs,
    payeBands: rs.payeBands.map((b) => ({ ...b, rate: b.rate === 0 ? 0 : Math.max(0, b.rate + s.payeBandDeltaPp / 100) })),
    employerPensionRate: s.employerPensionPct != null ? s.employerPensionPct / 100 : rs.employerPensionRate,
    employeePensionRate: s.employeePensionPct != null ? s.employeePensionPct / 100 : rs.employeePensionRate,
    nhfRate: s.nhfPct != null ? s.nhfPct / 100 : rs.nhfRate,
    nsitfRate: s.nsitfPct != null ? s.nsitfPct / 100 : rs.nsitfRate,
    minimumWageMonthly: s.minimumWage != null ? s.minimumWage : rs.minimumWageMonthly,
  };
}

function scenarioSettings(settings: PayrollSettings, s: Scenario): PayrollSettings {
  return {
    ...settings,
    nhfBasis: s.nhfBasis ?? settings.nhfBasis,
    itfApplicable: s.itf ?? settings.itfApplicable,
    groupLife: s.groupLife == null ? settings.groupLife : { ...groupLifeOf(settings), enabled: s.groupLife },
  };
}

const monthKey = (r: Pick<PayrollRun, "period">) => `${r.period.year}-${String(r.period.month).padStart(2, "0")}`;
const addMonths = (key: string, n: number) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (key: string, style: "long" | "short" = "long") => {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", { month: style, year: style === "long" ? "numeric" : "2-digit", timeZone: "UTC" });
};

/** The 12 months after the base month — the window a scenario is scheduled in. */
export function forecastMonths(baseRun: Pick<PayrollRun, "period">): { key: string; label: string }[] {
  const start = monthKey(baseRun);
  return Array.from({ length: 12 }, (_, i) => {
    const key = addMonths(start, i + 1);
    return { key, label: monthLabel(key) };
  });
}

/** "all" = every change in force, one-offs included (the full-effect view). */
type When = string | "all";
const on = (from: string | undefined, first: string, when: When) => when === "all" || (from || first) <= when;
const at = (month: string | undefined, first: string, when: When) => when === "all" || (month || first) === when;

export function simulate(data: TenantPayrollData, bundle: LocaleBundle, baseRun: PayrollRun, scenarioIn: Scenario, opts: { forecast?: boolean } = {}): SimResult {
  const scenario = normalizeScenario(scenarioIn);
  const date = baseRun.period.end;
  const elements = elementMapOn(data.elements, date);
  const groupOf = new Map([...elements.values()].map((e) => [e.code, e.group as string]));
  const recurringOf = (code: string) => elements.get(code)?.recurring !== false;
  const baseSettings = { ...settingsOn(data.settings, data.settingsVersions, date), taxMethod: "annualised" as const };
  const simSettings = scenarioSettings(baseSettings, scenario);
  const baseRates = resolveRateSet(data.rateSets, date);
  const simRates = scenarioRateSet(baseRates, scenario);
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const profiles = new Map(data.profiles.map((p) => [p.employeeId, p]));
  const months = forecastMonths(baseRun);
  const first = months[0].key;

  const calc = (emp: LocaleEmployee, lines: SalaryLine[], rates: StatutoryRateSet, settings: PayrollSettings, inputs: PeriodInput[] = []) =>
    simFiguresOf(
      computeEmployeePay({
        period: baseRun.period,
        runType: "regular",
        employee: { ...engineEmployee(emp), startDate: "1900-01-01", dateOfLeaving: null },
        structure: { id: "sim", employeeId: emp.id, effectiveFrom: baseRun.period.start, effectiveTo: null, currency: "NGN", lines, reason: "", approvedBy: "", approvedAt: "" },
        elements,
        inputs,
        profile: profiles.get(emp.id) ?? null,
        rateSet: rates,
        settings,
        ytd: null,
      }),
      groupOf,
      recurringOf,
    );

  const isFixed = (code: string) => {
    const el = elements.get(code);
    return !!el && el.calculationType === "fixed" && FIXED_GROUPS.has(el.group);
  };
  const componentOf = (c: SalaryComponent) => (code: string) => {
    if (!isFixed(code)) return false;
    if (c === "fixed") return true;
    if (c === "basic") return code === "BASIC" || code === "CONSOLIDATED";
    if (c === "housing") return code === "HOUSING";
    if (c === "transport") return code === "TRANSPORT";
    return elements.get(code)?.group === "allowances" && code !== "HOUSING" && code !== "TRANSPORT";
  };
  const inScope = (emp: LocaleEmployee, dept: string, s: Scope | undefined) =>
    !s || ((!s.department || s.department === dept) && (!s.grade || (emp.grade ?? "") === s.grade) && (!s.employeeIds?.length || s.employeeIds.includes(emp.id)));
  const basicOf = (lines: SalaryLine[]) => lines.find((l) => l.code === "BASIC" || l.code === "CONSOLIDATED")?.amount ?? 0;
  const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

  // Base: each employee in the run, once.
  const existing = baseRun.employees
    .filter((e) => e.included && e.computation)
    .map((re) => {
      const emp = people.get(re.employeeId);
      const structure = structureOn(data.structures, re.employeeId, date);
      return emp && structure ? { emp, structure, base: calc(emp, structure.lines, baseRates, baseSettings) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const baseTotal = existing.reduce((t, x) => addSim(t, x.base), ZERO_SIM);

  /** The scenario's rows for one month (or "all"); `oneOffs: false` strips one-off payments. */
  function state(when: When, oneOffs = true): SimRow[] {
    const rows: SimRow[] = [];
    for (const { emp, structure, base } of existing) {
      const leaveFrom = scenario.leavers.includes(emp.id) ? scenario.exitMonths?.[emp.id] || first : null;
      if (leaveFrom && (when === "all" || when >= leaveFrom)) {
        rows.push({ employeeId: emp.id, name: emp.fullName, department: emp.departmentName, baseDepartment: emp.departmentName, grade: emp.grade ?? "", status: "leaver", base, sim: ZERO_SIM, changes: [`Leaves — not paid from ${monthLabel(leaveFrom)}`] });
        continue;
      }
      const changes: string[] = [];
      const transfer = (scenario.transfers ?? []).filter((t) => t.employeeId === emp.id && on(t.fromMonth, first, when)).pop();
      const dept = transfer?.department || emp.departmentName;
      if (transfer) changes.push(`Transfers to ${transfer.department}`);
      let lines = structure.lines;
      for (const p of (scenario.promotions ?? []).filter((x) => x.employeeId === emp.id && on(x.fromMonth, first, when))) {
        lines = adjustLines(lines, "percent", p.pct, isFixed);
        changes.push(`Promotion +${p.pct}% from ${monthLabel(p.fromMonth || first)}`);
      }
      if (scenario.increasePct && (!scenario.increaseDepartment || scenario.increaseDepartment === dept) && on(scenario.increaseFrom, first, when)) {
        lines = adjustLines(lines, "percent", scenario.increasePct, isFixed);
        changes.push(`Salary increase ${scenario.increasePct}%`);
      }
      for (const a of (scenario.adjustments ?? []).filter((x) => x.value && inScope(emp, dept, x.scope) && on(x.fromMonth, first, when))) {
        lines = adjustLines(lines, a.mode, a.value, componentOf(a.component));
        changes.push(`${SALARY_COMPONENT_LABELS[a.component]} ${a.mode === "percent" ? `${a.value > 0 ? "+" : ""}${a.value}%` : `${a.value > 0 ? "+" : "−"}${naira(Math.abs(a.value))}`}`);
      }
      const inputs: PeriodInput[] = [];
      const basic = basicOf(lines);
      if (oneOffs && scenario.bonusPct && (!scenario.bonusDepartment || scenario.bonusDepartment === dept) && at(scenario.bonusMonth, first, when)) {
        inputs.push({ id: "sim-bonus", employeeId: emp.id, code: "PERFORMANCE_BONUS", amount: round2((basic * scenario.bonusPct) / 100), source: "manual" });
        changes.push(`Bonus ${scenario.bonusPct}% of basic`);
      }
      for (const v of (scenario.variable ?? []).filter((x) => x.value && inScope(emp, dept, x.scope))) {
        const active = v.recurring ? on(v.month, first, when) : oneOffs && at(v.month, first, when);
        if (!active) continue;
        const code = VARIABLE_CODE[v.kind];
        if (v.basis === "hours" || v.kind === "overtime") inputs.push({ id: `sim-${v.id}`, employeeId: emp.id, code, units: v.value, source: "attendance" });
        else inputs.push({ id: `sim-${v.id}`, employeeId: emp.id, code, amount: round2(v.basis === "percent_basic" ? (basic * v.value) / 100 : v.value), source: "manual" });
        changes.push(`${VARIABLE_LABELS[v.kind]}${v.recurring ? " (monthly)" : ""}`);
      }
      if (scenario.unpaidDays && inScope(emp, dept, scenario.unpaidScope)) {
        inputs.push({ id: "sim-unpaid", employeeId: emp.id, code: "UNPAID_LEAVE", units: scenario.unpaidDays, source: "attendance" });
        changes.push(`${scenario.unpaidDays} unpaid day${scenario.unpaidDays === 1 ? "" : "s"}`);
      }
      for (const d of (scenario.deductions ?? []).filter((x) => x.amount && inScope(emp, dept, x.scope) && on(x.fromMonth, first, when))) {
        inputs.push({ id: `sim-${d.id}`, employeeId: emp.id, code: DEDUCTION_CODE[d.kind], amount: d.amount, source: "manual" });
        changes.push(DEDUCTION_LABELS[d.kind]);
      }
      rows.push({ employeeId: emp.id, name: emp.fullName, department: dept, baseDepartment: emp.departmentName, grade: emp.grade ?? "", status: "existing", base, sim: calc(emp, lines, simRates, simSettings, inputs), changes });
    }
    // New starters: a typical employee of the department on the default split.
    const template = bundle.employees.find((e) => e.status !== "terminated") ?? bundle.employees[0];
    for (const st of scenario.starters) {
      if (!template || st.count <= 0 || st.monthlyGross <= 0 || !on(st.startMonth, first, when)) continue;
      const emp: LocaleEmployee = { ...template, id: `SIM-${st.id}`, fullName: `New starter (${st.department || "any department"})`, departmentName: st.department, grade: "" };
      const one = calc(emp, splitSalary(st.monthlyGross * 12, simSettings.defaultSplit), simRates, simSettings);
      rows.push({ employeeId: emp.id, name: `${st.count} × new starter${st.count === 1 ? "" : "s"}`, department: st.department || "—", baseDepartment: st.department || "—", grade: "", status: "starter", base: ZERO_SIM, sim: scaleSim(one, st.count), changes: [`Starts ${monthLabel(st.startMonth || first)}`] });
    }
    return rows;
  }

  const total = (rows: SimRow[]) => rows.reduce((t, r) => addSim(t, r.sim), ZERO_SIM);
  const heads = (rows: SimRow[]) => rows.filter((r) => r.status === "existing").length + rows.filter((r) => r.status === "starter").reduce((s, r) => s + (scenario.starters.find((x) => `SIM-${x.id}` === r.employeeId)?.count ?? 0), 0);

  const rows = state("all");
  const sim = total(rows);
  const delta = subSim(sim, baseTotal);
  const recurringOnly = total(state("all", false));
  const monthlyRecurringChange = round2(recurringOnly.employerCost - baseTotal.employerCost);
  const oneOffImpact = round2(sim.employerCost - recurringOnly.employerCost);

  // Month by month: states repeat, so cache them by what's in force.
  let forecast: ForecastMonth[] = [];
  if (opts.forecast !== false) {
    const cache = new Map<string, { cost: number; heads: number; oneOff: number; byDepartment: Record<string, number> }>();
    forecast = months.map(({ key }) => {
      const sig = JSON.stringify(stateSignature(scenario, key, first));
      let v = cache.get(sig);
      if (!v) {
        const withOne = state(key);
        const cost = total(withOne).employerCost;
        const noOne = total(state(key, false)).employerCost;
        const byDepartment: Record<string, number> = {};
        for (const r of withOne) byDepartment[r.department] = round2((byDepartment[r.department] ?? 0) + r.sim.employerCost);
        v = { cost, heads: heads(withOne), oneOff: round2(cost - noOne), byDepartment };
        cache.set(sig, v);
      }
      return { month: key, label: monthLabel(key), short: monthLabel(key, "short"), base: baseTotal.employerCost, scenario: round2(v.cost), delta: round2(v.cost - baseTotal.employerCost), headcount: v.heads, oneOff: v.oneOff, byDepartment: v.byDepartment };
    });
  }
  const total12Base = round2(baseTotal.employerCost * 12);
  const total12Scenario = round2(forecast.reduce((s, m) => s + m.scenario, 0));

  const dept = new Map<string, { base: number; sim: number }>();
  for (const r of rows) {
    const b = dept.get(r.baseDepartment) ?? { base: 0, sim: 0 };
    b.base += r.base.employerCost;
    dept.set(r.baseDepartment, b);
    const s = dept.get(r.department) ?? { base: 0, sim: 0 };
    s.sim += r.sim.employerCost;
    dept.set(r.department, s);
  }

  return {
    base: baseTotal,
    sim,
    delta,
    baseHeadcount: existing.length,
    simHeadcount: heads(rows),
    rows,
    annualCostDelta: round2(monthlyRecurringChange * 12 + oneOffImpact),
    byDepartment: [...dept.entries()].map(([department, v]) => ({ department, base: round2(v.base), sim: round2(v.sim), delta: round2(v.sim - v.base) })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    measures: {
      monthlyRecurringChange,
      oneOffImpact,
      annualisedRecurring: round2(monthlyRecurringChange * 12),
      total12Scenario: forecast.length ? total12Scenario : round2(total12Base + monthlyRecurringChange * 12 + oneOffImpact),
      total12Base,
      total12Change: forecast.length ? round2(total12Scenario - total12Base) : round2(monthlyRecurringChange * 12 + oneOffImpact),
    },
    forecast,
    months,
  };
}

/** Which scheduled items are in force in `month` — months with the same signature cost the same. */
function stateSignature(s: Scenario, month: string, first: string) {
  const f = (x?: string) => (x || first) <= month;
  const eq = (x?: string) => (x || first) === month;
  return [
    s.increasePct ? f(s.increaseFrom) : 0,
    s.bonusPct ? eq(s.bonusMonth) : 0,
    s.leavers.map((id) => f(s.exitMonths?.[id])),
    s.starters.map((x) => f(x.startMonth)),
    (s.adjustments ?? []).map((x) => f(x.fromMonth)),
    (s.variable ?? []).map((x) => (x.recurring ? f(x.month) : eq(x.month))),
    (s.promotions ?? []).map((x) => f(x.fromMonth)),
    (s.transfers ?? []).map((x) => f(x.fromMonth)),
    (s.deductions ?? []).map((x) => f(x.fromMonth)),
  ];
}

/** The base run a scenario starts from: the latest calculated regular run. */
export function latestBaseRun(runs: PayrollRun[]): PayrollRun | undefined {
  return runs
    .filter((r) => r.type === "regular" && r.employees.some((e) => e.computation))
    .sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month))[0];
}

// ── Saved scenarios ─────────────────────────────────────────────────────────

export type ScenarioStatus = "draft" | "submitted" | "approved" | "rejected";

export interface SavedScenario {
  id: string;
  name: string;
  description: string;
  scenario: Scenario;
  baseRunId: string;
  createdBy: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  status: ScenarioStatus;
  submittedBy?: string;
  submittedById?: string;
  submittedAt?: string;
  review?: { by: string; byId?: string; at: string; note?: string };
  /** Headline figures when last saved, for lists and the budget page. */
  snapshot?: { monthlyCost: number; monthlyChange: number; total12Change: number; headcount: number };
  history: { at: string; actor: string; action: string; note?: string }[];
}

export const SCENARIO_STATUS_LABELS: Record<ScenarioStatus, string> = { draft: "Draft", submitted: "Awaiting review", approved: "Approved for planning", rejected: "Rejected" };

import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";
import { elementMapOn, settingsOn } from "./config";
import { computeEmployeePay, round2, splitSalary } from "./ng/engine";
import { resolveRateSet } from "./ng/rate-sets";
import { engineEmployee, structureOn, type TenantPayrollData } from "./run-builder";
import { addFigures, figuresOf, ZERO_FIGURES } from "./salary-impact";
import type { PayFigures, PayrollRun, PeriodInput, SalaryLine, StatutoryRateSet } from "./types";

/**
 * Payroll simulation: model a change against a real month before anything is
 * committed — salary increases, a bonus, new starters, leavers and statutory
 * changes. Every employee is calculated by the same engine as a live run
 * (annualised PAYE, so year-to-date catch-up doesn't blur the comparison).
 * Nothing here writes to payroll.
 */

export interface SimStarter {
  id: string;
  department: string;
  count: number;
  /** Monthly gross per starter, split by the default salary split. */
  monthlyGross: number;
}

export interface Scenario {
  /** Salary increase, % of recurring fixed pay. */
  increasePct: number;
  /** Department the increase applies to ("" = everyone). */
  increaseDepartment: string;
  /** One-off bonus as % of monthly basic. */
  bonusPct: number;
  bonusDepartment: string;
  starters: SimStarter[];
  /** Employees modelled as having left. */
  leavers: string[];
  /** Percentage-point change to every PAYE band rate. */
  payeBandDeltaPp: number;
  /** Employer pension rate, % (blank = current). */
  employerPensionPct: number | null;
  /** Monthly minimum wage (blank = current). */
  minimumWage: number | null;
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
};

export interface SimRow {
  employeeId: string;
  name: string;
  department: string;
  status: "existing" | "starter" | "leaver";
  base: PayFigures;
  sim: PayFigures;
}

export interface SimResult {
  base: PayFigures;
  sim: PayFigures;
  delta: PayFigures;
  baseHeadcount: number;
  simHeadcount: number;
  rows: SimRow[];
  /** Twelve months of the recurring change (the bonus counted once). */
  annualCostDelta: number;
  byDepartment: { department: string; base: number; sim: number; delta: number }[];
}

const FIXED_GROUPS = new Set(["core", "allowances"]);

export function scenarioRateSet(rs: StatutoryRateSet, s: Scenario): StatutoryRateSet {
  return {
    ...rs,
    payeBands: rs.payeBands.map((b) => ({ ...b, rate: b.rate === 0 ? 0 : Math.max(0, b.rate + s.payeBandDeltaPp / 100) })),
    employerPensionRate: s.employerPensionPct !== null ? s.employerPensionPct / 100 : rs.employerPensionRate,
    minimumWageMonthly: s.minimumWage !== null ? s.minimumWage : rs.minimumWageMonthly,
  };
}

export function simulate(data: TenantPayrollData, bundle: LocaleBundle, baseRun: PayrollRun, scenario: Scenario): SimResult {
  const date = baseRun.period.end;
  const elements = elementMapOn(data.elements, date);
  const settings = { ...settingsOn(data.settings, data.settingsVersions, date), taxMethod: "annualised" as const };
  const baseRates = resolveRateSet(data.rateSets, date);
  const simRates = scenarioRateSet(baseRates, scenario);
  const people = new Map(bundle.employees.map((e) => [e.id, e]));
  const profiles = new Map(data.profiles.map((p) => [p.employeeId, p]));
  const leavers = new Set(scenario.leavers);

  const calc = (emp: LocaleEmployee, lines: SalaryLine[], rates: StatutoryRateSet, inputs: PeriodInput[] = []) =>
    figuresOf(
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
    );

  const rows: SimRow[] = [];
  for (const re of baseRun.employees.filter((e) => e.included && e.computation)) {
    const emp = people.get(re.employeeId);
    const structure = structureOn(data.structures, re.employeeId, date);
    if (!emp || !structure) continue;
    const base = calc(emp, structure.lines, baseRates);
    if (leavers.has(emp.id)) {
      rows.push({ employeeId: emp.id, name: emp.fullName, department: emp.departmentName, status: "leaver", base, sim: ZERO_FIGURES });
      continue;
    }
    const raise = scenario.increasePct && (!scenario.increaseDepartment || scenario.increaseDepartment === emp.departmentName);
    const lines = raise
      ? structure.lines.map((l) => {
          const el = elements.get(l.code);
          return el && el.calculationType === "fixed" && FIXED_GROUPS.has(el.group) ? { ...l, amount: round2(l.amount * (1 + scenario.increasePct / 100)) } : l;
        })
      : structure.lines;
    const bonusOn = scenario.bonusPct && (!scenario.bonusDepartment || scenario.bonusDepartment === emp.departmentName);
    const basic = lines.find((l) => l.code === "BASIC" || l.code === "CONSOLIDATED")?.amount ?? 0;
    const inputs: PeriodInput[] = bonusOn ? [{ id: "sim-bonus", employeeId: emp.id, code: "PERFORMANCE_BONUS", amount: round2((basic * scenario.bonusPct) / 100), source: "manual" }] : [];
    rows.push({ employeeId: emp.id, name: emp.fullName, department: emp.departmentName, status: "existing", base, sim: calc(emp, lines, simRates, inputs) });
  }

  // New starters: a typical employee of the department on the default split.
  const template = bundle.employees.find((e) => e.status !== "terminated") ?? bundle.employees[0];
  for (const st of scenario.starters) {
    if (!template || st.count <= 0 || st.monthlyGross <= 0) continue;
    const emp: LocaleEmployee = { ...template, id: `SIM-${st.id}`, fullName: `New starter (${st.department || "any department"})`, departmentName: st.department };
    const lines = splitSalary(st.monthlyGross * 12, settings.defaultSplit);
    const one = calc(emp, lines, simRates);
    const many = Object.fromEntries(Object.entries(one).map(([k, v]) => [k, round2(v * st.count)])) as unknown as PayFigures;
    rows.push({ employeeId: emp.id, name: `${st.count} × new starter${st.count === 1 ? "" : "s"}`, department: st.department || "—", status: "starter", base: ZERO_FIGURES, sim: many });
  }

  const base = rows.reduce((t, r) => addFigures(t, r.base), ZERO_FIGURES);
  const sim = rows.reduce((t, r) => addFigures(t, r.sim), ZERO_FIGURES);
  const delta = Object.fromEntries(Object.keys(base).map((k) => [k, round2(sim[k as keyof PayFigures] - base[k as keyof PayFigures])])) as unknown as PayFigures;

  // The bonus is paid once; everything else repeats every month.
  const bonusCost = rows.reduce((t, r) => {
    const emp = people.get(r.employeeId);
    if (!emp || r.status !== "existing" || !scenario.bonusPct || (scenario.bonusDepartment && scenario.bonusDepartment !== emp.departmentName)) return t;
    const basic = structureOn(data.structures, emp.id, date)?.lines.find((l) => l.code === "BASIC" || l.code === "CONSOLIDATED")?.amount ?? 0;
    const raised = scenario.increasePct && (!scenario.increaseDepartment || scenario.increaseDepartment === emp.departmentName) ? basic * (1 + scenario.increasePct / 100) : basic;
    return t + (raised * scenario.bonusPct) / 100;
  }, 0);
  const annualCostDelta = round2((delta.employerCost - bonusCost) * 12 + bonusCost);

  const dept = new Map<string, { base: number; sim: number }>();
  for (const r of rows) {
    const d = dept.get(r.department) ?? { base: 0, sim: 0 };
    d.base += r.base.employerCost;
    d.sim += r.sim.employerCost;
    dept.set(r.department, d);
  }
  return {
    base,
    sim,
    delta,
    baseHeadcount: rows.filter((r) => r.status !== "starter").length,
    simHeadcount: rows.filter((r) => r.status === "existing").length + scenario.starters.reduce((s, x) => s + (x.monthlyGross > 0 ? x.count : 0), 0),
    rows,
    annualCostDelta,
    byDepartment: [...dept.entries()].map(([department, v]) => ({ department, base: round2(v.base), sim: round2(v.sim), delta: round2(v.sim - v.base) })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
  };
}

import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";
import { elementMapOn, settingsOn } from "./config";
import { computeEmployeePay, makePeriod, round2, splitSalary } from "./ng/engine";
import { resolveRateSet } from "./ng/rate-sets";
import { engineEmployee, seedProfile, structureOn, type TenantPayrollData } from "./run-builder";
import type { EmployeeTaxProfile, HmoEnrolment, PayComputation, PayslipLine, PeriodInput, SalaryLine, VoluntaryPension } from "./types";

/**
 * Payslip simulation calculator: one employee's ordinary month, current pay
 * against a proposed change — salary, voluntary pension, HMO, other
 * deductions — on the live payroll engine. Nothing is saved: a change only
 * reaches payroll through an approved salary change.
 */

export interface CalcDeduction {
  id: string;
  code: string;
  label: string;
  amount: number;
}

export interface CalcInput {
  /** Existing employee; absent = a new person (gross only, like the website calculator). */
  employeeId?: string;
  /** Proposed salary lines (monthly). */
  lines: SalaryLine[];
  /** "YYYY-MM-DD" — the month the change takes effect (rules in force then). */
  date: string;
  /** Overrides for the proposed side; `undefined` = as today. */
  avc?: VoluntaryPension | null;
  hmo?: HmoEnrolment | null;
  /** Recurring deductions on both sides (union dues, loans…). */
  deductions: CalcDeduction[];
  /** Different deductions on the proposed side, if changed. */
  proposedDeductions?: CalcDeduction[];
}

export interface CalcSide {
  computation: PayComputation;
  earnings: PayslipLine[];
  deductions: PayslipLine[];
  employer: PayslipLine[];
  gross: number;
  paye: number;
  totalDeductions: number;
  net: number;
  employerCost: number;
  costToEmployer: number;
  effectiveRatePct: number;
}

export interface CalcResult {
  current: CalcSide | null;
  proposed: CalcSide;
  /** Every line code seen on either side, in payslip order, for the comparison table. */
  rows: { section: "earning" | "deduction" | "employer"; code: string; name: string; current: number; proposed: number }[];
}

const side = (c: PayComputation): CalcSide => {
  const earnings = c.lines.filter((l) => l.category === "earning");
  const deductions = c.lines.filter((l) => l.category === "deduction");
  const employer = c.lines.filter((l) => l.category === "employer");
  const paye = round2(c.lines.filter((l) => l.code === "PAYE" || l.code === "WHT").reduce((s, l) => s + l.amount, 0));
  return {
    computation: c,
    earnings,
    deductions,
    employer,
    gross: c.gross,
    paye,
    totalDeductions: c.totalDeductions,
    net: c.net,
    employerCost: c.employerCost,
    costToEmployer: round2(c.gross + c.employerCost),
    effectiveRatePct: c.gross ? round2((paye / c.gross) * 100) : 0,
  };
};

/** The employee the calculator models (a stand-in for a new person). */
export function calcEmployee(bundle: LocaleBundle, employeeId?: string): LocaleEmployee | null {
  if (employeeId) return bundle.employees.find((e) => e.id === employeeId) ?? null;
  const t = bundle.employees.find((e) => e.status !== "terminated") ?? bundle.employees[0];
  return t ? { ...t, id: "CALC-NEW", fullName: "New employee", employeeNumber: "—" } : null;
}

/** Recurring deductions on the employee's latest run (union dues, cooperative, loan instalments). */
export function recurringDeductions(data: TenantPayrollData, employeeId?: string): CalcDeduction[] {
  if (!employeeId) return [];
  const run = [...data.runs].filter((r) => r.type === "regular" && r.employees.some((e) => e.employeeId === employeeId && e.computation)).sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month))[0];
  const c = run?.employees.find((e) => e.employeeId === employeeId)?.computation;
  return (c?.lines ?? [])
    .filter((l) => l.category === "deduction" && !l.statutory && !["VOL_PENSION", "HMO_EE", "UNPAID_LEAVE", "LATENESS"].includes(l.code))
    .map((l, i) => ({ id: `D${i}`, code: l.code, label: l.name, amount: l.amount }));
}

/** Default monthly lines for a gross figure (the company's salary split). */
export function linesForGross(data: TenantPayrollData, monthlyGross: number): SalaryLine[] {
  return splitSalary(monthlyGross * 12, data.settings.defaultSplit);
}

export function calculate(data: TenantPayrollData, bundle: LocaleBundle, input: CalcInput): CalcResult | null {
  const emp = calcEmployee(bundle, input.employeeId);
  if (!emp) return null;
  const [y, m] = input.date.split("-").map(Number);
  const settings = { ...settingsOn(data.settings, data.settingsVersions, input.date), taxMethod: "annualised" as const };
  const period = makePeriod(y, m, settings.payDay);
  const elements = elementMapOn(data.elements, period.end);
  const rateSet = resolveRateSet(data.rateSets, period.end);
  const baseProfile: EmployeeTaxProfile = data.profiles.find((p) => p.employeeId === emp.id) ?? { ...seedProfile(emp), employeeId: emp.id, avc: null, hmo: null };
  const run = (lines: SalaryLine[], profile: EmployeeTaxProfile, deds: CalcDeduction[]) =>
    computeEmployeePay({
      period,
      runType: "regular",
      employee: { ...engineEmployee(emp), startDate: "1900-01-01", dateOfLeaving: null },
      structure: { id: "calc", employeeId: emp.id, effectiveFrom: period.start, effectiveTo: null, currency: "NGN", lines, reason: "", approvedBy: "", approvedAt: "" },
      elements,
      inputs: deds.filter((d) => d.amount > 0).map<PeriodInput>((d) => ({ id: `calc-${d.id}`, employeeId: emp.id, code: d.code, amount: d.amount, description: d.label, source: "manual" })),
      profile,
      rateSet,
      settings,
      ytd: null,
    });

  const currentStructure = input.employeeId ? structureOn(data.structures, emp.id, input.date) ?? structureOn(data.structures, emp.id, new Date().toISOString().slice(0, 10)) : null;
  const current = currentStructure ? side(run(currentStructure.lines, baseProfile, input.deductions)) : null;
  const proposedProfile: EmployeeTaxProfile = {
    ...baseProfile,
    ...(input.avc !== undefined ? { avc: input.avc } : {}),
    ...(input.hmo !== undefined ? { hmo: input.hmo } : {}),
  };
  const proposed = side(run(input.lines, proposedProfile, input.proposedDeductions ?? input.deductions));

  // One row per line code, keeping payslip order.
  const rows: CalcResult["rows"] = [];
  for (const section of ["earning", "deduction", "employer"] as const) {
    const seen = new Map<string, { name: string; current: number; proposed: number }>();
    const add = (ls: PayslipLine[] | undefined, k: "current" | "proposed") => {
      for (const l of ls ?? []) {
        if (l.category !== section) continue;
        const r = seen.get(l.code) ?? { name: l.name, current: 0, proposed: 0 };
        r[k] = round2(r[k] + l.amount);
        seen.set(l.code, r);
      }
    };
    add(current?.computation.lines, "current");
    add(proposed.computation.lines, "proposed");
    for (const [code, r] of seen) rows.push({ section, code, ...r });
  }
  return { current, proposed, rows };
}

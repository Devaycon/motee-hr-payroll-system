import type { LocaleEmployee } from "@/src/lib/types/locale";
import { elementMapOn, settingsOn } from "./config";
import { computeEmployeePay, makePeriod, round2 } from "./ng/engine";
import { resolveRateSet } from "./ng/rate-sets";
import { engineEmployee, structureOn, type TenantPayrollData } from "./run-builder";
import type { PayComputation, PayFigures, SalaryImpact, SalaryLine, SalaryStructure } from "./types";

/**
 * Financial impact of a salary change: a full, ordinary month on the old pay
 * against the same month on the new pay — gross, PAYE, pension, NHF, net and
 * what it costs the employer. Annualised PAYE (no year-to-date effects), so
 * the comparison shows the change itself, not catch-up tax.
 */

const amt = (c: PayComputation, code: string) => c.lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0);

export function figuresOf(c: PayComputation): PayFigures {
  return {
    gross: c.gross,
    paye: round2(amt(c, "PAYE") + amt(c, "WHT")),
    pension: round2(amt(c, "PENSION_EE")),
    nhf: round2(amt(c, "NHF")),
    net: c.net,
    employerCost: round2(c.gross + c.employerCost),
  };
}

export const ZERO_FIGURES: PayFigures = { gross: 0, paye: 0, pension: 0, nhf: 0, net: 0, employerCost: 0 };

/** One ordinary month's pay on `lines`, under the rules in force on `date`. */
export function monthOn(data: TenantPayrollData, emp: LocaleEmployee, lines: SalaryLine[], date: string): PayFigures {
  const [y, m] = date.split("-").map(Number);
  const settings = { ...settingsOn(data.settings, data.settingsVersions, date), taxMethod: "annualised" as const };
  const period = makePeriod(y, m, settings.payDay);
  const structure: SalaryStructure = { id: "impact", employeeId: emp.id, effectiveFrom: period.start, effectiveTo: null, currency: "NGN", lines, reason: "", approvedBy: "", approvedAt: "" };
  const c = computeEmployeePay({
    period,
    runType: "regular",
    // A whole month: never pro-rated for joining or leaving.
    employee: { ...engineEmployee(emp), startDate: "1900-01-01", dateOfLeaving: null },
    structure,
    elements: elementMapOn(data.elements, period.end),
    inputs: [],
    profile: data.profiles.find((p) => p.employeeId === emp.id) ?? null,
    rateSet: resolveRateSet(data.rateSets, period.end),
    settings,
    ytd: null,
  });
  return figuresOf(c);
}

export function salaryImpact(data: TenantPayrollData, emp: LocaleEmployee, lines: SalaryLine[], effectiveFrom: string): SalaryImpact {
  const current = structureOn(data.structures, emp.id, effectiveFrom) ?? structureOn(data.structures, emp.id, new Date().toISOString().slice(0, 10));
  return {
    before: current ? monthOn(data, emp, current.lines, effectiveFrom) : ZERO_FIGURES,
    after: monthOn(data, emp, lines, effectiveFrom),
  };
}

export const FIGURE_LABELS: { key: keyof PayFigures; label: string }[] = [
  { key: "gross", label: "Gross pay" },
  { key: "paye", label: "PAYE" },
  { key: "pension", label: "Pension (employee)" },
  { key: "nhf", label: "NHF" },
  { key: "net", label: "Net pay" },
  { key: "employerCost", label: "Cost to employer" },
];

export function addFigures(a: PayFigures, b: PayFigures): PayFigures {
  return Object.fromEntries(FIGURE_LABELS.map(({ key }) => [key, round2(a[key] + b[key])])) as unknown as PayFigures;
}

// ── Bulk salary review ──────────────────────────────────────────────────────

export type BulkChangeMode = "percent" | "fixed";

/** Scale a structure: fixed-amount lines move by the % (or share the fixed increase pro rata); % lines stay. */
export function adjustLines(lines: SalaryLine[], mode: BulkChangeMode, value: number, isFixed: (code: string) => boolean): SalaryLine[] {
  const fixedTotal = lines.filter((l) => isFixed(l.code)).reduce((s, l) => s + l.amount, 0);
  return lines.map((l) => {
    if (!isFixed(l.code)) return l;
    const next = mode === "percent" ? l.amount * (1 + value / 100) : fixedTotal > 0 ? l.amount + (value * l.amount) / fixedTotal : l.amount;
    return { ...l, amount: round2(Math.max(0, next)) };
  });
}

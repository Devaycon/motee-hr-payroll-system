import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { round2 } from "./ng/engine";
import { seedHistory, seedProfile, seedStructure } from "./run-builder";
import { explainLine, lineHistory } from "./explain";

/** Client feedback B6 (Nov 2026): click any payslip line to see how it was calculated. */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const profiles = bundle.employees.map(seedProfile);
const base = { elements: SEED_PAY_ELEMENTS, rateSets: NG_RATE_SETS, settings, structures: bundle.employees.map((e) => seedStructure(e, settings)), profiles };
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today: new Date("2026-11-24T12:00:00Z") });
const data = { ...base, ...history };
const adaeze = bundle.employees.find((e) => e.fullName === "Adaeze Okonkwo")!;
const oct = history.payslips.find((p) => p.employeeId === adaeze.id && p.period.month === 10)!;
const ctx = { data, profile: profiles.find((p) => p.employeeId === adaeze.id) };
const line = (code: string) => oct.computation.lines.find((l) => l.code === code)!;

describe("B6 · click-to-explain payslip", () => {
  it("employee pension: pensionable salary × 8% = the deduction, from the statutory configuration", () => {
    const x = explainLine(oct, line("PENSION_EE"), ctx);
    expect(x.rate).toBe("8%");
    expect(x.basis!.amount).toBe(oct.computation.bases.pensionable);
    expect(round2(x.basis!.amount * 0.08)).toBeCloseTo(x.amount, 1);
    expect(x.source.kind).toBe("statutory_configuration");
    expect(x.formula[x.formula.length - 1].value).toContain("71,966.67");
  });

  it("PAYE shows the cumulative steps ending in this month's tax", () => {
    const x = explainLine(oct, line("PAYE"), ctx);
    const labels = x.formula.map((f) => f.label);
    expect(labels[0]).toBe("Taxable pay to date");
    expect(labels).toContain("− tax already paid this year");
    expect(x.formula[x.formula.length - 1].value).toContain(line("PAYE").amount.toLocaleString("en-NG", { minimumFractionDigits: 2 }));
  });

  it("basic salary is traced to the salary structure (HR record) with its reference", () => {
    const x = explainLine(oct, line("BASIC"), ctx);
    expect(x.source.kind).toBe("hr_record");
    expect(x.source.reference).toMatch(/^SS-/);
  });

  it("voluntary pension cites the employee's signed mandate", () => {
    const x = explainLine(oct, line("VOL_PENSION"), ctx);
    expect(x.source).toMatchObject({ kind: "employee_mandate", reference: "AVC-NG1011" });
    expect(x.rate).toBe("3%");
  });

  it("history runs month by month from January, including brought-forward months, and compares with last month", () => {
    const x = explainLine(oct, line("BASIC"), ctx);
    expect(x.history.map((h) => h.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    // January's unpaid day is its own (negative) line, found in the brought-forward months.
    const unpaid = lineHistory(ctx, oct, "UNPAID_LEAVE");
    expect(unpaid.find((h) => h.month === 1)!.amount).toBeLessThan(0);
    expect(x.history.at(-1)!.current).toBe(true);
    expect(x.change).toMatchObject({ previousLabel: "Sep 2026", delta: 0 });
  });
});

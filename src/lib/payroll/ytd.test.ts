import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { round2 } from "./ng/engine";
import { seedHistory, seedProfile, seedStructure } from "./run-builder";
import { ytdBreakdown, ytdCtxFor, ytdIntegrity } from "./ytd";

/** Client feedback A1 (Nov 2026): Adaeze Okonkwo's October 2026 YTD. */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const structures = bundle.employees.map((e) => seedStructure(e, settings));
const profiles = bundle.employees.map(seedProfile);
const base = { elements: SEED_PAY_ELEMENTS, rateSets: NG_RATE_SETS, settings, structures, profiles };
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today: new Date("2026-11-24T12:00:00Z") });
const data = { ...base, ...history };
const adaeze = bundle.employees.find((e) => e.fullName === "Adaeze Okonkwo")!;
const oct = history.payslips.find((p) => p.employeeId === adaeze.id && p.period.month === 10)!;
const b = ytdBreakdown(data, adaeze.id, 2026, 10, ytdCtxFor(structures, adaeze.id, 2026));

describe("A1 · YTD is traceable", () => {
  it("the October payslip shows the figures the reviewer saw", () => {
    expect(Math.round(oct.computation.ytd.gross)).toBe(11_830_414);
    expect(Math.round(oct.computation.ytd.pensionEmployee)).toBe(717_345);
    expect(Math.round(oct.computation.ytd.nhf)).toBe(295_760);
  });

  it("the month-by-month rows add up to the payslip's YTD, to the kobo", () => {
    expect(b.rows).toHaveLength(10);
    expect(b.rows.slice(0, 7).every((r) => r.source === "brought_forward")).toBe(true);
    expect(b.totals.gross).toBe(oct.computation.ytd.gross);
    expect(b.totals.paye).toBe(oct.computation.ytd.paye);
    expect(b.totals.pensionEmployee).toBe(oct.computation.ytd.pensionEmployee);
    expect(b.totals.nhf).toBe(oct.computation.ytd.nhf);
    expect(b.totals.net).toBe(oct.computation.ytd.net);
    expect(Math.round(b.totals.voluntaryPension)).toBe(269_004);
  });

  it("the ₦1.25m over 10 × the monthly gross is fully explained by genuine variations", () => {
    expect(b.expectedIfUnchanged).toBe(round2(10 * 1_058_333.33));
    expect(b.difference).toBeCloseTo(1_247_080.21, 1);
    expect(b.explained).toBe(true);
    const by = (m: number) => b.variations.filter((v) => v.month === m);
    expect(by(1).reduce((s, v) => s + v.amount, 0)).toBeLessThan(0); // unpaid day
    expect(by(4).map((v) => v.code).sort()).toEqual(["LEAVE_ALLOW", "ONE_OFF"]);
    expect(by(9).map((v) => v.code)).toEqual(["PERFORMANCE_BONUS"]);
  });

  it("the integrity check passes on a correctly calculated run, and catches a stale one", () => {
    const octRun = history.runs.find((r) => r.id === oct.runId)!;
    expect(ytdIntegrity(octRun, data)).toEqual([]);
    const tampered = {
      ...octRun,
      employees: octRun.employees.map((e) => (e.employeeId === adaeze.id ? { ...e, computation: { ...e.computation!, ytd: { ...e.computation!.ytd, gross: 1 } } } : e)),
    };
    expect(ytdIntegrity(tampered, data).map((i) => i.field)).toEqual(["gross"]);
  });
});

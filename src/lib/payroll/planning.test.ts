import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { round2 } from "./ng/engine";
import { seedHistory, seedProfile, seedStructure } from "./run-builder";
import { buildForecast, scenarioBudgetImpact, spreadEvenly, type BudgetVersion } from "./budget";
import { EMPLOYER_KEYS, EMPTY_SCENARIO, latestBaseRun, simulate } from "./simulation";

/** Client feedback B7 (organisation-wide simulation vs budget) and B8 (committed / approved / hypothetical) — Nov 2026. */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const base = { elements: SEED_PAY_ELEMENTS, rateSets: NG_RATE_SETS, settings, structures: bundle.employees.map((e) => seedStructure(e, settings)), profiles: bundle.employees.map(seedProfile) };
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today: new Date("2026-11-24T12:00:00Z") });
const data = { ...base, ...history };
const dept = bundle.employees[0].departmentName;
const budget: BudgetVersion = {
  id: "B1",
  fiscalYear: 2026,
  name: "FY2026",
  status: "approved",
  dimension: "department",
  lines: [{ key: dept, months: spreadEvenly(12_000_000, 2026) }],
} as unknown as BudgetVersion;

describe("B8 · forecast by expenditure category", () => {
  it("committed + approved planned + hypothetical equals the projected forecast, month by month", () => {
    const f = buildForecast({ data, bundle, requisitions: [{ id: "REQ-1", title: "Analyst", department: dept, numberOfPositions: 2, salaryMin: 6_000_000, salaryMax: 8_000_000, startDate: "2026-12-01" }] })!;
    expect(f.categories.months.length).toBeGreaterThan(0);
    for (const m of f.categories.months) {
      const projected = f.year.find((y) => y.month === m.month)!.value!;
      expect(round2(m.committed + m.approved + m.hypothetical)).toBeCloseTo(projected, 0);
    }
    // The approved requisition lands in "approved planned", not "committed".
    expect(f.categories.totals.approved).toBeGreaterThan(0);
  });
});

describe("B7 · simulation against the budget", () => {
  const run = latestBaseRun(data.runs)!;
  const result = simulate(data, bundle, run, { ...EMPTY_SCENARIO, increasePct: 10, increaseDepartment: dept, starters: [{ id: "S1", department: dept, count: 20, monthlyGross: 500_000 }] });
  const impact = scenarioBudgetImpact(result, { ...data, budgets: [budget] }, bundle);

  it("ties to the simulation's own 12-month totals", () => {
    expect(impact.totals.projected).toBe(round2(result.measures.total12Scenario));
    expect(impact.totals.change).toBe(round2(result.measures.total12Change));
    expect(round2(impact.rows.reduce((s, r) => s + r.projected, 0))).toBeCloseTo(impact.totals.projected, 0);
  });

  it("reports headroom or overspend per department against its budget", () => {
    const row = impact.rows.find((r) => r.department === dept)!;
    expect(row.budget).toBeCloseTo(12_000_000 * (result.forecast.filter((m) => m.month.startsWith("2026")).length / 12), 0);
    expect(row.headroom).toBeCloseTo(row.budget! - row.projected, 2);
    expect(row.change).toBeGreaterThan(0); // 20 hires and a 10% review cost more
  });

  it("shows the additional employer statutory contributions", () => {
    expect(impact.employerStatutoryMonthly).toBeCloseTo(EMPLOYER_KEYS.reduce((s, k) => s + result.delta[k], 0), 2);
    expect(impact.employerStatutoryMonthly).toBeGreaterThan(0);
    expect(impact.employerCostAfter).toBeGreaterThan(impact.employerCostBefore);
  });
});

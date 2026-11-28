import { describe, expect, it } from "vitest";
import nigeria from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { SEED_PAY_ELEMENTS } from "./elements-seed";
import { DEFAULT_PAYROLL_SETTINGS, NG_RATE_SETS } from "./ng/rate-sets";
import { seedHistory, seedProfile, seedStructure } from "./run-builder";
import { buildEquityReport, compareBy, jobFamilyOf, type EquityExplanation } from "./pay-equity";

/** Client feedback B9 (Nov 2026): pay equity & salary intelligence, with small-group and like-for-like controls. */

const bundle = nigeria as unknown as LocaleBundle;
const settings = DEFAULT_PAYROLL_SETTINGS;
const structures = bundle.employees.map((e) => seedStructure(e, settings));
const base = { elements: SEED_PAY_ELEMENTS, rateSets: NG_RATE_SETS, settings, structures, profiles: bundle.employees.map(seedProfile) };
const history = seedHistory({ tenantId: bundle.tenant.id, bundle, base, loans: bundle.loans ?? [], today: new Date("2026-11-24T12:00:00Z") });
const run = history.runs.find((r) => r.period.month === 10)!;
const people = new Map(bundle.employees.map((e) => [e.id, e]));

describe("B9 · pay equity", () => {
  const report = buildEquityReport({ run, people, structures, minGroup: 3 });

  it("covers everyone paid in the run, at annual fixed pay", () => {
    expect(report.people).toHaveLength(run.employees.filter((e) => e.included && e.computation).length);
    const p = report.people[0];
    const s = structures.find((x) => x.employeeId === p.employeeId)!;
    expect(p.annual).toBeCloseTo(s.lines.reduce((t, l) => t + l.amount, 0) * 12, 0);
  });

  it("withholds groups smaller than the threshold — never shows a figure for 1 or 2 people", () => {
    for (const d of ["department", "grade", "location"] as const) {
      for (const g of compareBy(report.people, d, 3)) {
        if (g.count < 3) expect(g).toMatchObject({ suppressed: true, average: null, median: null });
        else expect(g.median).not.toBeNull();
      }
    }
    // Grade L3 has one person: suppressed.
    expect(compareBy(report.people, "grade", 3).find((g) => g.group === "L3")?.suppressed).toBe(true);
  });

  it("compares gender like for like within a grade, only where both sides meet the threshold", () => {
    for (const l of report.likeForLike) {
      if (l.women < 3 || l.men < 3) expect(l).toMatchObject({ suppressed: true, gapPct: null });
    }
    const paidWomen = run.employees.filter((e) => e.included && e.computation && people.get(e.employeeId)?.gender?.toLowerCase() === "female").length;
    expect(report.genderGap.women).toBe(paidWomen);
    expect(report.genderGap.medianPct).not.toBeNull();
  });

  it("without approved bands, uses provisional ones and recommends approving real bands", () => {
    expect(report.bandCompliance.noBand).toBe(0);
    expect(report.recommendations.some((r) => /Approve salary bands/.test(r))).toBe(true);
  });

  it("flags employees below their band with the annual cost to fix", () => {
    const tight = buildEquityReport({ run, people, structures, bands: [{ grade: "L5", min: 20_000_000, max: 30_000_000 }], minGroup: 3 });
    const below = tight.findings.filter((f) => f.kind === "below_band");
    expect(below.length).toBe(tight.people.filter((p) => p.grade === "L5").length);
    for (const f of below) expect(f.costToFix).toBeGreaterThan(0);
    expect(tight.recommendations[0]).toMatch(/band minimum/);
  });

  it("an approved explanation clears the alert; an unapproved one doesn't", () => {
    const tight = { run, people, structures, bands: [{ grade: "L5", min: 20_000_000, max: 30_000_000 }], minGroup: 3 };
    const target = buildEquityReport(tight).findings.find((f) => f.kind === "below_band")!;
    const x: EquityExplanation = { id: "X1", employeeId: target.employeeIds[0], kind: "below_band", note: "On a development plan to the minimum by June 2027.", by: "HR", at: "2026-11-24" };
    expect(buildEquityReport({ ...tight, explanations: [x] }).findings.find((f) => f.id === target.id)?.explained).toBeUndefined();
    expect(buildEquityReport({ ...tight, explanations: [{ ...x, approvedBy: "CFO" }] }).findings.find((f) => f.id === target.id)?.explained?.approvedBy).toBe("CFO");
  });

  it("groups job titles into families", () => {
    expect(jobFamilyOf("Senior Software Engineer")).toBe("Engineering & Technology");
    expect(jobFamilyOf("Chief Financial Officer")).toBe("Finance");
    expect(jobFamilyOf("Sales Executive")).toBe("Sales");
  });
});

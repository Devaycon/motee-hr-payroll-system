import { describe, expect, it } from "vitest";
import ng from "@/src/data/locale/nigeria.json";
import uk from "@/src/data/locale/uk.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import {
  DEFAULT_SCORE_KPIS,
  KPI_DEFS,
  attentionItems,
  buildRows,
  computeKpis,
  performanceScore,
  periodRange,
  previousRange,
  type PerfInput,
} from "./performance";
import { buildPerfInput } from "./performance-input";
import { buildReportModel } from "./performance-report";

const BUNDLES: [string, LocaleBundle][] = [
  ["nigeria", ng as unknown as LocaleBundle],
  ["uk", uk as unknown as LocaleBundle],
];

describe.each(BUNDLES)("%s branch performance", (_name, bundle) => {
  const input = buildPerfInput(bundle, bundle.branches ?? []);
  const ids = input.branches.map((b) => b.id);
  const range = periodRange("90d", input.asOf);

  it("keeps percentage indicators within 0–100", () => {
    for (const id of ids) {
      const v = computeKpis(input, id, range);
      for (const k of KPI_DEFS) {
        const x = v[k.id];
        if (x == null) continue;
        if (k.unit === "pct") expect(x).toBeGreaterThanOrEqual(0);
        if (k.unit === "pct") expect(x).toBeLessThanOrEqual(100);
        if (k.unit === "rating") expect(x).toBeLessThanOrEqual(5);
      }
    }
  });

  it("finds real activity behind the headline indicators", () => {
    const company = computeKpis(input, null, range);
    expect(company.attendance).not.toBeNull();
    expect(company.compliance).not.toBeNull();
    expect(company.training).not.toBeNull();
    expect(performanceScore(company, DEFAULT_SCORE_KPIS)).not.toBeNull();
  });

  it("ranks every branch once, best score first", () => {
    const rows = buildRows(input, ids, range, DEFAULT_SCORE_KPIS);
    expect(rows.map((r) => r.rank)).toEqual(rows.map((_, i) => i + 1));
    const scores = rows.map((r) => r.score).filter((s): s is number => s != null);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("builds a report the PDF, Excel and email share", () => {
    const targets = Object.fromEntries(KPI_DEFS.map((k) => [k.id, k.defaultTarget])) as Parameters<typeof attentionItems>[1];
    const model = buildReportModel(input, {
      companyName: "Test",
      frequency: "weekly",
      branchIds: ids,
      kpis: KPI_DEFS.map((k) => k.id),
      scoreKpis: DEFAULT_SCORE_KPIS,
      targets,
    });
    expect(model.rows).toHaveLength(ids.length);
    expect(model.trends[0].points).toHaveLength(6);
  });
});

describe("periods", () => {
  it("places the previous period directly before the current one", () => {
    const r = periodRange("30d", "2025-11-15");
    expect(r.start).toBe("2025-10-17");
    expect(previousRange(r)).toMatchObject({ start: "2025-09-17", end: "2025-10-16" });
  });
});

describe("sickness absence rate", () => {
  it("counts only working days that fall inside the period", () => {
    const input: PerfInput = {
      asOf: "2025-11-14",
      branches: [{ id: "B1", name: "B1", code: "B1", city: "X", status: "active" }],
      employees: [{ id: "E1", fullName: "E", branchId: "B1" }],
      tasks: [],
      attendance: [],
      enrollments: [],
      documents: [],
      dbsChecks: [],
      // Fri 7 → Tue 11 Nov: 3 working days.
      sickness: [{ employeeId: "E1", startDate: "2025-11-07", endDate: "2025-11-11" }],
      tickets: [],
      grievances: [],
      reviews: [],
    };
    // 10–14 Nov is 5 working days; 2 of them (Mon 10, Tue 11) are sick.
    const v = computeKpis(input, "B1", { start: "2025-11-10", end: "2025-11-14", label: "" });
    expect(v.sicknessRate).toBe(40);
  });
});

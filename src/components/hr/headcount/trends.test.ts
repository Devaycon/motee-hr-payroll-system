import { describe, expect, it } from "vitest";
import {
  headcountSeries,
  quarterOverQuarter,
  yearOverYear,
} from "./trends";
import type { HeadcountPlan, PlanPeriod } from "@/src/lib/types/headcount";

function plan(
  department: string,
  period: PlanPeriod,
  actual: number,
  target = actual,
): HeadcountPlan {
  return {
    id: `${department}-${period}`,
    department,
    period,
    target,
    actual,
    gapStatus: actual >= target ? (actual > target ? "over" : "on_target") : "under",
  };
}

const plans: HeadcountPlan[] = [
  plan("Engineering", "Q1 2025", 40, 42),
  plan("Engineering", "Q4 2025", 45, 46),
  plan("Engineering", "Q1 2026", 50, 55),
  plan("Finance", "Q1 2025", 10, 10),
  plan("Finance", "Q4 2025", 12, 12),
  plan("Finance", "Q1 2026", 9, 12),
];

describe("quarterOverQuarter", () => {
  it("compares against the immediately preceding quarter across a year boundary", () => {
    const result = quarterOverQuarter(plans, "Q1 2026");
    expect(result.comparisonPeriod).toBe("Q4 2025");
  });

  it("computes per-department deltas and percentages", () => {
    const { rows } = quarterOverQuarter(plans, "Q1 2026");
    const eng = rows.find((r) => r.department === "Engineering")!;
    expect(eng.previous).toBe(45);
    expect(eng.current).toBe(50);
    expect(eng.delta).toBe(5);
    expect(eng.pctChange).toBeCloseTo(11.1, 1);
  });

  it("reports a shrinking department as a negative delta", () => {
    const { rows } = quarterOverQuarter(plans, "Q1 2026");
    const finance = rows.find((r) => r.department === "Finance")!;
    expect(finance.delta).toBe(-3);
    expect(finance.pctChange).toBe(-25);
  });

  it("totals and counts growers vs shrinkers", () => {
    const result = quarterOverQuarter(plans, "Q1 2026");
    expect(result.totalPrevious).toBe(57);
    expect(result.totalCurrent).toBe(59);
    expect(result.totalDelta).toBe(2);
    expect(result.grew).toBe(1);
    expect(result.shrank).toBe(1);
  });
});

describe("yearOverYear", () => {
  it("compares against the same quarter a year earlier", () => {
    const result = yearOverYear(plans, "Q1 2026");
    expect(result.comparisonPeriod).toBe("Q1 2025");
    const eng = result.rows.find((r) => r.department === "Engineering")!;
    expect(eng.previous).toBe(40);
    expect(eng.delta).toBe(10);
    expect(eng.pctChange).toBe(25);
  });

  it("reports no comparison period when the prior year isn't held", () => {
    const result = yearOverYear(plans, "Q1 2025");
    expect(result.comparisonPeriod).toBeNull();
    expect(result.totalPrevious).toBe(0);
  });

  it("has no comparison for a full-year period", () => {
    expect(yearOverYear(plans, "FY 2026").comparisonPeriod).toBeNull();
    expect(quarterOverQuarter(plans, "FY 2026").comparisonPeriod).toBeNull();
  });
});

describe("zero baselines", () => {
  it("returns null rather than Infinity when growing from nothing", () => {
    const withNew: HeadcountPlan[] = [
      ...plans,
      plan("NewTeam", "Q1 2026", 5, 5),
    ];
    const { rows } = quarterOverQuarter(withNew, "Q1 2026");
    const newTeam = rows.find((r) => r.department === "NewTeam")!;
    expect(newTeam.previous).toBe(0);
    expect(newTeam.delta).toBe(5);
    // A "500% increase" from zero is meaningless, so the caller shows the
    // absolute movement instead.
    expect(newTeam.pctChange).toBeNull();
  });

  it("keeps a department that disappeared, as a drop to zero", () => {
    const { rows } = quarterOverQuarter(
      [plan("Legacy", "Q4 2025", 4), ...plans],
      "Q1 2026",
    );
    const legacy = rows.find((r) => r.department === "Legacy")!;
    expect(legacy.current).toBe(0);
    expect(legacy.delta).toBe(-4);
  });
});

describe("headcountSeries", () => {
  it("includes only quarters with data, oldest first", () => {
    const series = headcountSeries(plans);
    expect(series.map((p) => p.period)).toEqual([
      "Q1 2025",
      "Q4 2025",
      "Q1 2026",
    ]);
  });

  it("sums actual and target across departments", () => {
    const series = headcountSeries(plans);
    const q1_2026 = series.find((p) => p.period === "Q1 2026")!;
    expect(q1_2026.actual).toBe(59);
    expect(q1_2026.target).toBe(67);
  });

  it("excludes full-year periods so the year isn't double-counted", () => {
    const series = headcountSeries([...plans, plan("Engineering", "FY 2026", 50)]);
    expect(series.some((p) => p.period === "FY 2026")).toBe(false);
  });
});

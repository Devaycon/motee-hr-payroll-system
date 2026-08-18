import { describe, expect, it } from "vitest";
import {
  PREFER_NOT_TO_SAY,
  SUPPRESSION_THRESHOLD,
  declarationRate,
  diversityCategories,
  tallyWithSuppression,
} from "./diversity";

/** n copies of a value, for building tallies at a known size. */
function repeat(value: string, n: number): string[] {
  return Array.from({ length: n }, () => value);
}

describe("category sets", () => {
  it("always offers a way to decline, in every category and jurisdiction", () => {
    for (const jurisdiction of ["uk", "ng"] as const) {
      for (const category of diversityCategories(jurisdiction)) {
        expect(category.options).toContain(PREFER_NOT_TO_SAY);
      }
    }
  });

  it("does not ask Nigeria for ethnicity or sexual orientation", () => {
    const keys = diversityCategories("ng").map((c) => c.key);
    expect(keys).not.toContain("ethnicity");
    expect(keys).not.toContain("sexualOrientation");
  });

  it("asks the UK for the Equality Act characteristics", () => {
    const keys = diversityCategories("uk").map((c) => c.key);
    expect(keys).toContain("ethnicity");
    expect(keys).toContain("disability");
    expect(keys).toContain("religion");
    expect(keys).toContain("sexualOrientation");
  });

  it("explains why every question is being asked", () => {
    for (const jurisdiction of ["uk", "ng"] as const) {
      for (const category of diversityCategories(jurisdiction)) {
        expect(category.purpose.length).toBeGreaterThan(10);
      }
    }
  });
});

describe("tallyWithSuppression", () => {
  it("reports groups at or above the threshold", () => {
    const values = [...repeat("White", 8), ...repeat("Asian", 5)];
    const result = tallyWithSuppression(values, 20);
    expect(result.rows.map((r) => r.label)).toEqual(["White", "Asian"]);
    expect(result.suppressedCount).toBe(0);
  });

  it("withholds a group below the threshold", () => {
    const values = [...repeat("White", 8), ...repeat("Mixed", 2)];
    const result = tallyWithSuppression(values, 20);
    expect(result.rows.map((r) => r.label)).toEqual(["White"]);
    expect(result.suppressedCount).toBe(2);
    expect(result.suppressedGroups).toBe(1);
  });

  it("withholds everything when every group is small", () => {
    const values = [
      ...repeat("A", 2),
      ...repeat("B", 3),
      ...repeat("C", 1),
    ];
    const result = tallyWithSuppression(values, 30);
    expect(result.rows).toHaveLength(0);
    expect(result.suppressedCount).toBe(6);
    expect(result.suppressedGroups).toBe(3);
  });

  it("suppresses at exactly one below the threshold, not at it", () => {
    const atThreshold = tallyWithSuppression(
      repeat("A", SUPPRESSION_THRESHOLD),
      50,
    );
    expect(atThreshold.rows).toHaveLength(1);

    const below = tallyWithSuppression(
      repeat("A", SUPPRESSION_THRESHOLD - 1),
      50,
    );
    expect(below.rows).toHaveLength(0);
  });

  it("takes percentages of those who answered, not of headcount", () => {
    // 10 answered out of 100 employees; 5 of them said White.
    const values = [...repeat("White", 5), ...repeat("Asian", 5)];
    const result = tallyWithSuppression(values, 100);
    expect(result.declared).toBe(10);
    expect(result.eligible).toBe(100);
    expect(result.rows.find((r) => r.label === "White")?.percentage).toBe(50);
  });

  it("ignores unanswered categories rather than counting them as a group", () => {
    const values = [...repeat("White", 6), undefined, undefined];
    const result = tallyWithSuppression(values, 20);
    expect(result.declared).toBe(6);
    expect(result.rows).toHaveLength(1);
  });

  it("treats 'Prefer not to say' as a real answer, subject to the same threshold", () => {
    const values = [
      ...repeat("White", 6),
      ...repeat(PREFER_NOT_TO_SAY, 6),
    ];
    const result = tallyWithSuppression(values, 20);
    expect(result.rows.map((r) => r.label)).toContain(PREFER_NOT_TO_SAY);
  });

  it("handles an empty dataset without dividing by zero", () => {
    const result = tallyWithSuppression([], 0);
    expect(result.rows).toHaveLength(0);
    expect(result.declared).toBe(0);
  });
});

describe("declarationRate", () => {
  it("is the share of the workforce that answered", () => {
    expect(declarationRate(25, 100)).toBe(25);
  });

  it("is zero rather than NaN when nobody is eligible", () => {
    expect(declarationRate(0, 0)).toBe(0);
  });
});

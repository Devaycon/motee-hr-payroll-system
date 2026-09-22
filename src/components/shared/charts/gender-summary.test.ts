import { describe, expect, it } from "vitest";
import { genderSummaryLines, genderSummaryProps } from "./gender-summary";

describe("genderSummaryLines", () => {
  it("matches the reference wording for a three-way split", () => {
    expect(
      genderSummaryLines([
        { label: "Male", value: 12 },
        { label: "Female", value: 6 },
        { label: "Other", value: 2 },
      ]),
    ).toEqual([
      "Across the workforce of 20 employees, 12 (60%) are Male, 6 (30%) are Female, and 2 (10%) are recorded as Other.",
      "Male employees represent the largest proportion of the workforce at 60%, followed by Female employees at 30% and Other at 10%.",
    ]);
  });

  it("ranks by size whatever order the segments arrive in", () => {
    const [, ranking] = genderSummaryLines([
      { label: "Other", value: 2 },
      { label: "Female", value: 6 },
      { label: "Male", value: 12 },
    ]);
    expect(ranking.startsWith("Male employees represent the largest")).toBe(true);
  });

  it("reads naturally with two groups", () => {
    expect(
      genderSummaryLines([
        { label: "Male", value: 3 },
        { label: "Female", value: 1 },
      ]),
    ).toEqual([
      "Across the workforce of 4 employees, 3 (75%) are Male and 1 (25%) are Female.",
      "Male employees represent the largest proportion of the workforce at 75%, followed by Female employees at 25%.",
    ]);
  });

  it("drops groups with nobody in them instead of listing 0 (0%)", () => {
    const [composition, ranking] = genderSummaryLines([
      { label: "Male", value: 5 },
      { label: "Female", value: 5 },
      { label: "Other", value: 0 },
    ]);
    expect(composition).not.toMatch(/Other/);
    expect(ranking).toBe("Male and Female employees are equally represented, at 50% each.");
  });

  it("calls out a tie for the lead and still ranks the rest", () => {
    const [, ranking] = genderSummaryLines([
      { label: "Male", value: 4 },
      { label: "Female", value: 4 },
      { label: "Other", value: 2 },
    ]);
    expect(ranking).toBe(
      "Male and Female employees are equally represented, at 40% each, followed by Other employees at 20%.",
    );
  });

  it("handles a single group", () => {
    expect(genderSummaryLines([{ label: "Female", value: 7 }])).toEqual([
      "Across the workforce of 7 employees, all 7 (100%) are Female.",
      "Female employees represent the largest proportion of the workforce at 100%.",
    ]);
  });

  it("says so plainly when there is no data", () => {
    expect(genderSummaryLines([{ label: "Male", value: 0 }])).toEqual([
      "No gender data has been recorded for the workforce yet.",
    ]);
    expect(genderSummaryLines([])).toHaveLength(1);
  });
});

describe("genderSummaryProps", () => {
  it("titles the summary Gender Distribution and supplies its wording", () => {
    const p = genderSummaryProps([{ label: "Male", value: 1 }]);
    expect(p.summaryTitle).toBe("Gender Distribution");
    expect(p.summaryLines.length).toBeGreaterThan(0);
  });
});

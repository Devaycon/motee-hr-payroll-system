import { describe, expect, it } from "vitest";
import { summarizeSegments } from "./hero-ring-card";

const seg = (label: string, value: number) => ({ key: label, label, value, color: "#000" });

describe("summarizeSegments (the summary on every ring card)", () => {
  it("returns two paragraphs: the makeup, then how the groups compare", () => {
    const lines = summarizeSegments(
      [seg("Engineering", 12), seg("Sales", 6), seg("Ops", 2)],
      "employees",
    );
    expect(lines).toEqual([
      "Out of 20 employees, the breakdown is Engineering at 12 (60%), Sales at 6 (30%) and Ops at 2 (10%).",
      "Engineering is clearly ahead at 60%, roughly 2× the size of Sales (30%). Ops is the smallest of the 3 groups, at 10% (2 employees).",
    ]);
  });

  it("does not repeat the card subtitle as a paragraph of its own", () => {
    const lines = summarizeSegments([seg("A", 3), seg("B", 1)], "items");
    expect(lines[0].startsWith("Out of 4 items")).toBe(true);
  });

  it("says the groups are close when no one dominates", () => {
    const [, comparison] = summarizeSegments([seg("A", 5), seg("B", 4)], "items");
    expect(comparison).toContain("fairly close");
    expect(comparison).toContain("no single group dominates");
  });

  it("gives a single group just its makeup line", () => {
    expect(summarizeSegments([seg("Only", 7)], "items")).toEqual(["Only at 7 (100%) of 7 items."]);
  });
});

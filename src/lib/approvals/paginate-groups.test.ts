import { describe, expect, it } from "vitest";
import { paginateGroups } from "./paginate-groups";

const g = (name: string, n: number) => ({
  name,
  chains: Array.from({ length: n }, (_, i) => `${name}${i + 1}`),
});

/** A: 3, B: 1, C: 4 → 8 items in total. */
const GROUPS = [g("A", 3), g("B", 1), g("C", 4)];

describe("paginateGroups", () => {
  it("fills a page across group boundaries and regroups the slice", () => {
    const p = paginateGroups(GROUPS, 1, 4);
    expect(p.sections.map((s) => [s.group.name, s.chains])).toEqual([
      ["A", ["A1", "A2", "A3"]],
      ["B", ["B1"]],
    ]);
    expect([p.totalItems, p.totalPages, p.start, p.end]).toEqual([8, 2, 0, 4]);
  });

  it("carries a group that straddles a page break onto the next page", () => {
    const p = paginateGroups(GROUPS, 2, 3);
    // Page 1 = A1–A3, page 2 = B1 + C1–C2, page 3 = C3–C4.
    expect(p.sections.map((s) => [s.group.name, s.chains])).toEqual([
      ["B", ["B1"]],
      ["C", ["C1", "C2"]],
    ]);
    const last = paginateGroups(GROUPS, 3, 3);
    expect(last.sections.map((s) => [s.group.name, s.chains])).toEqual([
      ["C", ["C3", "C4"]],
    ]);
  });

  it("shows every item exactly once across all pages", () => {
    const seen: string[] = [];
    const { totalPages } = paginateGroups(GROUPS, 1, 3);
    for (let page = 1; page <= totalPages; page++) {
      for (const s of paginateGroups(GROUPS, page, 3).sections) seen.push(...s.chains);
    }
    expect(seen).toEqual(GROUPS.flatMap((x) => x.chains));
  });

  it("reports the last, partial page's bounds", () => {
    const p = paginateGroups(GROUPS, 2, 5);
    expect([p.start, p.end, p.totalPages]).toEqual([5, 8, 2]);
  });

  it("clamps an out-of-range page instead of returning nothing", () => {
    expect(paginateGroups(GROUPS, 99, 3).currentPage).toBe(3);
    expect(paginateGroups(GROUPS, 0, 3).currentPage).toBe(1);
    expect(paginateGroups(GROUPS, 99, 3).sections.length).toBeGreaterThan(0);
  });

  it("handles no groups, and skips empty ones", () => {
    const none = paginateGroups([], 1, 4);
    expect([none.totalItems, none.totalPages, none.currentPage, none.sections]).toEqual([0, 1, 1, []]);
    const withEmpty = paginateGroups([g("A", 0), g("B", 2)], 1, 4);
    expect(withEmpty.sections.map((s) => s.group.name)).toEqual(["B"]);
  });
});

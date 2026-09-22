import { describe, expect, it } from "vitest";
import { tallyWithSuppression } from "@/src/lib/types/diversity";
import {
  ALL,
  DEFAULT_LENS_FILTERS,
  NO_VALUE,
  aggregateGroups,
  filterLensEmployees,
  groupEmployees,
  isLensDimension,
  type LensMember,
} from "./group";

const NOW = new Date("2026-01-01T00:00:00Z");

function person(overrides: Partial<LensMember> & { id: string }): LensMember {
  return {
    name: `Person ${overrides.id}`,
    initials: "PP",
    jobTitle: "Engineer",
    department: "Engineering",
    employmentType: "full_time",
    status: "active",
    startDate: "2020-01-01",
    ...overrides,
  };
}

describe("groupEmployees", () => {
  it("groups by department, largest column first", () => {
    const rows = [
      person({ id: "1", department: "Finance" }),
      person({ id: "2", department: "Engineering" }),
      person({ id: "3", department: "Engineering" }),
    ];
    const groups = groupEmployees(rows, "department", NOW);
    expect(groups.map((g) => [g.label, g.count])).toEqual([
      ["Engineering", 2],
      ["Finance", 1],
    ]);
    expect(groups[0].members.map((m) => m.id)).toEqual(["2", "3"]);
  });

  it("breaks ties alphabetically so the order is stable", () => {
    const rows = [
      person({ id: "1", department: "Sales" }),
      person({ id: "2", department: "Legal" }),
    ];
    expect(groupEmployees(rows, "department", NOW).map((g) => g.label)).toEqual([
      "Legal",
      "Sales",
    ]);
  });

  it("puts people with no value in a '—' bucket that always sorts last", () => {
    const rows = [
      person({ id: "1", country: undefined }),
      person({ id: "2", country: undefined }),
      person({ id: "3", country: "Nigeria" }),
    ];
    const groups = groupEmployees(rows, "country", NOW);
    expect(groups.map((g) => g.label)).toEqual(["Nigeria", NO_VALUE]);
    expect(groups[1].count).toBe(2);
  });

  it("treats blank strings as missing", () => {
    const groups = groupEmployees([person({ id: "1", city: "   " })], "city", NOW);
    expect(groups.map((g) => g.label)).toEqual([NO_VALUE]);
  });

  it("uses readable labels for gender and employment type", () => {
    const rows = [
      person({ id: "1", gender: "non_binary", employmentType: "part_time" }),
      person({ id: "2", gender: "prefer_not_to_say" }),
    ];
    expect(groupEmployees(rows, "gender", NOW).map((g) => g.label).sort()).toEqual([
      "Non-binary",
      "Prefer not to say",
    ]);
    expect(
      groupEmployees(rows, "employmentType", NOW).map((g) => g.label),
    ).toEqual(["Full-time", "Part-time"]);
  });

  it("puts a person in every skill column they hold", () => {
    const rows = [
      person({ id: "1", skills: ["Leadership", "Strategy"] }),
      person({ id: "2", skills: ["Leadership"] }),
      person({ id: "3", skills: [] }),
    ];
    const groups = groupEmployees(rows, "skill", NOW);
    const byLabel = Object.fromEntries(groups.map((g) => [g.label, g]));
    expect(byLabel["Leadership"].members.map((m) => m.id)).toEqual(["1", "2"]);
    expect(byLabel["Strategy"].members.map((m) => m.id)).toEqual(["1"]);
    expect(byLabel[NO_VALUE].members.map((m) => m.id)).toEqual(["3"]);
    // Total memberships (4) exceed headcount (3): expected for overlapping groups.
    expect(groups.reduce((n, g) => n + g.count, 0)).toBe(4);
  });

  it("counts a duplicated skill once per person", () => {
    const groups = groupEmployees(
      [person({ id: "1", skills: ["Sales", " Sales ", "Sales"] })],
      "skill",
      NOW,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].count).toBe(1);
  });

  it("calculates percentages against headcount, not memberships", () => {
    const rows = [
      person({ id: "1", skills: ["A", "B"] }),
      person({ id: "2", skills: ["A"] }),
      person({ id: "3", skills: ["A"] }),
      person({ id: "4", skills: ["C"] }),
    ];
    const a = groupEmployees(rows, "skill", NOW).find((g) => g.label === "A")!;
    expect(a.count).toBe(3);
    expect(a.pct).toBe(75);
  });

  it("orders age bands low to high rather than by size", () => {
    const rows = [
      person({ id: "1", dateOfBirth: "1970-06-01" }),
      person({ id: "2", dateOfBirth: "1970-06-02" }),
      person({ id: "3", dateOfBirth: "2003-06-01" }),
      person({ id: "4", dateOfBirth: "1995-06-01" }),
    ];
    expect(groupEmployees(rows, "ageBand", NOW).map((g) => g.label)).toEqual([
      "Under 25",
      "25–34",
      "55–64",
    ]);
  });

  it("orders tenure bands short to long", () => {
    const rows = [
      person({ id: "1", startDate: "2015-01-01" }),
      person({ id: "2", startDate: "2025-09-01" }),
      person({ id: "3", startDate: "2024-01-01" }),
    ];
    expect(groupEmployees(rows, "tenureBand", NOW).map((g) => g.label)).toEqual([
      "<1y",
      "1-3y",
      "5+y",
    ]);
  });

  it("returns no columns for nobody", () => {
    expect(groupEmployees([], "department", NOW)).toEqual([]);
  });
});

describe("aggregateGroups", () => {
  it("never carries members, and flags the column as counts-only", () => {
    const values = [
      ...Array(6).fill("White"),
      ...Array(5).fill("Asian or Asian British"),
    ];
    const groups = aggregateGroups(tallyWithSuppression(values, 20));
    expect(groups.map((g) => g.label)).toEqual([
      "White",
      "Asian or Asian British",
    ]);
    for (const g of groups) {
      expect(g.members).toEqual([]);
      expect(g.aggregateOnly).toBe(true);
    }
  });

  it("drops groups below the suppression threshold", () => {
    const values = [...Array(5).fill("White"), ...Array(4).fill("Other ethnic group")];
    const groups = aggregateGroups(tallyWithSuppression(values, 20));
    expect(groups.map((g) => g.label)).toEqual(["White"]);
  });

  it("returns nothing when every group is too small to show", () => {
    expect(aggregateGroups(tallyWithSuppression(["White", "Asian"], 20))).toEqual(
      [],
    );
  });
});

describe("filterLensEmployees", () => {
  const rows = [
    person({ id: "1", status: "active", name: "Ada Obi", department: "Finance" }),
    person({ id: "2", status: "on_leave", branchId: "b1" }),
    person({ id: "3", status: "inactive" }),
    person({ id: "4", status: "deleted" }),
    person({ id: "5", status: "pending" }),
    person({ id: "6", status: "active", employmentType: "contract" }),
  ];
  const ids = (r: LensMember[]) => r.map((m) => m.id);

  it("defaults to people currently employed and never shows deleted or pending", () => {
    expect(ids(filterLensEmployees(rows, DEFAULT_LENS_FILTERS))).toEqual([
      "1",
      "2",
      "6",
    ]);
  });

  it("'anyone' still hides deleted and pending records", () => {
    const out = filterLensEmployees(rows, { ...DEFAULT_LENS_FILTERS, lifecycle: ALL });
    expect(ids(out)).toEqual(["1", "2", "3", "6"]);
  });

  it("can show leavers on their own", () => {
    const out = filterLensEmployees(rows, {
      ...DEFAULT_LENS_FILTERS,
      lifecycle: "inactive",
    });
    expect(ids(out)).toEqual(["3"]);
  });

  it("filters by employment type, branch and department", () => {
    expect(
      ids(filterLensEmployees(rows, { ...DEFAULT_LENS_FILTERS, employmentType: "contract" })),
    ).toEqual(["6"]);
    expect(
      ids(filterLensEmployees(rows, { ...DEFAULT_LENS_FILTERS, branch: "b1" })),
    ).toEqual(["2"]);
    expect(
      ids(filterLensEmployees(rows, { ...DEFAULT_LENS_FILTERS, department: "Finance" })),
    ).toEqual(["1"]);
  });

  it("searches name, title and department, ignoring case", () => {
    expect(
      ids(filterLensEmployees(rows, { ...DEFAULT_LENS_FILTERS, query: "  ada " })),
    ).toEqual(["1"]);
  });
});

describe("isLensDimension", () => {
  it("accepts known dimensions and rejects anything else", () => {
    expect(isLensDimension("skill")).toBe(true);
    expect(isLensDimension("ethnicity")).toBe(true);
    expect(isLensDimension("salary")).toBe(false);
    expect(isLensDimension(null)).toBe(false);
  });
});

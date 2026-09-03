import { describe, expect, it } from "vitest";
import {
  allowedBranchIds,
  isOpenScope,
  scopeBundleToAccess,
  visibleEmployees,
} from "./data-scope";
import { narrowerScope } from "./resolve";
import type { DataScope } from "@/src/lib/types/access-levels";
import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";

const LAGOS = "NG-BR-0001";
const ABUJA = "NG-BR-0002";
const ENG = "DEP-ENG";
const SALES = "DEP-SALES";

function emp(
  id: string,
  branchId: string,
  departmentId: string,
  managerId: string | null = null,
): LocaleEmployee {
  return {
    id,
    tenantId: "t",
    employeeNumber: id,
    firstName: "A",
    lastName: "B",
    fullName: `Person ${id}`,
    initials: "AB",
    email: `${id}@x.ng`,
    phone: "",
    departmentId,
    departmentName: departmentId,
    jobTitle: "Engineer",
    employmentTypeId: "ET-1",
    status: "active",
    startDate: "2024-01-01",
    salary: { amount: 1, currency: "NGN", period: "month" },
    managerId,
    branchId,
  };
}

/** Boss sits in Lagos/Engineering; two of the four report to them. */
const BOSS = emp("E1", LAGOS, ENG);
const REPORT_A = emp("E2", LAGOS, ENG, "E1");
const REPORT_B = emp("E3", ABUJA, SALES, "E1");
const STRANGER = emp("E4", ABUJA, SALES);
const PEOPLE = [BOSS, REPORT_A, REPORT_B, STRANGER];

function bundle(): LocaleBundle {
  return {
    employees: [...PEOPLE],
    branches: [
      { id: LAGOS, name: "Lagos HQ" },
      { id: ABUJA, name: "Abuja Office" },
    ],
    departments: [{ id: ENG }, { id: SALES }],
    attendance: PEOPLE.map((p) => ({ employeeId: p.id, date: "2026-01-01" })),
    announcements: [{ id: "AN-1" }],
  } as unknown as LocaleBundle;
}

const ids = (list: LocaleEmployee[]) => list.map((e) => e.id).sort();

describe("isOpenScope", () => {
  it("treats 'all' as unrestricted", () => {
    expect(isOpenScope({ kind: "all" })).toBe(true);
  });

  it("treats 'business_unit' as unrestricted — no employee field matches it", () => {
    // The two seeded roles shipped with this kind and no unit list. Failing
    // closed here would empty the app for them.
    expect(isOpenScope({ kind: "business_unit" })).toBe(true);
  });

  it("treats branch and department as restrictions", () => {
    expect(isOpenScope({ kind: "branch" })).toBe(false);
    expect(isOpenScope({ kind: "department" })).toBe(false);
  });
});

describe("visibleEmployees", () => {
  const see = (scope: DataScope, employeeId?: string) =>
    ids(visibleEmployees(PEOPLE, scope, { employeeId }));

  it("self sees only the viewer", () => {
    expect(see({ kind: "self" }, "E1")).toEqual(["E1"]);
  });

  it("direct_reports includes the manager's own record", () => {
    // A list that excluded them would break the profile and approval screens
    // reached from it.
    expect(see({ kind: "direct_reports" }, "E1")).toEqual(["E1", "E2", "E3"]);
  });

  it("direct_reports sees only yourself when nobody reports to you", () => {
    expect(see({ kind: "direct_reports" }, "E4")).toEqual(["E4"]);
  });

  it("branch honours an explicit id list", () => {
    expect(see({ kind: "branch", branchIds: [ABUJA] }, "E1")).toEqual([
      "E3",
      "E4",
    ]);
  });

  it("branch with no list falls back to the viewer's own branch", () => {
    // This is what lets a seeded role stay tenant-agnostic: branch ids differ
    // between the NG and UK bundles.
    expect(see({ kind: "branch" }, "E1")).toEqual(["E1", "E2"]);
    expect(see({ kind: "branch" }, "E4")).toEqual(["E3", "E4"]);
  });

  it("department with no list falls back to the viewer's own department", () => {
    expect(see({ kind: "department" }, "E1")).toEqual(["E1", "E2"]);
  });

  it("department honours an explicit id list", () => {
    expect(see({ kind: "department", departmentIds: [SALES] }, "E1")).toEqual([
      "E3",
      "E4",
    ]);
  });

  it("shows nothing but the viewer when the scope cannot be resolved", () => {
    const orphan = { ...BOSS, id: "E9", branchId: undefined };
    expect(
      visibleEmployees([...PEOPLE, orphan], { kind: "branch" }, { employeeId: "E9" }),
    ).toEqual([orphan]);
  });

  it("shows nothing when there is no signed-in viewer to resolve against", () => {
    expect(see({ kind: "self" })).toEqual([]);
  });
});

describe("scopeBundleToAccess", () => {
  it("returns the same object when nothing is restricted", () => {
    const b = bundle();
    expect(scopeBundleToAccess(b, { kind: "all" }, { employeeId: "E1" })).toBe(b);
  });

  it("narrows the people and everything they own", () => {
    const scoped = scopeBundleToAccess(
      bundle(),
      { kind: "branch", branchIds: [LAGOS] },
      { employeeId: "E1" },
    );
    expect(ids(scoped.employees)).toEqual(["E1", "E2"]);
    expect(scoped.attendance.map((a) => a.employeeId).sort()).toEqual([
      "E1",
      "E2",
    ]);
  });

  it("narrows the branch list, so the switcher cannot name a site out of reach", () => {
    const scoped = scopeBundleToAccess(
      bundle(),
      { kind: "branch", branchIds: [LAGOS] },
      { employeeId: "E1" },
    );
    expect(scoped.branches?.map((b) => b.id)).toEqual([LAGOS]);
  });

  it("leaves company-wide reference data whole", () => {
    const b = bundle();
    const scoped = scopeBundleToAccess(
      b,
      { kind: "self" },
      { employeeId: "E1" },
    );
    expect(scoped.departments).toBe(b.departments);
    expect(scoped.announcements).toHaveLength(1);
  });
});

describe("allowedBranchIds", () => {
  it("is null when every branch is allowed", () => {
    expect(
      allowedBranchIds(bundle(), { kind: "all" }, { employeeId: "E1" }),
    ).toBeNull();
  });

  it("is the branches of the people the role can see", () => {
    // A direct-reports role spanning two sites should be able to switch
    // between both of them.
    const allowed = allowedBranchIds(
      bundle(),
      { kind: "direct_reports" },
      { employeeId: "E1" },
    );
    expect([...(allowed ?? [])].sort()).toEqual([LAGOS, ABUJA].sort());
  });
});

describe("multi-role merging with the new branch kind", () => {
  it("ranks branch wider than department, so department wins", () => {
    const merged = narrowerScope({ kind: "branch" }, { kind: "department" });
    expect(merged.kind).toBe("department");
  });

  it("ranks branch narrower than business_unit and all", () => {
    expect(narrowerScope({ kind: "branch" }, { kind: "all" }).kind).toBe("branch");
    expect(
      narrowerScope({ kind: "branch" }, { kind: "business_unit" }).kind,
    ).toBe("branch");
  });

  it("intersects branch lists rather than adding them", () => {
    // Holding two branch-scoped roles must never widen what you can see.
    const merged = narrowerScope(
      { kind: "branch", branchIds: [LAGOS, ABUJA] },
      { kind: "branch", branchIds: [ABUJA] },
    );
    expect(merged.branchIds).toEqual([ABUJA]);
  });
});

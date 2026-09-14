import { describe, expect, it } from "vitest";
import { resolveBranchScope, scopeBundleToBranch } from "./scope";
import { applyBundleOverrides } from "@/src/lib/profile/overrides";
import type { LocaleBundle } from "@/src/lib/types/locale";

const LAGOS = "NG-BR-0001";
const ABUJA = "NG-BR-0002";

function employee(id: string, branchId: string) {
  return {
    id,
    tenantId: "tenant_ng_001",
    employeeNumber: id,
    firstName: "A",
    lastName: "B",
    fullName: "A B",
    initials: "AB",
    email: `${id}@x.ng`,
    phone: "",
    departmentId: "DEP-1",
    departmentName: "Engineering",
    jobTitle: "Engineer",
    employmentTypeId: "ET-1",
    status: "active",
    startDate: "2024-01-01",
    salary: { amount: 1, currency: "NGN", period: "month" },
    managerId: null,
    branchId,
  };
}

/** Only the keys the scope function touches; the rest is cast away. */
function bundle(): LocaleBundle {
  return {
    employees: [
      employee("NG-EMP-0001", LAGOS),
      employee("NG-EMP-0002", LAGOS),
      employee("NG-EMP-0003", ABUJA),
    ],
    branches: [
      { id: LAGOS, name: "Lagos HQ" },
      { id: ABUJA, name: "Abuja Office" },
    ],
    departments: [{ id: "DEP-1", name: "Engineering" }],
    roles: [{ id: "ROLE-1" }],
    settings: { theme: "dark" },
    attendance: [
      { employeeId: "NG-EMP-0001", date: "2026-01-01", status: "present" },
      { employeeId: "NG-EMP-0003", date: "2026-01-01", status: "present" },
    ],
    leaveRequests: [
      { id: "LR-1", employeeId: "NG-EMP-0003", type: "annual", status: "approved" },
    ],
    kudos: [
      { id: "K-1", employeeId: "NG-EMP-0001", toEmployeeId: "NG-EMP-0003" },
      { id: "K-2", employeeId: "NG-EMP-0003", toEmployeeId: "NG-EMP-0003" },
    ],
    announcements: [{ id: "AN-1", title: "All hands" }],
    orgStructure: [
      { employeeId: "NG-EMP-0001", parentEmployeeId: null },
      { employeeId: "NG-EMP-0003", parentEmployeeId: "NG-EMP-0001" },
    ],
  } as unknown as LocaleBundle;
}

describe("scopeBundleToBranch", () => {
  it("returns the same object when nothing is scoped", () => {
    const b = bundle();
    // Identity, not deep equality — the default path must not re-allocate a
    // multi-megabyte bundle or every downstream memo is invalidated.
    expect(scopeBundleToBranch(b, null)).toBe(b);
  });

  it("returns the same object when the branch holds everyone", () => {
    const b = bundle();
    b.employees = b.employees.map((e) => ({ ...e, branchId: LAGOS }));
    expect(scopeBundleToBranch(b, LAGOS)).toBe(b);
  });

  it("filters employees to the branch", () => {
    const scoped = scopeBundleToBranch(bundle(), LAGOS);
    expect(scoped.employees.map((e) => e.id)).toEqual([
      "NG-EMP-0001",
      "NG-EMP-0002",
    ]);
  });

  it("drops employee-keyed records belonging to filtered-out people", () => {
    const scoped = scopeBundleToBranch(bundle(), LAGOS);
    expect(scoped.attendance.map((a) => a.employeeId)).toEqual(["NG-EMP-0001"]);
    expect(scoped.leaveRequests).toHaveLength(0);
    expect(scoped.orgStructure).toHaveLength(1);
  });

  it("keeps a record when any of its employee references is in scope", () => {
    // K-1 was sent *by* someone at Lagos, so it survives; K-2 involves nobody
    // at Lagos and does not.
    const scoped = scopeBundleToBranch(bundle(), LAGOS);
    expect((scoped.kudos as { id: string }[]).map((k) => k.id)).toEqual(["K-1"]);
  });

  it("leaves company-wide reference data whole", () => {
    const b = bundle();
    const scoped = scopeBundleToBranch(b, ABUJA);
    expect(scoped.departments).toBe(b.departments);
    expect(scoped.roles).toBe(b.roles);
    expect(scoped.settings).toBe(b.settings);
    expect(scoped.branches).toBe(b.branches);
    // An announcement has no employee reference, so it is not branch-owned.
    expect(scoped.announcements).toHaveLength(1);
  });

  it("scopes to nothing for a branch with no people", () => {
    const scoped = scopeBundleToBranch(bundle(), "NG-BR-9999");
    expect(scoped.employees).toHaveLength(0);
    expect(scoped.attendance).toHaveLength(0);
  });
});

describe("resolveBranchScope", () => {
  const known = [LAGOS, ABUJA];

  it("keeps a selection that exists in the loaded tenant", () => {
    expect(resolveBranchScope(ABUJA, known)).toBe(ABUJA);
  });

  it("passes null through", () => {
    expect(resolveBranchScope(null, known)).toBeNull();
  });

  it("drops a selection left over from another tenant", () => {
    // The reported bug: `motee:branch` restored a branch picked under the NG
    // tenant into a UK session. Every screen filtered to an id no UK employee
    // carries and came back empty, while the switcher — which resolves the id
    // before displaying it — still read "All Branches".
    expect(resolveBranchScope("GB-BR-0002", known)).toBeNull();
  });

  it("drops a selection whose branch has since been deleted", () => {
    expect(resolveBranchScope(ABUJA, [LAGOS])).toBeNull();
  });

  it("shows everyone rather than nobody when the selection is stale", () => {
    const b = bundle();
    const scoped = scopeBundleToBranch(
      b,
      resolveBranchScope("GB-BR-0002", b.branches!.map((x) => x.id)),
    );
    expect(scoped).toBe(b);
    expect(scoped.employees).toHaveLength(3);
  });
});

/**
 * `useLocaleSection` applies overrides before scoping. Reassigning someone is
 * stored as a profile edit, so scoping the raw bundle would keep them filed at
 * their old site until the page was reloaded.
 */
describe("reassignment through profile overrides", () => {
  const moveToAbuja = { "NG-EMP-0001": { branchId: ABUJA } };

  it("follows the employee to their new branch", () => {
    const b = bundle();
    const patched = applyBundleOverrides(b, moveToAbuja);

    expect(
      scopeBundleToBranch(patched, ABUJA).employees.map((e) => e.id),
    ).toEqual(["NG-EMP-0001", "NG-EMP-0003"]);
    expect(
      scopeBundleToBranch(patched, LAGOS).employees.map((e) => e.id),
    ).toEqual(["NG-EMP-0002"]);
  });

  it("re-derives workLocation so the label matches the new branch", () => {
    const patched = applyBundleOverrides(bundle(), moveToAbuja);
    const moved = patched.employees.find((e) => e.id === "NG-EMP-0001");
    expect(moved?.workLocation).toBe("Abuja Office");
  });

  it("leaves the base bundle untouched", () => {
    const b = bundle();
    applyBundleOverrides(b, moveToAbuja);
    expect(b.employees[0].branchId).toBe(LAGOS);
  });
});

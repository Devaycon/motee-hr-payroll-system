import { describe, expect, it } from "vitest";
import { resolveBranchScope, scopeBundleToBranch } from "./scope";
import ng from "@/src/data/locale/nigeria.json";
import uk from "@/src/data/locale/uk.json";
import type { LocaleBundle } from "@/src/lib/types/locale";

/**
 * Guards the seeded fixtures themselves. `scripts/seed-branches.mjs` is a
 * one-off, so nothing else would notice if a later fixture regeneration
 * dropped `branches` or left employees unassigned — and an employee with no
 * `branchId` silently disappears the moment a branch is selected.
 */
const BUNDLES: [string, LocaleBundle][] = [
  ["nigeria", ng as unknown as LocaleBundle],
  ["uk", uk as unknown as LocaleBundle],
];

describe.each(BUNDLES)("%s fixture", (name, bundle) => {
  it("ships a branch list", () => {
    expect(bundle.branches?.length).toBeGreaterThan(1);
  });

  it("gives every employee a branch that exists", () => {
    const ids = new Set((bundle.branches ?? []).map((b) => b.id));
    const orphans = bundle.employees.filter(
      (e) => !e.branchId || !ids.has(e.branchId),
    );
    expect(orphans.map((e) => e.id)).toEqual([]);
  });

  it("has exactly one head office and unique codes", () => {
    const branches = bundle.branches ?? [];
    expect(branches.filter((b) => b.kind === "headquarters")).toHaveLength(1);
    expect(new Set(branches.map((b) => b.code)).size).toBe(branches.length);
  });

  it("keeps workLocation in step with the branch name", () => {
    const nameById = new Map((bundle.branches ?? []).map((b) => [b.id, b.name]));
    const mismatched = bundle.employees.filter(
      (e) => e.workLocation !== nameById.get(e.branchId ?? ""),
    );
    expect(mismatched.map((e) => e.id)).toEqual([]);
  });

  it("partitions the workforce — branch headcounts sum to the total", () => {
    const perBranch = (bundle.branches ?? []).map(
      (b) => scopeBundleToBranch(bundle, b.id).employees.length,
    );
    const sum = perBranch.reduce((a, b) => a + b, 0);
    expect(sum).toBe(bundle.employees.length);
    // Every branch must actually hold someone, or the switcher offers a
    // destination that shows an empty app.
    expect(perBranch.every((n) => n > 0)).toBe(true);
  });

  it("ignores a branch selection saved under the other tenant", () => {
    // The reported bug, end to end: `motee:branch` survives in localStorage
    // across a tenant change, so a branch id from the other bundle came back
    // and filtered the employee list down to nobody — the Employees page
    // showed only the pending onboarding rows, which are layered on from
    // Redux rather than read from the bundle.
    const foreign = name === "nigeria" ? "GB-BR-0001" : "NG-BR-0001";
    const known = (bundle.branches ?? []).map((b) => b.id);
    expect(known).not.toContain(foreign);

    const scoped = scopeBundleToBranch(
      bundle,
      resolveBranchScope(foreign, known),
    );
    expect(scoped.employees).toHaveLength(bundle.employees.length);
  });

  it("still scopes normally for a branch this tenant does have", () => {
    const own = bundle.branches![1].id;
    const known = (bundle.branches ?? []).map((b) => b.id);
    const scoped = scopeBundleToBranch(bundle, resolveBranchScope(own, known));
    expect(scoped.employees.length).toBeGreaterThan(0);
    expect(scoped.employees.length).toBeLessThan(bundle.employees.length);
  });

  it("narrows attendance along with the people", () => {
    const branchId = bundle.branches![1].id;
    const scoped = scopeBundleToBranch(bundle, branchId);
    const keep = new Set(scoped.employees.map((e) => e.id));
    expect(scoped.attendance.length).toBeLessThan(bundle.attendance.length);
    expect(scoped.attendance.every((a) => keep.has(a.employeeId))).toBe(true);
    // Reference data is untouched.
    expect(scoped.departments).toBe(bundle.departments);
  });
});

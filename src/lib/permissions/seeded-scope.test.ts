import { describe, expect, it } from "vitest";
import { DEFAULT_ACCESS_LEVELS } from "./seeds";
import { resolveEffectiveLevel } from "./resolve";
import { isOpenScope, visibleEmployees } from "./data-scope";
import ng from "@/src/data/locale/nigeria.json";
import uk from "@/src/data/locale/uk.json";
import type { LocaleBundle } from "@/src/lib/types/locale";

/**
 * End-to-end over the real seeds and the real tenant fixtures: the thing that
 * actually matters is whether logging in as a given demo role restricts what
 * comes back, which the unit tests above cannot show on their own.
 */
const BUNDLES: [string, LocaleBundle][] = [
  ["nigeria", ng as unknown as LocaleBundle],
  ["uk", uk as unknown as LocaleBundle],
];

/** Resolve a seeded access level the way `useEffectiveAccess` does. */
function seeFor(bundle: LocaleBundle, accessLevelId: string) {
  const role = bundle.roles.find((r) => r.linkedAccessLevelId === accessLevelId);
  const employeeId = role?.linkedEmployeeId;
  const access = resolveEffectiveLevel(DEFAULT_ACCESS_LEVELS, {
    accessLevelId,
  });
  return {
    employeeId,
    scope: access.dataScope,
    people: visibleEmployees(bundle.employees, access.dataScope, { employeeId }),
  };
}

describe.each(BUNDLES)("%s — seeded role scopes", (_name, bundle) => {
  it("HR Admin sees and can do everything", () => {
    const { scope, people } = seeFor(bundle, "AL-HR-ADMIN");
    expect(scope.kind).toBe("all");
    expect(isOpenScope(scope)).toBe(true);
    expect(people).toHaveLength(bundle.employees.length);

    const level = DEFAULT_ACCESS_LEVELS.find((l) => l.id === "AL-HR-ADMIN")!;
    expect(level.permissions.every((p) => p.access)).toBe(true);
    expect(level.permissions.every((p) => p.actions.includes("delete"))).toBe(
      true,
    );
  });

  it("Super Admin is equally unrestricted", () => {
    const { scope, people } = seeFor(bundle, "AL-SUPER-ADMIN");
    expect(scope.kind).toBe("all");
    expect(people).toHaveLength(bundle.employees.length);
  });

  it("HR Manager is confined to their own branch", () => {
    const { employeeId, scope, people } = seeFor(bundle, "AL-HR-MANAGER");
    expect(scope.kind).toBe("branch");

    const me = bundle.employees.find((e) => e.id === employeeId);
    expect(me?.branchId).toBeTruthy();
    expect(people.length).toBeGreaterThan(0);
    expect(people.length).toBeLessThan(bundle.employees.length);
    expect(people.every((p) => p.branchId === me!.branchId)).toBe(true);
    expect(people.some((p) => p.id === employeeId)).toBe(true);
  });

  it("Line Manager is confined to their own reports", () => {
    // Previously declared but never applied — the seed comment called a line
    // manager seeing every employee "the exact leak this closes".
    const { employeeId, scope, people } = seeFor(bundle, "AL-LINE-MANAGER");
    expect(scope.kind).toBe("direct_reports");
    expect(people.length).toBeLessThan(bundle.employees.length);
    expect(
      people.every((p) => p.id === employeeId || p.managerId === employeeId),
    ).toBe(true);
  });

  it("the Read-Only demo login still sees everyone", () => {
    // The "employee@" self-service demo login maps to Read-Only, so enforcing
    // scopes must not empty the self-service portal.
    const { scope, people } = seeFor(bundle, "AL-READ-ONLY");
    expect(scope.kind).toBe("all");
    expect(people).toHaveLength(bundle.employees.length);
  });

  it("no seeded role can widen its scope by holding another", () => {
    // Union on permissions, intersection on scope (§1.13).
    const both = resolveEffectiveLevel(DEFAULT_ACCESS_LEVELS, {
      accessLevelId: "AL-HR-MANAGER",
      accessLevelIds: ["AL-HR-MANAGER", "AL-HR-ADMIN"],
    });
    expect(both.dataScope.kind).toBe("branch");
  });
});

import { describe, expect, it } from "vitest";
import {
  allows,
  findConflicts,
  findScopeConflict,
  narrowerScope,
  resolveEffectiveLevel,
} from "./resolve";
import type { AccessLevel, DataScope } from "@/src/lib/types/access-levels";

function level(
  id: string,
  name: string,
  opts: {
    status?: AccessLevel["status"];
    scope?: DataScope;
    permissions?: AccessLevel["permissions"];
  } = {},
): AccessLevel {
  return {
    id,
    name,
    description: "",
    kind: "custom",
    status: opts.status ?? "active",
    employeeCount: 0,
    dataScope: opts.scope ?? { kind: "all" },
    createdBy: "test",
    createdAt: "2026-01-01",
    lastModifiedBy: "test",
    lastModifiedAt: "2026-01-01",
    permissions: opts.permissions ?? [],
  };
}

describe("narrowerScope", () => {
  it("prefers the narrower of two different scopes", () => {
    expect(narrowerScope({ kind: "all" }, { kind: "department" }).kind).toBe(
      "department",
    );
    expect(narrowerScope({ kind: "self" }, { kind: "direct_reports" }).kind).toBe(
      "self",
    );
  });

  it("intersects the lists when both scopes are the same kind", () => {
    // Holding two department-scoped roles must not add their departments
    // together — that would widen access, which is the bug worth guarding.
    const merged = narrowerScope(
      { kind: "department", departmentIds: ["eng", "fin"] },
      { kind: "department", departmentIds: ["fin", "ops"] },
    );
    expect(merged.departmentIds).toEqual(["fin"]);
  });

  it("treats an unknown scope kind as the narrowest (fails closed)", () => {
    const rogue = { kind: "something_new" } as unknown as DataScope;
    expect(narrowerScope({ kind: "all" }, rogue)).toBe(rogue);
  });
});

describe("resolveEffectiveLevel", () => {
  const viewer = level("V", "Viewer", {
    permissions: [
      { module: "organization.employees", access: true, actions: ["view"] },
    ],
  });
  const manager = level("M", "Manager", {
    scope: { kind: "department", departmentIds: ["eng"] },
    permissions: [
      {
        module: "organization.employees",
        access: true,
        actions: ["view", "delete"],
      },
    ],
  });

  it("falls open when no role is supplied", () => {
    const access = resolveEffectiveLevel([viewer], {});
    expect(access.unresolved).toBe(true);
    // Pre-login UI must not be broken by an unresolved user.
    expect(allows(access, "anything", "view")).toBe(true);
  });

  it("unions permissions across roles", () => {
    const access = resolveEffectiveLevel([viewer, manager], {
      accessLevelIds: ["V", "M"],
    });
    expect(allows(access, "organization.employees", "delete")).toBe(true);
    expect(allows(access, "organization.employees", "view")).toBe(true);
  });

  it("takes the narrowest data scope, not the widest", () => {
    const access = resolveEffectiveLevel([viewer, manager], {
      accessLevelIds: ["V", "M"],
    });
    expect(access.dataScope.kind).toBe("department");
  });

  it("ignores inactive roles", () => {
    const draft = level("D", "Draft", {
      status: "draft",
      permissions: [
        { module: "admin.settings", access: true, actions: ["view"] },
      ],
    });
    const access = resolveEffectiveLevel([viewer, draft], {
      accessLevelIds: ["V", "D"],
    });
    expect(allows(access, "admin.settings", "view")).toBe(false);
  });

  it("substitutes the previewed role outright, ignoring the user's own", () => {
    const access = resolveEffectiveLevel([viewer, manager], {
      accessLevelIds: ["M"],
      previewLevelId: "V",
    });
    expect(access.previewing).toBe(true);
    expect(allows(access, "organization.employees", "delete")).toBe(false);
  });

  it("grants nothing to a locked or revoked account", () => {
    for (const state of ["locked", "revoked"] as const) {
      const access = resolveEffectiveLevel([manager], {
        accessLevelIds: ["M"],
        accountState: state,
      });
      expect(allows(access, "organization.employees", "view")).toBe(false);
      expect(access.unresolved).toBe(false);
    }
  });

  it("keeps permissions but confines a restricted account to itself", () => {
    const access = resolveEffectiveLevel([manager], {
      accessLevelIds: ["M"],
      accountState: "restricted",
    });
    expect(allows(access, "organization.employees", "delete")).toBe(true);
    expect(access.dataScope.kind).toBe("self");
  });
});

describe("conflict reporting", () => {
  const a = level("A", "Role A", {
    permissions: [
      { module: "operations.assets", access: true, actions: ["view", "delete"] },
    ],
  });
  const b = level("B", "Role B", {
    scope: { kind: "self" },
    permissions: [
      { module: "operations.assets", access: true, actions: ["view"] },
    ],
  });

  it("names which role grants a contested action", () => {
    const conflicts = findConflicts([a, b]);
    const del = conflicts.find((c) => c.action === "delete");
    expect(del?.grantedBy).toEqual(["Role A"]);
    expect(del?.deniedBy).toEqual(["Role B"]);
  });

  it("does not report unanimous grants as conflicts", () => {
    expect(findConflicts([a, b]).some((c) => c.action === "view")).toBe(false);
  });

  it("reports nothing for a single role", () => {
    expect(findConflicts([a])).toEqual([]);
    expect(findScopeConflict([a])).toBeNull();
  });

  it("reports which scope won and which was overridden", () => {
    const conflict = findScopeConflict([a, b]);
    expect(conflict?.winner.kind).toBe("self");
    expect(conflict?.overridden[0]?.roleName).toBe("Role A");
  });
});

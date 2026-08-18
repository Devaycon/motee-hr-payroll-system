/**
 * The single place that answers "what can this user actually do?".
 *
 * Two client-feedback items funnel through here rather than through every
 * `useCan` call site in the app:
 *
 * - §1.10 "Test as Role" — a preview replaces the effective level outright.
 * - §1.13 Multi-role — a user holding several roles gets the *union* of their
 *   module actions but the *narrowest* of their data scopes.
 *
 * Union-on-permissions with intersection-on-scope is the deliberate pairing.
 * Union alone would let a second role silently widen whose records someone can
 * see, which is the failure mode worth designing against: being handed an extra
 * role should never quietly expose more people's data.
 */
import type {
  AccessLevel,
  DataScope,
  DataScopeKind,
  ModulePermission,
  PermissionAction,
} from "@/src/lib/types/access-levels";

/**
 * A deactivated or draft role grants nothing even though its permission rows
 * are intact (§1.7). Keeping the rows is the point — the role can be switched
 * back on without being rebuilt.
 */
export function isAssignable(level: AccessLevel): boolean {
  return (level.status ?? "active") === "active";
}

/** Narrowest first. A lower index wins when two roles disagree. */
const SCOPE_BREADTH: DataScopeKind[] = [
  "self",
  "direct_reports",
  "department",
  "business_unit",
  "all",
];

function scopeRank(kind: DataScopeKind): number {
  const i = SCOPE_BREADTH.indexOf(kind);
  // An unrecognised scope is treated as the narrowest possible, so a future
  // scope kind fails closed rather than granting everything.
  return i === -1 ? 0 : i;
}

/**
 * The narrower of two scopes. Where both are the same kind, the *intersection*
 * of their department/business-unit lists is taken — holding two
 * department-scoped roles should not add their departments together.
 */
export function narrowerScope(a: DataScope, b: DataScope): DataScope {
  const rankA = scopeRank(a.kind);
  const rankB = scopeRank(b.kind);
  if (rankA !== rankB) return rankA < rankB ? a : b;

  const intersect = (x?: string[], y?: string[]): string[] | undefined => {
    if (!x) return y;
    if (!y) return x;
    const set = new Set(y);
    return x.filter((v) => set.has(v));
  };

  return {
    kind: a.kind,
    departmentIds: intersect(a.departmentIds, b.departmentIds),
    businessUnits: intersect(a.businessUnits, b.businessUnits),
  };
}

export interface EffectiveAccess {
  /** Merged module permissions. Empty when the user holds no usable role. */
  permissions: ModulePermission[];
  dataScope: DataScope;
  /** The roles that contributed, for the §1.13 conflict panel. */
  sourceLevels: AccessLevel[];
  /** True when a §1.10 preview is driving this answer. */
  previewing: boolean;
  /**
   * True when no role could be resolved at all. Callers fall open in this case
   * so pre-login UI and demo links aren't broken.
   */
  unresolved: boolean;
}

export interface ResolveInput {
  /** The user's primary role. */
  accessLevelId?: string | null;
  /** §1.13 — every role the user holds, including the primary one. */
  accessLevelIds?: string[] | null;
  /** §1.10 — when set, this role alone is the effective level. */
  previewLevelId?: string | null;
  /**
   * §4.14 — the account's administrative state. A locked or revoked account
   * grants nothing; a restricted one keeps its permissions but is confined to
   * its own record, whatever its roles say.
   */
  accountState?: "active" | "locked" | "restricted" | "revoked" | null;
}

const OPEN_SCOPE: DataScope = { kind: "all" };

/** Merge many roles' module rows into one, taking the union of actions. */
function unionPermissions(levels: AccessLevel[]): ModulePermission[] {
  const byModule = new Map<string, ModulePermission>();
  for (const level of levels) {
    for (const perm of level.permissions) {
      const existing = byModule.get(perm.module);
      if (!existing) {
        byModule.set(perm.module, {
          module: perm.module,
          access: perm.access,
          actions: [...perm.actions],
        });
        continue;
      }
      existing.access = existing.access || perm.access;
      for (const action of perm.actions) {
        if (!existing.actions.includes(action)) existing.actions.push(action);
      }
    }
  }
  return [...byModule.values()];
}

export function resolveEffectiveLevel(
  levels: AccessLevel[],
  input: ResolveInput,
): EffectiveAccess {
  const byId = new Map(levels.map((l) => [l.id, l]));

  // §1.10 — a preview is an outright substitution. It intentionally ignores
  // the previewer's own roles: the whole point is to see the app as the
  // previewed role sees it, not as the union of both.
  if (input.previewLevelId) {
    const level = byId.get(input.previewLevelId);
    if (level) {
      return {
        permissions: isAssignable(level) ? level.permissions : [],
        dataScope: level.dataScope ?? OPEN_SCOPE,
        sourceLevels: [level],
        previewing: true,
        unresolved: false,
      };
    }
  }

  // §4.14 — an account that has been locked or revoked holds no permissions,
  // regardless of how many roles it was assigned. Checked before the roles are
  // even resolved so there is no path around it.
  if (input.accountState === "locked" || input.accountState === "revoked") {
    return {
      permissions: [],
      dataScope: { kind: "self" },
      sourceLevels: [],
      previewing: false,
      unresolved: false,
    };
  }

  const ids = new Set<string>();
  if (input.accessLevelId) ids.add(input.accessLevelId);
  for (const id of input.accessLevelIds ?? []) ids.add(id);

  if (ids.size === 0) {
    return {
      permissions: [],
      dataScope: OPEN_SCOPE,
      sourceLevels: [],
      previewing: false,
      unresolved: true,
    };
  }

  const held = [...ids].map((id) => byId.get(id)).filter(Boolean) as AccessLevel[];
  // Ids that resolve to nothing mean the store hasn't caught up with the
  // session — fall open rather than locking the user out of their own app.
  if (held.length === 0) {
    return {
      permissions: [],
      dataScope: OPEN_SCOPE,
      sourceLevels: [],
      previewing: false,
      unresolved: true,
    };
  }

  const usable = held.filter(isAssignable);
  if (usable.length === 0) {
    return {
      permissions: [],
      dataScope: { kind: "self" },
      sourceLevels: held,
      previewing: false,
      unresolved: false,
    };
  }

  const mergedScope = usable
    .map((l) => l.dataScope ?? OPEN_SCOPE)
    .reduce(narrowerScope, OPEN_SCOPE);

  return {
    permissions: unionPermissions(usable),
    // §4.14 — a restriction is applied on top of the roles, not instead of
    // them: they keep what they can *do*, but only against their own record.
    dataScope:
      input.accountState === "restricted"
        ? narrowerScope(mergedScope, { kind: "self" })
        : mergedScope,
    sourceLevels: usable,
    previewing: false,
    unresolved: false,
  };
}

/** Does the resolved access allow `action` on `moduleId`? */
export function allows(
  access: EffectiveAccess,
  moduleId: string,
  action: PermissionAction,
): boolean {
  if (access.unresolved) return true;
  const perm = access.permissions.find((p) => p.module === moduleId);
  if (!perm?.access) return false;
  return perm.actions.includes(action);
}

/** Does the resolved access allow *any* of `actions` on `moduleId`? */
export function allowsAny(
  access: EffectiveAccess,
  moduleId: string,
  actions: PermissionAction[],
): boolean {
  if (access.unresolved) return true;
  const perm = access.permissions.find((p) => p.module === moduleId);
  if (!perm?.access) return false;
  return actions.some((a) => perm.actions.includes(a));
}

// ── §1.13 conflict reporting ────────────────────────────────────────────────

export interface PermissionConflict {
  moduleId: string;
  action: PermissionAction;
  /** Role names that grant it. */
  grantedBy: string[];
  /** Role names that do not. */
  deniedBy: string[];
}

export interface ScopeConflict {
  /** The scope that won (the narrowest). */
  winner: DataScope;
  winnerRoles: string[];
  /** Scopes that were overridden, with the roles that asked for them. */
  overridden: { scope: DataScope; roleName: string }[];
}

/**
 * Where the user's roles disagree. A silent union is exactly what the client
 * objected to — this is what the conflict panel renders, so an admin can see
 * that "Manager" is the reason someone can delete records.
 */
export function findConflicts(levels: AccessLevel[]): PermissionConflict[] {
  const usable = levels.filter(isAssignable);
  if (usable.length < 2) return [];

  const conflicts: PermissionConflict[] = [];
  const modules = new Set(
    usable.flatMap((l) => l.permissions.map((p) => p.module)),
  );

  for (const moduleId of modules) {
    const actions = new Set<PermissionAction>();
    for (const level of usable) {
      const perm = level.permissions.find((p) => p.module === moduleId);
      if (perm?.access) for (const a of perm.actions) actions.add(a);
    }

    for (const action of actions) {
      const grantedBy: string[] = [];
      const deniedBy: string[] = [];
      for (const level of usable) {
        const perm = level.permissions.find((p) => p.module === moduleId);
        if (perm?.access && perm.actions.includes(action)) {
          grantedBy.push(level.name);
        } else {
          deniedBy.push(level.name);
        }
      }
      // Only a genuine disagreement is a conflict; unanimous grants are not.
      if (grantedBy.length > 0 && deniedBy.length > 0) {
        conflicts.push({ moduleId, action, grantedBy, deniedBy });
      }
    }
  }

  return conflicts;
}

export function findScopeConflict(levels: AccessLevel[]): ScopeConflict | null {
  const usable = levels.filter(isAssignable);
  if (usable.length < 2) return null;

  const winner = usable
    .map((l) => l.dataScope ?? OPEN_SCOPE)
    .reduce(narrowerScope, OPEN_SCOPE);

  const winnerRank = scopeRank(winner.kind);
  const winnerRoles = usable
    .filter((l) => scopeRank((l.dataScope ?? OPEN_SCOPE).kind) === winnerRank)
    .map((l) => l.name);
  const overridden = usable
    .filter((l) => scopeRank((l.dataScope ?? OPEN_SCOPE).kind) > winnerRank)
    .map((l) => ({ scope: l.dataScope ?? OPEN_SCOPE, roleName: l.name }));

  return overridden.length > 0
    ? { winner, winnerRoles, overridden }
    : null;
}

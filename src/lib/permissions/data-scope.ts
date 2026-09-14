import { SELF_RELATIVE_SCOPES, type DataScope } from "@/src/lib/types/access-levels";
import { filterBundleToEmployees } from "@/src/lib/branches/scope";
import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";

/**
 * Turns a role's `DataScope` into the set of people it can actually see.
 *
 * This is the enforcement half of §1.4. The scope kind was resolved and stored
 * for a long time but never applied to a single row, which made "Assigned
 * departments" a label rather than a restriction. It is applied in exactly one
 * place — `useLocaleSection` — so a new screen cannot forget it.
 *
 * Unlike the branch *view* switcher, this is a floor: a read that opts out of
 * the view scope still gets this.
 */

export interface ScopeViewer {
  /** The signed-in user's employee id, when there is one. */
  employeeId?: string | null;
}

/** Whether `scope` restricts anything at all, given who is looking. */
export function isOpenScope(scope: DataScope): boolean {
  if (scope.kind === "all") return true;
  // No entity corresponds to a business unit on an employee record, so there
  // is nothing to match against — it stays open rather than failing closed and
  // emptying the app for the roles that ship with it.
  if (scope.kind === "business_unit") return true;
  return false;
}

/**
 * The ids `scope` confines the viewer to, resolved against the viewer's own
 * record when the role names no explicit list (see `SELF_RELATIVE_SCOPES`).
 * Returns null when the kind is not list-based.
 */
function resolveIds(
  scope: DataScope,
  viewer: LocaleEmployee | undefined,
): Set<string> | null {
  if (!SELF_RELATIVE_SCOPES.includes(scope.kind)) return null;
  const isBranch = scope.kind === "branch";
  const explicit =
    (isBranch ? scope.branchIds : scope.departmentIds)?.filter(Boolean) ?? [];
  if (explicit.length > 0) return new Set(explicit);
  const own = isBranch ? viewer?.branchId : viewer?.departmentId;
  return new Set(own ? [own] : []);
}

/** The employees `scope` permits `viewer` to see, out of `employees`. */
export function visibleEmployees(
  employees: LocaleEmployee[],
  scope: DataScope,
  viewer: ScopeViewer,
): LocaleEmployee[] {
  if (isOpenScope(scope)) return employees;

  const viewerId = viewer.employeeId ?? undefined;
  const me = viewerId ? employees.find((e) => e.id === viewerId) : undefined;

  switch (scope.kind) {
    case "self":
      return me ? [me] : [];

    case "direct_reports": {
      if (!viewerId) return me ? [me] : [];
      // A manager's own record is always in view — a list that excluded them
      // would break the profile and approval screens they reach from it.
      const reports = employees.filter((e) => e.managerId === viewerId);
      return me ? [me, ...reports] : reports;
    }

    case "branch": {
      const ids = resolveIds(scope, me);
      if (!ids || ids.size === 0) return me ? [me] : [];
      return employees.filter((e) => e.branchId && ids.has(e.branchId));
    }

    case "department": {
      const ids = resolveIds(scope, me);
      if (!ids || ids.size === 0) return me ? [me] : [];
      return employees.filter((e) => ids.has(e.departmentId));
    }

    default:
      return employees;
  }
}

/** The branch ids `scope` permits, or null when every branch is allowed. */
export function allowedBranchIds(
  bundle: LocaleBundle | null,
  scope: DataScope,
  viewer: ScopeViewer,
): Set<string> | null {
  if (!bundle || isOpenScope(scope)) return null;
  // For every other kind the answer is "wherever the people I can see work",
  // which keeps the branch switcher honest for a direct-reports or
  // department-scoped role too.
  const visible = visibleEmployees(bundle.employees, scope, viewer);
  return new Set(
    visible.map((e) => e.branchId).filter((id): id is string => Boolean(id)),
  );
}

/**
 * A bundle narrowed to what `scope` permits. Returns the same object reference
 * when nothing is restricted, so the common case allocates nothing.
 */
export function scopeBundleToAccess(
  bundle: LocaleBundle,
  scope: DataScope,
  viewer: ScopeViewer,
): LocaleBundle {
  if (isOpenScope(scope)) return bundle;

  const employees = visibleEmployees(bundle.employees, scope, viewer);
  if (employees.length === bundle.employees.length) return bundle;

  const scoped = filterBundleToEmployees(bundle, employees);
  // The branch list narrows too, or the switcher would offer sites whose
  // people the role cannot see.
  const branchIds = new Set(
    employees.map((e) => e.branchId).filter(Boolean) as string[],
  );
  if (scoped.branches) {
    scoped.branches = scoped.branches.filter((b) => branchIds.has(b.id));
  }
  return scoped;
}

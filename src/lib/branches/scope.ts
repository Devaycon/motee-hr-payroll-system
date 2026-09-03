import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";

/**
 * Narrows a locale bundle to a single branch.
 *
 * This is the one place branch scoping happens. Every screen reads through
 * `useLocaleSection`, and dashboards and reports aggregate straight off
 * `bundle.employees` rather than off filtered table rows — so scoping the
 * bundle is what keeps a stat card and the table beneath it telling the same
 * story. A per-toolbar filter could not.
 *
 * Employees are filtered directly; everything owned *by* an employee follows
 * from the surviving ids. Company-wide reference data (departments, roles,
 * settings, the branch list itself) is deliberately left whole.
 */

/** Collections keyed by `employeeId`, filtered to the branch's people. */
const EMPLOYEE_KEYED = [
  "attendance",
  "leaveRequests",
  "leaveBalances",
  "leaveAdjustments",
  "contracts",
  "documents",
  "expenses",
  "employmentHistory",
  "locationBookings",
  "payHistory",
  "dbsChecks",
  "disciplinaries",
  "medicalFacts",
  "employeeNotes",
  "employeeChecklists",
  "offboarding",
  "assets",
  "kudos",
  "tasks",
  "grievances",
  "helpdeskTickets",
] as const satisfies readonly (keyof LocaleBundle)[];

/**
 * Fields that can carry the employee id on those collections. `kudos` records
 * a sender and a recipient; assets and tickets vary by fixture generation.
 */
const ID_FIELDS = [
  "employeeId",
  "toEmployeeId",
  "assignedToId",
  "assigneeId",
  "raisedById",
  "ownerId",
] as const;

function belongsTo(record: unknown, keep: Set<string>): boolean {
  if (!record || typeof record !== "object") return true;
  const row = record as Record<string, unknown>;
  let sawIdField = false;
  for (const field of ID_FIELDS) {
    const value = row[field];
    if (typeof value !== "string") continue;
    sawIdField = true;
    if (keep.has(value)) return true;
  }
  // A record with no employee reference at all is company-wide — keep it
  // rather than silently dropping it.
  return !sawIdField;
}

function filterCollection(value: unknown, keep: Set<string>): unknown {
  if (!Array.isArray(value)) return value;
  const next = value.filter((row) => belongsTo(row, keep));
  return next.length === value.length ? value : next;
}

/**
 * A bundle narrowed to `employees` — everything owned by someone outside that
 * set is dropped, company-wide reference data is kept whole.
 *
 * Shared by the branch view switcher and by role data-scope enforcement
 * (`lib/permissions/data-scope.ts`), so the two can never disagree about which
 * collections belong to a person. Always returns a new object.
 */
export function filterBundleToEmployees(
  bundle: LocaleBundle,
  employees: LocaleEmployee[],
): LocaleBundle {
  const keep = new Set(employees.map((e) => e.id));
  const scoped: LocaleBundle = { ...bundle, employees };
  const writable = scoped as unknown as Record<string, unknown>;

  for (const key of EMPLOYEE_KEYED) {
    const filtered = filterCollection(bundle[key], keep);
    if (filtered !== bundle[key]) writable[key] = filtered;
  }

  // The reporting tree is person-to-person, so it uses its own id fields.
  if (Array.isArray(bundle.orgStructure)) {
    scoped.orgStructure = bundle.orgStructure.filter((node) => {
      const id = (node as Record<string, unknown>).employeeId;
      return typeof id === "string" ? keep.has(id) : true;
    });
  }

  return scoped;
}

/**
 * The branch id to actually scope by, or null for "all branches".
 *
 * A saved selection outlives the tenant it was made in: `motee:branch` is
 * restored from localStorage on load, and the branch slice only clears on an
 * explicit tenant switch — so a branch picked under one tenant comes back
 * under another, matching nobody. Filtering by it emptied every screen while
 * the switcher, which resolves the id before displaying it, still read
 * "All Branches".
 *
 * Treating an unresolvable selection as no selection keeps the two in step and
 * makes the stale value self-healing.
 */
export function resolveBranchScope(
  activeBranchId: string | null | undefined,
  knownBranchIds: Iterable<string>,
): string | null {
  if (!activeBranchId) return null;
  for (const id of knownBranchIds) {
    if (id === activeBranchId) return activeBranchId;
  }
  return null;
}

/**
 * Returns a bundle narrowed to `branchId`, or the *same object reference* when
 * `branchId` is null. The identity return matters: it is the default path, and
 * re-allocating a ~2 MB object on every render would invalidate every
 * downstream `useMemo`.
 */
export function scopeBundleToBranch(
  bundle: LocaleBundle,
  branchId: string | null,
): LocaleBundle {
  if (!branchId) return bundle;

  const employees = bundle.employees.filter((e) => e.branchId === branchId);
  if (employees.length === bundle.employees.length) return bundle;

  return filterBundleToEmployees(bundle, employees);
}

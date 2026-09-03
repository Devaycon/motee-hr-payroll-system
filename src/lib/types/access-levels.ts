export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "approve"
  /** Configure the module itself — settings, templates, workflow rules (§1.3). */
  | "administer";

/**
 * Actions that imply others (client feedback §1.11). An approver who cannot
 * view the queue cannot approve anything, so granting the dependent action
 * grants its prerequisites too.
 */
export const ACTION_DEPENDENCIES: Partial<
  Record<PermissionAction, PermissionAction[]>
> = {
  create: ["view"],
  edit: ["view"],
  delete: ["view"],
  export: ["view"],
  approve: ["view"],
  administer: ["view", "edit"],
};

/** Expand a set of actions to include everything they depend on. */
export function withDependencies(
  actions: PermissionAction[],
): PermissionAction[] {
  const out = new Set(actions);
  for (const a of actions) {
    for (const dep of ACTION_DEPENDENCIES[a] ?? []) out.add(dep);
  }
  return [...out];
}

/** Actions that would break if `action` were removed. */
export function dependentsOf(action: PermissionAction): PermissionAction[] {
  return (
    Object.entries(ACTION_DEPENDENCIES) as [
      PermissionAction,
      PermissionAction[],
    ][]
  )
    .filter(([, deps]) => deps.includes(action))
    .map(([a]) => a);
}

export interface ModulePermission {
  module: string;
  access: boolean;
  actions: PermissionAction[];
}

/**
 * Which records a role can see, independent of which modules it can open
 * (client feedback §1.4). Module access answers "can they open Employees";
 * this answers "whose employee records do they get back".
 */
export type DataScopeKind =
  | "all"
  | "business_unit"
  | "branch"
  | "department"
  | "direct_reports"
  | "self";

export interface DataScope {
  kind: DataScopeKind;
  /** Departments the role is confined to when kind is "department". */
  departmentIds?: string[];
  /** Branches the role is confined to when kind is "branch". */
  branchIds?: string[];
  /** Business units the role is confined to when kind is "business_unit". */
  businessUnits?: string[];
}

export const DATA_SCOPE_LABELS: Record<DataScopeKind, string> = {
  all: "All records",
  business_unit: "Assigned business units",
  branch: "Assigned branches",
  department: "Assigned departments",
  direct_reports: "Direct reports only",
  self: "Own record only",
};

export const DATA_SCOPE_DESCRIPTIONS: Record<DataScopeKind, string> = {
  all: "No restriction — sees every record in every module they can open.",
  business_unit: "Sees only records belonging to the business units assigned below.",
  branch:
    "Sees only people posted to the branches assigned below. Leave the list empty to confine the role to whichever branch the holder works at.",
  department:
    "Sees only records belonging to the departments assigned below. Leave the list empty to confine the role to the holder's own department.",
  direct_reports: "Sees only the people who report to them.",
  self: "Sees only their own record.",
};

/**
 * Scope kinds resolved against an attribute the holder carries themselves, so
 * an empty list means "their own" rather than "no restriction". This is what
 * lets a seeded role say `{ kind: "branch" }` and stay tenant-agnostic —
 * branch ids differ between the NG and UK bundles.
 *
 * `business_unit` is deliberately not in here: no employee field corresponds
 * to it, so an empty list has nothing to resolve against and stays open.
 */
export const SELF_RELATIVE_SCOPES: DataScopeKind[] = ["branch", "department"];

/** Lifecycle of the role itself (client feedback §1.7). */
export type AccessLevelStatus = "active" | "inactive" | "draft";

export const ACCESS_LEVEL_STATUS_LABELS: Record<AccessLevelStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  draft: "Draft",
};

export const ACCESS_LEVEL_STATUS_STYLES: Record<AccessLevelStatus, string> = {
  active:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inactive: "border-border bg-muted text-muted-foreground",
  draft:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export interface AccessLevel {
  id: string;
  name: string;
  description: string;
  kind: "default" | "custom";
  /** §1.7 — inactive and draft roles cannot be assigned to anyone. */
  status: AccessLevelStatus;
  employeeCount: number;
  /** §1.4 — the record-level restriction applied on top of module access. */
  dataScope: DataScope;
  /** §1.8 — usage signals that make an obsolete role obvious. */
  createdBy: string;
  createdAt: string;
  lastUsedAt?: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  permissions: ModulePermission[];
}

export interface NewAccessLevel {
  name: string;
  description: string;
  status: AccessLevelStatus;
  dataScope: DataScope;
  permissions: ModulePermission[];
}

/**
 * One entry in the role assignment audit trail (client feedback §1.6) — who
 * moved between roles, when, who did it and why.
 */
export interface RoleAssignmentEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  previousRoleId: string | null;
  previousRoleName: string;
  newRoleId: string;
  newRoleName: string;
  changedBy: string;
  /** ISO date-time. */
  changedAt: string;
  reason: string;
}

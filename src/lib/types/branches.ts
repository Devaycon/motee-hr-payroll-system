/**
 * A physical site the company operates from. Branches are an organisational
 * and reporting axis only — departments stay company-wide, and an employee
 * belongs to exactly one branch via `LocaleEmployee.branchId`.
 *
 * The switcher built on this is a *view* scope, not a security boundary; role
 * data scopes live separately in `lib/types/access-levels.ts`.
 */
export type BranchKind =
  | "headquarters"
  | "branch"
  | "regional_office"
  | "site"
  | "remote";

export type BranchStatus = "active" | "inactive";

export const BRANCH_KIND_LABELS: Record<BranchKind, string> = {
  headquarters: "Head Office",
  branch: "Branch",
  regional_office: "Regional Office",
  site: "Site",
  remote: "Remote",
};

export const BRANCH_STATUS_LABELS: Record<BranchStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

/** Matches the badge vocabulary used by departments and access levels. */
export const BRANCH_STATUS_STYLES: Record<BranchStatus, string> = {
  active:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  inactive: "border-border bg-muted text-muted-foreground",
};

/** Raw record as it lives in the locale bundle (`bundle.branches`). */
export interface LocaleBranch {
  id: string;
  tenantId: string;
  name: string;
  /** Short display code, e.g. "LAG". Unique within the tenant. */
  code: string;
  kind: BranchKind;
  status: BranchStatus;
  addressLines?: string[];
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  timezone?: string;
  phone?: string;
  email?: string;
  /** Branch head. Null when nobody has been named yet. */
  managerEmployeeId?: string | null;
  headcountTarget?: number;
  openedAt?: string;
}

/** View model — derived counts layered over the raw record. */
export interface Branch extends LocaleBranch {
  managerName: string | null;
  managerInitials?: string;
  employeeCount: number;
  /** Distinct departments with at least one person at this branch. */
  departmentCount: number;
  openPositions: number;
  /** Flattened single-line address, for tables and cards. */
  addressLabel: string;
}

/** The shape the create/edit modals collect. */
export interface NewBranch {
  name: string;
  code: string;
  kind: BranchKind;
  status: BranchStatus;
  addressLines: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  managerEmployeeId: string;
  headcountTarget: string;
  openedAt: string;
}

/** Joins the address parts the way the company-profile header already does. */
export function branchAddressLabel(branch: LocaleBranch): string {
  return [
    ...(branch.addressLines ?? []),
    branch.city,
    branch.region,
    branch.postalCode,
    branch.country,
  ]
    .filter(Boolean)
    .join(", ");
}

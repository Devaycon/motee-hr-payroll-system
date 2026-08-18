/**
 * §4.14 — user account administration.
 *
 * Roles & Permissions manages *definitions*: what a role called "HR Manager"
 * may do. This is the operational counterpart — what has happened to a
 * particular person's account. The two were conflated, which is why there was
 * nowhere to lock an account or force a password reset.
 */

export type UserAccountState =
  | "active"
  /** Temporarily barred from signing in — reversible. */
  | "locked"
  /** Signed in but confined to a narrower data scope than their role grants. */
  | "restricted"
  /** Access withdrawn entirely; the record is kept for audit. */
  | "revoked";

export const USER_STATE_LABELS: Record<UserAccountState, string> = {
  active: "Active",
  locked: "Locked",
  restricted: "Restricted",
  revoked: "Revoked",
};

export const USER_STATE_STYLES: Record<UserAccountState, string> = {
  active:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  locked:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  restricted:
    "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  revoked: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

/**
 * Everything the admin can change about an account, layered over the account
 * derived from the locale bundle. Only accounts that have actually been acted
 * on get an entry — an absent override means "as issued".
 */
export interface UserAccountOverride {
  state?: UserAccountState;
  /** Why the account was locked/restricted/revoked, for the audit trail. */
  reason?: string;
  /** ISO timestamp of the last state change. */
  changedAt?: string;
  changedBy?: string;
  /** §1.13 — extra roles granted on top of the account's primary role. */
  accessLevelIds?: string[];
  /** ISO timestamp of the last forced password reset. */
  passwordResetAt?: string;
  /** Set while a reset is outstanding — they must change it at next sign-in. */
  mustChangePassword?: boolean;
}

/** An account as the Users table renders it: bundle data plus any override. */
export interface UserAccount {
  /** The locale role id this account is derived from. */
  id: string;
  name: string;
  email: string;
  roleName: string;
  /** Primary access level. */
  accessLevelId: string;
  /** Every access level held, primary first (§1.13). */
  accessLevelIds: string[];
  employeeId: string;
  initials: string;
  jobTitle: string;
  departmentName: string;
  state: UserAccountState;
  reason?: string;
  changedAt?: string;
  changedBy?: string;
  passwordResetAt?: string;
  mustChangePassword?: boolean;
}

/** Can this account currently sign in? */
export function canSignIn(account: UserAccount): boolean {
  return account.state === "active" || account.state === "restricted";
}

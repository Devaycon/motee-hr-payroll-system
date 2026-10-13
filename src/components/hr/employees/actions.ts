import type { EmployeeStatus } from "@/src/lib/types/employees";

/**
 * Employee row actions and which of them are live for a given lifecycle status
 * (client feedback §1.2/§1.3).
 *
 * Disabled actions are still rendered — greyed rather than hidden — so the full
 * action set is visible on every row.
 *
 * Two rules are confirmed by the client:
 *   - an inactive employee cannot be sent kudos;
 *   - an exited / inactive employee cannot be sent login credentials.
 *
 * The rest of the matrix is our proposed default and is deliberately expressed
 * as one literal below so it is a single edit when the client returns the full
 * tab-by-action matrix.
 *
 * TODO: add the deferred provisioning action (feedback §1.2) once defined.
 */
export type EmployeeAction =
  | "view"
  | "edit"
  | "credentials"
  /** §3.1 — reissue an onboarding link that lapsed or was ignored. */
  | "resend_invite"
  /** §3.1 — everything that has happened to this employee record. */
  | "activity_log"
  | "kudos"
  | "deactivate"
  | "reactivate"
  | "exit"
  | "delete"
  | "restore";

type Matrix = Record<EmployeeStatus, readonly EmployeeAction[]>;

/**
 * Actions enabled per status. Anything absent renders disabled.
 *
 * "activity_log" is available on every live status — the audit trail is the
 * one thing you always want to be able to read, including for a leaver.
 * "resend_invite" only makes sense while onboarding is still in flight.
 */
const ENABLED: Matrix = {
  active: ["view", "edit", "credentials", "activity_log", "kudos", "deactivate", "exit", "delete"],
  on_leave: ["view", "edit", "credentials", "activity_log", "kudos", "deactivate", "exit", "delete"],
  probation: ["view", "edit", "credentials", "activity_log", "kudos", "deactivate", "exit", "delete"],
  onboarded: ["view", "edit", "credentials", "activity_log", "kudos", "deactivate", "exit", "delete"],
  // Notice already served — no second exit, and kudos would be tone-deaf.
  offboarding: ["view", "edit", "credentials", "activity_log", "deactivate", "delete"],
  // Onboarding still in flight — they are not yet a live employee, and this
  // is the only status where resending the onboarding invite is meaningful.
  pending: ["view", "edit", "credentials", "resend_invite", "activity_log", "delete"],
  // Confirmed: no credentials, no kudos for a leaver.
  inactive: ["view", "edit", "activity_log", "reactivate", "delete"],
  deleted: ["view", "activity_log", "restore"],
};

export function isActionEnabled(
  action: EmployeeAction,
  status: EmployeeStatus,
): boolean {
  return ENABLED[status]?.includes(action) ?? false;
}

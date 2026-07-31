import type { OffboardingStatus } from "@/src/lib/types/offboarding";

/**
 * Offboarding row actions and which are live per status
 * (client feedback §2.2/§2.3).
 *
 * As with the Employees table, disabled actions stay visible but greyed. The
 * "All" tab needs no special handling — it uses each row's actual status.
 */
export type OffboardingAction =
  | "viewChecklist"
  | "approve"
  | "disapprove"
  | "reactivate"
  | "revokeAccess"
  | "scheduleInterview"
  | "generateDocuments"
  | "edit"
  | "remove";

type Matrix = Record<OffboardingStatus, readonly OffboardingAction[]>;

const ENABLED: Matrix = {
  pending: ["viewChecklist", "approve", "disapprove", "edit", "remove"],
  approved: [
    "viewChecklist",
    "revokeAccess",
    "generateDocuments",
    "scheduleInterview",
    "reactivate",
    "edit",
    "remove",
  ],
  // Clearance underway — same affordances as `approved`.
  in_progress: [
    "viewChecklist",
    "revokeAccess",
    "generateDocuments",
    "scheduleInterview",
    "reactivate",
    "edit",
    "remove",
  ],
  completed: ["viewChecklist", "generateDocuments", "reactivate", "remove"],
  disapproved: ["viewChecklist", "reactivate", "edit", "remove"],
  reactivated: ["viewChecklist", "edit", "remove"],
  cancelled: ["viewChecklist", "reactivate", "edit", "remove"],
};

export function isActionEnabled(
  action: OffboardingAction,
  status: OffboardingStatus,
): boolean {
  return ENABLED[status]?.includes(action) ?? false;
}

/** Tabs requested in client feedback §2.1, and the statuses each one covers. */
export const OFFBOARDING_TABS: {
  value: string;
  label: string;
  statuses?: readonly OffboardingStatus[];
}[] = [
  { value: "pending", label: "Pending Offboarding", statuses: ["pending"] },
  {
    value: "approved",
    label: "Approved Offboarding",
    statuses: ["approved", "in_progress", "completed"],
  },
  {
    value: "disapproved",
    label: "Disapproved Offboarding",
    statuses: ["disapproved"],
  },
  { value: "reactivated", label: "Reactivated", statuses: ["reactivated"] },
  { value: "all", label: "All" },
];

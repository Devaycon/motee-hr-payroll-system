/**
 * Offboarding lifecycle (client feedback §2.1).
 *
 * `pending` → `approved` → clearance (`in_progress`) → `completed`, with
 * `disapproved` and `reactivated` as the two ways a record leaves the pipeline
 * without the employee actually exiting. `cancelled` is retained for records
 * seeded from the locale bundle.
 */
export type OffboardingStatus =
  | "pending"
  | "approved"
  | "disapproved"
  | "in_progress"
  | "completed"
  | "reactivated"
  | "cancelled";

/** Statuses that mean the exit is still live — the employee has notice served. */
export const OPEN_OFFBOARDING_STATUSES: readonly OffboardingStatus[] = [
  "pending",
  "approved",
  "in_progress",
];

export function isOpenOffboardingStatus(status: OffboardingStatus): boolean {
  return OPEN_OFFBOARDING_STATUSES.includes(status);
}

export type ExitReason =
  | "resignation"
  | "termination"
  | "redundancy"
  | "retirement"
  | "contract_end"
  | "other";

export interface ClearanceItem {
  id: string;
  label: string;
  department: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface OffboardingRecord {
  id: string;
  /** Links the record back to the employee row so both tables stay in sync. */
  employeeId?: string;
  employeeName: string;
  employeeInitials: string;
  jobTitle: string;
  department: string;
  lastWorkingDate: string;
  exitReason: ExitReason;
  status: OffboardingStatus;
  clearanceItems: ClearanceItem[];
  exitInterviewCompleted: boolean;
  exitInterviewNotes?: string;
  initiatedAt: string;
  workflowTemplateId?: string;
  approvedAt?: string;
  approvedBy?: string;
  disapprovedAt?: string;
  disapprovedBy?: string;
  disapprovalReason?: string;
  reactivatedAt?: string;
  reactivatedBy?: string;
  /** Set by the "Revoke System Access" action. */
  systemAccessRevokedAt?: string;
  /** Scheduled date for the exit interview, distinct from its completion. */
  exitInterviewScheduledAt?: string;
  /** Set by "Generate Exit Documents". */
  exitDocumentsGeneratedAt?: string;
}

export interface NewOffboardingRecord {
  employeeId?: string;
  employeeName: string;
  employeeInitials: string;
  jobTitle: string;
  department: string;
  lastWorkingDate: string;
  exitReason: ExitReason;
  exitInterviewNotes?: string;
  workflowTemplateId?: string;
}

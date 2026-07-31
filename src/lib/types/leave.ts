/**
 * Multi-stage approval states (client feedback round 2, §F4). A request enters
 * as `pending` and advances through the stages defined by the active
 * `ApprovalChainTemplate` for `leave_request` before reaching `approved`.
 */
export type LeaveStatus =
  | "pending"
  | "awaiting_manager"
  | "awaiting_hr"
  | "approved"
  | "rejected"
  | "cancelled";

/** Statuses that still need someone to act. */
export const OPEN_LEAVE_STATUSES: readonly LeaveStatus[] = [
  "pending",
  "awaiting_manager",
  "awaiting_hr",
];

export function isOpenLeaveStatus(status: LeaveStatus): boolean {
  return OPEN_LEAVE_STATUSES.includes(status);
}

/** One entry in a request's audit trail. */
export interface LeaveHistoryEntry {
  id: string;
  /** ISO datetime. */
  at: string;
  /** What happened, e.g. "Submitted", "Approved by manager". */
  action: string;
  /** Who did it. */
  actor: string;
  /** Status the request moved into, when the action was a transition. */
  toStatus?: LeaveStatus;
  /** Free-text comment left by the approver. */
  comment?: string;
}

/** A document attached in support of a request. */
export interface LeaveDocument {
  id: string;
  name: string;
  /** Bytes, for display. */
  size?: number;
  /** Data URL or remote href. */
  url?: string;
  uploadedAt: string;
}

export type LeaveTypeName =
  | "annual"
  | "sick"
  | "maternity"
  | "paternity"
  | "unpaid"
  | "compassionate"
  | "study";

export interface LeaveRequest {
  id: string;
  /** FK to the employee record; absent on legacy/demo rows. */
  employeeId?: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  /** Line manager, for the approval chain and the on-leave drill-down. */
  managerName?: string;
  /** Office / site, used by the location filter. */
  location?: string;
  /** Employment type, used by the employment-type filter. */
  employmentType?: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: "morning" | "afternoon";
  status: LeaveStatus;
  /** Why the leave is being taken — distinct from internal `notes`. */
  reason?: string;
  notes?: string;
  /**
   * Colleague nominated to cover this employee while they are away
   * (client feedback §3). Optional and purely informational — the relief
   * employee is not asked to accept.
   */
  reliefEmployeeId?: string;
  reliefEmployeeName?: string;
  /** Supporting evidence, e.g. a fit note for sick leave. */
  documents?: LeaveDocument[];
  /** Append-only audit trail of every transition. */
  history?: LeaveHistoryEntry[];
  submittedAt: string;
  /** Who raised it, when it differs from the employee. */
  submittedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}

export interface NewLeaveRequest {
  employeeId?: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  managerName?: string;
  location?: string;
  employmentType?: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: "morning" | "afternoon";
  reason?: string;
  notes?: string;
  reliefEmployeeId?: string;
  reliefEmployeeName?: string;
  documents?: LeaveDocument[];
}

export interface LeaveBalance {
  id: string;
  employeeId?: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  leaveType: LeaveTypeName;
  totalEntitlement: number;
  daysUsed: number;
  daysPending: number;
  /** Days brought forward from the previous holiday year (§F12). */
  carriedOver?: number;
  /** Entitlement accrued so far this year, for accrual-based policies. */
  accruedToDate?: number;
  /** When carried-over days lapse, ISO date. */
  carryOverExpiresAt?: string;
  /** Manual adjustments applied by HR, positive or negative. */
  adjustments?: number;
}

export interface LeavePolicy {
  id: string;
  name: string;
  leaveType: LeaveTypeName;
  description?: string;
  maxDaysPerYear: number;
  minNoticeDays: number;
  maxConsecutiveDays: number;
  requiresMedicalCertificate: boolean;
  carryOverAllowed: boolean;
  maxCarryOverDays: number;
  /** Who qualifies, e.g. "All employees after 3 months' service" (§F13). */
  eligibility?: string;
  /** How public holidays interact with this policy. */
  publicHolidayRule?: string;
  /** What must be attached, e.g. "Fit note for absences over 7 days". */
  attachmentRequirement?: string;
  /** Link to the full written policy document. */
  documentUrl?: string;
  createdAt: string;
}

export interface NewLeavePolicy {
  name: string;
  leaveType: LeaveTypeName;
  description?: string;
  maxDaysPerYear: number;
  minNoticeDays: number;
  maxConsecutiveDays: number;
  requiresMedicalCertificate: boolean;
  carryOverAllowed: boolean;
  maxCarryOverDays: number;
  /** Who qualifies, e.g. "All employees after 3 months' service" (§F13). */
  eligibility?: string;
  /** How public holidays interact with this policy. */
  publicHolidayRule?: string;
  /** What must be attached, e.g. "Fit note for absences over 7 days". */
  attachmentRequirement?: string;
  /** Link to the full written policy document. */
  documentUrl?: string;
}

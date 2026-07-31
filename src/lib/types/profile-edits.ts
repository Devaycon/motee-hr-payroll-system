export type ChangeRequestStatus = "pending" | "approved" | "rejected";

export interface ChangeRequest {
  id: string;
  employeeId: string;
  field: string; // dot-path
  label: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  status: ChangeRequestStatus;
  requestedBy: string;
  /** Requester's system id, so the log can link to their profile. */
  requestedById?: string;
  requestedAt: string;
  decidedBy?: string;
  /** Approver/rejecter's system id. Absent on records written before ids were captured. */
  decidedById?: string;
  decidedAt?: string;
  decisionNote?: string;
}

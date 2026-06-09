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
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionNote?: string;
}

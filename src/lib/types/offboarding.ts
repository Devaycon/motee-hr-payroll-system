export type OffboardingStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

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
}

export interface NewOffboardingRecord {
  employeeName: string;
  employeeInitials: string;
  jobTitle: string;
  department: string;
  lastWorkingDate: string;
  exitReason: ExitReason;
  exitInterviewNotes?: string;
}


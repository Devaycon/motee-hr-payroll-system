export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

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
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: "morning" | "afternoon";
  status: LeaveStatus;
  notes?: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface NewLeaveRequest {
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: "morning" | "afternoon";
  notes?: string;
}

export interface LeaveBalance {
  id: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  leaveType: LeaveTypeName;
  totalEntitlement: number;
  daysUsed: number;
  daysPending: number;
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
}

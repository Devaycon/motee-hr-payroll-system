import type { LeaveTypeName, LeaveStatus } from "@/src/lib/types/leave";

export interface LeaveRequestEntry {
  id: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayPeriod?: "morning" | "afternoon";
  status: LeaveStatus;
  notes?: string;
  approvedBy?: string;
  rejectionReason?: string;
  submittedAt: string;
}

export type LeaveBalance = Record<
  LeaveTypeName,
  { total: number; used: number; pending: number }
>;

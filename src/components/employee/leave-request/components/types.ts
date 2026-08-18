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
  /** Colleague nominated to cover while away (client feedback §3). */
  reliefEmployeeId?: string;
  reliefEmployeeName?: string;
  approvedBy?: string;
  rejectionReason?: string;
  submittedAt: string;
}

export type LeaveBalance = Record<
  LeaveTypeName,
  { total: number; used: number; pending: number }
>;

/**
 * What the request form opens on. Dates come from a suggested window; the
 * leave type comes from clicking a balance card, so "Sick Leave Remaining"
 * starts a sick-leave request rather than a blank one.
 */
export interface LeavePrefill {
  startDate?: string;
  endDate?: string;
  leaveType?: LeaveTypeName;
}

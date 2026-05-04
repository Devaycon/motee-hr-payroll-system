export type AttendanceStatus =
  | "present"
  | "absent"
  | "late"
  | "early_departure"
  | "on_leave"
  | "not_clocked_in";

export type TimesheetStatus = "pending" | "submitted" | "approved" | "rejected";

export type WorkDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface DailyEntry {
  date: string;
  day: WorkDay;
  clockIn?: string;
  clockOut?: string;
  breakMinutes: number;
  totalHours?: number;
  overtimeHours?: number;
  status: AttendanceStatus;
}

export interface AttendanceRecord {
  id: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakMinutes: number;
  totalHours?: number;
  overtimeHours: number;
  status: AttendanceStatus;
  notes?: string;
  location?: string;
}

export interface NewAttendanceRecord {
  employeeName: string;
  employeeInitials: string;
  department: string;
  jobTitle: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakMinutes: number;
  totalHours?: number;
  status: AttendanceStatus;
  notes?: string;
  location?: string;
}

export interface TimesheetRecord {
  id: string;
  employeeName: string;
  employeeInitials: string;
  department: string;
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  overtimeHours: number;
  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  status: TimesheetStatus;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  dailyEntries: DailyEntry[];
}

export interface WorkSchedule {
  id: string;
  name: string;
  workDays: WorkDay[];
  startTime: string;
  endTime: string;
  breakMinutes: number;
  assignedCount: number;
  createdAt: string;
}

export interface NewWorkSchedule {
  name: string;
  workDays: WorkDay[];
  startTime: string;
  endTime: string;
  breakMinutes: number;
}

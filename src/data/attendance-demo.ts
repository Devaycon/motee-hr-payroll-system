import type { AttendanceRecord, TimesheetRecord, WorkSchedule } from "@/src/lib/types/attendance";

export const DEPARTMENT_OPTIONS = [
  "all","Engineering","HR","Finance","Marketing","Sales",
  "Operations","Design","Product","Legal","Customer Success",
];

export const ALL_WORK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] as const;

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  early_departure: "Early Departure",
  on_leave: "On Leave",
  not_clocked_in: "Not Clocked In",
};

export const ATTENDANCE_STATUS_STYLES: Record<string, string> = {
  present: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  absent: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
  late: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  early_departure: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20",
  on_leave: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20",
  not_clocked_in: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20",
};

export const TIMESHEET_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
};

export const TIMESHEET_STATUS_STYLES: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  submitted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
};

export const TODAY_ATTENDANCE: AttendanceRecord[] = [
  { id: "att-001", employeeName: "Adaeze Okonkwo", employeeInitials: "AO", department: "Engineering", jobTitle: "Senior Software Engineer", date: "2026-04-04", clockIn: "08:52", clockOut: "17:10", breakMinutes: 30, totalHours: 7.8, overtimeHours: 0, status: "present" },
  { id: "att-002", employeeName: "Chukwuemeka Eze", employeeInitials: "CE", department: "Engineering", jobTitle: "Backend Engineer", date: "2026-04-04", clockIn: "09:18", clockOut: "17:35", breakMinutes: 30, totalHours: 7.8, overtimeHours: 0, status: "late" },
  { id: "att-003", employeeName: "Chidinma Okeke", employeeInitials: "CO", department: "HR", jobTitle: "HR Manager", date: "2026-04-04", clockIn: "08:45", clockOut: "17:00", breakMinutes: 30, totalHours: 7.75, overtimeHours: 0, status: "present" },
  { id: "att-004", employeeName: "Blessing Okafor", employeeInitials: "BO", department: "Finance", jobTitle: "Finance Analyst", date: "2026-04-04", clockIn: "09:05", clockOut: "17:15", breakMinutes: 30, totalHours: 7.8, overtimeHours: 0, status: "present" },
  { id: "att-005", employeeName: "Aisha Bello", employeeInitials: "AB", department: "Marketing", jobTitle: "Brand Manager", date: "2026-04-04", breakMinutes: 0, overtimeHours: 0, status: "absent" },
  { id: "att-006", employeeName: "Sodiq Olawale", employeeInitials: "SO", department: "Operations", jobTitle: "Business Analyst", date: "2026-04-04", breakMinutes: 0, overtimeHours: 0, status: "on_leave" },
  { id: "att-007", employeeName: "Musa Ibrahim", employeeInitials: "MI", department: "Finance", jobTitle: "Accountant", date: "2026-04-04", clockIn: "08:55", breakMinutes: 30, overtimeHours: 0, status: "not_clocked_in" },
  { id: "att-008", employeeName: "Babatunde Adeyemi", employeeInitials: "BA", department: "Engineering", jobTitle: "DevOps Engineer", date: "2026-04-04", clockIn: "14:30", clockOut: "18:00", breakMinutes: 0, totalHours: 3.5, overtimeHours: 0, status: "early_departure" },
];

export const TIMESHEETS: TimesheetRecord[] = [
  {
    id: "ts-001", employeeName: "Adaeze Okonkwo", employeeInitials: "AO", department: "Engineering",
    weekStart: "2026-03-24", weekEnd: "2026-03-28", totalHours: 39.5, overtimeHours: 0,
    daysPresent: 5, daysAbsent: 0, daysLate: 0, status: "approved",
    submittedAt: "2026-03-28", approvedAt: "2026-03-30", approvedBy: "Chidinma Okeke",
    dailyEntries: [
      { date: "2026-03-24", day: "Mon", clockIn: "08:50", clockOut: "17:00", breakMinutes: 30, totalHours: 7.67, status: "present" },
      { date: "2026-03-25", day: "Tue", clockIn: "09:00", clockOut: "17:00", breakMinutes: 30, totalHours: 7.5, status: "present" },
      { date: "2026-03-26", day: "Wed", clockIn: "08:55", clockOut: "17:05", breakMinutes: 30, totalHours: 7.67, status: "present" },
      { date: "2026-03-27", day: "Thu", clockIn: "09:00", clockOut: "17:00", breakMinutes: 30, totalHours: 7.5, status: "present" },
      { date: "2026-03-28", day: "Fri", clockIn: "09:05", clockOut: "17:10", breakMinutes: 30, totalHours: 7.67, status: "present" },
    ],
  },
  {
    id: "ts-002", employeeName: "Chukwuemeka Eze", employeeInitials: "CE", department: "Engineering",
    weekStart: "2026-03-24", weekEnd: "2026-03-28", totalHours: 36.5, overtimeHours: 0,
    daysPresent: 4, daysAbsent: 0, daysLate: 2, status: "submitted",
    submittedAt: "2026-03-28",
    dailyEntries: [
      { date: "2026-03-24", day: "Mon", clockIn: "09:15", clockOut: "17:00", breakMinutes: 30, totalHours: 7.25, status: "late" },
      { date: "2026-03-25", day: "Tue", clockIn: "09:00", clockOut: "17:00", breakMinutes: 30, totalHours: 7.5, status: "present" },
      { date: "2026-03-26", day: "Wed", clockIn: "09:20", clockOut: "17:00", breakMinutes: 30, totalHours: 7.17, status: "late" },
      { date: "2026-03-27", day: "Thu", clockIn: "09:00", clockOut: "17:05", breakMinutes: 30, totalHours: 7.58, status: "present" },
      { date: "2026-03-28", day: "Fri", clockIn: "09:00", clockOut: "16:30", breakMinutes: 30, totalHours: 7.0, status: "present" },
    ],
  },
  {
    id: "ts-003", employeeName: "Chidinma Okeke", employeeInitials: "CO", department: "HR",
    weekStart: "2026-03-24", weekEnd: "2026-03-28", totalHours: 38.75, overtimeHours: 0,
    daysPresent: 5, daysAbsent: 0, daysLate: 0, status: "pending",
    dailyEntries: [
      { date: "2026-03-24", day: "Mon", clockIn: "08:45", clockOut: "17:00", breakMinutes: 30, totalHours: 7.75, status: "present" },
      { date: "2026-03-25", day: "Tue", clockIn: "08:50", clockOut: "17:00", breakMinutes: 30, totalHours: 7.67, status: "present" },
      { date: "2026-03-26", day: "Wed", clockIn: "09:00", clockOut: "17:00", breakMinutes: 30, totalHours: 7.5, status: "present" },
      { date: "2026-03-27", day: "Thu", clockIn: "08:55", clockOut: "17:00", breakMinutes: 30, totalHours: 7.58, status: "present" },
      { date: "2026-03-28", day: "Fri", clockIn: "09:00", clockOut: "17:15", breakMinutes: 30, totalHours: 7.75, status: "present" },
    ],
  },
];

export const WORK_SCHEDULES: WorkSchedule[] = [
  { id: "ws-001", name: "Standard (9-5)", workDays: ["Mon","Tue","Wed","Thu","Fri"], startTime: "09:00", endTime: "17:00", breakMinutes: 30, assignedCount: 142, createdAt: "2024-01-01" },
  { id: "ws-002", name: "Early Shift (7-3)", workDays: ["Mon","Tue","Wed","Thu","Fri"], startTime: "07:00", endTime: "15:00", breakMinutes: 30, assignedCount: 12, createdAt: "2024-06-01" },
  { id: "ws-003", name: "Flexible (Core 10-3)", workDays: ["Mon","Tue","Wed","Thu","Fri"], startTime: "10:00", endTime: "15:00", breakMinutes: 30, assignedCount: 18, createdAt: "2025-01-15" },
];

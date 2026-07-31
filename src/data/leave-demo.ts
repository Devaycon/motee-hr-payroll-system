import type {
  LeaveRequest,
  LeaveBalance,
  LeavePolicy,
  LeaveStatus,
} from "@/src/lib/types/leave";

/** Selectable departments. "all" is a filter sentinel, so it is NOT a member. */
export const DEPARTMENTS = [
  "Engineering","HR","Finance","Marketing","Sales",
  "Operations","Design","Product","Legal","Customer Success",
];

/** Filter options — includes the "all" sentinel. */
export const DEPARTMENT_OPTIONS = ["all", ...DEPARTMENTS];

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  maternity: "Maternity",
  paternity: "Paternity",
  unpaid: "Unpaid",
  compassionate: "Compassionate",
  study: "Study",
};

export const LEAVE_TYPE_STYLES: Record<string, string> = {
  annual: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  sick: "bg-red-500/10 text-red-600 border-red-500/20",
  maternity: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  paternity: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  unpaid: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  compassionate: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  study: "bg-teal-500/10 text-teal-600 border-teal-500/20",
};

export const LEAVE_TYPE_OPTIONS = ["annual","sick","maternity","paternity","unpaid","compassionate","study"] as const;

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "Pending",
  awaiting_manager: "Awaiting Manager",
  awaiting_hr: "Awaiting HR",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const LEAVE_STATUS_STYLES: Record<LeaveStatus, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  awaiting_manager: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  awaiting_hr: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  cancelled: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

/** Status filter options, derived so new statuses can never be missed. */
export const LEAVE_STATUS_OPTIONS = Object.keys(
  LEAVE_STATUS_LABELS,
) as LeaveStatus[];

export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "lr-ao-001", employeeName: "Adaeze Okonkwo", employeeInitials: "AO", department: "Engineering", jobTitle: "Senior Software Engineer", leaveType: "annual", startDate: "2026-01-06", endDate: "2026-01-08", totalDays: 3, isHalfDay: false, status: "approved", submittedAt: "2025-12-27", approvedAt: "2025-12-28", approvedBy: "Chidinma Okeke", notes: "New Year break" },
  { id: "lr-ao-002", employeeName: "Adaeze Okonkwo", employeeInitials: "AO", department: "Engineering", jobTitle: "Senior Software Engineer", leaveType: "annual", startDate: "2026-02-03", endDate: "2026-02-07", totalDays: 5, isHalfDay: false, status: "approved", submittedAt: "2026-01-24", approvedAt: "2026-01-26", approvedBy: "Chidinma Okeke", notes: "Family trip" },
  { id: "lr-ao-003", employeeName: "Adaeze Okonkwo", employeeInitials: "AO", department: "Engineering", jobTitle: "Senior Software Engineer", leaveType: "sick", startDate: "2026-03-11", endDate: "2026-03-12", totalDays: 2, isHalfDay: false, status: "approved", submittedAt: "2026-03-11", approvedAt: "2026-03-11", approvedBy: "Chidinma Okeke", notes: "Doctor's visit" },
  { id: "lr-ao-004", employeeName: "Adaeze Okonkwo", employeeInitials: "AO", department: "Engineering", jobTitle: "Senior Software Engineer", leaveType: "study", startDate: "2026-05-12", endDate: "2026-05-14", totalDays: 3, isHalfDay: false, status: "pending", submittedAt: "2026-04-20", notes: "ICAN professional exams" },
  { id: "lr-001", employeeName: "Fatima Al-Hassan", employeeInitials: "FA", department: "Engineering", jobTitle: "Frontend Engineer", leaveType: "maternity", startDate: "2026-03-01", endDate: "2026-05-29", totalDays: 90, isHalfDay: false, status: "approved", submittedAt: "2026-02-10", approvedAt: "2026-02-12", approvedBy: "Chidinma Okeke" },
  { id: "lr-002", employeeName: "Ifeoma Nwachukwu", employeeInitials: "IN", department: "Finance", jobTitle: "Payroll Officer", leaveType: "sick", startDate: "2026-03-10", endDate: "2026-03-14", totalDays: 5, isHalfDay: false, status: "approved", submittedAt: "2026-03-09", approvedAt: "2026-03-09", approvedBy: "Chidinma Okeke" },
  { id: "lr-003", employeeName: "Chukwuemeka Eze", employeeInitials: "CE", department: "Engineering", jobTitle: "Backend Engineer", leaveType: "annual", startDate: "2026-04-14", endDate: "2026-04-18", totalDays: 5, isHalfDay: false, status: "pending", submittedAt: "2026-04-01", notes: "Family vacation" },
  { id: "lr-004", employeeName: "Yusuf Garba", employeeInitials: "YG", department: "HR", jobTitle: "HR Officer", leaveType: "annual", startDate: "2026-04-21", endDate: "2026-04-24", totalDays: 4, isHalfDay: false, status: "pending", submittedAt: "2026-04-02", notes: "Personal travel" },
  { id: "lr-005", employeeName: "Aisha Bello", employeeInitials: "AB", department: "Marketing", jobTitle: "Brand Manager", leaveType: "sick", startDate: "2026-04-07", endDate: "2026-04-08", totalDays: 2, isHalfDay: false, status: "pending", submittedAt: "2026-04-04" },
  { id: "lr-006", employeeName: "Blessing Okafor", employeeInitials: "BO", department: "Finance", jobTitle: "Finance Analyst", leaveType: "annual", startDate: "2026-02-14", endDate: "2026-02-18", totalDays: 5, isHalfDay: false, status: "approved", submittedAt: "2026-02-01", approvedAt: "2026-02-03", approvedBy: "Chidinma Okeke" },
  { id: "lr-007", employeeName: "Sodiq Olawale", employeeInitials: "SO", department: "Operations", jobTitle: "Business Analyst", leaveType: "compassionate", startDate: "2026-02-20", endDate: "2026-02-22", totalDays: 3, isHalfDay: false, status: "rejected", submittedAt: "2026-02-18", rejectionReason: "Extended bereavement — maximum 2 days per policy" },
  { id: "lr-008", employeeName: "Kelechi Onyekachi", employeeInitials: "KO", department: "Marketing", jobTitle: "Digital Marketing Specialist", leaveType: "annual", startDate: "2026-01-27", endDate: "2026-01-31", totalDays: 5, isHalfDay: false, status: "rejected", submittedAt: "2026-01-20", rejectionReason: "Insufficient leave balance" },
];

export const LEAVE_BALANCES: LeaveBalance[] = [
  { id: "lb-001", employeeName: "Adaeze Okonkwo", employeeInitials: "AO", department: "Engineering", leaveType: "annual", totalEntitlement: 20, daysUsed: 8, daysPending: 0 },
  { id: "lb-002", employeeName: "Adaeze Okonkwo", employeeInitials: "AO", department: "Engineering", leaveType: "sick", totalEntitlement: 10, daysUsed: 2, daysPending: 0 },
  { id: "lb-003", employeeName: "Chukwuemeka Eze", employeeInitials: "CE", department: "Engineering", leaveType: "annual", totalEntitlement: 20, daysUsed: 5, daysPending: 5 },
  { id: "lb-004", employeeName: "Chukwuemeka Eze", employeeInitials: "CE", department: "Engineering", leaveType: "sick", totalEntitlement: 10, daysUsed: 0, daysPending: 0 },
  { id: "lb-005", employeeName: "Chidinma Okeke", employeeInitials: "CO", department: "HR", leaveType: "annual", totalEntitlement: 20, daysUsed: 3, daysPending: 0 },
  { id: "lb-006", employeeName: "Blessing Okafor", employeeInitials: "BO", department: "Finance", leaveType: "annual", totalEntitlement: 20, daysUsed: 10, daysPending: 0 },
  { id: "lb-007", employeeName: "Aisha Bello", employeeInitials: "AB", department: "Marketing", leaveType: "annual", totalEntitlement: 20, daysUsed: 7, daysPending: 2 },
  { id: "lb-008", employeeName: "Yusuf Garba", employeeInitials: "YG", department: "HR", leaveType: "annual", totalEntitlement: 20, daysUsed: 4, daysPending: 4 },
];

export const LEAVE_POLICIES: LeavePolicy[] = [
  { id: "lp-001", name: "Standard Annual Leave", leaveType: "annual", description: "20 working days per year for full-time employees.", maxDaysPerYear: 20, minNoticeDays: 5, maxConsecutiveDays: 15, requiresMedicalCertificate: false, carryOverAllowed: true, maxCarryOverDays: 5, createdAt: "2024-01-01" },
  { id: "lp-002", name: "Sick Leave", leaveType: "sick", description: "10 days per year. Medical certificate required for 3+ consecutive days.", maxDaysPerYear: 10, minNoticeDays: 0, maxConsecutiveDays: 10, requiresMedicalCertificate: true, carryOverAllowed: false, maxCarryOverDays: 0, createdAt: "2024-01-01" },
  { id: "lp-003", name: "Maternity Leave", leaveType: "maternity", description: "90 calendar days for female employees following childbirth.", maxDaysPerYear: 90, minNoticeDays: 14, maxConsecutiveDays: 90, requiresMedicalCertificate: true, carryOverAllowed: false, maxCarryOverDays: 0, createdAt: "2024-01-01" },
  { id: "lp-004", name: "Paternity Leave", leaveType: "paternity", description: "5 working days for male employees following birth of a child.", maxDaysPerYear: 5, minNoticeDays: 7, maxConsecutiveDays: 5, requiresMedicalCertificate: false, carryOverAllowed: false, maxCarryOverDays: 0, createdAt: "2024-01-01" },
  { id: "lp-005", name: "Compassionate Leave", leaveType: "compassionate", description: "Up to 3 days for bereavement of immediate family members.", maxDaysPerYear: 3, minNoticeDays: 0, maxConsecutiveDays: 3, requiresMedicalCertificate: false, carryOverAllowed: false, maxCarryOverDays: 0, createdAt: "2024-01-01" },
  { id: "lp-006", name: "Study/Exam Leave", leaveType: "study", description: "Up to 5 days per year for approved academic/professional examinations.", maxDaysPerYear: 5, minNoticeDays: 14, maxConsecutiveDays: 5, requiresMedicalCertificate: false, carryOverAllowed: false, maxCarryOverDays: 0, createdAt: "2024-06-01" },
  { id: "lp-007", name: "Unpaid Leave", leaveType: "unpaid", description: "Discretionary unpaid leave pending manager and HR approval.", maxDaysPerYear: 30, minNoticeDays: 7, maxConsecutiveDays: 30, requiresMedicalCertificate: false, carryOverAllowed: false, maxCarryOverDays: 0, createdAt: "2024-01-01" },
];

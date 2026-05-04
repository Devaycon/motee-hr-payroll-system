import type { Employee, LeaveRequest, JobPosting, Candidate, PayrollRun } from "@/src/lib/types/hr.types";

export const DEMO_EMPLOYEES: Employee[] = [
  { id: "e-001", name: "Adaeze Okonkwo", email: "adaeze.okonkwo@company.ng", phone: "+234-801-234-5678", department: "Engineering", jobTitle: "Senior Software Engineer", employmentType: "full_time", status: "active", startDate: "2021-04-15", avatar: null, salary: 850000, managerId: null },
  { id: "e-002", name: "Chukwuemeka Eze", email: "chukwuemeka.eze@company.ng", phone: "+234-802-345-6789", department: "Engineering", jobTitle: "Backend Engineer", employmentType: "full_time", status: "active", startDate: "2022-01-10", avatar: null, salary: 650000, managerId: "e-001" },
  { id: "e-003", name: "Fatima Al-Hassan", email: "fatima.alhassan@company.ng", phone: "+234-803-456-7890", department: "Engineering", jobTitle: "Frontend Engineer", employmentType: "full_time", status: "on_leave", startDate: "2022-06-01", avatar: null, salary: 600000, managerId: "e-001" },
  { id: "e-004", name: "Babatunde Adeyemi", email: "babatunde.adeyemi@company.ng", phone: "+234-804-567-8901", department: "Engineering", jobTitle: "DevOps Engineer", employmentType: "full_time", status: "active", startDate: "2023-03-20", avatar: null, salary: 720000, managerId: "e-001" },
  { id: "e-005", name: "Ngozi Obi", email: "ngozi.obi@company.ng", phone: "+234-805-678-9012", department: "Engineering", jobTitle: "QA Engineer", employmentType: "contract", status: "active", startDate: "2023-08-01", avatar: null, salary: 450000, managerId: "e-001" },
  { id: "e-006", name: "Emeka Nwosu", email: "emeka.nwosu@company.ng", phone: "+234-806-789-0123", department: "Engineering", jobTitle: "Mobile Engineer", employmentType: "full_time", status: "probation", startDate: "2026-01-15", avatar: null, salary: 500000, managerId: "e-001" },
  { id: "e-007", name: "Chidinma Okeke", email: "chidinma.okeke@company.ng", phone: "+234-807-890-1234", department: "HR", jobTitle: "HR Manager", employmentType: "full_time", status: "active", startDate: "2020-09-01", avatar: null, salary: 580000, managerId: null },
  { id: "e-008", name: "Yusuf Garba", email: "yusuf.garba@company.ng", phone: "+234-808-901-2345", department: "HR", jobTitle: "HR Officer", employmentType: "full_time", status: "active", startDate: "2023-01-10", avatar: null, salary: 320000, managerId: "e-007" },
  { id: "e-009", name: "Amaka Chukwu", email: "amaka.chukwu@company.ng", phone: "+234-809-012-3456", department: "HR", jobTitle: "Talent Acquisition Specialist", employmentType: "full_time", status: "active", startDate: "2023-07-15", avatar: null, salary: 350000, managerId: "e-007" },
  { id: "e-010", name: "Oluwaseun Afolabi", email: "oluwaseun.afolabi@company.ng", phone: "+234-810-123-4567", department: "Finance", jobTitle: "Chief Financial Officer", employmentType: "full_time", status: "active", startDate: "2019-05-01", avatar: null, salary: 980000, managerId: null },
  { id: "e-011", name: "Blessing Okafor", email: "blessing.okafor@company.ng", phone: "+234-811-234-5678", department: "Finance", jobTitle: "Finance Analyst", employmentType: "full_time", status: "active", startDate: "2022-04-10", avatar: null, salary: 420000, managerId: "e-010" },
  { id: "e-012", name: "Musa Ibrahim", email: "musa.ibrahim@company.ng", phone: "+234-812-345-6789", department: "Finance", jobTitle: "Accountant", employmentType: "full_time", status: "active", startDate: "2021-11-20", avatar: null, salary: 380000, managerId: "e-010" },
  { id: "e-013", name: "Ifeoma Nwachukwu", email: "ifeoma.nwachukwu@company.ng", phone: "+234-813-456-7890", department: "Finance", jobTitle: "Payroll Officer", employmentType: "full_time", status: "on_leave", startDate: "2022-09-01", avatar: null, salary: 360000, managerId: "e-010" },
  { id: "e-014", name: "Tunde Fashola", email: "tunde.fashola@company.ng", phone: "+234-814-567-8901", department: "Marketing", jobTitle: "Marketing Director", employmentType: "full_time", status: "active", startDate: "2020-02-14", avatar: null, salary: 750000, managerId: null },
  { id: "e-015", name: "Aisha Bello", email: "aisha.bello@company.ng", phone: "+234-815-678-9012", department: "Marketing", jobTitle: "Brand Manager", employmentType: "full_time", status: "active", startDate: "2022-08-01", avatar: null, salary: 480000, managerId: "e-014" },
  { id: "e-016", name: "Kelechi Onyekachi", email: "kelechi.onyekachi@company.ng", phone: "+234-816-789-0123", department: "Marketing", jobTitle: "Digital Marketing Specialist", employmentType: "part_time", status: "active", startDate: "2023-05-01", avatar: null, salary: 280000, managerId: "e-014" },
  { id: "e-017", name: "Folake Adeleke", email: "folake.adeleke@company.ng", phone: "+234-817-890-1234", department: "Operations", jobTitle: "Operations Manager", employmentType: "full_time", status: "active", startDate: "2020-10-15", avatar: null, salary: 620000, managerId: null },
  { id: "e-018", name: "Sodiq Olawale", email: "sodiq.olawale@company.ng", phone: "+234-818-901-2345", department: "Operations", jobTitle: "Business Analyst", employmentType: "full_time", status: "active", startDate: "2023-02-01", avatar: null, salary: 410000, managerId: "e-017" },
  { id: "e-019", name: "Chiamaka Eze", email: "chiamaka.eze@company.ng", phone: "+234-819-012-3456", department: "Operations", jobTitle: "Project Coordinator", employmentType: "full_time", status: "active", startDate: "2023-09-10", avatar: null, salary: 340000, managerId: "e-017" },
  { id: "e-020", name: "Abdullahi Musa", email: "abdullahi.musa@company.ng", phone: "+234-820-123-4567", department: "Operations", jobTitle: "Logistics Officer", employmentType: "contract", status: "active", startDate: "2024-01-05", avatar: null, salary: 250000, managerId: "e-017" },
];

export const DEMO_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "lr-001", employeeId: "e-003", employeeName: "Fatima Al-Hassan", type: "maternity", startDate: "2026-03-01", endDate: "2026-05-29", days: 90, status: "approved", reason: "Maternity leave for newborn" },
  { id: "lr-002", employeeId: "e-013", employeeName: "Ifeoma Nwachukwu", type: "sick", startDate: "2026-03-10", endDate: "2026-03-14", days: 5, status: "approved", reason: "Medical procedure recovery" },
  { id: "lr-003", employeeId: "e-002", employeeName: "Chukwuemeka Eze", type: "annual", startDate: "2026-03-20", endDate: "2026-03-27", days: 7, status: "pending", reason: "Family vacation" },
  { id: "lr-004", employeeId: "e-008", employeeName: "Yusuf Garba", type: "annual", startDate: "2026-03-25", endDate: "2026-03-28", days: 4, status: "pending", reason: "Personal travel" },
  { id: "lr-005", employeeId: "e-015", employeeName: "Aisha Bello", type: "sick", startDate: "2026-03-13", endDate: "2026-03-14", days: 2, status: "pending", reason: "Flu and fever" },
  { id: "lr-006", employeeId: "e-011", employeeName: "Blessing Okafor", type: "annual", startDate: "2026-02-14", endDate: "2026-02-18", days: 5, status: "approved", reason: "Valentine break" },
  { id: "lr-007", employeeId: "e-018", employeeName: "Sodiq Olawale", type: "compassionate", startDate: "2026-02-20", endDate: "2026-02-22", days: 3, status: "rejected", reason: "Extended bereavement request" },
  { id: "lr-008", employeeId: "e-016", employeeName: "Kelechi Onyekachi", type: "annual", startDate: "2026-01-27", endDate: "2026-01-31", days: 5, status: "rejected", reason: "Insufficient leave balance" },
];

export const DEMO_JOB_POSTINGS: JobPosting[] = [
  { id: "jp-001", title: "Senior Software Engineer", department: "Engineering", applicants: 12, stage: "Interviewing", postedDate: "2026-02-15", status: "open" },
  { id: "jp-002", title: "HR Officer", department: "HR", applicants: 7, stage: "Screening", postedDate: "2026-02-20", status: "open" },
  { id: "jp-003", title: "Finance Analyst", department: "Finance", applicants: 4, stage: "Applied", postedDate: "2026-03-01", status: "open" },
  { id: "jp-004", title: "Marketing Manager", department: "Marketing", applicants: 9, stage: "Interviewing", postedDate: "2026-02-10", status: "open" },
  { id: "jp-005", title: "DevOps Engineer", department: "Engineering", applicants: 6, stage: "Offer", postedDate: "2026-01-25", status: "open" },
];

export const DEMO_CANDIDATES: Candidate[] = [
  { id: "c-001", name: "Tomiwa Adebayo", email: "tomiwa@gmail.com", jobId: "jp-001", stage: "interviewed", appliedDate: "2026-02-16" },
  { id: "c-002", name: "Grace Okonkwo", email: "grace.ok@gmail.com", jobId: "jp-001", stage: "screened", appliedDate: "2026-02-18" },
  { id: "c-003", name: "David Mensah", email: "d.mensah@gmail.com", jobId: "jp-001", stage: "offered", appliedDate: "2026-02-17" },
  { id: "c-004", name: "Sade Williams", email: "sade.w@gmail.com", jobId: "jp-002", stage: "applied", appliedDate: "2026-02-22" },
  { id: "c-005", name: "Emeka Osei", email: "emeka.os@gmail.com", jobId: "jp-002", stage: "screened", appliedDate: "2026-02-21" },
  { id: "c-006", name: "Halima Musa", email: "halima.m@gmail.com", jobId: "jp-002", stage: "interviewed", appliedDate: "2026-02-20" },
  { id: "c-007", name: "Chidi Nwosu", email: "chidi.n@gmail.com", jobId: "jp-003", stage: "applied", appliedDate: "2026-03-02" },
  { id: "c-008", name: "Funmi Adesanya", email: "funmi.a@gmail.com", jobId: "jp-003", stage: "screened", appliedDate: "2026-03-03" },
  { id: "c-009", name: "Uche Eze", email: "uche.eze@gmail.com", jobId: "jp-004", stage: "interviewed", appliedDate: "2026-02-12" },
  { id: "c-010", name: "Bisi Olatunji", email: "bisi.ol@gmail.com", jobId: "jp-004", stage: "rejected", appliedDate: "2026-02-11" },
  { id: "c-011", name: "Ahmed Yusuf", email: "ahmed.y@gmail.com", jobId: "jp-004", stage: "screened", appliedDate: "2026-02-13" },
  { id: "c-012", name: "Nneka Obiora", email: "nneka.ob@gmail.com", jobId: "jp-005", stage: "offered", appliedDate: "2026-01-27" },
  { id: "c-013", name: "Kolade Akintola", email: "kolade.a@gmail.com", jobId: "jp-005", stage: "hired", appliedDate: "2026-01-26" },
  { id: "c-014", name: "Taiwo Ogunleye", email: "taiwo.og@gmail.com", jobId: "jp-001", stage: "applied", appliedDate: "2026-02-25" },
  { id: "c-015", name: "Zainab Lawal", email: "zainab.l@gmail.com", jobId: "jp-004", stage: "interviewed", appliedDate: "2026-02-14" },
];

export const DEMO_PAYROLL_RUNS: PayrollRun[] = [
  { id: "pr-001", period: "October 2025", totalAmount: 89500000, employeeCount: 238, status: "completed" },
  { id: "pr-002", period: "November 2025", totalAmount: 90100000, employeeCount: 240, status: "completed" },
  { id: "pr-003", period: "December 2025", totalAmount: 95800000, employeeCount: 242, status: "completed" },
  { id: "pr-004", period: "January 2026", totalAmount: 91200000, employeeCount: 243, status: "completed" },
  { id: "pr-005", period: "February 2026", totalAmount: 92400000, employeeCount: 245, status: "completed" },
  { id: "pr-006", period: "March 2026", totalAmount: 0, employeeCount: 247, status: "draft" },
];

export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  status: "clocked_in" | "late" | "absent" | "not_clocked_in";
  clockInTime: string | null;
}

export const DEMO_ATTENDANCE_TODAY: AttendanceRecord[] = [
  { employeeId: "e-001", employeeName: "Adaeze Okonkwo", status: "clocked_in", clockInTime: "08:02" },
  { employeeId: "e-002", employeeName: "Chukwuemeka Eze", status: "clocked_in", clockInTime: "08:15" },
  { employeeId: "e-004", employeeName: "Babatunde Adeyemi", status: "late", clockInTime: "09:42" },
  { employeeId: "e-005", employeeName: "Ngozi Obi", status: "clocked_in", clockInTime: "07:58" },
  { employeeId: "e-006", employeeName: "Emeka Nwosu", status: "clocked_in", clockInTime: "08:30" },
  { employeeId: "e-007", employeeName: "Chidinma Okeke", status: "clocked_in", clockInTime: "08:05" },
  { employeeId: "e-008", employeeName: "Yusuf Garba", status: "clocked_in", clockInTime: "08:10" },
  { employeeId: "e-009", employeeName: "Amaka Chukwu", status: "clocked_in", clockInTime: "08:20" },
  { employeeId: "e-010", employeeName: "Oluwaseun Afolabi", status: "clocked_in", clockInTime: "07:45" },
  { employeeId: "e-011", employeeName: "Blessing Okafor", status: "clocked_in", clockInTime: "08:01" },
  { employeeId: "e-012", employeeName: "Musa Ibrahim", status: "clocked_in", clockInTime: "08:35" },
  { employeeId: "e-014", employeeName: "Tunde Fashola", status: "clocked_in", clockInTime: "08:50" },
  { employeeId: "e-015", employeeName: "Aisha Bello", status: "absent", clockInTime: null },
  { employeeId: "e-016", employeeName: "Kelechi Onyekachi", status: "clocked_in", clockInTime: "09:00" },
  { employeeId: "e-017", employeeName: "Folake Adeleke", status: "clocked_in", clockInTime: "07:55" },
  { employeeId: "e-018", employeeName: "Sodiq Olawale", status: "late", clockInTime: "10:05" },
  { employeeId: "e-019", employeeName: "Chiamaka Eze", status: "clocked_in", clockInTime: "08:22" },
  { employeeId: "e-020", employeeName: "Abdullahi Musa", status: "clocked_in", clockInTime: "08:18" },
  { employeeId: "e-013", employeeName: "Ifeoma Nwachukwu", status: "absent", clockInTime: null },
  { employeeId: "e-003", employeeName: "Fatima Al-Hassan", status: "not_clocked_in", clockInTime: null },
  { employeeId: "e-001", employeeName: "Late clock-in staff A", status: "late", clockInTime: "10:22" },
];

export const DEMO_HR_STATS = {
  totalEmployees: 247,
  onLeaveToday: 4,
  openPositions: 12,
  pendingApprovals: 8,
  newHiresThisMonth: 3,
  turnoverRate: 8.2,
};


export type CountryKey = "ng" | "uk";

export interface LocaleTenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  industry: string;
  country: string;
  countryCode: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  logoUrl: string;
  primaryColor: string;
  createdAt: string;
  trialEndsAt: string | null;
  billingEmail: string;
}

export interface LocaleDepartment {
  id: string;
  name: string;
  code: string;
  parentDepartmentId: string | null;
  headEmployeeId: string | null;
  costCenter: string;
  headcountTarget: number;
}

export interface LocaleRoleCredentials {
  email: string;
  password: string;
}

export interface LocaleRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  linkedEmployeeId: string;
  linkedAccessLevelId: string;
  credentials: LocaleRoleCredentials;
}

export interface LocaleEmployee {
  id: string;
  tenantId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  grade?: string;
  level?: number;
  employmentTypeId: string;
  status: string;
  startDate: string;
  dateOfLeaving?: string;
  salary: { amount: number; currency: string; period: string };
  managerId: string | null;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  address?: Record<string, string>;
  /** Detailed addresses keyed by type slug (home, work, holiday, …). */
  addresses?: Record<string, Record<string, string>>;
  workMode?: string;
  workLocation?: string;
  identifiers?: Record<string, string>;
  bankDetails?: Record<string, string>;
  emergencyContact?: LocaleEmergencyContact;
  emergencyContacts?: LocaleEmergencyContact[];
  workPattern?: LocaleWorkPattern;
  roleIds?: string[];
  accessLevelId?: string;
}

export interface LocaleEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary?: boolean;
}

export interface LocaleWorkPattern {
  weeklyHours: number;
  daysPerWeek: number;
  schedule: Record<string, { start: string; end: string } | null>;
  holidayEntitlementDays: number;
  publicHolidayDays: number;
  contractType: "full_time" | "part_time" | "zero_hours";
}

export interface LocaleLeaveAdjustment {
  id: string;
  employeeId: string;
  policyId: string;
  delta: number;
  reason: string;
  addedBy: string;
  date: string;
}

export interface LocaleDbsCheck {
  id: string;
  employeeId: string;
  kind: "dbs" | "background_check";
  type: string;
  certificateNumber: string;
  issuedDate: string;
  expiryDate: string;
  status: "clear" | "pending" | "expired";
}

export interface LocaleDisciplinary {
  id: string;
  employeeId: string;
  date: string;
  type: "verbal_warning" | "written_warning" | "final_warning" | "dismissal";
  reason: string;
  issuedBy: string;
  status: "active" | "expired" | "withdrawn";
  outcome: string;
  documentUrl: string;
}

export interface LocaleExpense {
  id: string;
  employeeId: string;
  date: string;
  category: "travel" | "meals" | "equipment" | "other";
  amount: number;
  currency: string;
  description: string;
  status: "submitted" | "approved" | "rejected" | "reimbursed";
  receiptUrl: string;
  approverId: string;
}

export interface LocaleEmploymentEvent {
  id: string;
  employeeId: string;
  date: string;
  type:
    | "hired"
    | "role_change"
    | "salary_change"
    | "department_change"
    | "promotion"
    | "probation_passed";
  from: string | null;
  to: string | null;
  reason: string;
  actorId: string;
}

export interface LocaleLocationBooking {
  id: string;
  employeeId: string;
  locationType: "desk" | "meeting_room" | "parking";
  locationName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled";
  notes: string;
}

export interface LocaleMedicalFacts {
  employeeId: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  dietaryRequirements: string[];
  accessibilityNeeds: string;
  doctorContact: { name: string; phone: string; practice: string };
}

export interface LocaleEmployeeNote {
  id: string;
  employeeId: string;
  authorId: string;
  body: string;
  createdAt: string;
  pinned: boolean;
  type: "note" | "reminder";
  remindAt: string | null;
  visibility: "hr_only" | "manager_and_hr";
}

export interface LocalePayChange {
  id: string;
  employeeId: string;
  effectiveDate: string;
  previousAmount: number;
  newAmount: number;
  currency: string;
  changeType: "increment" | "promotion" | "adjustment" | "bonus";
  reason: string;
  approvedBy: string;
}

export interface LocaleHeadcountSnapshot {
  month: string;
  total: number;
  joiners?: number;
  leavers?: number;
  attrition?: number;
  byDepartment?: Record<string, number>;
}

export interface LocaleAttendanceEntry {
  employeeId: string;
  date: string;
  status: string;
  clockIn?: string | null;
  clockOut?: string | null;
  hoursWorked?: number;
  source?: string;
}

export interface LocaleLeaveRequest {
  id: string;
  employeeId: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  days?: number;
  reason?: string;
}

export interface LocaleEvent {
  id: string;
  title: string;
  type: string;
  start: string;
  end?: string;
}

export interface LocaleBundle {
  _meta: { tenantKey: string; generatedAt: string; referenceDate: string; historyDays: number; seed: number; employeeCount: number };
  tenant: LocaleTenant;
  companyProfile: Record<string, unknown>;
  departments: LocaleDepartment[];
  employmentTypes: Array<{ id: string; name: string; defaultLeaveDays: number; eligibleForBenefits: boolean; probationMonths: number }>;
  roles: LocaleRole[];
  accessLevels: Array<{ id: string; name: string; description: string }>;
  employees: LocaleEmployee[];
  orgStructure: Array<Record<string, unknown>>;
  headcountSnapshots: LocaleHeadcountSnapshot[];
  workforce: Record<string, unknown>;
  contracts: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  attendance: LocaleAttendanceEntry[];
  leavePolicies: Array<Record<string, unknown>>;
  leaveBalances: Array<Record<string, unknown>>;
  leaveRequests: LocaleLeaveRequest[];
  recruitment: Record<string, unknown>;
  onboarding: Record<string, unknown>;
  employeeChecklists: Array<Record<string, unknown>>;
  offboarding: Array<Record<string, unknown>>;
  performance: Record<string, unknown>;
  learning: Record<string, unknown>;
  assets: Array<Record<string, unknown>>;
  helpdeskTickets: Array<Record<string, unknown>>;
  grievances: Array<Record<string, unknown>>;
  suggestions: Array<Record<string, unknown>>;
  surveys: Record<string, unknown>;
  announcements: Array<Record<string, unknown>>;
  knowledgeBase: Record<string, unknown>;
  community: Record<string, unknown>;
  kudos: Array<Record<string, unknown>>;
  events: LocaleEvent[];
  tasks: Array<Record<string, unknown>>;
  payroll: Record<string, unknown>;
  benefits: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
  chat: Record<string, unknown>;
  auditTrail: Array<Record<string, unknown>>;
  settings: Record<string, unknown>;
  platform: Record<string, unknown>;
  approvals?: Array<Record<string, unknown>>;
  // Per-employee collections for the Employee Detail page.
  leaveAdjustments?: LocaleLeaveAdjustment[];
  dbsChecks?: LocaleDbsCheck[];
  disciplinaries?: LocaleDisciplinary[];
  expenses?: LocaleExpense[];
  employmentHistory?: LocaleEmploymentEvent[];
  locationBookings?: LocaleLocationBooking[];
  medicalFacts?: LocaleMedicalFacts[];
  employeeNotes?: LocaleEmployeeNote[];
  payHistory?: LocalePayChange[];
}

export interface AuthUser {
  roleId: string;
  roleName: string;
  accessLevelId: string;
  name: string;
  email: string;
  employeeId: string;
  initials: string;
  jobTitle: string;
  departmentName: string;
}

import type {
  AccountSettings,
  SecuritySettings,
  NotificationPrefs,
  BillingRecord,
  ModuleSetting,
  PickList,
  HolidayYearConfig,
  CompanyHoliday,
  BlackoutPeriod,
  TwoFactorConfig,
  ApiKey,
  ApiUsageLog,
} from "@/src/lib/types/settings";

export const ACCOUNT_SETTINGS: AccountSettings = {
  companyName: "Motee Technologies Ltd.",
  plan: "growth",
  planLabel: "Growth",
  renewalDate: "2026-09-01",
  contactEmail: "admin@motee.io",
  seats: 100,
  usedSeats: 64,
};

export const BILLING_RECORDS: BillingRecord[] = [
  {
    id: "bill-001",
    period: "August 2026",
    amount: 420,
    currency: "NGN",
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "bill-002",
    period: "July 2026",
    amount: 420,
    currency: "NGN",
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "bill-003",
    period: "June 2026",
    amount: 380,
    currency: "NGN",
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "bill-004",
    period: "May 2026",
    amount: 380,
    currency: "NGN",
    status: "paid",
    downloadUrl: "#",
  },
  {
    id: "bill-005",
    period: "April 2026",
    amount: 380,
    currency: "NGN",
    status: "paid",
    downloadUrl: "#",
  },
];

export const SECURITY_SETTINGS: SecuritySettings = {
  passwordPolicy: {
    minLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    requireUppercase: false,
    requireSymbols: true,
    expiryDays: 90,
    preventReuse: 5,
    sessionTimeoutMinutes: 60,
  },
  sessionTimeoutMinutes: 30,
  loginNotifications: true,
  suspiciousActivityAlerts: true,
  twoFactorEnabled: false,
  trustedDevices: [
    {
      id: "dev-001",
      name: "MacBook Pro",
      browser: "Chrome 124",
      os: "macOS 14.4",
      lastSeen: "2026-04-03T09:45:00",
      isCurrent: true,
    },
    {
      id: "dev-002",
      name: "iPhone 15",
      browser: "Safari 17",
      os: "iOS 17.4",
      lastSeen: "2026-04-02T18:20:00",
      isCurrent: false,
    },
    {
      id: "dev-003",
      name: "Windows Desktop",
      browser: "Edge 123",
      os: "Windows 11",
      lastSeen: "2026-03-28T14:10:00",
      isCurrent: false,
    },
  ],
  loginActivity: [
    {
      id: "act-001",
      event: "Successful login",
      ipAddress: "197.210.44.12",
      location: "Lagos, Nigeria",
      device: "Chrome / macOS",
      timestamp: "2026-04-03T09:45:00",
      success: true,
    },
    {
      id: "act-002",
      event: "Successful login",
      ipAddress: "197.210.44.12",
      location: "Lagos, Nigeria",
      device: "Safari / iOS",
      timestamp: "2026-04-02T18:20:00",
      success: true,
    },
    {
      id: "act-003",
      event: "Failed login attempt",
      ipAddress: "91.189.88.201",
      location: "Amsterdam, Netherlands",
      device: "Firefox / Linux",
      timestamp: "2026-04-02T03:14:00",
      success: false,
    },
    {
      id: "act-004",
      event: "Successful login",
      ipAddress: "105.112.70.88",
      location: "Abuja, Nigeria",
      device: "Edge / Windows",
      timestamp: "2026-03-28T14:10:00",
      success: true,
    },
    {
      id: "act-005",
      event: "Password changed",
      ipAddress: "197.210.44.12",
      location: "Lagos, Nigeria",
      device: "Chrome / macOS",
      timestamp: "2026-03-20T11:30:00",
      success: true,
    },
  ],
};

export const NOTIFICATION_PREFS: NotificationPrefs = {
  modules: [
    { id: "notif-001", module: "leave", label: "Leave & Time-Off", email: true, inApp: true, push: false },
    { id: "notif-002", module: "payroll", label: "Payroll & Pay", email: true, inApp: true, push: false },
    { id: "notif-003", module: "recruitment", label: "Recruitment", email: false, inApp: true, push: false },
    { id: "notif-004", module: "onboarding", label: "Onboarding", email: true, inApp: true, push: true },
    { id: "notif-005", module: "performance", label: "Performance", email: false, inApp: true, push: false },
    { id: "notif-006", module: "announcements", label: "Announcements", email: true, inApp: true, push: true },
    { id: "notif-007", module: "documents", label: "Documents", email: false, inApp: true, push: false },
    { id: "notif-008", module: "helpdesk", label: "Help Desk", email: true, inApp: true, push: true },
    { id: "notif-009", module: "grievance", label: "Grievance & Disciplinary", email: true, inApp: true, push: false },
    { id: "notif-010", module: "system", label: "System Alerts", email: true, inApp: true, push: true },
  ],
  digestFrequency: "daily",
  timezone: "Africa/Lagos",
  language: "en",
};

export const TIMEZONES = [
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi (EAT)" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET)" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
];

export const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "FranÃ§ais" },
  { value: "pt", label: "PortuguÃªs" },
  { value: "ar", label: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©" },
  { value: "sw", label: "Kiswahili" },
];

// --- Account › Module Settings ---
export const MODULE_SETTINGS: ModuleSetting[] = [
  { id: "mod-leave", name: "Leave & Time-Off", description: "Leave requests, balances and approvals.", enabled: true, showInSidebar: true },
  { id: "mod-attendance", name: "Attendance", description: "Clock-ins, timesheets and work schedules.", enabled: true, showInSidebar: true },
  { id: "mod-payroll", name: "Payroll", description: "Pay runs, payslips and compensation.", enabled: true, showInSidebar: true },
  { id: "mod-recruitment", name: "Recruitment", description: "Requisitions, candidates and hiring pipeline.", enabled: true, showInSidebar: true },
  { id: "mod-onboarding", name: "Onboarding", description: "New-hire checklists and pre-boarding.", enabled: true, showInSidebar: true },
  { id: "mod-performance", name: "Performance", description: "Reviews, goals and appraisals.", enabled: true, showInSidebar: false },
  { id: "mod-training", name: "Training", description: "Courses, assignments and certifications.", enabled: false, showInSidebar: false },
  { id: "mod-assets", name: "Assets", description: "Company asset assignment and tracking.", enabled: true, showInSidebar: true },
  { id: "mod-helpdesk", name: "Help Desk", description: "Employee support tickets.", enabled: true, showInSidebar: true },
  { id: "mod-community", name: "Community", description: "Announcements, kudos and surveys.", enabled: false, showInSidebar: false },
];

// --- Account › Pick List ---
export const PICK_LISTS: PickList[] = [
  {
    id: "pl-department",
    name: "Department",
    description: "Departments available across employee records.",
    options: [
      { id: "dep-1", value: "Engineering", isDefault: true },
      { id: "dep-2", value: "Human Resources", isDefault: false },
      { id: "dep-3", value: "Finance", isDefault: false },
      { id: "dep-4", value: "Sales", isDefault: false },
      { id: "dep-5", value: "Operations", isDefault: false },
    ],
  },
  {
    id: "pl-job-title",
    name: "Job Title",
    description: "Standard job titles for new hires and roles.",
    options: [
      { id: "jt-1", value: "Software Engineer", isDefault: true },
      { id: "jt-2", value: "Product Manager", isDefault: false },
      { id: "jt-3", value: "HR Business Partner", isDefault: false },
      { id: "jt-4", value: "Accountant", isDefault: false },
    ],
  },
  {
    id: "pl-location",
    name: "Location",
    description: "Office locations and remote regions.",
    options: [
      { id: "loc-1", value: "Lagos HQ", isDefault: true },
      { id: "loc-2", value: "Abuja", isDefault: false },
      { id: "loc-3", value: "Remote", isDefault: false },
    ],
  },
];

// --- Absence › Holiday Year ---
export const HOLIDAY_YEARS: HolidayYearConfig[] = [
  { id: "hy-1", label: "Calendar Year 2026", startDate: "2026-01-01", endDate: "2026-12-31", isActive: true },
  { id: "hy-2", label: "Fiscal Year 2025/26", startDate: "2025-04-01", endDate: "2026-03-31", isActive: false },
];

// --- Absence › Company Holidays ---
export const COMPANY_HOLIDAYS: CompanyHoliday[] = [
  { id: "ch-1", name: "New Year's Day", date: "2026-01-01", nonWorking: true, excludedDepartments: [] },
  { id: "ch-2", name: "Workers' Day", date: "2026-05-01", nonWorking: true, excludedDepartments: [] },
  { id: "ch-3", name: "Democracy Day", date: "2026-06-12", nonWorking: true, excludedDepartments: [] },
  { id: "ch-4", name: "Independence Day", date: "2026-10-01", nonWorking: true, excludedDepartments: [] },
  { id: "ch-5", name: "Founders' Day", date: "2026-08-15", nonWorking: false, excludedDepartments: ["Sales"] },
];

// --- Absence › Company Blackout ---
export const BLACKOUT_PERIODS: BlackoutPeriod[] = [
  { id: "bo-1", name: "Year-End Close", startDate: "2026-12-15", endDate: "2026-12-31", reason: "Financial year-end processing." },
  { id: "bo-2", name: "Product Launch Freeze", startDate: "2026-09-01", endDate: "2026-09-14", reason: "All hands on deck for the Q3 launch." },
];

// --- Security › Two-Factor Authentication ---
export const TWO_FACTOR_CONFIG: TwoFactorConfig = {
  enabled: false,
  methods: { sms: false, email: true, authenticator: true },
  enforcement: "optional",
  recoveryCodes: ["A1B2-C3D4", "E5F6-G7H8", "J9K0-L1M2", "N3P4-Q5R6", "S7T8-U9V0"],
};

// --- Integrations › API Setup ---
export const API_KEYS: ApiKey[] = [
  {
    id: "key-1",
    label: "Production Integration",
    token: "mt_live_8f2a9c4e7b1d3056",
    scopes: ["read", "write"],
    createdAt: "2026-02-12T10:00:00",
    lastUsed: "2026-06-05T14:22:00",
    revoked: false,
  },
  {
    id: "key-2",
    label: "Reporting (Read-only)",
    token: "mt_live_1a2b3c4d5e6f7081",
    scopes: ["read"],
    createdAt: "2026-04-20T09:30:00",
    lastUsed: "2026-06-07T08:10:00",
    revoked: false,
  },
];

export const API_USAGE_LOGS: ApiUsageLog[] = [
  { id: "log-1", endpoint: "/v1/employees", method: "GET", status: 200, timestamp: "2026-06-07T08:10:00" },
  { id: "log-2", endpoint: "/v1/leave/requests", method: "POST", status: 201, timestamp: "2026-06-06T16:42:00" },
  { id: "log-3", endpoint: "/v1/payroll/runs", method: "GET", status: 200, timestamp: "2026-06-05T14:22:00" },
  { id: "log-4", endpoint: "/v1/employees/9921", method: "PATCH", status: 403, timestamp: "2026-06-04T11:05:00" },
  { id: "log-5", endpoint: "/v1/attendance", method: "GET", status: 200, timestamp: "2026-06-03T07:50:00" },
];



import type {
  AccountSettings,
  SecuritySettings,
  NotificationPrefs,
  BillingRecord,
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



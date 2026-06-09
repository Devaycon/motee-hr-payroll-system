export interface AccountSettings {
  companyName: string;
  plan: string;
  planLabel: string;
  renewalDate: string;
  contactEmail: string;
  seats: number;
  usedSeats: number;
}

export interface BillingRecord {
  id: string;
  period: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  downloadUrl: string;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  requireSpecialChars?: boolean;
  expiryDays: number;
  preventReuse: number;
  sessionTimeoutMinutes?: number;
}

export interface TrustedDevice {
  id: string;
  name: string;
  browser: string;
  os: string;
  lastSeen: string;
  isCurrent: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeoutMinutes: number;
  passwordPolicy: PasswordPolicy;
  trustedDevices: TrustedDevice[];
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
  loginActivity?: { id: string; event: string; ipAddress: string; location: string; device: string; timestamp: string; success: boolean }[];
}

export type DigestFrequency = "realtime" | "hourly" | "daily" | "weekly" | "never";

export type LanguageOption = "en" | "fr" | "es" | "pt" | "ar";

export interface NotificationModule {
  id: string;
  module?: string;
  label: string;
  email: boolean;
  inApp: boolean;
  push: boolean;
}

export interface NotificationPrefs {
  modules: NotificationModule[];
  digestFrequency: DigestFrequency;
  timezone: string;
  language: LanguageOption;
}

// --- Account › Module Settings ---
export interface ModuleSetting {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  showInSidebar: boolean;
}

// --- Account › Pick List ---
export interface PickListOption {
  id: string;
  value: string;
  isDefault: boolean;
}

export interface PickList {
  id: string;
  name: string;
  description: string;
  options: PickListOption[];
}

// --- Absence › Holiday Year ---
export interface HolidayYearConfig {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// --- Absence › Company Holidays ---
export interface CompanyHoliday {
  id: string;
  name: string;
  date: string;
  nonWorking: boolean;
  excludedDepartments: string[];
}

// --- Absence › Company Blackout ---
export interface BlackoutPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

// --- Security › Two-Factor Authentication ---
export type TwoFactorMethod = "sms" | "email" | "authenticator";

export type TwoFactorEnforcement = "mandatory" | "optional" | "admin-only";

export interface TwoFactorConfig {
  enabled: boolean;
  methods: Record<TwoFactorMethod, boolean>;
  enforcement: TwoFactorEnforcement;
  recoveryCodes: string[];
}

// --- Integrations › API Setup ---
export type ApiKeyScope = "read" | "write" | "admin";

export interface ApiKey {
  id: string;
  label: string;
  token: string;
  scopes: ApiKeyScope[];
  createdAt: string;
  lastUsed?: string;
  revoked: boolean;
}

export interface ApiUsageLog {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  timestamp: string;
}


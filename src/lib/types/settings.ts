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


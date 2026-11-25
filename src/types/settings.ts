import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface HolidayYearCycle {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface HolidayYearRequest {
  startMonth: number;
  startDay: number;
}

export interface HolidayYearSettings {
  startMonth: number;
  startDay: number;
  cycles: HolidayYearCycle[];
  cyclesAreDerived?: boolean;
}

export interface ModuleChoice {
  id: string;
  enabled: boolean;
  showInSidebar?: boolean;
}

export interface ModuleSettingRow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  showInSidebar: boolean;
  essential: boolean;
  closesModules: number;
}

export interface ModuleSettings {
  modules: ModuleSettingRow[];
}

export interface ModuleSettingsRequest {
  modules: ModuleChoice[];
}

export interface PasswordPolicy {
  minLength?: number;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSymbols?: boolean;
  expiryDays?: number;
  preventReuse?: number;
  sessionTimeoutMinutes?: number;
}

export interface PasswordPolicyRequest {
  minLength?: number;
  requireUppercase?: boolean;
  requireNumbers?: boolean;
  requireSymbols?: boolean;
  requireSpecialChars?: boolean | null;
  expiryDays?: number;
  preventReuse?: number;
  sessionTimeoutMinutes?: number;
  wantsSymbols?: boolean;
}

export interface PasswordPolicyView {
  policy: PasswordPolicy;
  minLengthFloor?: number;
  minLengthCeiling?: number;
  sessionFloorMinutes?: number;
  sessionCeilingMinutes?: number;
}

export interface SubscriptionView {
  companyName: string;
  plan: string;
  planLabel: string;
  status: string;
  trialEndsAt?: string | null;
  billingEmail?: string | null;
  usedSeats: number;
  seatLimit?: number | null;
  invoicesAvailable?: boolean;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/settings/modules
export type GetModuleSettingsResponse = ApiResponse<ModuleSettings>;

// PUT /api/v1/settings/modules
export type UpdateModuleSettingsResponse = ApiResponse<ModuleSettings>;

// GET /api/v1/settings/password-policy
export type GetPasswordPolicyResponse = ApiResponse<PasswordPolicyView>;

// PUT /api/v1/settings/password-policy
export type UpdatePasswordPolicyResponse = ApiResponse<PasswordPolicyView>;

// GET /api/v1/settings/holiday-years
export type GetHolidayYearsResponse = ApiResponse<HolidayYearSettings>;

// PUT /api/v1/settings/holiday-year
export type UpdateHolidayYearResponse = ApiResponse<HolidayYearSettings>;

// GET /api/v1/settings/subscription
export type GetSubscriptionResponse = ApiResponse<SubscriptionView>;


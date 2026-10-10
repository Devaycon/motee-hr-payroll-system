import type { ApiResponse } from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterTenantRequest {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  companyName: string;
  password: string;
  countryCode: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string | null;
  refreshTokenExpiresAt: string | null;
  expiresAt: string;
  userId: string;
  tenantId: string | null;
  onboardingCompleted: boolean;
}

export interface RegisterResponseData {
  email: string;
  verificationRequired: boolean;
}

/**
 * `GET /auth/me`. Every field is optional on purpose: the docs have described
 * this payload as both the signed-in user and the tenant, so nothing here is
 * relied on without a fallback.
 */
export interface CurrentUserData {
  userId?: string;
  email?: string;
  name?: string;
  tenantId?: string | null;
  role?: string | null;
  employeeId?: string | null;
  isPlatformStaff?: boolean;
  isOwner?: boolean;
  onboardingCompleted?: boolean;
  accessLevels?: string[];
}

export type LoginResponse = ApiResponse<LoginResponseData>;
export type RegisterResponse = ApiResponse<RegisterResponseData>;
export type MessageResponse = ApiResponse<null>;

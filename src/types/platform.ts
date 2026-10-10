import type { ApiResponse, PagedResult } from "./api";

export interface GrantPlatformRoleRequest {
  email: string;
  role: PlatformRole;
}

export type PlatformRole =
  | "support"
  | "finance"
  | "admin";

export interface PlatformStaffDto {
  userId: string;
  email: string;
  name: string;
  role: PlatformRole;
}

export interface PlatformTenantDto {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  countryCode: string;
  billingEmail?: string | null;
  users: number;
  employees: number;
  createdAt: string;
  trialEndsAt?: string | null;
  onboardingCompletedAt?: string | null;
}

export type GetPlatformTenantsResponse = ApiResponse<PagedResult<PlatformTenantDto>>;

export interface GetPlatformTenantsParams {
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export type GetPlatformTenantResponse = ApiResponse<PlatformTenantDto>;

export type GetPlatformStaffResponse = ApiResponse<PlatformStaffDto[]>;

export type GrantPlatformRoleResponse = ApiResponse<PlatformStaffDto>;

export type RevokePlatformRoleResponse = ApiResponse<null>;

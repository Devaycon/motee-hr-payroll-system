import type { ApiResponse } from "./api";

export type UserAccountState = "active" | "locked" | "pending";

export interface HeldAccessLevel {
  id: string;
  name: string;
  isActive: boolean;
}

export interface TenantUser {
  id: string;
  name: string;
  initials: string;
  email: string;
  isOwner: boolean;
  employeeId: string | null;
  jobTitle: string | null;
  departmentName: string | null;
  accessLevels: HeldAccessLevel[];
  state: UserAccountState;
  lockedUntil: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

export type GetUsersResponse = ApiResponse<TenantUser[]>;

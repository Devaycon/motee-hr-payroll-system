import type { ApiResponse } from "./api";

export interface BranchDto {
  id: string;
  name: string;
  code: string;
  kind: BranchKind;
  status: BranchStatus;
  addressLines: string[];
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  timeZone?: string | null;
  phone?: string | null;
  email?: string | null;
  managerEmployeeId?: string | null;
  managerName?: string | null;
  headcountTarget?: number | null;
  openedAt?: string | null;
  employeeCount: number;
  departmentCount: number;
  openPositions?: number | null;
  addressLabel: string;
}

export type BranchKind =
  | "headquarters"
  | "branch"
  | "regionalOffice"
  | "site"
  | "remote";

export interface BranchRequest {
  name: string;
  code: string;
  kind?: BranchKind;
  status?: BranchStatus;
  addressLines?: string[];
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
  timeZone?: string | null;
  phone?: string | null;
  email?: string | null;
  managerEmployeeId?: string | null;
  headcountTarget?: number | null;
  openedAt?: string | null;
}

export type BranchStatus =
  | "active"
  | "inactive";

export type GetBranchesResponse = ApiResponse<BranchDto[]>;

export type CreateBranchResponse = ApiResponse<BranchDto>;

export type GetBranchResponse = ApiResponse<BranchDto>;

export type UpdateBranchResponse = ApiResponse<BranchDto>;

export interface UpdateBranchParams {
  id: string;
  body: BranchRequest;
}

export type DeleteBranchResponse = ApiResponse<null>;

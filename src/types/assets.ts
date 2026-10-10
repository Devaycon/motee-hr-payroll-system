import type { ApiResponse, PagedResult } from "./api";
import type { AssetRequest } from "./common";

export interface AssetAssignmentDto {
  id: string;
  employeeId: string;
  employeeName: string;
  assignedOn: string;
  returnedOn?: string | null;
  returnReason?: string | null;
  conditionOnAssign?: string | null;
  conditionOnReturn?: string | null;
  heldDays?: number | null;
  isOpen: boolean;
}

export interface AssetDto {
  id: string;
  tag: string;
  name: string;
  category?: string | null;
  serialNumber?: string | null;
  assignedToEmployeeId?: string | null;
  assignedToName?: string | null;
  assignedDate?: string | null;
  notes?: string | null;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
}

export type AssetStatus =
  | "available"
  | "assigned"
  | "lost"
  | "retired";

export interface AssignAssetRequest {
  employeeId: string;
  assignedDate?: string | null;
  condition?: string | null;
}

export interface ChangeAssetStatusRequest {
  status: AssetStatus;
}

export interface ReturnAssetRequest {
  returnedOn?: string | null;
  reason?: string | null;
  condition?: string | null;
}

export type GetAssetsResponse = ApiResponse<PagedResult<AssetDto>>;

export interface GetAssetsParams {
  Search?: string;
  Category?: string;
  Status?: AssetStatus;
  AssignedToEmployeeId?: string;
  page?: number;
  pageSize?: number;
}

export type CreateAssetResponse = ApiResponse<AssetDto>;

export type GetAssetResponse = ApiResponse<AssetDto>;

export type UpdateAssetResponse = ApiResponse<AssetDto>;

export interface UpdateAssetParams {
  id: string;
  body: AssetRequest;
}

export type AssignAssetResponse = ApiResponse<AssetDto>;

export interface AssignAssetParams {
  id: string;
  body: AssignAssetRequest;
}

export type ReturnAssetResponse = ApiResponse<AssetDto>;

export interface ReturnAssetParams {
  id: string;
  body?: ReturnAssetRequest;
}

export type GetAssetHistoryResponse = ApiResponse<AssetAssignmentDto[]>;

export type ChangeAssetStatusResponse = ApiResponse<AssetDto>;

export interface ChangeAssetStatusParams {
  id: string;
  body: ChangeAssetStatusRequest;
}

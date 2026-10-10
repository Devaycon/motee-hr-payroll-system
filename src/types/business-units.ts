import type { ApiResponse } from "./api";

export interface BusinessUnitDto {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  isActive: boolean;
  departmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessUnitRequest {
  name: string;
  code?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export type GetBusinessUnitsResponse = ApiResponse<BusinessUnitDto[]>;

export type CreateBusinessUnitResponse = ApiResponse<BusinessUnitDto>;

export type GetBusinessUnitResponse = ApiResponse<BusinessUnitDto>;

export type UpdateBusinessUnitResponse = ApiResponse<BusinessUnitDto>;

export interface UpdateBusinessUnitParams {
  id: string;
  body: BusinessUnitRequest;
}

export type DeleteBusinessUnitResponse = ApiResponse<null>;

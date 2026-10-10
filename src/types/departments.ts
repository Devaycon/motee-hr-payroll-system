import type { ApiResponse } from "./api";

export interface DepartmentDto {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  headEmployeeId?: string | null;
  headName?: string | null;
  headInitials?: string | null;
  businessUnitId?: string | null;
  businessUnitName?: string | null;
  budgetMonthly?: number | null;
  status: DepartmentStatus;
  employeeCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface DepartmentRequest {
  name: string;
  code: string;
  description?: string | null;
  headEmployeeId?: string | null;
  businessUnitId?: string | null;
  budgetMonthly?: number | null;
  status?: DepartmentStatus;
}

export type DepartmentStatus =
  | "active"
  | "inactive"
  | "restructuring";

export type GetDepartmentsResponse = ApiResponse<DepartmentDto[]>;

export type CreateDepartmentResponse = ApiResponse<DepartmentDto>;

export type GetDepartmentResponse = ApiResponse<DepartmentDto>;

export type UpdateDepartmentResponse = ApiResponse<DepartmentDto>;

export interface UpdateDepartmentParams {
  id: string;
  body: DepartmentRequest;
}

export type DeleteDepartmentResponse = ApiResponse<null>;

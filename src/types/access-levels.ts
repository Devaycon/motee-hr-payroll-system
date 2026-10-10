import type { ApiResponse } from "./api";

export interface AccessLevelCatalogue {
  modules: string[];
  actions: PermissionAction[];
  actionDependencies: Record<string, PermissionAction[]>;
  scopeKinds: DataScopeKind[];
}

export interface AccessLevelDto {
  id: string;
  templateSlug?: string | null;
  name: string;
  description?: string | null;
  kind: AccessLevelKind;
  status: AccessLevelStatus;
  scope: DataScope;
  permissions: ModulePermission[];
  assignedCount: number;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AccessLevelKind =
  | "default"
  | "custom";

export interface AccessLevelRequest {
  name: string;
  description?: string | null;
  scope: DataScope;
  permissions: ModulePermission[];
  copyFromId?: string | null;
}

export type AccessLevelStatus =
  | "draft"
  | "active"
  | "inactive";

export interface AssignAccessLevelRequest {
  userId: string;
}

export interface ChangeAccessLevelStatusRequest {
  status: AccessLevelStatus;
}

export interface DataScope {
  kind: DataScopeKind;
  departmentIds?: string[];
  businessUnitIds?: string[];
  branchIds?: string[];
  needsHolder?: boolean;
  breadth?: PermissionScope;
  reachesNothing?: boolean;
}

export type DataScopeKind =
  | "none"
  | "self"
  | "directReports"
  | "ownDepartment"
  | "department"
  | "ownBranch"
  | "branch"
  | "businessUnit"
  | "all";

export interface ModulePermission {
  module: string;
  access: boolean;
  actions: PermissionAction[];
}

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "approve"
  | "administer";

export type PermissionScope =
  | "none"
  | "self"
  | "team"
  | "department"
  | "all";

export type GetAccessLevelsResponse = ApiResponse<AccessLevelDto[]>;

export type CreateAccessLevelResponse = ApiResponse<AccessLevelDto>;

export type GetAccessLevelCatalogueResponse = ApiResponse<AccessLevelCatalogue>;

export type GetAccessLevelResponse = ApiResponse<AccessLevelDto>;

export type UpdateAccessLevelResponse = ApiResponse<AccessLevelDto>;

export interface UpdateAccessLevelParams {
  id: string;
  body: AccessLevelRequest;
}

export type DeleteAccessLevelResponse = ApiResponse<null>;

export type ChangeAccessLevelStatusResponse = ApiResponse<AccessLevelDto>;

export interface ChangeAccessLevelStatusParams {
  id: string;
  body: ChangeAccessLevelStatusRequest;
}

export type AssignAccessLevelResponse = ApiResponse<AccessLevelDto>;

export interface AssignAccessLevelParams {
  id: string;
  body: AssignAccessLevelRequest;
}

export type UnassignAccessLevelResponse = ApiResponse<null>;

export interface UnassignAccessLevelParams {
  id: string;
  userId: string;
}

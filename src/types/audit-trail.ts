import type { ApiResponse, PagedResult } from "./api";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "export"
  | "view"
  | "approve"
  | "reject";

export interface AuditCatalogueDto {
  actions: string[];
  modules: string[];
  statusClasses: string[];
}

export interface AuditEntryDto {
  id: string;
  actorUserId?: string | null;
  actorName?: string | null;
  action: AuditAction;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  description: string;
  changes?: string | null;
  endpoint?: string | null;
  httpMethod?: string | null;
  httpStatus?: number | null;
  durationMs?: number | null;
  ipAddress?: string | null;
  correlationId?: string | null;
  createdAt: string;
}

export type GetAuditTrailResponse = ApiResponse<PagedResult<AuditEntryDto>>;

export interface GetAuditTrailParams {
  Action?: AuditAction;
  Module?: string;
  ActorUserId?: string;
  EntityId?: string;
  StatusClass?: string;
  From?: string;
  To?: string;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export type GetAuditTrailCatalogueResponse = ApiResponse<AuditCatalogueDto>;

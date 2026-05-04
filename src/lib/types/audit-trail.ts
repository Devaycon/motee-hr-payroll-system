export type AuditActionType =
  | "login"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "export"
  | "view"
  | "approve"
  | "reject";

export interface AuditEntry {
  id: string;
  sessionId: string;
  userId: string;
  userName: string;
  userInitials: string;
  userRole: string;
  actionType: AuditActionType;
  module: string;
  description: string;
  endpoint: string;
  httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  httpStatus: number;
  ipAddress: string;
  responseTimeMs: number;
  timestamp: string;
  isSuspicious: boolean;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditSession {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  userRole: string;
  startTime: string;
  endTime?: string;
  entries: AuditEntry[];
}


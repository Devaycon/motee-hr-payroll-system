import type { ApiResponse } from "./api";

export interface NotificationDto {
  id: string;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  body: string;
  href?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  read: boolean;
  createdAt: string;
}

export type NotificationKind =
  | "contractExpiring"
  | "documentExpiring"
  | "acknowledgementOutstanding"
  | "timesheetDue"
  | "reviewOverdue"
  | "goalOverdue"
  | "openClockSession";

export type NotificationSeverity =
  | "info"
  | "success"
  | "warning";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/notifications
export type GetNotificationsResponse = ApiResponse<NotificationDto[]>;

export interface GetNotificationsParams {
  unreadOnly?: boolean;
}

// GET /api/v1/notifications/unread-count
export type GetUnreadNotificationCountResponse = ApiResponse<number>;

// POST /api/v1/notifications/{id}/read
export type MarkNotificationReadResponse = ApiResponse<null>;

// POST /api/v1/notifications/read-all
export type MarkAllNotificationsReadResponse = ApiResponse<null>;

// POST /api/v1/notifications/{id}/dismiss
export type DismissNotificationResponse = ApiResponse<null>;

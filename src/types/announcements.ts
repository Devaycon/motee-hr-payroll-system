import type { ApiResponse, PagedResult } from "./api";

export interface AcknowledgedPersonDto {
  employeeId: string;
  employeeName: string;
  department?: string | null;
  acknowledgedAt: string;
}

export interface AcknowledgementSummaryDto {
  announcementId: string;
  totalTargeted: number;
  acknowledged: AcknowledgedPersonDto[];
  outstanding: string[];
}

export type AnnouncementAudience =
  | "allStaff"
  | "department"
  | "managers"
  | "leadership";

export interface AnnouncementDto {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  status: string;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
  targetDepartmentIds: string[];
  targetDepartments: string[];
  isPinned: boolean;
  requiresAcknowledgement: boolean;
  scheduledFor?: string | null;
  expiresAt?: string | null;
  attachmentFileId?: string | null;
  attachmentName?: string | null;
  createdByName?: string | null;
  createdAt: string;
  publishedAt?: string | null;
  viewCount: number;
  acknowledgedCount: number;
  acknowledgements: AcknowledgedPersonDto[];
  totalTargeted: number;
  acknowledgedByMe?: boolean | null;
}

export type AnnouncementPriority =
  | "standard"
  | "urgent";

export interface AnnouncementRequest {
  title: string;
  body: string;
  type: AnnouncementType;
  priority?: AnnouncementPriority;
  audience?: AnnouncementAudience;
  targetDepartmentIds?: string[] | null;
  isPinned?: boolean;
  requiresAcknowledgement?: boolean;
  scheduledFor?: string | null;
  expiresAt?: string | null;
  attachmentFileId?: string | null;
}

export type AnnouncementType =
  | "general"
  | "policy"
  | "event"
  | "urgent";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/announcements/feed
export type GetAnnouncementFeedResponse = ApiResponse<AnnouncementDto[]>;

// POST /api/v1/announcements/feed/{id}/view
export type MarkAnnouncementViewedResponse = ApiResponse<AnnouncementDto>;

// POST /api/v1/announcements/feed/{id}/acknowledge
export type AcknowledgeAnnouncementResponse = ApiResponse<AnnouncementDto>;

// GET /api/v1/announcements
export type GetAnnouncementsResponse = ApiResponse<PagedResult<AnnouncementDto>>;

export interface GetAnnouncementsParams {
  Type?: AnnouncementType;
  Audience?: AnnouncementAudience;
  IncludeArchived?: boolean;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/announcements
export type CreateAnnouncementResponse = ApiResponse<AnnouncementDto>;

// GET /api/v1/announcements/{id}
export type GetAnnouncementResponse = ApiResponse<AnnouncementDto>;

// PUT /api/v1/announcements/{id}
export type UpdateAnnouncementResponse = ApiResponse<AnnouncementDto>;

// DELETE /api/v1/announcements/{id}
export type DeleteAnnouncementResponse = ApiResponse<null>;

// GET /api/v1/announcements/{id}/acknowledgements
export type GetAnnouncementAcknowledgementsResponse = ApiResponse<AcknowledgementSummaryDto>;

// POST /api/v1/announcements/{id}/publish
export type PublishAnnouncementResponse = ApiResponse<AnnouncementDto>;

// POST /api/v1/announcements/{id}/archive
export type ArchiveAnnouncementResponse = ApiResponse<AnnouncementDto>;

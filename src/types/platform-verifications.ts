import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface ReviewQueueItemDto {
  tenantId: string;
  companyName: string;
  countryName: string;
  kind: VerificationKind;
  label: string;
  authority: string;
  number?: string | null;
  documentFileId?: string | null;
  stage: VerificationStage;
  submittedOn?: string | null;
  daysWaiting: number;
}

export interface VerificationDto {
  kind: VerificationKind;
  label: string;
  numberLabel: string;
  authority: string;
  description: string;
  number?: string | null;
  documentFileId?: string | null;
  stage: VerificationStage;
  submittedOn?: string | null;
  reviewedByName?: string | null;
  reviewedOn?: string | null;
  decisionNote?: string | null;
  editable: boolean;
  canSubmit: boolean;
  outstanding: string[];
  history: VerificationEventDto[];
}

export interface VerificationEventDto {
  event: string;
  by?: string | null;
  at: string;
}

export type VerificationKind =
  "registration" | "tax";

export interface VerificationReviewRequest {
  stage: VerificationStage;
  note?: string | null;
}

export type VerificationStage =
  "draft" | "submitted" | "underReview" | "verified" | "rejected";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/platform/verifications
export type GetPlatformVerificationsResponse = ApiResponse<ReviewQueueItemDto[]>;

// POST /api/v1/platform/tenants/{tenantId}/verification/{kind}/review
export type ReviewTenantVerificationResponse = ApiResponse<VerificationDto>;


import type { ApiResponse, PagedResult } from "./api";

export interface AssignOwnerRequest {
  ownerEmployeeId?: string | null;
}

export interface CandidateDto {
  id: string;
  requisitionId: string;
  requisitionTitle?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  stage: CandidateStage;
  status: CandidateStatus;
  skills: string[];
  experienceSummary?: string | null;
  notes?: string | null;
  linkedIn?: string | null;
  cvFileId?: string | null;
  coverLetterFileId?: string | null;
  ownerEmployeeId?: string | null;
  ownerName?: string | null;
  createdEmployeeId?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  appliedAt: string;
  updatedAt: string;
  daysInStage: number;
  scorecards: ScorecardDto[];
  score?: number | null;
  offers: OfferDto[];
}

export interface CandidateRequest {
  requisitionId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  skills?: string[] | null;
  experienceSummary?: string | null;
  notes?: string | null;
  linkedIn?: string | null;
  cvFileId?: string | null;
  coverLetterFileId?: string | null;
  ownerEmployeeId?: string | null;
}

export type CandidateStage =
  | "applicants"
  | "interview"
  | "interviewed"
  | "offer"
  | "hired";

export type CandidateStatus =
  | "active"
  | "rejected";

export interface MoveCandidateRequest {
  to: CandidateStage;
}

export type MoveRefusal =
  | "none"
  | "alreadyThere"
  | "rejected"
  | "stageNotEnabled"
  | "skipsAStage"
  | "notScored"
  | "noOffer"
  | "offerNotAccepted"
  | "offerDeclined"
  | "noOpeningsLeft";

export interface MoveVerdictDto {
  allowed: boolean;
  refusal: MoveRefusal;
  reason?: string | null;
}

export interface OfferDto {
  id: string;
  status: OfferStatus;
  salary?: number | null;
  currency?: string | null;
  startDate?: string | null;
  notes?: string | null;
  attachmentFileId?: string | null;
  sentAt: string;
  respondedAt?: string | null;
  responseNote?: string | null;
}

export interface OfferRequest {
  salary?: number | null;
  currency?: string | null;
  startDate?: string | null;
  notes?: string | null;
  attachmentFileId?: string | null;
}

export interface OfferResponseRequest {
  status: OfferStatus;
  responseNote?: string | null;
}

export type OfferStatus =
  | "sent"
  | "accepted"
  | "rejected"
  | "withdrawn";

export interface RejectCandidateRequest {
  reason: string;
}

export interface ScorecardCriterion {
  label: string;
  score: number;
}

export interface ScorecardDto {
  id: string;
  interviewId?: string | null;
  byEmployeeId?: string | null;
  byName?: string | null;
  criteria: ScorecardCriterion[];
  overall?: number | null;
  recommendation?: ScorecardRecommendation;
  comment?: string | null;
  createdAt: string;
}

export type ScorecardRecommendation =
  | "strongNo"
  | "no"
  | "yes"
  | "strongYes";

export interface ScorecardRequest {
  interviewId?: string | null;
  criteria: ScorecardCriterion[];
  recommendation?: ScorecardRecommendation;
  comment?: string | null;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/candidates
export type GetCandidatesResponse = ApiResponse<PagedResult<CandidateDto>>;

export interface GetCandidatesParams {
  RequisitionId?: string;
  Stage?: CandidateStage;
  Status?: CandidateStatus;
  OwnerEmployeeId?: string;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/candidates
export type CreateCandidateResponse = ApiResponse<CandidateDto>;

// GET /api/v1/candidates/{id}
export type GetCandidateResponse = ApiResponse<CandidateDto>;

// PUT /api/v1/candidates/{id}
export type UpdateCandidateResponse = ApiResponse<CandidateDto>;

// GET /api/v1/candidates/{id}/can-move
export type CanMoveCandidateResponse = ApiResponse<MoveVerdictDto>;

export interface CanMoveCandidateParams {
  id: string;
  to?: CandidateStage;
}

// POST /api/v1/candidates/{id}/move
export type MoveCandidateResponse = ApiResponse<CandidateDto>;

// POST /api/v1/candidates/{id}/reject
export type RejectCandidateResponse = ApiResponse<CandidateDto>;

// POST /api/v1/candidates/{id}/restore
export type RestoreCandidateResponse = ApiResponse<CandidateDto>;

// POST /api/v1/candidates/{id}/owner
export type AssignCandidateOwnerResponse = ApiResponse<CandidateDto>;

// POST /api/v1/candidates/{id}/scorecards
export type AddCandidateScorecardResponse = ApiResponse<CandidateDto>;

// POST /api/v1/candidates/{id}/offers
export type MakeCandidateOfferResponse = ApiResponse<CandidateDto>;

// POST /api/v1/candidates/{id}/offers/{offerId}/respond
export type RespondToCandidateOfferResponse = ApiResponse<CandidateDto>;

// POST /api/v1/candidates/{id}/send-to-onboarding
export type SendCandidateToOnboardingResponse = ApiResponse<CandidateDto>;

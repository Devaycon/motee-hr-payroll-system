import type { ApiResponse, PagedResult } from "./api";
import type { AbsenceState, SicknessReason } from "./sickness";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface AdjustmentDto {
  id: string;
  description: string;
  recommendedOn: string;
  sicknessRecordId?: string | null;
  agreedByEmployeeId?: string | null;
  agreedByName?: string | null;
  implementationOwnerEmployeeId?: string | null;
  implementationOwnerName?: string | null;
  effectiveDate?: string | null;
  reviewDate?: string | null;
  stage: AdjustmentStage;
  isInPlace: boolean;
  reviewIsDue: boolean;
  nextStages: AdjustmentStage[];
}

export interface AdjustmentRequest {
  description: string;
  recommendedOn?: string | null;
  sicknessRecordId?: string | null;
  agreedByEmployeeId?: string | null;
  implementationOwnerEmployeeId?: string | null;
  effectiveDate?: string | null;
  reviewDate?: string | null;
}

export type AdjustmentStage =
  "proposed" | "agreed" | "implemented" | "reviewed" | "closed";

export interface AdjustmentStageRequest {
  stage: AdjustmentStage;
}

export type OhBoardTab =
  "all" | "actionRequired" | "awaitingProvider" | "adjustments" | "followUp" | "closed";

export interface OhCandidateDto {
  employeeId: string;
  employeeName: string;
  department?: string | null;
  sicknessRecordId: string;
  absenceStartDate: string;
  absenceDays: number;
  daysPastThreshold: number;
}

export interface OhCaseDto {
  id: string;
  referenceNumber: string;
  employeeId: string;
  employeeName: string;
  initials?: string | null;
  department?: string | null;
  sicknessRecordId?: string | null;
  absenceStartDate?: string | null;
  absenceDays?: number | null;
  referralDate?: string | null;
  assessmentDate?: string | null;
  stage: OhStage;
  recordedStage: OhStage;
  fitness: OhFitness;
  reasonableAdjustmentsConsidered: boolean;
  expectedReturnDate?: string | null;
  caseNotes?: string | null;
  caseOwnerEmployeeId?: string | null;
  caseOwnerName?: string | null;
  reviewDate?: string | null;
  reviewIsDue: boolean;
  closedOn?: string | null;
  adjustments: AdjustmentDto[];
  /** Every absence linked to the case. No reasonDetail: that stays behind the medical grant. */
  linkedAbsences: LinkedAbsenceDto[];
  nextAction?: OhNextAction;
  nextStages: OhStage[];
}

export interface LinkedAbsenceDto {
  id: string;
  startDate: string;
  endDate?: string | null;
  days?: number | null;
  reason: SicknessReason;
  state: AbsenceState;
}

/** Replaces the whole set; an empty array unlinks everything. */
export interface LinkAbsencesRequest {
  sicknessRecordIds: string[];
}

// PUT /api/v1/occupational-health/{id}/sickness-records
export type LinkOhAbsencesResponse = ApiResponse<OhCaseDto>;

export type OhFitness =
  "pending" | "fit" | "fitWithAdjustments" | "temporarilyUnfit" | "unfit";

export interface OhHistoryDto {
  at: string;
  actorName?: string | null;
  note: string;
}

export interface OhNextAction {
  label: string;
  owner: string;
  due?: string | null;
}

export interface OhReferralRequest {
  employeeId: string;
  sicknessRecordId?: string | null;
  absenceStartDate?: string | null;
  referralDate?: string | null;
  assessmentDate?: string | null;
  fitness?: OhFitness;
  reasonableAdjustmentsConsidered?: boolean;
  expectedReturnDate?: string | null;
  caseNotes?: string | null;
  caseOwnerEmployeeId?: string | null;
  reviewDate?: string | null;
}

export type OhStage =
  "absenceRecorded" | "monitoring" | "thresholdReached" | "hrAlerted" | "referred" | "assessmentCompleted" | "recommendationsReceived" | "hrReview" | "adjustmentsImplemented" | "returned" | "rtwCompleted" | "closed";

export interface OhStageRequest {
  stage: OhStage;
  note?: string | null;
}

export interface OhTally {
  open: number;
  awaitingProvider: number;
  withAdjustments: number;
  reviewsDue: number;
  pastThresholdUnreferred: number;
  closed: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/occupational-health
export type GetOhReferralsResponse = ApiResponse<PagedResult<OhCaseDto>>;
export interface GetOhReferralsParams {
  Tab?: OhBoardTab;
  CaseOwnerEmployeeId?: string;
  EmployeeId?: string;
  DepartmentId?: string;
  Fitness?: OhFitness;
  Search?: string;
  ReviewsDue?: boolean;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/occupational-health
export type CreateOhReferralResponse = ApiResponse<OhCaseDto>;

// GET /api/v1/occupational-health/{id}
export type GetOhReferralResponse = ApiResponse<OhCaseDto>;

// PUT /api/v1/occupational-health/{id}
export type UpdateOhReferralResponse = ApiResponse<OhCaseDto>;

// DELETE /api/v1/occupational-health/{id}
export type DeleteOhReferralResponse = ApiResponse<unknown | null>;

// GET /api/v1/occupational-health/summary
export type GetOhSummaryResponse = ApiResponse<OhTally>;

// GET /api/v1/occupational-health/candidates
export type GetOhCandidatesResponse = ApiResponse<OhCandidateDto[]>;

// GET /api/v1/occupational-health/{id}/history
export type GetOhReferralHistoryResponse = ApiResponse<OhHistoryDto[]>;

// POST /api/v1/occupational-health/{id}/stage
export type MoveOhReferralStageResponse = ApiResponse<OhCaseDto>;

// POST /api/v1/occupational-health/{id}/adjustments
export type AddOhAdjustmentResponse = ApiResponse<OhCaseDto>;

// PUT /api/v1/occupational-health/{id}/adjustments/{adjustmentId}
export type UpdateOhAdjustmentResponse = ApiResponse<OhCaseDto>;

// DELETE /api/v1/occupational-health/{id}/adjustments/{adjustmentId}
export type DeleteOhAdjustmentResponse = ApiResponse<unknown | null>;

// POST /api/v1/occupational-health/{id}/adjustments/{adjustmentId}/stage
export type MoveOhAdjustmentStageResponse = ApiResponse<OhCaseDto>;


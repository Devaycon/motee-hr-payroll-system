import type { ApiResponse, PagedResult } from "./api";
import type { EmploymentType } from "./common";
import type { CandidateStage } from "./candidates";

export interface CloseRequisitionRequest {
  reason?: string | null;
}

export type HiringPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export interface PipelineCountsDto {
  openings: number;
  hired: number;
  remaining: number;
  active: number;
  rejected: number;
  byStage: Record<string, number>;
  offersSent: number;
  offersAccepted: number;
  offersRejected: number;
}

export interface PublishWarningDto {
  field: string;
  message: string;
  isBlocking: boolean;
}

export interface RequisitionDto {
  id: string;
  reference?: string | null;
  positionTitle: string;
  departmentId?: string | null;
  department?: string | null;
  hiringManagerId?: string | null;
  hiringManager?: string | null;
  recruiterId?: string | null;
  recruiter?: string | null;
  hrBusinessPartnerId?: string | null;
  hrBusinessPartner?: string | null;
  interviewPanel: string[];
  interviewPanelNames: string[];
  employmentType: EmploymentType;
  status: RequisitionStatus;
  hiringPriority: HiringPriority;
  location?: string | null;
  openings: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  jobDescription?: string | null;
  qualifications?: string | null;
  requiredSkills: string[];
  targetStartDate?: string | null;
  expiryDate?: string | null;
  hasExpired: boolean;
  isAcceptingApplications: boolean;
  stages: CandidateStage[];
  pipeline: PipelineCountsDto;
  createdAt: string;
  publishedAt?: string | null;
  closedAt?: string | null;
}

export interface RequisitionRequest {
  positionTitle: string;
  departmentId?: string | null;
  hiringManagerId?: string | null;
  recruiterId?: string | null;
  hrBusinessPartnerId?: string | null;
  interviewPanel?: string[] | null;
  employmentType: EmploymentType;
  hiringPriority?: HiringPriority;
  location?: string | null;
  openings?: number;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  jobDescription?: string | null;
  qualifications?: string | null;
  requiredSkills?: string[] | null;
  targetStartDate?: string | null;
  expiryDate?: string | null;
  stages?: CandidateStage[] | null;
}

export type RequisitionStatus =
  | "draft"
  | "pendingApproval"
  | "approved"
  | "open"
  | "interviewing"
  | "offerStage"
  | "filled"
  | "closed"
  | "cancelled"
  | "onHold";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/requisitions
export type GetRequisitionsResponse = ApiResponse<PagedResult<RequisitionDto>>;

export interface GetRequisitionsParams {
  Status?: RequisitionStatus;
  DepartmentId?: string;
  HiringManagerId?: string;
  RecruitingOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/requisitions
export type CreateRequisitionResponse = ApiResponse<RequisitionDto>;

// GET /api/v1/requisitions/{id}
export type GetRequisitionResponse = ApiResponse<RequisitionDto>;

// PUT /api/v1/requisitions/{id}
export type UpdateRequisitionResponse = ApiResponse<RequisitionDto>;

// DELETE /api/v1/requisitions/{id}
export type DeleteRequisitionResponse = ApiResponse<null>;

// GET /api/v1/requisitions/{id}/warnings
export type GetRequisitionWarningsResponse = ApiResponse<PublishWarningDto[]>;

// POST /api/v1/requisitions/{id}/publish
export type PublishRequisitionResponse = ApiResponse<RequisitionDto>;

// POST /api/v1/requisitions/{id}/hold
export type HoldRequisitionResponse = ApiResponse<RequisitionDto>;

// POST /api/v1/requisitions/{id}/resume
export type ResumeRequisitionResponse = ApiResponse<RequisitionDto>;

// POST /api/v1/requisitions/{id}/close
export type CloseRequisitionResponse = ApiResponse<RequisitionDto>;

// POST /api/v1/requisitions/{id}/cancel
export type CancelRequisitionResponse = ApiResponse<RequisitionDto>;

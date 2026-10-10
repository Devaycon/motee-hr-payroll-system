import type { ApiResponse, PagedResult } from "./api";
import type { ApprovalDto, OnboardingMethod } from "./common";

export interface MoveStageRequest {
  stage: OnboardingStage;
}

export interface OnboardingCatalogue {
  stages: string[];
  submissions: string[];
}

export interface OnboardingDto {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  jobTitle?: string | null;
  departmentName?: string | null;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
  stage: OnboardingStage;
  submission: OnboardingSubmission;
  method: OnboardingMethod;
  startDate?: string | null;
  isOverdue: boolean;
  review?: ApprovalDto;
  submittedAt?: string | null;
  completedAt?: string | null;
}

export type OnboardingStage =
  | "preBoarding"
  | "dayOne"
  | "firstWeek"
  | "thirtyDay"
  | "sixtyDay"
  | "ninetyDay"
  | "completed";

export type OnboardingSubmission =
  | "notStarted"
  | "inProgress"
  | "submitted";

export type GetOnboardingsResponse = ApiResponse<PagedResult<OnboardingDto>>;

export interface GetOnboardingsParams {
  Stage?: OnboardingStage;
  Submission?: OnboardingSubmission;
  DepartmentId?: string;
  Search?: string;
  Overdue?: boolean;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export type GetOnboardingCatalogueResponse = ApiResponse<OnboardingCatalogue>;

export type GetMyOnboardingResponse = ApiResponse<OnboardingDto>;

export type GetOnboardingResponse = ApiResponse<OnboardingDto>;

export type MoveOnboardingStageResponse = ApiResponse<OnboardingDto>;

export interface MoveOnboardingStageParams {
  id: string;
  body: MoveStageRequest;
}

export type CompleteOnboardingResponse = ApiResponse<OnboardingDto>;

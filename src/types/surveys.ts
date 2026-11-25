import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface DepartmentScoreDto {
  departmentId?: string | null;
  departmentName: string;
  responses: number;
  engagementScore?: number | null;
}

export interface EngagementPointDto {
  month: string;
  companyWide?: number | null;
  byDepartment: DepartmentScoreDto[];
}

export interface EnpsTally {
  promoters: number;
  passives: number;
  detractors: number;
  score: number;
  answers: number;
}

export interface MySurveyResponseDto {
  haveIAnswered: boolean;
  submittedAt?: string | null;
  answers?: SubmittedAnswerDto[] | null;
}

export type PulseFrequency =
  "weekly" | "biWeekly" | "monthly" | "quarterly";

export interface QuestionResultDto {
  questionId: string;
  text: string;
  questionType: QuestionType;
  answers: number;
  distribution: ValueCountDto[];
  options: ValueCountDto[];
  average?: number | null;
  comments: string[];
}

export type QuestionType =
  "multipleChoice" | "rating" | "likert" | "openText" | "nps" | "yesNo";

export interface SubmittedAnswerDto {
  questionId: string;
  values: string[];
}

export interface SubmittedAnswerRequest {
  questionId: string;
  values?: string[] | null;
}

export type SurveyAudience =
  "allStaff" | "department" | "managers";

export interface SurveyBoardDto {
  total: number;
  active: number;
  draft: number;
  closed: number;
  archived: number;
  totalResponses: number;
  engagementScore?: number | null;
}

export interface SurveyDto {
  id: string;
  title: string;
  description: string;
  surveyType: SurveyType;
  status: SurveyStatus;
  audience: SurveyAudience;
  targetDepartmentIds: string[];
  isAnonymous: boolean;
  sendReminder: boolean;
  startDate?: string | null;
  endDate?: string | null;
  pulseFrequency?: PulseFrequency;
  questions: SurveyQuestionDto[];
  totalTargeted?: number | null;
  responses: number;
  responseRate?: number | null;
  haveIAnswered: boolean;
  createdByEmployeeId?: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestionDto {
  id: string;
  text: string;
  questionType: QuestionType;
  required: boolean;
  options: string[];
  scaleMin?: number | null;
  scaleMax?: number | null;
  sequence: number;
}

export interface SurveyQuestionRequest {
  text: string;
  questionType?: QuestionType;
  required?: boolean;
  options?: string[] | null;
  scaleMin?: number | null;
  scaleMax?: number | null;
}

export interface SurveyRequest {
  title: string;
  description?: string | null;
  surveyType?: SurveyType;
  audience?: SurveyAudience;
  targetDepartmentIds?: string[] | null;
  isAnonymous?: boolean;
  sendReminder?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  pulseFrequency?: PulseFrequency;
  status?: SurveyStatus;
  questions: SurveyQuestionRequest[];
}

export interface SurveyResultsDto {
  surveyId: string;
  responses: number;
  responseRate?: number | null;
  isReportable: boolean;
  withheld?: string | null;
  engagementScore?: number | null;
  enps?: EnpsTally;
  questions: QuestionResultDto[];
  byDepartment: DepartmentScoreDto[];
  suppressedDepartments: number;
}

export type SurveyStatus =
  "draft" | "scheduled" | "active" | "closed" | "archived";

export interface SurveyStatusRequest {
  status: SurveyStatus;
}

export interface SurveySubmissionRequest {
  answers: SubmittedAnswerRequest[];
}

export type SurveyType =
  "engagement" | "pulse" | "enps" | "onboarding" | "exit" | "managerLeadership";

export interface ValueCountDto {
  value: string;
  count: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/surveys
export type GetSurveysResponse = ApiResponse<PagedResult<SurveyDto>>;
export interface GetSurveysParams {
  Status?: SurveyStatus;
  SurveyType?: SurveyType;
  Audience?: SurveyAudience;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/surveys
export type CreateSurveyResponse = ApiResponse<SurveyDto>;

// GET /api/v1/surveys/summary
export type GetSurveySummaryResponse = ApiResponse<SurveyBoardDto>;

// GET /api/v1/surveys/engagement-trend
export type GetEngagementTrendResponse = ApiResponse<EngagementPointDto[]>;
export interface GetEngagementTrendParams {
  months?: number;
}

// GET /api/v1/surveys/mine
export type GetMySurveysResponse = ApiResponse<SurveyDto[]>;

// GET /api/v1/surveys/{id}
export type GetSurveyResponse = ApiResponse<SurveyDto>;

// PUT /api/v1/surveys/{id}
export type UpdateSurveyResponse = ApiResponse<SurveyDto>;

// DELETE /api/v1/surveys/{id}
export type DeleteSurveyResponse = ApiResponse<unknown | null>;

// GET /api/v1/surveys/{id}/results
export type GetSurveyResultsResponse = ApiResponse<SurveyResultsDto>;

// GET /api/v1/surveys/{id}/my-response
export type GetMySurveyResponseResponse = ApiResponse<MySurveyResponseDto>;

// POST /api/v1/surveys/{id}/status
export type SetSurveyStatusResponse = ApiResponse<SurveyDto>;

// POST /api/v1/surveys/{id}/responses
export type SubmitSurveyResponseResponse = ApiResponse<SurveyDto>;


import type { ApiResponse, PagedResult } from "./api";

export interface AskForFeedbackRequest {
  colleagueId: string;
  context?: string | null;
}

export interface CalibrateReviewRequest {
  rating: number;
}

export interface ChangeGoalStatusRequest {
  status: GoalStatus;
}

export interface FeedbackRequestDto {
  id: string;
  askedByEmployeeId: string;
  askedByName: string;
  askedOfEmployeeId: string;
  askedOfName: string;
  context?: string | null;
  status: FeedbackRequestStatus;
  createdAt: string;
  respondedAt?: string | null;
}

export type FeedbackRequestStatus =
  | "pending"
  | "answered"
  | "declined";

export type FeedbackType =
  | "peer"
  | "upward"
  | "downward"
  | "manager";

export interface GiveFeedbackRequest {
  aboutEmployeeId: string;
  message: string;
  requestId?: string | null;
}

export type GoalCategory =
  | "technical"
  | "leadership"
  | "communication"
  | "growth"
  | "operational";

export interface GoalRequest {
  title: string;
  description?: string | null;
  category: GoalCategory;
  dueDate: string;
  goalType?: string | null;
}

export type GoalStatus =
  | "onTrack"
  | "atRisk"
  | "completed"
  | "cancelled";

export interface GoalUpdateDto {
  at: string;
  progress: number;
  note?: string | null;
  byName?: string | null;
}

export interface ManagerReviewRequest {
  managerRating?: number | null;
  strengths?: string | null;
  improvements?: string | null;
  comments?: string | null;
}

export interface OpenReviewRequest {
  employeeId: string;
  reviewerId?: string | null;
  reviewType: ReviewType;
  period: string;
  dueDate: string;
}

export interface PerformanceFeedbackDto {
  id: string;
  aboutEmployeeId: string;
  aboutEmployeeName: string;
  fromEmployeeId: string;
  fromName: string;
  fromJobTitle?: string | null;
  type: FeedbackType;
  message: string;
  requestId?: string | null;
  createdAt: string;
}

export interface PerformanceGoalDto {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string | null;
  title: string;
  description?: string | null;
  category: GoalCategory;
  status: GoalStatus;
  isOverdue: boolean;
  progress: number;
  dueDate: string;
  goalType?: string | null;
  updates: GoalUpdateDto[];
  createdAt: string;
  completedAt?: string | null;
}

export interface PerformanceReviewDto {
  id: string;
  employeeId: string;
  employeeName: string;
  jobTitle?: string | null;
  departmentName?: string | null;
  reviewerId?: string | null;
  reviewerName?: string | null;
  reviewType: ReviewType;
  period: string;
  status: ReviewStatus;
  isOverdue: boolean;
  dueDate: string;
  selfAssessment?: SelfAssessmentDto;
  selfRating?: number | null;
  selfSubmittedAt?: string | null;
  managerRating?: number | null;
  strengths?: string | null;
  improvements?: string | null;
  comments?: string | null;
  calibratedRating?: number | null;
  rating?: number | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface ProgressUpdateRequest {
  progress: number;
  note?: string | null;
}

export type ReviewStatus =
  | "notStarted"
  | "inProgress"
  | "completed";

export type ReviewType =
  | "annual"
  | "midYear"
  | "probation"
  | "pip"
  | "threeSixty";

export interface SelfAssessmentDto {
  achievements?: string | null;
  challenges?: string | null;
  developmentAreas?: string | null;
  managerFeedback?: string | null;
}

export interface SelfAssessmentRequest {
  achievements?: string | null;
  challenges?: string | null;
  developmentAreas?: string | null;
  managerFeedback?: string | null;
  selfRating?: number | null;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/performance/feedback/mine
export type GetMyFeedbackResponse = ApiResponse<PerformanceFeedbackDto[]>;

// GET /api/v1/performance/feedback/requests/mine
export type GetMyFeedbackRequestsResponse = ApiResponse<FeedbackRequestDto[]>;

// GET /api/v1/performance/feedback/requests/awaiting-me
export type GetFeedbackRequestsAwaitingMeResponse = ApiResponse<FeedbackRequestDto[]>;

// POST /api/v1/performance/feedback/requests
export type AskForFeedbackResponse = ApiResponse<FeedbackRequestDto>;

// POST /api/v1/performance/feedback/requests/{id}/decline
export type DeclineFeedbackRequestResponse = ApiResponse<FeedbackRequestDto>;

// POST /api/v1/performance/feedback
export type GiveFeedbackResponse = ApiResponse<PerformanceFeedbackDto>;

// GET /api/v1/performance/feedback
export type GetFeedbackResponse = ApiResponse<PagedResult<PerformanceFeedbackDto>>;

export interface GetFeedbackParams {
  AboutEmployeeId?: string;
  Type?: FeedbackType;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/performance/goals/mine
export type GetMyGoalsResponse = ApiResponse<PerformanceGoalDto[]>;

export interface GetMyGoalsParams {
  EmployeeId?: string;
  DepartmentId?: string;
  Status?: GoalStatus;
  Category?: GoalCategory;
  OverdueOnly?: boolean;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/performance/goals/mine
export type CreateMyGoalResponse = ApiResponse<PerformanceGoalDto>;

// POST /api/v1/performance/goals/{id}/progress
export type UpdateGoalProgressResponse = ApiResponse<PerformanceGoalDto>;

// GET /api/v1/performance/goals
export type GetGoalsResponse = ApiResponse<PagedResult<PerformanceGoalDto>>;

export interface GetGoalsParams {
  EmployeeId?: string;
  DepartmentId?: string;
  Status?: GoalStatus;
  Category?: GoalCategory;
  OverdueOnly?: boolean;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/performance/goals/{id}
export type GetGoalResponse = ApiResponse<PerformanceGoalDto>;

// PUT /api/v1/performance/goals/{id}
export type UpdateGoalResponse = ApiResponse<PerformanceGoalDto>;

// DELETE /api/v1/performance/goals/{id}
export type DeleteGoalResponse = ApiResponse<null>;

// POST /api/v1/performance/goals/employees/{employeeId}
export type CreateEmployeeGoalResponse = ApiResponse<PerformanceGoalDto>;

// POST /api/v1/performance/goals/{id}/status
export type ChangeGoalStatusResponse = ApiResponse<PerformanceGoalDto>;

// GET /api/v1/performance/reviews/mine
export type GetMyReviewsResponse = ApiResponse<PerformanceReviewDto[]>;

// PUT /api/v1/performance/reviews/mine/{id}/self-assessment
export type SaveSelfAssessmentResponse = ApiResponse<PerformanceReviewDto>;

// POST /api/v1/performance/reviews/mine/{id}/self-assessment
export type SubmitSelfAssessmentResponse = ApiResponse<PerformanceReviewDto>;

// GET /api/v1/performance/reviews
export type GetReviewsResponse = ApiResponse<PagedResult<PerformanceReviewDto>>;

export interface GetReviewsParams {
  EmployeeId?: string;
  ReviewerId?: string;
  DepartmentId?: string;
  Status?: ReviewStatus;
  ReviewType?: ReviewType;
  OverdueOnly?: boolean;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/performance/reviews
export type OpenReviewResponse = ApiResponse<PerformanceReviewDto>;

// GET /api/v1/performance/reviews/{id}
export type GetReviewResponse = ApiResponse<PerformanceReviewDto>;

// DELETE /api/v1/performance/reviews/{id}
export type DeleteReviewResponse = ApiResponse<null>;

// PUT /api/v1/performance/reviews/{id}/manager-review
export type SaveManagerReviewResponse = ApiResponse<PerformanceReviewDto>;

// POST /api/v1/performance/reviews/{id}/complete
export type CompleteReviewResponse = ApiResponse<PerformanceReviewDto>;

// POST /api/v1/performance/reviews/{id}/calibrate
export type CalibrateReviewResponse = ApiResponse<PerformanceReviewDto>;

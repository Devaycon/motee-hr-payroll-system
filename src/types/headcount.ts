import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface AttritionRiskDto {
  employeeId: string;
  employeeName: string;
  jobTitle?: string | null;
  departmentName?: string | null;
  managerName?: string | null;
  tenureYears: number;
  score: number;
  level: AttritionRiskLevel;
  factors: RiskFactor[];
  recommendedAction: string;
  lastPerformanceRating?: number | null;
  bradfordScore?: number | null;
}

export type AttritionRiskLevel = "low" | "medium" | "high";

export interface DemographicItemDto {
  label: string;
  count: number;
  percentage: number;
  departmentId?: string | null;
  branchId?: string | null;
}

export interface DemographicsDto {
  asOf: string;
  headcount: number;
  department: DemographicItemDto[];
  employmentType: DemographicItemDto[];
  status: DemographicItemDto[];
  tenure: DemographicItemDto[];
  age: DemographicItemDto[];
  gender: DemographicItemDto[];
  grade: DemographicItemDto[];
  location: DemographicItemDto[];
}

export type GapStatus = "under" | "onTarget" | "over";

export interface HeadcountPlanBoardDto {
  period: string;
  countedAsAt: string;
  rows: HeadcountPlanRowDto[];
  totalTarget: number;
  totalActual: number;
  totalGap: number;
  departmentsUnder: number;
  departmentsOver: number;
  departmentsOnTarget: number;
  departmentsUnplanned: number;
  totalBudget?: number | null;
}

export interface HeadcountPlanRequest {
  departmentId: string;
  period: string;
  target: number;
  budget?: number | null;
}

export interface HeadcountPlanRowDto {
  id?: string | null;
  departmentId: string;
  departmentName: string;
  period: string;
  target?: number | null;
  actual: number;
  gap?: number | null;
  gapStatus?: GapStatus | null;
  budget?: number | null;
  openVacancies: number;
  activeRecruitments: number;
  recruitmentStage: RecruitmentPipelineStage;
  acceptedNotStarted: number;
  expectedStartDate?: string | null;
  previousPeriodGap?: number | null;
  recommendedAction: string;
}

export interface HeadcountSeriesPointDto {
  period: string;
  actual: number;
  target?: number | null;
}

export interface HeadcountTrendDto {
  period: string;
  comparisonPeriod?: string | null;
  rows: HeadcountTrendRowDto[];
  totalCurrent: number;
  totalPrevious: number;
  totalDelta: number;
  totalPercentChange?: number | null;
  grew: number;
  shrank: number;
  flat: number;
}

export interface HeadcountTrendRowDto {
  departmentId: string;
  departmentName: string;
  current: number;
  previous: number;
  delta: number;
  percentChange?: number | null;
  target?: number | null;
}

export type RecruitmentPipelineStage =
  | "notStarted"
  | "requestRaised"
  | "requisitionApproved"
  | "vacancyPublished"
  | "interviewing"
  | "offerMade"
  | "offerAccepted";

export interface RiskFactor {
  label: string;
  weight: number;
}

export type TrendComparison = "previousQuarter" | "sameQuarterLastYear";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/headcount/plans
export type GetHeadcountPlansResponse = ApiResponse<HeadcountPlanBoardDto>;

export interface GetHeadcountPlansParams {
  period?: string;
}

// PUT /api/v1/headcount/plans
export type SaveHeadcountPlanResponse = ApiResponse<HeadcountPlanRowDto>;

// GET /api/v1/headcount/trend
export type GetHeadcountTrendResponse = ApiResponse<HeadcountTrendDto>;

export interface GetHeadcountTrendParams {
  period?: string;
  comparison?: TrendComparison;
}

// GET /api/v1/headcount/series
export type GetHeadcountSeriesResponse = ApiResponse<HeadcountSeriesPointDto[]>;

export interface GetHeadcountSeriesParams {
  year?: number;
}

// GET /api/v1/headcount/demographics
export type GetHeadcountDemographicsResponse = ApiResponse<DemographicsDto>;

// GET /api/v1/headcount/attrition
export type GetHeadcountAttritionResponse = ApiResponse<AttritionRiskDto[]>;

export interface GetHeadcountAttritionParams {
  DepartmentId?: string;
  AtLeast?: AttritionRiskLevel;
  Limit?: number;
}

// DELETE /api/v1/headcount/plans/{id}
export type DeleteHeadcountPlanResponse = ApiResponse<null>;

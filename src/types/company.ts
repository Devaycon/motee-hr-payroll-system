import type { ApiResponse } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface CompanyProfileDto {
  name: string;
  legalName?: string | null;
  industry?: string | null;
  countryCode: CountryCode;
  countryName: string;
  address?: string | null;
  headOfficeBranchId?: string | null;
  headOfficeName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  sizeBand?: string | null;
  headcount: number;
  registeredAt?: string | null;
}

export interface CompanyProfileRequest {
  name: string;
  legalName?: string | null;
  industry?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
}

export interface CountryCode {
  value?: string | null;
}

export interface OrgChartNode {
  id: string;
  name: string;
  initials?: string | null;
  role?: string | null;
  department?: string | null;
  reportsTo?: string | null;
  level: number;
  directReports: number;
  detached: boolean;
}

export interface OrgChartView {
  nodes: OrgChartNode[];
  roots: string[];
  unplaced: string[];
}

export interface PinnedNoticeDto {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  publishedBy?: string | null;
}

export interface VerificationDetailsRequest {
  number?: string | null;
  documentFileId?: string | null;
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

export type VerificationStage =
  "draft" | "submitted" | "underReview" | "verified" | "rejected";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/company
export type GetCompanyResponse = ApiResponse<CompanyProfileDto>;

// PUT /api/v1/company
export type UpdateCompanyResponse = ApiResponse<CompanyProfileDto>;

// GET /api/v1/company/org-chart
export type GetCompanyOrgChartResponse = ApiResponse<OrgChartView>;
export interface GetCompanyOrgChartParams {
  maxLevel?: number;
}

// GET /api/v1/company/notice
export type GetCompanyNoticeResponse = ApiResponse<PinnedNoticeDto>;

// GET /api/v1/company/verification
export type GetCompanyVerificationResponse = ApiResponse<VerificationDto[]>;

// PUT /api/v1/company/verification/{kind}
export type SaveCompanyVerificationResponse = ApiResponse<VerificationDto>;

// POST /api/v1/company/verification/{kind}/submit
export type SubmitCompanyVerificationResponse = ApiResponse<VerificationDto>;

// POST /api/v1/company/verification/{kind}/withdraw
export type WithdrawCompanyVerificationResponse = ApiResponse<VerificationDto>;


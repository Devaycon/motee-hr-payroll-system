import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type CertStatus =
  "noExpiry" | "active" | "expiringInSixty" | "expiringInThirty" | "expired";

export interface CertTally {
  total: number;
  active: number;
  expiringInThirty: number;
  expiringInSixty: number;
  expired: number;
  compliancePercent: number;
}

export interface CertificationDto {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  departmentName?: string | null;
  courseId?: string | null;
  courseTitle?: string | null;
  certificationKind: CertificationKind;
  title: string;
  issuingBody?: string | null;
  category?: string | null;
  credentialId?: string | null;
  issuedOn: string;
  expiresOn?: string | null;
  status: CertStatus;
  daysToExpiry?: number | null;
  storedFileId?: string | null;
  expiryIsDerived: boolean;
}

export type CertificationKind =
  "professional" | "course";

export interface CertificationRequest {
  employeeId: string;
  title: string;
  issuingBody?: string | null;
  category?: string | null;
  credentialId?: string | null;
  issuedOn: string;
  expiresOn?: string | null;
  storedFileId?: string | null;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/certifications
export type GetCertificationsResponse = ApiResponse<PagedResult<CertificationDto>>;
export interface GetCertificationsParams {
  EmployeeId?: string;
  CourseId?: string;
  DepartmentId?: string;
  CertificationKind?: CertificationKind;
  Status?: CertStatus;
  Category?: string;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/certifications
export type CreateCertificationResponse = ApiResponse<CertificationDto>;

// GET /api/v1/certifications/summary
export type GetCertificationSummaryResponse = ApiResponse<CertTally>;
export interface GetCertificationSummaryParams {
  EmployeeId?: string;
  CourseId?: string;
  DepartmentId?: string;
  CertificationKind?: CertificationKind;
  Status?: CertStatus;
  Category?: string;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/certifications/mine
export type GetMyCertificationsResponse = ApiResponse<CertificationDto[]>;

// PUT /api/v1/certifications/{id}
export type UpdateCertificationResponse = ApiResponse<CertificationDto>;

// DELETE /api/v1/certifications/{id}
export type DeleteCertificationResponse = ApiResponse<unknown | null>;


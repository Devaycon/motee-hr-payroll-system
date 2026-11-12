import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type HiringReason =
  "newPosition" | "replacement" | "internalTransfer" | "seasonal";

export type VacancyType =
  | "permanent"
  | "fixedTerm"
  | "contract"
  | "temporary"
  | "apprentice"
  | "graduate";

export interface WorkforceCancelRequest {
  reason: string;
}

export interface WorkforceRequestDto {
  id: string;
  reference?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  businessUnitId?: string | null;
  position: string;
  grade?: string | null;
  numberOfHires: number;
  hiringReason: HiringReason;
  vacancyType: VacancyType;
  urgency: WorkforceUrgency;
  justification: string;
  budgetEstimate?: number | null;
  currency?: string | null;
  costCentreCode?: string | null;
  expectedStartDate?: string | null;
  requestedByEmployeeId?: string | null;
  requestedByName?: string | null;
  status: WorkforceRequestStatus;
  approvalInstanceId?: string | null;
  waitingOn?: string | null;
  requisitionId?: string | null;
  requisitionReference?: string | null;
  submittedAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkforceRequestRequest {
  departmentId?: string | null;
  businessUnitId?: string | null;
  position: string;
  grade?: string | null;
  numberOfHires?: number;
  hiringReason?: HiringReason;
  vacancyType?: VacancyType;
  urgency?: WorkforceUrgency;
  justification: string;
  budgetEstimate?: number | null;
  currency?: string | null;
  costCentreCode?: string | null;
  expectedStartDate?: string | null;
}

export type WorkforceRequestStatus =
  | "draft"
  | "pendingApproval"
  | "approved"
  | "rejected"
  | "returned"
  | "cancelled"
  | "converted";

export type WorkforceUrgency = "low" | "medium" | "high" | "critical";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/workforce-requests
export type GetWorkforceRequestsResponse = ApiResponse<
  PagedResult<WorkforceRequestDto>
>;

export interface GetWorkforceRequestsParams {
  DepartmentId?: string;
  Status?: WorkforceRequestStatus;
  RequestedByEmployeeId?: string;
  Urgency?: WorkforceUrgency;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/workforce-requests
export type CreateWorkforceRequestResponse = ApiResponse<WorkforceRequestDto>;

// GET /api/v1/workforce-requests/{id}
export type GetWorkforceRequestResponse = ApiResponse<WorkforceRequestDto>;

// PUT /api/v1/workforce-requests/{id}
export type UpdateWorkforceRequestResponse = ApiResponse<WorkforceRequestDto>;

// DELETE /api/v1/workforce-requests/{id}
export type DeleteWorkforceRequestResponse = ApiResponse<null>;

// POST /api/v1/workforce-requests/{id}/submit
export type SubmitWorkforceRequestResponse = ApiResponse<WorkforceRequestDto>;

// POST /api/v1/workforce-requests/{id}/cancel
export type CancelWorkforceRequestResponse = ApiResponse<WorkforceRequestDto>;

// POST /api/v1/workforce-requests/{id}/convert
export type ConvertWorkforceRequestResponse = ApiResponse<WorkforceRequestDto>;

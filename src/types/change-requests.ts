import type { ApiResponse } from "./api";

export type ChangeRequestStatus = "pending" | "approved" | "rejected" | "withdrawn";

/** The profile groups a requestable field belongs to. */
export type ProfileFieldGroup =
  | "personal"
  | "contact"
  | "address"
  | "emergency"
  | "bank"
  | "identity";

export interface ChangeRequestDto {
  id: string;
  employeeId: string;
  employeeName: string;
  /** The server's key for the field. */
  field: string;
  label: string;
  currentValue?: string | null;
  requestedValue?: string | null;
  reason: string;
  fileId?: string | null;
  fileUrl?: string | null;
  status: ChangeRequestStatus;
  requestedByName?: string | null;
  requestedAt: string;
  decidedByName?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
}

/** A field the signed-in employee may ask to change. */
export interface RequestableFieldDto {
  key: string;
  label: string;
  group: ProfileFieldGroup;
  currentValue?: string | null;
}

export interface RaiseChangeRequest {
  field: string;
  requestedValue?: string | null;
  reason: string;
  /** Evidence (or the new photo), uploaded as `profileChangeEvidence`. */
  fileId?: string | null;
}

export interface ApproveChangeRequest {
  note?: string | null;
}

export interface RejectChangeRequest {
  reason: string;
}

export interface GetChangeRequestsParams {
  Status?: ChangeRequestStatus;
  EmployeeId?: string;
  Page?: number;
  PageSize?: number;
}

export interface PagedChangeRequests {
  items: ChangeRequestDto[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
}

// GET /api/v1/change-requests
export type GetChangeRequestsResponse = ApiResponse<PagedChangeRequests>;
// GET /api/v1/employees/{id}/change-requests
// GET /api/v1/employees/me/change-requests
export type GetEmployeeChangeRequestsResponse = ApiResponse<ChangeRequestDto[]>;
// GET /api/v1/employees/me/change-requests/fields
export type GetRequestableFieldsResponse = ApiResponse<RequestableFieldDto[]>;
// POST raise / approve / reject / withdraw
export type ChangeRequestResponse = ApiResponse<ChangeRequestDto>;

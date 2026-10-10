import type { ApiResponse } from "./api";

export interface ApprovalDelegationDto {
  id: string;
  delegatorEmployeeId: string;
  delegatorName: string;
  delegateEmployeeId: string;
  delegateName: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ApprovalDelegationRequest {
  delegateEmployeeId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
}

export type GetMyApprovalDelegationsResponse = ApiResponse<ApprovalDelegationDto[]>;

export type CreateApprovalDelegationResponse = ApiResponse<ApprovalDelegationDto>;

export type GetApprovalDelegationsResponse = ApiResponse<ApprovalDelegationDto[]>;

export type DeleteApprovalDelegationResponse = ApiResponse<null>;

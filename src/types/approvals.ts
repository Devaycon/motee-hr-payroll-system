import type { ApiResponse, PagedResult } from "./api";
import type { ApprovalDto, ApprovalStepStatus } from "./common";

export interface CancelApprovalRequest {
  reason?: string | null;
}

export interface DecideApprovalRequest {
  decision: ApprovalStepStatus;
  note?: string | null;
}

export type GetMyApprovalQueueResponse = ApiResponse<PagedResult<ApprovalDto>>;

export interface GetMyApprovalQueueParams {
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export type GetApprovalResponse = ApiResponse<ApprovalDto>;

export type GetApprovalsForSubjectResponse = ApiResponse<ApprovalDto[]>;

export interface GetApprovalsForSubjectParams {
  subjectType: string;
  subjectId: string;
}

export type DecideApprovalResponse = ApiResponse<ApprovalDto>;

export interface DecideApprovalParams {
  id: string;
  body: DecideApprovalRequest;
}

export type ResubmitApprovalResponse = ApiResponse<ApprovalDto>;

export type ReresolveApprovalResponse = ApiResponse<ApprovalDto>;

export type CancelApprovalResponse = ApiResponse<ApprovalDto>;

export interface CancelApprovalParams {
  id: string;
  body?: CancelApprovalRequest;
}

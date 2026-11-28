import type { ApiResponse, PagedResult } from "./api";
import type {
  ApprovalDto,
  ApprovalStatus,
  ApprovalStepStatus,
  AttachmentRules,
  IntakeField,
} from "./common";

export interface CancelApprovalRequest {
  reason?: string | null;
}

export interface DecideApprovalRequest {
  decision: ApprovalStepStatus;
  note?: string | null;
  /** A stored file (purpose approvalSignature) the approver signed with. */
  signatureFileId?: string | null;
}

// GET /api/v1/approvals and /approvals/mine
export type GetApprovalsResponse = ApiResponse<PagedResult<ApprovalDto>>;

export interface GetApprovalsParams {
  Status?: ApprovalStatus;
  DocumentType?: string;
  RequesterEmployeeId?: string;
  SubjectEmployeeId?: string;
  From?: string;
  To?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

export interface GetMyApprovalsParams {
  Page?: number;
  PageSize?: number;
  Skip?: number;
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

// ── Raising a request (POST /approvals) ──

/** A request type the signed-in user may raise, with its intake form. */
export interface RaisableTypeDto {
  key: string;
  label: string;
  fields: IntakeField[];
  attachments: AttachmentRules;
}

export interface RaiseApprovalRequest {
  documentType: string;
  title: string;
  summary?: string | null;
  fields: Record<string, string>;
  fileIds: string[];
  templateId?: string | null;
}

export interface ApprovalCommentRequest {
  message: string;
}

// GET /api/v1/approvals/document-types
export type GetRaisableTypesResponse = ApiResponse<RaisableTypeDto[]>;
// POST /api/v1/approvals
export type RaiseApprovalResponse = ApiResponse<ApprovalDto>;
// POST /api/v1/approvals/{id}/comments
export type CommentOnApprovalResponse = ApiResponse<ApprovalDto>;

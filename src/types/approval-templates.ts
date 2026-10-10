import type { ApiResponse } from "./api";
import type { ApproverResolver, AttachmentRules } from "./common";

export interface ApprovalRoleDto {
  id: string;
  name: string;
  holders: number;
}

export interface ApprovalTemplateDto {
  id: string;
  documentType: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  isSystem: boolean;
  isActive: boolean;
  attachments: AttachmentRules;
  steps: ApprovalTemplateStepDto[];
  runningInstances: number;
  updatedAt: string;
}

export interface ApprovalTemplateRequest {
  documentType: string;
  name: string;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  attachments?: AttachmentRules;
  steps: ApprovalTemplateStepRequest[];
}

export interface ApprovalTemplateStepDto {
  id: string;
  sequence: number;
  label: string;
  approver: ApproverResolver;
  roleId?: string | null;
  roleName?: string | null;
  required: boolean;
}

export interface ApprovalTemplateStepRequest {
  label: string;
  approver: ApproverResolver;
  roleId?: string | null;
  required?: boolean;
}

export type GetApprovalTemplatesResponse = ApiResponse<ApprovalTemplateDto[]>;

export interface GetApprovalTemplatesParams {
  documentType?: string;
}

export type CreateApprovalTemplateResponse = ApiResponse<ApprovalTemplateDto>;

export type GetApprovalTemplateCatalogueResponse = ApiResponse<ApprovalRoleDto[]>;

export type GetApprovalTemplateResponse = ApiResponse<ApprovalTemplateDto>;

export type UpdateApprovalTemplateResponse = ApiResponse<ApprovalTemplateDto>;

export interface UpdateApprovalTemplateParams {
  id: string;
  body: ApprovalTemplateRequest;
}

export type DeleteApprovalTemplateResponse = ApiResponse<null>;

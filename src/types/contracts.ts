import type { ApiResponse, PagedResult } from "./api";

export interface ContractDto {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string | null;
  title: string;
  description?: string | null;
  contractType: ContractType;
  status: ContractStatus;
  isExpired: boolean;
  isExpiringSoon: boolean;
  startDate: string;
  endDate?: string | null;
  autoRenew: boolean;
  noticePeriodDays: number;
  salary?: number | null;
  currency: string;
  signatureStatus: SignatureStatus;
  signatures: ContractSignatureDto[];
  notes: ContractNoteDto[];
  isArchived: boolean;
  documentId?: string | null;
  createdAt: string;
}

export interface ContractNoteDto {
  id: string;
  content: string;
  createdByName?: string | null;
  createdAt: string;
}

export interface ContractNoteRequest {
  content: string;
}

export interface ContractRequest {
  employeeId: string;
  title: string;
  description?: string | null;
  contractType: ContractType;
  startDate: string;
  endDate?: string | null;
  autoRenew?: boolean;
  noticePeriodDays?: number;
  salary?: number | null;
  currency?: string | null;
}

export interface ContractSignatureDto {
  employeeId?: string | null;
  signedAs: string;
  signedByName: string;
  signatureFileId?: string | null;
  signedAt: string;
}

export type ContractStatus =
  | "draft"
  | "pendingSignature"
  | "active"
  | "terminated";

export type ContractType =
  | "employment"
  | "nda"
  | "contractor"
  | "internship"
  | "consultancy"
  | "amendment";

export interface FileContractRequest {
  storedFileId: string;
}

export interface SignContractRequest {
  signedAs: string;
  signatureFileId?: string | null;
}

export type SignatureStatus =
  | "unsigned"
  | "partiallySigned"
  | "fullySigned";

export interface TerminateContractRequest {
  reason: string;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/contracts/mine
export type GetMyContractsResponse = ApiResponse<ContractDto[]>;

// POST /api/v1/contracts/mine/{id}/sign
export type SignMyContractResponse = ApiResponse<ContractDto>;

// GET /api/v1/contracts
export type GetContractsResponse = ApiResponse<PagedResult<ContractDto>>;

export interface GetContractsParams {
  EmployeeId?: string;
  DepartmentId?: string;
  Status?: ContractStatus;
  ContractType?: ContractType;
  IncludeArchived?: boolean;
  ExpiringSoonOnly?: boolean;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/contracts
export type CreateContractResponse = ApiResponse<ContractDto>;

// GET /api/v1/contracts/{id}
export type GetContractResponse = ApiResponse<ContractDto>;

// PUT /api/v1/contracts/{id}
export type UpdateContractResponse = ApiResponse<ContractDto>;

// DELETE /api/v1/contracts/{id}
export type DeleteContractResponse = ApiResponse<null>;

// POST /api/v1/contracts/{id}/send
export type SendContractResponse = ApiResponse<ContractDto>;

// POST /api/v1/contracts/{id}/activate
export type ActivateContractResponse = ApiResponse<ContractDto>;

// POST /api/v1/contracts/{id}/terminate
export type TerminateContractResponse = ApiResponse<ContractDto>;

// POST /api/v1/contracts/{id}/sign
export type SignContractResponse = ApiResponse<ContractDto>;

// POST /api/v1/contracts/{id}/file-to-documents
export type FileContractToDocumentsResponse = ApiResponse<ContractDto>;

// POST /api/v1/contracts/{id}/notes
export type AddContractNoteResponse = ApiResponse<ContractDto>;

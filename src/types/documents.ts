import type { ApiResponse, PagedResult } from "./api";

export interface AcknowledgedByDto {
  employeeId: string;
  employeeName: string;
  acknowledgedAt: string;
}

export interface AcknowledgementReportDto {
  documentId: string;
  currentVersion: number;
  totalAssigned: number;
  acknowledged: AcknowledgedByDto[];
  outstanding: string[];
}

export interface AddVersionRequest {
  storedFileId: string;
  notes?: string | null;
}

export type AssignmentScope =
  | "global"
  | "department"
  | "specific";

export interface CreateDocumentRequest {
  name: string;
  category: DocumentCategory;
  folderId: string;
  storedFileId: string;
  description?: string | null;
  expiryDate?: string | null;
  assignment?: AssignmentScope;
  assignedDepartmentIds?: string[] | null;
  requiresAcknowledgement?: boolean;
}

export type DocumentCategory =
  | "policy"
  | "contract"
  | "handbook"
  | "form"
  | "certificate"
  | "report"
  | "other";

export interface DocumentDto {
  id: string;
  name: string;
  category: DocumentCategory;
  folderId: string;
  folderName?: string | null;
  description?: string | null;
  expiryDate?: string | null;
  isExpired: boolean;
  assignment: AssignmentScope;
  assignedDepartmentIds: string[];
  requiresAcknowledgement: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  versions: DocumentVersionDto[];
  shares: DocumentShareDto[];
  acknowledgedByMe?: boolean | null;
  createdAt: string;
}

export type DocumentPermission =
  | "viewOnly"
  | "download";

export interface DocumentShareDto {
  employeeId: string;
  employeeName: string;
  permission: DocumentPermission;
  sharedAt: string;
}

export interface DocumentVersionDto {
  id: string;
  version: number;
  storedFileId: string;
  sizeBytes: number;
  notes?: string | null;
  uploadedByName?: string | null;
  uploadedAt: string;
}

export interface FolderDto {
  id: string;
  name: string;
  type: FolderType;
  parentId?: string | null;
  documentCount: number;
  canDelete: boolean;
}

export interface FolderRequest {
  name: string;
  parentId?: string | null;
}

export type FolderType =
  | "system"
  | "personal"
  | "archive"
  | "custom"
  | "shared"
  | "trash";

export interface RenameFolderRequest {
  name: string;
}

export interface ShareDocumentRequest {
  employeeId: string;
  permission?: DocumentPermission;
}

export interface UpdateDocumentRequest {
  name: string;
  category: DocumentCategory;
  folderId: string;
  description?: string | null;
  expiryDate?: string | null;
  assignment?: AssignmentScope;
  assignedDepartmentIds?: string[] | null;
  requiresAcknowledgement?: boolean;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/documents/mine
export type GetMyDocumentsResponse = ApiResponse<DocumentDto[]>;

// POST /api/v1/documents/mine/{id}/acknowledge
export type AcknowledgeMyDocumentResponse = ApiResponse<DocumentDto>;

// GET /api/v1/documents/folders
export type GetDocumentFoldersResponse = ApiResponse<FolderDto[]>;

// POST /api/v1/documents/folders
export type CreateDocumentFolderResponse = ApiResponse<FolderDto>;

// PUT /api/v1/documents/folders/{id}
export type RenameDocumentFolderResponse = ApiResponse<FolderDto>;

// DELETE /api/v1/documents/folders/{id}
export type DeleteDocumentFolderResponse = ApiResponse<null>;

// GET /api/v1/documents
export type GetDocumentsResponse = ApiResponse<PagedResult<DocumentDto>>;

export interface GetDocumentsParams {
  FolderId?: string;
  Category?: DocumentCategory;
  IncludeArchived?: boolean;
  IncludeTrashed?: boolean;
  ExpiredOnly?: boolean;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/documents
export type CreateDocumentResponse = ApiResponse<DocumentDto>;

// GET /api/v1/documents/{id}
export type GetDocumentResponse = ApiResponse<DocumentDto>;

// PUT /api/v1/documents/{id}
export type UpdateDocumentResponse = ApiResponse<DocumentDto>;

// POST /api/v1/documents/{id}/versions
export type AddDocumentVersionResponse = ApiResponse<DocumentDto>;

// POST /api/v1/documents/{id}/archive
export type ArchiveDocumentResponse = ApiResponse<DocumentDto>;

// POST /api/v1/documents/{id}/trash
export type TrashDocumentResponse = ApiResponse<DocumentDto>;

// POST /api/v1/documents/{id}/restore
export type RestoreDocumentResponse = ApiResponse<DocumentDto>;

// POST /api/v1/documents/{id}/shares
export type ShareDocumentResponse = ApiResponse<DocumentDto>;

// DELETE /api/v1/documents/{id}/shares/{employeeId}
export type UnshareDocumentResponse = ApiResponse<null>;

// GET /api/v1/documents/{id}/acknowledgements
export type GetDocumentAcknowledgementsResponse = ApiResponse<AcknowledgementReportDto>;

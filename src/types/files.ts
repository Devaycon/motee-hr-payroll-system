import type { ApiResponse } from "./api";

export type FilePurpose =
  | "companyLogo"
  | "employeeAvatar"
  | "employeeDocument"
  | "approvalAttachment"
  | "export";

export interface StoredFileDto {
  id: string;
  purpose: FilePurpose;
  ownerId?: string | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedByUserId?: string | null;
}

export interface UploadFileParams {
  file: File;
  purpose: FilePurpose;
  ownerId?: string;
}

export interface GetFilesParams {
  purpose?: FilePurpose;
  ownerId?: string;
}

export interface DownloadFileParams {
  id: string;
  /** Used when the server does not name the file. */
  fileName?: string;
}

export type UploadFileResponse = ApiResponse<StoredFileDto>;
export type GetFilesResponse = ApiResponse<StoredFileDto[]>;
export type GetFileResponse = ApiResponse<StoredFileDto>;
export type DeleteFileResponse = ApiResponse<null>;

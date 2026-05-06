export interface DocFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  isTrashed?: boolean;
}

export type FileExt = "pdf" | "docx" | "xlsx" | "png" | "jpg" | "txt" | "other";

export interface EmployeeDocument {
  id: string;
  name: string;
  type: string;
  ext: FileExt;
  folderId: string | null;
  uploadedBy: "hr" | "employee";
  uploadedAt: string;
  fileSize: string;
  expiryDate?: string;
  requiresAck: boolean;
  acknowledged: boolean;
  isTrashed?: boolean;
  isShared?: boolean;
}

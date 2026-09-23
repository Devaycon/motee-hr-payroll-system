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
  /**
   * §8.3 (Correction 2 feedback) — a self-service upload is routed to HR
   * for review/approval rather than filed automatically. Absent for
   * documents HR uploaded directly, which need no review.
   */
  reviewStatus?: "awaiting_review" | "approved" | "rejected";
}

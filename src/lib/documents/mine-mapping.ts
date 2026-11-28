import type {
  DocumentCategory,
  DocumentDto,
  DocumentReviewStatus,
  FolderDto,
} from "@/src/types/documents";
import type {
  DocFolder,
  EmployeeDocument,
  FileExt,
} from "@/src/components/employee/documents/types";

const EXTS: FileExt[] = ["pdf", "docx", "xlsx", "png", "jpg", "txt"];

function extOf(name: string): FileExt {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "doc") return "docx";
  if (ext === "xls" || ext === "csv") return "xlsx";
  if (ext === "jpeg") return "jpg";
  return (EXTS as string[]).includes(ext) ? (ext as FileExt) : "pdf";
}

function size(bytes: number | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_LABEL: Record<string, string> = {
  policy: "Policy",
  contract: "Contract",
  handbook: "Handbook",
  form: "Form",
  certificate: "Certificate",
  report: "Report",
  other: "Other",
};

const REVIEW: Record<DocumentReviewStatus, EmployeeDocument["reviewStatus"]> = {
  awaitingReview: "awaiting_review",
  accepted: "approved",
  rejected: "rejected",
};

/** Folder colour when the server has none (the first swatch on the page). */
export const DEFAULT_FOLDER_COLOUR = "#7F77DD";

/**
 * A document on the signed-in employee's "My Documents" page: one HR shared
 * with or assigned to them, or one they uploaded themself (`isMine`). A
 * document sits in a folder only when that folder is one of theirs.
 */
export function myDocumentFromApi(
  dto: DocumentDto,
  myFolderIds: ReadonlySet<string> = new Set(),
): EmployeeDocument {
  const latest = [...dto.versions].sort((a, b) => b.version - a.version)[0];
  const mine = !!dto.isMine;
  return {
    id: dto.id,
    name: dto.name,
    type: TYPE_LABEL[dto.category] ?? "Other",
    ext: extOf(dto.name),
    folderId: dto.folderId && myFolderIds.has(dto.folderId) ? dto.folderId : null,
    uploadedBy: mine ? "employee" : "hr",
    uploadedAt: (latest?.uploadedAt ?? dto.createdAt).slice(0, 10),
    fileSize: size(latest?.sizeBytes),
    expiryDate: dto.expiryDate ? dto.expiryDate.slice(0, 10) : undefined,
    requiresAck: dto.requiresAcknowledgement,
    acknowledged: !!dto.acknowledgedByMe,
    isTrashed: dto.isTrashed,
    isShared: !mine && dto.shares.length > 0,
    reviewStatus: dto.reviewStatus ? REVIEW[dto.reviewStatus] : undefined,
  };
}

/** The employee's own folders; the system ones (trash, shared…) are views. */
export function myFoldersFromApi(folders: FolderDto[]): DocFolder[] {
  return folders
    .filter((f) => f.type === "personal" || f.type === "custom")
    .map((f) => ({
      id: f.id,
      name: f.name,
      color: f.colour || DEFAULT_FOLDER_COLOUR,
      createdAt: "",
    }));
}

/** The upload dialog's document types onto the server's categories. */
export function categoryFromType(type: string): DocumentCategory {
  const t = type.toLowerCase();
  if (t.includes("contract") || t.includes("offer")) return "contract";
  if (t.includes("policy")) return "policy";
  if (t.includes("handbook")) return "handbook";
  if (t.includes("certificate") || t.includes("qualification")) return "certificate";
  if (t.includes("form")) return "form";
  if (t.includes("report")) return "report";
  return "other";
}

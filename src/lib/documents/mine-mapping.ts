import type { DocumentDto } from "@/src/types/documents";
import type { EmployeeDocument, FileExt } from "@/src/components/employee/documents/types";

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

/**
 * A document HR shared or assigned to the signed-in employee, in the "My
 * Documents" shape. They sit at the top level (the employee's own folders
 * are not on the API).
 */
export function myDocumentFromApi(dto: DocumentDto): EmployeeDocument {
  const latest = [...dto.versions].sort((a, b) => b.version - a.version)[0];
  return {
    id: dto.id,
    name: dto.name,
    type: TYPE_LABEL[dto.category] ?? "Other",
    ext: extOf(dto.name),
    folderId: null,
    uploadedBy: "hr",
    uploadedAt: (latest?.uploadedAt ?? dto.createdAt).slice(0, 10),
    fileSize: size(latest?.sizeBytes),
    expiryDate: dto.expiryDate ? dto.expiryDate.slice(0, 10) : undefined,
    requiresAck: dto.requiresAcknowledgement,
    acknowledged: !!dto.acknowledgedByMe,
    isTrashed: false,
    isShared: dto.shares.length > 0,
  };
}

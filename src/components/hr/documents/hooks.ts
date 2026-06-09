"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  DocumentCategory,
  DocumentFileType,
  Folder,
  HRDocument,
} from "@/src/lib/types/documents";
import type { LocaleBundle } from "@/src/lib/types/locale";

interface RawDocument {
  id?: string;
  name?: string;
  fileName?: string;
  category?: string;
  fileType?: string;
  fileSize?: number;
  employeeId?: string;
  uploadedAt?: string;
  expiresAt?: string;
  url?: string;
  fileUrl?: string;
  visibility?: string;
}

function mapFileType(s?: string): DocumentFileType {
  if (s && /^(pdf|doc|docx|png|jpg|jpeg)$/.test(s)) return s as DocumentFileType;
  if (s === "image") return "png";
  return "pdf";
}

function mapCategory(s?: string): DocumentCategory {
  switch (s) {
    case "ID":
    case "id":
    case "id_card":
      return "id_card";
    case "certificate":
      return "certificate";
    case "contract":
    case "offer letter":
      return "contract";
    case "policy":
      return "policy";
    case "report":
    case "payslip":
      return "report";
    default:
      return "other";
  }
}

interface DocumentsData {
  documents: HRDocument[];
  folders: Folder[];
}

function buildDocuments(bundle: LocaleBundle): DocumentsData {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const documents: HRDocument[] = bundle.documents.map((raw, i) => {
    const r = raw as RawDocument;
    const id = r.id ?? `DOC-${String(i + 1).padStart(3, "0")}`;
    const emp = r.employeeId ? employeesById.get(r.employeeId) : null;
    const uploadedAt = r.uploadedAt ?? bundle.tenant.createdAt.slice(0, 10);
    return {
      id,
      name: r.name ?? r.fileName ?? "Untitled",
      fileType: mapFileType(r.fileType),
      category: mapCategory(r.category),
      folderId: mapCategory(r.category),
      description: emp ? `Belongs to ${emp.fullName}` : undefined,
      fileSize: r.fileSize ?? 256_000,
      expiryDate: r.expiresAt,
      uploadedAt,
      uploadedBy: "HR Admin",
      isArchived: false,
      versions: [
        {
          id: `V-${id}-1`,
          version: 1,
          uploadedAt,
          uploadedBy: "HR Admin",
          fileSize: r.fileSize ?? 256_000,
          notes: "Initial upload.",
        },
      ],
      shares: [],
    } satisfies HRDocument;
  });
  const folders: Folder[] = [
    { id: "id_card", name: "ID Cards", type: "system", createdAt: bundle.tenant.createdAt, createdBy: "System" },
    { id: "contract", name: "Contracts", type: "system", createdAt: bundle.tenant.createdAt, createdBy: "System" },
    { id: "policy", name: "Policies", type: "system", createdAt: bundle.tenant.createdAt, createdBy: "System" },
    { id: "certificate", name: "Certificates", type: "system", createdAt: bundle.tenant.createdAt, createdBy: "System" },
    { id: "report", name: "Reports", type: "system", createdAt: bundle.tenant.createdAt, createdBy: "System" },
    { id: "other", name: "Other", type: "system", createdAt: bundle.tenant.createdAt, createdBy: "System" },
  ];
  return { documents, folders };
}

export function useDocuments() {
  return useLocaleSection<DocumentsData>(buildDocuments);
}

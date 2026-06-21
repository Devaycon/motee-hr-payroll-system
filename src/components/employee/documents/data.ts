import {
  DOCUMENTS as HR_DOCUMENTS,
  DOCUMENT_CATEGORY_LABELS,
} from "@/src/data/documents-demo";
import type { HRDocument } from "@/src/lib/types/documents";
import type { DocFolder, EmployeeDocument, FileExt } from "./types";

export const EXT_CONFIG: Record<FileExt, { bg: string; text: string; label: string }> = {
  pdf: { bg: "#EF4444", text: "#fff", label: "PDF" },
  docx: { bg: "#2563EB", text: "#fff", label: "DOC" },
  xlsx: { bg: "#16A34A", text: "#fff", label: "XLS" },
  png: { bg: "#7C3AED", text: "#fff", label: "PNG" },
  jpg: { bg: "#DB2777", text: "#fff", label: "JPG" },
  txt: { bg: "#6B7280", text: "#fff", label: "TXT" },
  other: { bg: "#7F77DD", text: "#fff", label: "FILE" },
};

export const FOLDER_COLORS = [
  { label: "Purple", value: "#7F77DD" },
  { label: "Blue", value: "#2563EB" },
  { label: "Green", value: "#16A34A" },
  { label: "Amber", value: "#D97706" },
  { label: "Red", value: "#DC2626" },
  { label: "Pink", value: "#DB2777" },
];

export const DEMO_FOLDERS: DocFolder[] = [
  { id: "f-001", name: "Contracts & Agreements", color: "#7F77DD", createdAt: "2022-03-15" },
  { id: "f-002", name: "Policies", color: "#D97706", createdAt: "2022-03-15" },
  { id: "f-003", name: "Identity Documents", color: "#2563EB", createdAt: "2022-03-15" },
  { id: "f-004", name: "Certificates", color: "#16A34A", createdAt: "2022-03-15" },
  { id: "f-005", name: "Payslips", color: "#DB2777", createdAt: "2022-03-15" },
];

export const DEMO_DOCUMENTS: EmployeeDocument[] = [
  {
    id: "d-001",
    name: "Employment Contract – March 2022",
    type: "Contract",
    ext: "pdf",
    folderId: "f-001",
    uploadedBy: "hr",
    uploadedAt: "2022-03-15",
    fileSize: "245 KB",
    requiresAck: true,
    acknowledged: true,
  },
  {
    id: "d-002",
    name: "Offer Letter – Software Engineer",
    type: "Offer Letter",
    ext: "docx",
    folderId: "f-001",
    uploadedBy: "hr",
    uploadedAt: "2022-03-01",
    fileSize: "120 KB",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-003",
    name: "Signed Remote Work Agreement",
    type: "Policy",
    ext: "pdf",
    folderId: "f-001",
    uploadedBy: "hr",
    uploadedAt: "2023-09-01",
    fileSize: "88 KB",
    requiresAck: true,
    acknowledged: true,
  },
  {
    id: "d-004",
    name: "Updated Leave & Absence Policy",
    type: "Policy",
    ext: "pdf",
    folderId: "f-002",
    uploadedBy: "hr",
    uploadedAt: "2026-03-08",
    fileSize: "98 KB",
    requiresAck: true,
    acknowledged: false,
  },
  {
    id: "d-005",
    name: "Code of Conduct Policy",
    type: "Policy",
    ext: "docx",
    folderId: "f-002",
    uploadedBy: "hr",
    uploadedAt: "2024-01-10",
    fileSize: "210 KB",
    requiresAck: true,
    acknowledged: true,
  },
  {
    id: "d-006",
    name: "National ID – NIN",
    type: "Identity",
    ext: "jpg",
    folderId: "f-003",
    uploadedBy: "employee",
    uploadedAt: "2022-03-15",
    fileSize: "55 KB",
    expiryDate: "2030-03-15",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-007",
    name: "Driver's License",
    type: "Identity",
    ext: "png",
    folderId: "f-003",
    uploadedBy: "employee",
    uploadedAt: "2024-07-05",
    fileSize: "62 KB",
    expiryDate: "2026-07-05",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-008",
    name: "International Passport",
    type: "Identity",
    ext: "jpg",
    folderId: "f-003",
    uploadedBy: "employee",
    uploadedAt: "2023-04-12",
    fileSize: "80 KB",
    expiryDate: "2028-04-12",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-009",
    name: "AWS Solutions Architect Certificate",
    type: "Certificate",
    ext: "pdf",
    folderId: "f-004",
    uploadedBy: "employee",
    uploadedAt: "2025-06-20",
    fileSize: "180 KB",
    expiryDate: "2027-06-20",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-010",
    name: "Performance Review – Q4 2025",
    type: "HR File",
    ext: "docx",
    folderId: null,
    uploadedBy: "hr",
    uploadedAt: "2026-01-15",
    fileSize: "145 KB",
    requiresAck: false,
    acknowledged: false,
  },
  {
    id: "d-011",
    name: "Employee Handbook 2026",
    type: "Policy",
    ext: "pdf",
    folderId: null,
    uploadedBy: "hr",
    uploadedAt: "2026-01-02",
    fileSize: "320 KB",
    requiresAck: true,
    acknowledged: false,
  },
];

const MY_EMPLOYEE = "Adaeze Okonkwo";
const MY_DEPARTMENT = "Engineering";

/**
 * A document reaches an employee when it is directly shared with them, assigned
 * to the whole organisation (global), or assigned to their department.
 */
function isAssignedToMe(d: HRDocument): boolean {
  if (d.shares.some((s) => s.employeeName === MY_EMPLOYEE)) return true;
  const scope = d.assignment?.scope;
  if (scope === "global") return true;
  if (scope === "department")
    return (d.assignment?.departments ?? []).includes(MY_DEPARTMENT);
  return false;
}

function hrFileTypeToExt(ft: string): FileExt {
  if (ft === "doc") return "docx";
  if (ft === "jpeg") return "jpg";
  const valid: FileExt[] = ["pdf", "docx", "xlsx", "png", "jpg", "txt"];
  return valid.includes(ft as FileExt) ? (ft as FileExt) : "other";
}

export function formatFileBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const SHARED_WITH_ME: EmployeeDocument[] = HR_DOCUMENTS.filter(
  isAssignedToMe,
).map((d: HRDocument) => ({
  id: `shared-${d.id}`,
  name: d.name,
  type: DOCUMENT_CATEGORY_LABELS[d.category],
  ext: hrFileTypeToExt(d.fileType),
  folderId: "shared",
  uploadedBy: "hr" as const,
  uploadedAt: d.uploadedAt,
  fileSize: formatFileBytes(d.fileSize),
  expiryDate: d.expiryDate,
  requiresAck: d.requiresAcknowledgement ?? false,
  acknowledged: false,
  isShared: true,
}));

export function daysUntilExpiry(date: string) {
  return Math.ceil(
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export { formatDate } from "@/src/lib/utils/format-date";

export const DOC_TYPES = [
  "All Types",
  "Contract",
  "Offer Letter",
  "Policy",
  "Certificate",
  "Identity",
  "HR File",
];

export const EXT_OPTIONS: { label: string; value: FileExt }[] = [
  { label: "PDF (.pdf)", value: "pdf" },
  { label: "Word (.docx)", value: "docx" },
  { label: "Excel (.xlsx)", value: "xlsx" },
  { label: "Image PNG (.png)", value: "png" },
  { label: "Image JPG (.jpg)", value: "jpg" },
  { label: "Text (.txt)", value: "txt" },
  { label: "Other", value: "other" },
];

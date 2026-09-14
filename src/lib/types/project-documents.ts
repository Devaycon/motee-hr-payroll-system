import type { DocumentFileType } from "./documents";

/**
 * §11 — Project Documents.
 *
 * Deliberately not built on `HRDocument` (`./documents.ts`): that model's
 * folders, sharing, versioning and acknowledgement-tracking target a
 * company-wide compliance library, not "attach a categorised file to one
 * project." Only the file-type union is reused; the category list below is
 * the client's own suggested set for an HRIS rollout.
 */
export type ProjectDocumentCategory =
  | "charter"
  | "business_requirements"
  | "process_maps"
  | "data_migration_plan"
  | "payroll_integration_spec"
  | "uat_plan"
  | "training_plan"
  | "go_live_checklist"
  | "risk_register"
  | "status_report"
  | "vendor_contract"
  | "change_request"
  | "other";

export const PROJECT_DOCUMENT_CATEGORY_LABELS: Record<
  ProjectDocumentCategory,
  string
> = {
  charter: "Project Charter",
  business_requirements: "Business Requirements",
  process_maps: "Process Maps",
  data_migration_plan: "Data Migration Plan",
  payroll_integration_spec: "Payroll Integration Specification",
  uat_plan: "UAT Plan",
  training_plan: "Training Plan",
  go_live_checklist: "Go-Live Checklist",
  risk_register: "Risk Register",
  status_report: "Project Status Reports",
  vendor_contract: "Vendor Contract",
  // A placeholder category only — the Change Requests feature itself is out
  // of scope pending a client scoping conversation (doc's own P6).
  change_request: "Change Requests",
  other: "Other",
};

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  fileType: DocumentFileType;
  category: ProjectDocumentCategory;
  description?: string;
  /** Bytes. */
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
}

export type NewProjectDocument = Omit<
  ProjectDocument,
  "id" | "projectId" | "uploadedAt"
>;

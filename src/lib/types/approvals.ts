/**
 * A workflow module-category id. Built-in categories use the stable ids below;
 * user-added categories use generated ids (e.g. "CAT-..."). Kept as `string`
 * so categories can be created at runtime.
 */
export type ApprovalDocumentType = string;

export const BUILTIN_CATEGORY_IDS = [
  "workforce_request",
  "leave_request",
  "job_requisition",
  "contract",
  "onboarding",
  "offboarding_clearance",
  "promotion_request",
  "training_request",
  "asset_request",
  "expense_claim",
] as const;

export type ApprovalStatus =
  | "draft"
  | "in_progress"
  | "approved"
  | "rejected"
  | "returned"
  | "cancelled";

export type ApprovalStepStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "returned"
  | "skipped";

export type ApprovalEventType =
  | "submitted"
  | "approved"
  | "rejected"
  | "returned"
  | "resubmitted"
  | "commented"
  | "cancelled";

export type ApproverResolver =
  | "LINE_MANAGER"
  | "DEPARTMENT_HEAD"
  | `ROLE:${string}`;

// On-leave fallback actions (admin picks one per step)
export type OnLeaveAction =
  | { kind: "skip" }
  | { kind: "reassign_to_manager" }
  | { kind: "reassign_to_role"; approver: ApproverResolver };

// Workflow desks (start + end)
export type WorkflowStartDesk =
  | { kind: "submitter" }
  | { kind: "resolver"; approver: ApproverResolver };

export type WorkflowEndDesk =
  | { kind: "approved" }
  | { kind: "resolver"; approver: ApproverResolver };

export interface AttachmentRules {
  allowed: boolean;
  required: boolean;
  description?: string;
}

export interface SignatureRules {
  submitterSigns: boolean;
  reviewerSigns: boolean;
  placeOnDocument: boolean;
}

export interface ApprovalChainStep {
  id: string;
  order: number;
  /** The task to be done (the unit of work in the workflow). */
  label: string;
  /** The reviewer who must approve this task. */
  approver: ApproverResolver;
  required: boolean;
  onLeaveAction: OnLeaveAction;
}

export interface ApprovalChainTemplate {
  id: string;
  documentType: ApprovalDocumentType;
  name: string;
  description?: string;
  isDefault: boolean;
  kind: "system" | "custom";
  startDesk: WorkflowStartDesk;
  endDesk: WorkflowEndDesk;
  steps: ApprovalChainStep[];
  attachments: AttachmentRules;
  signatures: SignatureRules;
  lastModifiedBy: string;
  lastModifiedAt: string;
}

export interface ApprovalStepInstance {
  id: string;
  order: number;
  templateStepId: string;
  label: string;
  approver: ApproverResolver;
  resolvedEmployeeId: string | null;
  resolvedEmployeeName: string | null;
  status: ApprovalStepStatus;
  decidedAt?: string;
  note?: string;
  signatureId?: string;
  skippedReason?: "on_leave" | "manual";
  reassignedFromEmployeeId?: string;
  reassignedFromName?: string;
}

export interface ApprovalEvent {
  id: string;
  at: string;
  actorEmployeeId: string;
  actorName: string;
  type: ApprovalEventType;
  stepOrder?: number;
  note?: string;
}

export interface ApprovalSubmitter {
  employeeId: string;
  name: string;
  initials: string;
  departmentName: string;
}

export interface ApprovalAttachment {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  uploadedAt: string;
  uploadedByEmployeeId: string;
}

export interface ApprovalSignaturePlacement {
  attachmentId: string;
  x: number; // 0–1 normalized
  y: number; // 0–1 normalized
  width: number; // 0–1 normalized
}

export interface ApprovalSignature {
  id: string;
  signerEmployeeId: string;
  signerName: string;
  dataUrl: string;
  placement: ApprovalSignaturePlacement | null;
  signedAt: string;
  role: "submitter" | "reviewer";
  stepId?: string;
}

export interface ApprovalRequest {
  id: string;
  documentType: ApprovalDocumentType;
  documentId: string;
  documentTitle: string;
  documentSummary: string;
  payloadSnapshot: Record<string, unknown>;
  submittedBy: ApprovalSubmitter;
  submittedAt: string;
  chainTemplateId: string;
  currentStepIndex: number;
  status: ApprovalStatus;
  steps: ApprovalStepInstance[];
  history: ApprovalEvent[];
  attachments: ApprovalAttachment[];
  signatures: ApprovalSignature[];
}

export interface NewApprovalSubmission {
  documentType: ApprovalDocumentType;
  documentId: string;
  documentTitle: string;
  documentSummary: string;
  payloadSnapshot: Record<string, unknown>;
  submitter: ApprovalSubmitter;
  chainTemplateId?: string;
  attachments?: ApprovalAttachment[];
  submitterSignatureDataUrl?: string;
}

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  workforce_request: "Workforce Request",
  leave_request: "Leave Request",
  job_requisition: "Job Requisition",
  contract: "Contract",
  onboarding: "Onboarding",
  offboarding_clearance: "Offboarding",
  promotion_request: "Promotion / Salary Change",
  training_request: "Training Request",
  asset_request: "Asset Request",
  expense_claim: "Expense Claim",
};

export const ALL_DOCUMENT_TYPES: ApprovalDocumentType[] = [
  ...BUILTIN_CATEGORY_IDS,
];

/** A workflow module category — built-in or user-added. */
export interface ApprovalCategory {
  id: string;
  label: string;
  builtIn: boolean;
  description?: string;
}

export const BUILTIN_CATEGORIES: ApprovalCategory[] = BUILTIN_CATEGORY_IDS.map(
  (id) => ({ id, label: DOCUMENT_TYPE_LABELS[id] ?? id, builtIn: true }),
);

/** Resolve a category id to its display label using the registry, with fallbacks. */
export function categoryLabel(
  id: string,
  categories?: ApprovalCategory[],
): string {
  const fromRegistry = categories?.find((c) => c.id === id)?.label;
  return fromRegistry ?? DOCUMENT_TYPE_LABELS[id] ?? id;
}

export const STATUS_LABELS: Record<ApprovalStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  approved: "Approved",
  rejected: "Rejected",
  returned: "Returned",
  cancelled: "Cancelled",
};

export const STATUS_STYLES: Record<ApprovalStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-600 border-red-500/20",
  returned: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

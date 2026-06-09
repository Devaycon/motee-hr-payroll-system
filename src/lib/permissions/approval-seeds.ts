import type {
  ApprovalChainTemplate,
  ApprovalDocumentType,
  AttachmentRules,
  SignatureRules,
} from "@/src/lib/types/approvals";

interface SeedStep {
  /** The task to be done (the unit of work). */
  label: string;
  /** The reviewer who must approve this task. */
  approver: ApprovalChainTemplate["steps"][number]["approver"];
}

// Each workflow is an ordered list of tasks; every task carries the reviewer
// who must approve it. The reviewers in sequence form the approval chain.
const DEFAULT_STEPS: Record<ApprovalDocumentType, SeedStep[]> = {
  workforce_request: [
    { label: "Review role justification", approver: "ROLE:ROLE-HRMGR" },
    { label: "Confirm budget availability", approver: "ROLE:ROLE-FIN" },
    { label: "Executive authorization", approver: "ROLE:ROLE-EXEC" },
  ],
  leave_request: [
    { label: "Validate leave dates & cover", approver: "LINE_MANAGER" },
    { label: "HR policy check & record", approver: "ROLE:ROLE-HRMGR" },
  ],
  job_requisition: [
    { label: "Approve role need", approver: "LINE_MANAGER" },
    { label: "Confirm headcount & grade", approver: "ROLE:ROLE-HRMGR" },
    { label: "Budget approval", approver: "ROLE:ROLE-FIN" },
  ],
  contract: [
    { label: "Review contract terms", approver: "ROLE:ROLE-HRMGR" },
    { label: "Finalize & file contract", approver: "ROLE:ROLE-HRADMIN" },
  ],
  onboarding: [
    { label: "Confirm offer & documents", approver: "LINE_MANAGER" },
    { label: "Provision equipment & accounts", approver: "ROLE:ROLE-IT" },
    { label: "HR compliance sign-off", approver: "ROLE:ROLE-HRADMIN" },
  ],
  offboarding_clearance: [
    { label: "Handover & manager clearance", approver: "LINE_MANAGER" },
    { label: "Revoke access & collect assets", approver: "ROLE:ROLE-IT" },
    { label: "Final settlement", approver: "ROLE:ROLE-FIN" },
    { label: "HR exit sign-off", approver: "ROLE:ROLE-HRADMIN" },
  ],
  promotion_request: [
    { label: "Recommend promotion", approver: "LINE_MANAGER" },
    { label: "Validate grade & policy", approver: "ROLE:ROLE-HRADMIN" },
    { label: "Approve salary change", approver: "ROLE:ROLE-FIN" },
  ],
  training_request: [
    { label: "Endorse training need", approver: "LINE_MANAGER" },
    { label: "Approve training budget", approver: "ROLE:ROLE-HRMGR" },
  ],
  asset_request: [
    { label: "Approve asset need", approver: "LINE_MANAGER" },
    { label: "Provision asset", approver: "ROLE:ROLE-IT" },
  ],
  expense_claim: [
    { label: "Validate expense", approver: "LINE_MANAGER" },
    { label: "Reimburse claim", approver: "ROLE:ROLE-FIN" },
  ],
};

const DOCUMENT_TEMPLATE_NAMES: Record<ApprovalDocumentType, string> = {
  workforce_request: "Standard Workforce Request Approval",
  leave_request: "Standard Leave Approval",
  job_requisition: "Standard Job Requisition Approval",
  contract: "Standard Contract Approval",
  onboarding: "Standard Onboarding Workflow",
  offboarding_clearance: "Standard Offboarding Clearance",
  promotion_request: "Standard Promotion / Salary Change",
  training_request: "Standard Training Request",
  asset_request: "Standard Asset Request",
  expense_claim: "Standard Expense Claim",
};

const ATTACHMENTS_BY_TYPE: Record<ApprovalDocumentType, AttachmentRules> = {
  workforce_request: {
    allowed: true,
    required: false,
    description: "Attach a budget breakdown or business case (optional).",
  },
  leave_request: {
    allowed: true,
    required: false,
    description: "Attach a medical certificate for sick leave (optional).",
  },
  job_requisition: { allowed: true, required: false },
  contract: {
    allowed: true,
    required: true,
    description: "Attach the draft contract or amendment PDF / image.",
  },
  onboarding: {
    allowed: true,
    required: false,
    description: "Attach the signed offer letter or onboarding pack (optional).",
  },
  offboarding_clearance: {
    allowed: true,
    required: true,
    description: "Attach the signed exit checklist.",
  },
  promotion_request: { allowed: true, required: false },
  training_request: {
    allowed: true,
    required: true,
    description: "Attach the course outline or proforma invoice.",
  },
  asset_request: { allowed: true, required: false },
  expense_claim: {
    allowed: true,
    required: true,
    description: "Attach receipts / invoices.",
  },
};

const SIGNATURES_BY_TYPE: Record<ApprovalDocumentType, SignatureRules> = {
  workforce_request: {
    submitterSigns: false,
    reviewerSigns: false,
    placeOnDocument: false,
  },
  leave_request: {
    submitterSigns: false,
    reviewerSigns: false,
    placeOnDocument: false,
  },
  job_requisition: {
    submitterSigns: false,
    reviewerSigns: false,
    placeOnDocument: false,
  },
  contract: {
    submitterSigns: true,
    reviewerSigns: true,
    placeOnDocument: true,
  },
  onboarding: {
    submitterSigns: false,
    reviewerSigns: false,
    placeOnDocument: false,
  },
  offboarding_clearance: {
    submitterSigns: true,
    reviewerSigns: true,
    placeOnDocument: false,
  },
  promotion_request: {
    submitterSigns: false,
    reviewerSigns: true,
    placeOnDocument: false,
  },
  training_request: {
    submitterSigns: false,
    reviewerSigns: false,
    placeOnDocument: false,
  },
  asset_request: {
    submitterSigns: false,
    reviewerSigns: false,
    placeOnDocument: false,
  },
  expense_claim: {
    submitterSigns: false,
    reviewerSigns: true,
    placeOnDocument: false,
  },
};

function buildTemplate(
  documentType: ApprovalDocumentType,
): ApprovalChainTemplate {
  const seedSteps = DEFAULT_STEPS[documentType];
  return {
    id: `ACT-DEFAULT-${documentType.toUpperCase().replace(/_/g, "-")}`,
    documentType,
    name: DOCUMENT_TEMPLATE_NAMES[documentType],
    description: `Default ${documentType.replace(/_/g, " ")} workflow`,
    isDefault: true,
    kind: "system",
    startDesk: { kind: "submitter" },
    endDesk: { kind: "approved" },
    steps: seedSteps.map((s, i) => ({
      id: `ACT-STEP-${documentType.toUpperCase().replace(/_/g, "-")}-${i + 1}`,
      order: i + 1,
      label: s.label,
      approver: s.approver,
      required: true,
      onLeaveAction: { kind: "skip" },
    })),
    attachments: ATTACHMENTS_BY_TYPE[documentType],
    signatures: SIGNATURES_BY_TYPE[documentType],
    lastModifiedBy: "System",
    lastModifiedAt: "2026-01-01",
  };
}

export const DEFAULT_APPROVAL_TEMPLATES: ApprovalChainTemplate[] = [
  buildTemplate("workforce_request"),
  buildTemplate("leave_request"),
  buildTemplate("job_requisition"),
  buildTemplate("contract"),
  buildTemplate("onboarding"),
  buildTemplate("offboarding_clearance"),
  buildTemplate("promotion_request"),
  buildTemplate("training_request"),
  buildTemplate("asset_request"),
  buildTemplate("expense_claim"),
];

export const DEFAULT_TEMPLATE_IDS = new Set(
  DEFAULT_APPROVAL_TEMPLATES.map((t) => t.id),
);

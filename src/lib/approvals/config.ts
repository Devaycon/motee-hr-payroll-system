import {
  BUILTIN_CATEGORY_IDS,
  type ApprovalDocumentType,
} from "@/src/lib/types/approvals";

/**
 * The two front doors onto the submissions hub. The admin (HR) portal and the
 * employee self-service portal each raise a different set of submissions.
 */
export type SubmissionPortal = "admin" | "self_service";

type BuiltinCategoryId = (typeof BUILTIN_CATEGORY_IDS)[number];

/**
 * Which portal a submission type is raised from. A `Record` over the built-in
 * ids, so adding a category without deciding its portal is a type error.
 *
 *  - admin: organisation-level actions HR, managers and finance raise.
 *  - self_service: personal requests an employee raises for themselves.
 *
 * Every type belongs to exactly one portal, so the two lists never overlap.
 */
const SUBMISSION_PORTAL_BY_TYPE: Record<BuiltinCategoryId, SubmissionPortal> = {
  workforce_request: "admin",
  job_requisition: "admin",
  contract: "admin",
  onboarding: "admin",
  offboarding_clearance: "admin",
  promotion_request: "admin",
  leave_request: "self_service",
  expense_claim: "self_service",
  asset_request: "self_service",
  training_request: "self_service",
};

/** Can this portal raise a submission of this type? Unknown (custom) types default to admin. */
export function canSubmitFromPortal(
  documentType: ApprovalDocumentType,
  portal: SubmissionPortal,
): boolean {
  const owner =
    SUBMISSION_PORTAL_BY_TYPE[documentType as BuiltinCategoryId] ?? "admin";
  return owner === portal;
}

/** A module that can host an approval chain — and so shows the read-only Approval Chain tab. */
export interface ApprovalChainModule {
  documentType: ApprovalDocumentType;
  /** The module's name as HR sees it in the sidebar. */
  label: string;
  /** Where the module lives, for "open module" links. */
  href: string;
}

/**
 * Every module an approval chain can be set up for. Each one has a tabbed page
 * that renders the read-only Approval Chain tab once a chain exists, so every
 * option in the create-chain dropdown is guaranteed a place to show up.
 */
export const APPROVAL_CHAIN_MODULES: ApprovalChainModule[] = [
  { documentType: "workforce_request", label: "Workforce Requests", href: "/talent/workforce-requests" },
  { documentType: "job_requisition", label: "Requisitions", href: "/talent/requisition" },
  { documentType: "leave_request", label: "Leave", href: "/time-payroll/leave" },
  { documentType: "expense_claim", label: "Expenses", href: "/time-payroll/expenses" },
  { documentType: "contract", label: "Contracts", href: "/operations/contracts" },
  { documentType: "asset_request", label: "Assets", href: "/operations/assets" },
  { documentType: "offboarding_clearance", label: "Offboarding", href: "/talent/offboarding" },
  { documentType: "training_request", label: "Training", href: "/talent/training" },
];

export function moduleForDocumentType(
  documentType: ApprovalDocumentType,
): ApprovalChainModule | undefined {
  return APPROVAL_CHAIN_MODULES.find((m) => m.documentType === documentType);
}

/** Where the chains are managed — the only place they can be edited. */
export const APPROVAL_CHAINS_PATH = "/hr-action-center/submissions?tab=chains";

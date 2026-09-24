import { useAppSelector } from "@/src/lib/stores/hooks";
import type { ApprovalDocumentType } from "@/src/lib/types/approvals";
import type { PageTabItem } from "@/src/components/shared/page-tabs";

/** The read-only tab a module shows for the approval chain it goes through. */
export const APPROVAL_CHAIN_TAB_ITEM: PageTabItem = {
  value: "approval_chain",
  label: "Approval Chain",
};

/**
 * Should this module show its read-only Approval Chain tab? Whenever any chain
 * routes its requests — the built-in default counts too, so people on the
 * module can always see the steps a request goes through. Chains are still
 * created and changed only in Submissions & Approvals.
 */
export function useHasApprovalChainTab(
  documentType: ApprovalDocumentType,
): boolean {
  return useAppSelector((s) =>
    s.approvals.templates.some((t) => t.documentType === documentType),
  );
}

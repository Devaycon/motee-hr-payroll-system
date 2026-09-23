import { useAppSelector } from "@/src/lib/stores/hooks";
import type { ApprovalDocumentType } from "@/src/lib/types/approvals";
import type { PageTabItem } from "@/src/components/shared/page-tabs";

/** The tab a module adds once an approval chain has been created for it. */
export const APPROVAL_CHAIN_TAB_ITEM: PageTabItem = {
  value: "approval_chain",
  label: "Approval Chain",
};

/**
 * Should this module show its read-only Approval Chain tab? Only once someone
 * has created a chain for it in Submissions & Approvals — the built-in default
 * chains don't count, so a module never grows an empty tab on its own.
 */
export function useHasApprovalChainTab(
  documentType: ApprovalDocumentType,
): boolean {
  return useAppSelector((s) =>
    s.approvals.templates.some(
      (t) => t.documentType === documentType && t.kind === "custom",
    ),
  );
}

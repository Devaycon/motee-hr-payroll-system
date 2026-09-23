import { useEffectiveAccess } from "@/src/lib/permissions/use-can";
import type { OHReferral } from "@/src/lib/types/occupational-health";

/** Fixed "today" the demo data is authored against, matching the rest of the module. */
export const REF_TODAY = new Date(2026, 8, 22);

export function daysSince(iso: string): number {
  return Math.floor((REF_TODAY.getTime() - new Date(iso).getTime()) / 86_400_000);
}

export function fmt(iso?: string): string {
  return iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

export function isOverdue(due?: string): boolean {
  if (!due) return false;
  return new Date(due).getTime() < REF_TODAY.getTime();
}

/**
 * §10.3 tab predicates. Kept as plain functions (not a lookup on `status`
 * alone) because several tabs read more than one field — e.g. "Adjustments"
 * cares about whether adjustments exist, not what stage the case is at.
 */
export const OH_TABS = [
  { value: "all", label: "All" },
  { value: "action_required", label: "Action Required" },
  { value: "awaiting_oh", label: "Awaiting OH" },
  { value: "adjustments", label: "Adjustments" },
  { value: "follow_up", label: "Follow-up" },
  { value: "closed", label: "Closed" },
] as const;

export type OHTabValue = (typeof OH_TABS)[number]["value"];

export function matchesTab(r: OHReferral, tab: OHTabValue): boolean {
  switch (tab) {
    case "all":
      return true;
    case "action_required":
      return Boolean(r.nextAction) && r.status !== "closed";
    case "awaiting_oh":
      return r.status === "referred" || r.status === "assessment_completed";
    case "adjustments":
      return r.adjustments.length > 0 && r.status !== "closed";
    case "follow_up":
      return (
        r.status === "adjustments_implemented" ||
        r.status === "returned" ||
        r.status === "rtw_completed"
      );
    case "closed":
      return r.status === "closed";
  }
}

/**
 * §10.8 — role-based confidentiality, keyed off data scope rather than the
 * module's `edit` action: `actionsFor()` in permissions/seeds.ts grants
 * Line Manager "edit" too (for their own reports' records generally), so
 * action-based gating would wrongly hand managers the confidential view.
 * Data scope is the signal this codebase already uses to mean "a line
 * manager looking at their own reports" (`direct_reports`) vs. HR staff
 * (`all` / `business_unit` / `branch` / `department`) — see the doc comment
 * on `DataScope` in src/lib/types/access-levels.ts. An individual viewing
 * their own record (`self`) is equally not HR/OH staff.
 *
 * Falls open (full detail) when access hasn't resolved yet, matching every
 * other `useCan` call site's pre-login/demo behaviour.
 */
export function useCanViewConfidentialOH(): boolean {
  const access = useEffectiveAccess();
  if (access.unresolved) return true;
  return access.dataScope.kind !== "direct_reports" && access.dataScope.kind !== "self";
}

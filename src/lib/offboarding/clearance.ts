import {
  isOpenOffboardingStatus,
  type ClearanceItem,
  type OffboardingRecord,
} from "@/src/lib/types/offboarding";

/**
 * The stage a clearance step belongs to (Offboarding feedback §1).
 *
 * A single "Clearance Pending: 28" doesn't tell HR where exits are stuck, so
 * every checklist step is bucketed into the team that has to act on it. The
 * breakdown under the KPI cards counts leavers per bucket.
 */
export type ClearanceCategory =
  | "it_assets"
  | "finance"
  | "manager"
  | "access"
  | "hr";

/** The four stages shown on the bottleneck breakdown, in display order. */
export const CLEARANCE_BOTTLENECK_CATEGORIES = [
  "it_assets",
  "finance",
  "manager",
  "access",
] as const satisfies readonly ClearanceCategory[];

export type ClearanceBottleneckCategory =
  (typeof CLEARANCE_BOTTLENECK_CATEGORIES)[number];

export const CLEARANCE_CATEGORY_LABELS: Record<ClearanceCategory, string> = {
  it_assets: "IT Assets Pending",
  finance: "Finance Clearance",
  manager: "Manager Approval",
  access: "Access Revocation",
  hr: "HR Clearance",
};

/**
 * Buckets a step by its label first (the most specific signal), then by the
 * owning department. Physical returns are matched before access so "Return
 * access cards" lands with the assets, and "Revoke system access" (owned by
 * IT) is matched before the IT department fallback.
 */
export function clearanceCategory(item: ClearanceItem): ClearanceCategory {
  const label = item.label.toLowerCase();
  const dept = item.department.toLowerCase();

  if (/laptop|asset|equipment|badge|card|device|it clearance/.test(label)) {
    return "it_assets";
  }
  if (/access|revoke|account|email/.test(label)) return "access";
  if (/pay|finance|timesheet|settlement|payslip/.test(label)) return "finance";
  if (/manager|handover|knowledge/.test(label)) return "manager";

  if (dept === "it") return "it_assets";
  if (dept === "finance") return "finance";
  if (dept === "manager") return "manager";
  return "hr";
}

/**
 * Whether a record still has outstanding clearance — optionally in one stage.
 * Only live exits count: a disapproved or reactivated record keeps its
 * unticked checklist, but nobody needs to chase it.
 */
export function hasPendingClearance(
  record: OffboardingRecord,
  category?: ClearanceCategory,
): boolean {
  if (!isOpenOffboardingStatus(record.status)) return false;
  return record.clearanceItems.some(
    (c) =>
      !c.completed && (category === undefined || clearanceCategory(c) === category),
  );
}

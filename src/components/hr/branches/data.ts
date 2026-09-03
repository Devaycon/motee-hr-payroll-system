import {
  BRANCH_KIND_LABELS,
  BRANCH_STATUS_LABELS,
  BRANCH_STATUS_STYLES,
  type BranchKind,
  type BranchStatus,
} from "@/src/lib/types/branches";

export {
  BRANCH_KIND_LABELS,
  BRANCH_STATUS_LABELS,
  BRANCH_STATUS_STYLES,
};

export const BRANCH_KIND_OPTIONS = Object.entries(BRANCH_KIND_LABELS) as [
  BranchKind,
  string,
][];

export const BRANCH_STATUS_OPTIONS = Object.entries(BRANCH_STATUS_LABELS) as [
  BranchStatus,
  string,
][];

/**
 * "Lagos" -> "LAG", "Port Harcourt" -> "PHA". Suggested as the user types the
 * city so the code field is rarely touched by hand; it stays editable.
 */
export function suggestBranchCode(city: string): string {
  const words = city.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) {
    return words[0].replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
  }
  return (
    words.map((w) => w[0]).join("") + (words[words.length - 1][1] ?? "")
  )
    .replace(/[^A-Za-z]/g, "")
    .slice(0, 4)
    .toUpperCase();
}

import type { ExpenseClaim } from "@/src/data/employee-expenses-demo";

/**
 * Duplicate expense detection (client feedback §8.6, §9.10).
 *
 * The client flagged this as a significant fraud-prevention feature, but it
 * mostly catches honest mistakes — a claim submitted twice after a page
 * refresh, or the same receipt filed by two people. Either way the fix is the
 * same: warn before the claim is accepted, and let the user continue if they
 * genuinely meant it.
 */

/** How close two dates have to be to count as the same expense. */
const DATE_WINDOW_DAYS = 3;

export interface DuplicateMatch {
  claim: ExpenseClaim;
  /** Why this looked like a duplicate, for the warning copy. */
  reasons: string[];
}

function daysApart(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  if (Number.isNaN(da) || Number.isNaN(db)) return Number.POSITIVE_INFINITY;
  return Math.abs(da - db) / 86_400_000;
}

function sameMerchant(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Find claims that look like the one being submitted. Returns the closest
 * match first. An exact amount + merchant + near-date hit is the strong
 * signal; two out of three is worth a mention.
 */
export function findDuplicates(
  candidate: Pick<
    ExpenseClaim,
    "amount" | "merchant" | "dateSubmitted" | "category"
  >,
  existing: ExpenseClaim[],
  { excludeId }: { excludeId?: string } = {},
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];

  for (const claim of existing) {
    if (excludeId && claim.id === excludeId) continue;

    const reasons: string[] = [];
    const amountMatches = Math.abs(claim.amount - candidate.amount) < 0.005;
    const merchantMatches = sameMerchant(claim.merchant, candidate.merchant);
    const gap = daysApart(claim.dateSubmitted, candidate.dateSubmitted);
    const dateMatches = gap <= DATE_WINDOW_DAYS;

    if (amountMatches) reasons.push("same amount");
    if (merchantMatches) reasons.push("same merchant");
    if (dateMatches) {
      reasons.push(gap === 0 ? "same date" : "within a few days");
    }

    // Amount alone is far too common to be worth flagging.
    const strong = amountMatches && merchantMatches;
    const plausible = amountMatches && dateMatches && merchantMatches;
    if (strong || plausible) {
      matches.push({ claim, reasons });
    }
  }

  return matches.sort(
    (a, b) =>
      daysApart(a.claim.dateSubmitted, candidate.dateSubmitted) -
      daysApart(b.claim.dateSubmitted, candidate.dateSubmitted),
  );
}

/** One-line warning for the closest match, in the client's §9.10 wording. */
export function duplicateWarning(
  match: DuplicateMatch,
  formatAmount: (n: number) => string,
): string {
  const when = new Date(match.claim.dateSubmitted).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  return `Similar expense submitted on ${when} (${formatAmount(
    match.claim.amount,
  )} at ${match.claim.merchant}).`;
}

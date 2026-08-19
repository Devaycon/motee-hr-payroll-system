import type {
  ExpenseClaim,
  ExpenseHistoryEntry,
} from "@/src/data/employee-expenses-demo";

/** ISO date plus `days`, staying in ISO date form. */
function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The trail a claim would have had before the store recorded one — inferred
 * from the status it is sitting in, since an approved claim must have been
 * submitted first. Inferred dates are spaced off the submission date rather
 * than invented wholesale.
 */
function inferTimeline(claim: ExpenseClaim): ExpenseHistoryEntry[] {
  const reviewer = claim.reviewer ?? "your approver";
  const entry = (
    id: string,
    at: string,
    action: string,
    actor?: string,
  ): ExpenseHistoryEntry => ({ id: `${claim.id}-${id}`, at, action, actor });

  if (claim.status === "draft") {
    return [entry("draft", claim.dateSubmitted, "Draft saved", "You")];
  }

  const trail = [entry("sub", claim.dateSubmitted, "Submitted", "You")];

  if (claim.status === "submitted") return trail;

  if (claim.status === "rejected") {
    // No reason is inferred — the employee's own notes are not an approver's
    // rejection note, and guessing one would be worse than leaving it blank.
    trail.push(entry("rej", addDays(claim.dateSubmitted, 2), "Rejected", reviewer));
    return trail;
  }

  trail.push(entry("app", addDays(claim.dateSubmitted, 2), "Approved", reviewer));

  if (claim.status === "reimbursed") {
    trail.push(
      entry("fin", addDays(claim.dateSubmitted, 4), "Cleared by Finance", "Finance"),
      entry("paid", addDays(claim.dateSubmitted, 6), "Reimbursement paid", "Finance"),
    );
  }

  return trail;
}

/**
 * The claim's audit trail, oldest first.
 *
 * Claims raised in the app carry their own history. Seeded ones have none, so
 * their trail is inferred. The two are *merged* rather than chosen between:
 * an HR decision on a seeded claim would otherwise create a one-entry history
 * and wipe out the submission that must have preceded it.
 */
export function claimTimeline(claim: ExpenseClaim): ExpenseHistoryEntry[] {
  if (!claim.history?.length) return inferTimeline(claim);

  const sorted = [...claim.history].sort((a, b) => a.at.localeCompare(b.at));
  const hasOrigin = sorted.some(
    (h) => h.action === "Submitted" || h.action === "Draft saved",
  );
  if (hasOrigin) return sorted;

  // History exists but not the entry that started it — prepend the inferred
  // origin so the trail doesn't begin mid-story.
  return [
    {
      id: `${claim.id}-sub`,
      at: claim.dateSubmitted,
      action: "Submitted",
      actor: claim.employeeName ?? "You",
    },
    ...sorted,
  ];
}

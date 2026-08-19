import type { Interview } from "@/src/lib/types/recruitment";

function endOf(iv: Interview): number {
  return new Date(iv.scheduledAt).getTime() + iv.durationMins * 60_000;
}

/**
 * Interviews where a panellist is double-booked, keyed by interview id.
 *
 * Two interviews can be scheduled into the same slot with the same panel and
 * nothing anywhere says so — the clash only surfaces when somebody fails to
 * turn up. This flags the overlap at the point the schedule is read.
 */
export function findConflicts(interviews: Interview[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  const live = interviews.filter((iv) => iv.status === "scheduled");
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      const startA = new Date(a.scheduledAt).getTime();
      const startB = new Date(b.scheduledAt).getTime();
      if (Number.isNaN(startA) || Number.isNaN(startB)) continue;
      const overlaps = startA < endOf(b) && startB < endOf(a);
      if (!overlaps) continue;
      const shared = a.panel.filter((p) => b.panel.includes(p));
      if (shared.length === 0) continue;
      const names = shared.map((id) => a.panelNames[a.panel.indexOf(id)] ?? id);
      conflicts.set(a.id, [...(conflicts.get(a.id) ?? []), ...names]);
      conflicts.set(b.id, [...(conflicts.get(b.id) ?? []), ...names]);
    }
  }
  return conflicts;
}

/**
 * The one interview worth showing against a candidate in the pipeline table.
 *
 * A candidate can have several rounds booked. The row has space for one, so it
 * shows the next one still to happen; once nothing is upcoming it falls back to
 * the most recent, which is what you want on the Interviewed tab. Cancelled
 * rounds are ignored — a cancelled slot is not the candidate's interview.
 */
export function relevantInterview(
  interviews: Interview[],
  candidateId: string,
  now = Date.now(),
): Interview | null {
  const mine = interviews
    .filter((iv) => iv.candidateId === candidateId && iv.status !== "cancelled")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  if (mine.length === 0) return null;
  return (
    mine.find((iv) => new Date(iv.scheduledAt).getTime() >= now) ?? mine.at(-1)!
  );
}

/** "14 Sep 2025, 11:00" — one line, because it lives in a table cell. */
export function interviewWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unscheduled";
  return `${d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}, ${d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

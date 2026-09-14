/**
 * Presence check-ins — periodic "are you still there?" prompts shown to a
 * clocked-in employee, so a tenant has some assurance the person behind the
 * clock-in is actually at their machine, and HR gets a productivity split of
 * active vs. inactive time for the day rather than a single "8h worked" figure.
 */

export interface PresenceCheckSettings {
  enabled: boolean;
  /** Random prompt interval range, in minutes — a fixed interval would let an
   *  employee learn the cadence and simply be present for it. */
  intervalMinMinutes: number;
  intervalMaxMinutes: number;
  /** How long the employee has to respond before a prompt counts as missed. */
  responseWindowSeconds: number;
  /** Consecutive missed prompts before that stretch is logged inactive. */
  missThreshold: number;
  /** Skip prompts while the employee is on a break. */
  pauseDuringBreaks: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PRESENCE_CHECK_SETTINGS: PresenceCheckSettings = {
  enabled: false,
  intervalMinMinutes: 15,
  intervalMaxMinutes: 30,
  responseWindowSeconds: 60,
  missThreshold: 2,
  pauseDuringBreaks: true,
};

export type PresencePromptOutcome = "confirmed" | "missed";

/** One "are you still there?" prompt shown to a clocked-in employee. */
export interface PresencePrompt {
  id: string;
  employeeId: string;
  employeeName: string;
  /** ISO date of the clock session this prompt belongs to. */
  sessionDate: string;
  triggeredAt: string;
  respondedAt?: string;
  /** Undefined while the prompt is still awaiting a response. */
  outcome?: PresencePromptOutcome;
  /** Seconds allowed to respond, captured from settings at trigger time. */
  responseWindowSeconds: number;
}

/** One contiguous stretch of active or inactive time, derived from prompts. */
export interface PresencePeriod {
  status: "active" | "inactive";
  startAt: string;
  endAt: string;
}

export interface PresenceDaySummary {
  employeeId: string;
  employeeName: string;
  sessionDate: string;
  totalPrompts: number;
  confirmed: number;
  missed: number;
  /** Still waiting on a response — not yet confirmed or missed. */
  pending: number;
  activeSeconds: number;
  inactiveSeconds: number;
  periods: PresencePeriod[];
}

/**
 * Splits `[sessionStart, sessionEnd]` into active/inactive periods.
 *
 * A stretch turns "inactive" the moment `missThreshold` consecutive prompts
 * go unanswered, starting from the first missed prompt in that run — the
 * employee was already unresponsive before the threshold prompt fired, not
 * only from that instant. It turns "active" again the moment any prompt is
 * confirmed. Prompts still pending (no outcome yet) don't resolve either way.
 */
export function derivePresencePeriods(
  prompts: readonly PresencePrompt[],
  missThreshold: number,
  sessionStart: string,
  sessionEnd: string,
): PresencePeriod[] {
  const sorted = [...prompts].sort((a, b) =>
    a.triggeredAt.localeCompare(b.triggeredAt),
  );

  const inactiveSpans: { start: string; end: string }[] = [];
  let missStreak = 0;
  let streakStartAt: string | null = null;
  let openInactiveStart: string | null = null;

  for (const p of sorted) {
    if (p.outcome === "missed") {
      if (missStreak === 0) streakStartAt = p.triggeredAt;
      missStreak++;
      if (missStreak >= missThreshold && openInactiveStart === null) {
        openInactiveStart = streakStartAt;
      }
    } else if (p.outcome === "confirmed") {
      if (openInactiveStart) {
        inactiveSpans.push({ start: openInactiveStart, end: p.triggeredAt });
        openInactiveStart = null;
      }
      missStreak = 0;
      streakStartAt = null;
    }
    // Pending prompts don't change the streak either way yet.
  }
  if (openInactiveStart) {
    inactiveSpans.push({ start: openInactiveStart, end: sessionEnd });
  }

  const periods: PresencePeriod[] = [];
  let cursor = sessionStart;
  for (const span of inactiveSpans) {
    if (span.start > cursor) {
      periods.push({ status: "active", startAt: cursor, endAt: span.start });
    }
    periods.push({ status: "inactive", startAt: span.start, endAt: span.end });
    cursor = span.end;
  }
  if (cursor < sessionEnd) {
    periods.push({ status: "active", startAt: cursor, endAt: sessionEnd });
  }
  return periods;
}

function secondsBetween(a: string, b: string): number {
  return Math.max(
    0,
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 1000),
  );
}

/** Aggregates one employee's prompts for one session into a day summary. */
export function summarizePresenceDay(
  employeeId: string,
  employeeName: string,
  sessionDate: string,
  prompts: readonly PresencePrompt[],
  missThreshold: number,
  sessionStart: string,
  sessionEnd: string,
): PresenceDaySummary {
  const periods = derivePresencePeriods(
    prompts,
    missThreshold,
    sessionStart,
    sessionEnd,
  );
  const activeSeconds = periods
    .filter((p) => p.status === "active")
    .reduce((s, p) => s + secondsBetween(p.startAt, p.endAt), 0);
  const inactiveSeconds = periods
    .filter((p) => p.status === "inactive")
    .reduce((s, p) => s + secondsBetween(p.startAt, p.endAt), 0);

  return {
    employeeId,
    employeeName,
    sessionDate,
    totalPrompts: prompts.length,
    confirmed: prompts.filter((p) => p.outcome === "confirmed").length,
    missed: prompts.filter((p) => p.outcome === "missed").length,
    pending: prompts.filter((p) => !p.outcome).length,
    activeSeconds,
    inactiveSeconds,
    periods,
  };
}

import { isOpenLeaveStatus, type LeaveRequest } from "@/src/lib/types/leave";
import { MIN_COVERAGE_RATIO } from "./conflicts";

/**
 * Leave planning intelligence (client feedback — Leave module enhancements).
 *
 * Where `conflicts.ts` answers "should HR approve this?", this answers the
 * employee's question first: *when should I even ask?* Four capabilities, all
 * pure so the same rules drive the request form, the insights panel and any
 * future manager view:
 *
 *   1. `suggestLeaveWindows`  — staffing-aware dates that are unlikely to clash
 *   2. `staffingImpact`       — what a specific range would do to team cover
 *   3. `leaveExpiryAlert`     — carry-over days about to lapse
 *   4. `yearEndRecommendation`— pacing advice for unbooked annual leave
 *
 * Everything takes `today` explicitly rather than reading the clock, so the
 * results are deterministic and testable.
 */

export interface PublicHolidayLike {
  date: string;
  name: string;
}

export interface ShutdownLike {
  startDate: string;
  endDate: string;
  name: string;
}

// ── date helpers (ISO `yyyy-mm-dd`, compared lexically) ──────────────────────

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** The next Monday strictly after `d`. */
function nextMonday(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + ((8 - r.getDay()) % 7 || 7));
  return r;
}

function overlapsRange(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

/** "4–8 August" / "29 July – 2 August" — how the suggestions read. */
export function formatWindow(startIso: string, endIso: string): string {
  const a = new Date(startIso);
  const b = new Date(endIso);
  const month = (d: Date) => d.toLocaleDateString("en-GB", { month: "long" });
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${month(a)}`
    : `${a.getDate()} ${month(a)} – ${b.getDate()} ${month(b)}`;
}

/** Counts Mon–Fri days in an inclusive range. */
export function workingDaysBetween(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 0;
  const end = new Date(endIso);
  const cur = new Date(startIso);
  if (end < cur) return 0;
  let count = 0;
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ── 2. staffing impact for a specific range ─────────────────────────────────

export interface StaffingInput {
  startDate: string;
  endDate: string;
  /** Whose team to measure. */
  department: string;
  /** Every request to check overlaps against. */
  allRequests: readonly LeaveRequest[];
  /** Headcount of `department`. */
  teamSize: number;
  /** Exclude the employee's own in-flight requests from the "others off" count. */
  excludeEmployeeName?: string;
  excludeRequestId?: string;
}

export interface StaffingImpact {
  /** Colleagues in the same department already off over this range. */
  awayCount: number;
  /** Up to a handful of their names, for the message. */
  awayNames: string[];
  /** Team members left at work if this request is granted. */
  availableIfApproved: number;
  teamSize: number;
  minStaffing: number;
  /** True when granting the request breaches minimum cover. */
  belowMinimum: boolean;
}

/** The minimum headcount that must stay at work in a team of `teamSize`. */
export function minStaffingFor(teamSize: number): number {
  return Math.ceil(teamSize * MIN_COVERAGE_RATIO);
}

/**
 * What booking `startDate`–`endDate` would do to the team's cover. Counts
 * approved *and* still-open requests, since a pending one may yet be granted.
 */
export function staffingImpact({
  startDate,
  endDate,
  department,
  allRequests,
  teamSize,
  excludeEmployeeName,
  excludeRequestId,
}: StaffingInput): StaffingImpact {
  const away = allRequests.filter(
    (r) =>
      r.department === department &&
      r.id !== excludeRequestId &&
      r.employeeName !== excludeEmployeeName &&
      (r.status === "approved" || isOpenLeaveStatus(r.status)) &&
      overlapsRange(r.startDate, r.endDate, startDate, endDate),
  );
  // One name per colleague — a person with two overlapping requests is still
  // only one body missing from the team.
  const awayNames = [...new Set(away.map((r) => r.employeeName))];
  const minStaffing = minStaffingFor(teamSize);
  const availableIfApproved = Math.max(0, teamSize - awayNames.length - 1);
  return {
    awayCount: awayNames.length,
    awayNames,
    availableIfApproved,
    teamSize,
    minStaffing,
    belowMinimum: teamSize > 0 && availableIfApproved < minStaffing,
  };
}

// ── 1. suggested leave windows ──────────────────────────────────────────────

export interface SuggestionInput extends Omit<StaffingInput, "startDate" | "endDate"> {
  /** Search starts at the first Monday after this date. */
  today: string;
  /** How many working days the employee wants off. Defaults to a full week. */
  length?: number;
  /** How many weeks ahead to scan. */
  horizonWeeks?: number;
  /** How many windows to return. */
  limit?: number;
  holidays?: readonly PublicHolidayLike[];
  shutdowns?: readonly ShutdownLike[];
  /** Windows starting before this are skipped (e.g. a policy's notice period). */
  earliestStart?: string;
}

export interface SuggestedWindow {
  startDate: string;
  endDate: string;
  /** "4–8 August" */
  label: string;
  workingDays: number;
  impact: StaffingImpact;
  /** Public holiday inside or adjacent to the window, if any. */
  holidayName?: string;
  /** Company shutdown clashing with the window — a reason *not* to book. */
  shutdownName?: string;
  /** Plain-language reason this window is being suggested. */
  reason: string;
}

/**
 * Ranks upcoming Mon–Fri windows by how little they clash with the rest of the
 * team, preferring weeks that sit next to a public holiday (more time off for
 * fewer days) and skipping company shutdowns (already non-working).
 */
export function suggestLeaveWindows({
  today,
  department,
  allRequests,
  teamSize,
  length = 5,
  horizonWeeks = 14,
  limit = 3,
  holidays = [],
  shutdowns = [],
  earliestStart,
  excludeEmployeeName,
  excludeRequestId,
}: SuggestionInput): SuggestedWindow[] {
  const first = nextMonday(new Date(today));
  // A window is `length` working days from a Monday; clamp to the Mon–Fri week
  // so a 5-day request doesn't spill a weekend into the label.
  const span = Math.min(Math.max(length, 1), 5) - 1;

  const windows = Array.from({ length: horizonWeeks }, (_, w) => {
    const startDate = toIso(addDays(first, w * 7));
    const endDate = toIso(addDays(new Date(startDate), span));

    const impact = staffingImpact({
      startDate,
      endDate,
      department,
      allRequests,
      teamSize,
      excludeEmployeeName,
      excludeRequestId,
    });

    // A holiday just outside the window still makes it attractive — it extends
    // the break without spending another day of entitlement.
    const holiday = holidays.find(
      (h) =>
        h.date >= toIso(addDays(new Date(startDate), -3)) &&
        h.date <= toIso(addDays(new Date(endDate), 3)),
    );
    const shutdown = shutdowns.find((s) =>
      overlapsRange(s.startDate, s.endDate, startDate, endDate),
    );

    return {
      startDate,
      endDate,
      label: formatWindow(startDate, endDate),
      workingDays: workingDaysBetween(startDate, endDate),
      impact,
      holidayName: holiday?.name,
      shutdownName: shutdown?.name,
      reason: shutdown
        ? `Overlaps ${shutdown.name}`
        : holiday
          ? `Next to ${holiday.name}`
          : impact.awayCount === 0
            ? "Team fully available"
            : `Only ${impact.awayCount} away — cover stays above the minimum`,
      // Lower is better: clashes hurt, an adjacent holiday helps, a shutdown
      // disqualifies (you'd be spending leave on days off).
      score:
        impact.awayCount * 2 +
        (impact.belowMinimum ? 10 : 0) +
        (holiday ? -1 : 0) +
        (shutdown ? 50 : 0),
    };
  })
    .filter((w) => !w.shutdownName)
    .filter((w) => !earliestStart || w.startDate >= earliestStart)
    // Never recommend a window we'd immediately warn about.
    .filter((w) => !w.impact.belowMinimum);

  return windows
    .sort((a, b) => a.score - b.score || a.startDate.localeCompare(b.startDate))
    .slice(0, limit)
    .map((w) => {
      const { score, ...window } = w;
      void score;
      return window;
    });
}

// ── 3. leave expiry alerts ──────────────────────────────────────────────────

export type AlertSeverity = "none" | "info" | "warning" | "urgent";

export interface LeaveExpiryAlert {
  /** Days of annual leave still unbooked. */
  remaining: number;
  /** How many of those may be carried into next year. */
  carryCap: number;
  /** Days that lapse if they aren't booked — `remaining` beyond the cap. */
  daysAtRisk: number;
  /** End of the holiday year, ISO. */
  deadline: string;
  daysToDeadline: number;
  severity: AlertSeverity;
  message: string;
}

/** 31 December of `today`'s year, unless the tenant sets its own year end. */
function holidayYearEnd(today: string, yearEnd?: string): string {
  if (yearEnd) return yearEnd;
  return `${new Date(today).getFullYear()}-12-31`;
}

function daysBetween(fromIso: string, toIsoDate: string): number {
  return Math.round(
    (new Date(toIsoDate).getTime() - new Date(fromIso).getTime()) / 86_400_000,
  );
}

/**
 * Flags annual leave that will lapse at the year end. Anything above the
 * carry-over cap is use-it-or-lose-it, and the warning sharpens as the deadline
 * closes so it isn't shouting in January.
 */
export function leaveExpiryAlert({
  today,
  remaining,
  carryCap,
  yearEnd,
  subject,
}: {
  today: string;
  remaining: number;
  carryCap: number;
  yearEnd?: string;
  /** Name to address in the copy. Omit for second person ("you"). */
  subject?: string;
}): LeaveExpiryAlert {
  const deadline = holidayYearEnd(today, yearEnd);
  const daysToDeadline = Math.max(0, daysBetween(today, deadline));
  const daysAtRisk = Math.max(0, remaining - carryCap);

  let severity: AlertSeverity = "none";
  if (daysAtRisk > 0) {
    severity =
      daysToDeadline <= 60 ? "urgent" : daysToDeadline <= 120 ? "warning" : "info";
  }

  const deadlineText = new Date(deadline).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
  const has = subject ? `${subject} has` : "You have";
  const their = subject ? `${subject}'s` : "Your";

  const message =
    daysAtRisk === 0
      ? remaining > 0
        ? `${their} ${remaining} remaining day${remaining === 1 ? "" : "s"} ${
            remaining === 1 ? "is" : "are"
          } within the ${carryCap}-day carry-over allowance — nothing expires.`
        : `${has} no annual leave left to book this year.`
      : `${daysAtRisk} day${daysAtRisk === 1 ? "" : "s"} will expire on ${deadlineText}. ` +
        `${has} ${remaining} left and only ${carryCap} can be carried into next year.`;

  return {
    remaining,
    carryCap,
    daysAtRisk,
    deadline,
    daysToDeadline,
    severity,
    message,
  };
}

// ── 4. year-end pacing recommendation ───────────────────────────────────────

export interface YearEndRecommendation {
  remaining: number;
  daysToDeadline: number;
  /** Whole working weeks left before the year end, roughly. */
  weeksToDeadline: number;
  /** Suggested booking pace, e.g. "about 2 days a month". */
  pace: string | null;
  severity: AlertSeverity;
  message: string;
}

/**
 * Nudges the employee to spread unbooked annual leave over the time that's
 * left, rather than discovering in December that they can't take it all.
 */
export function yearEndRecommendation({
  today,
  remaining,
  yearEnd,
}: {
  today: string;
  remaining: number;
  yearEnd?: string;
}): YearEndRecommendation {
  const deadline = holidayYearEnd(today, yearEnd);
  const daysToDeadline = Math.max(0, daysBetween(today, deadline));
  const weeksToDeadline = Math.floor(daysToDeadline / 7);
  const monthsLeft = Math.max(1, Math.round(daysToDeadline / 30));

  if (remaining <= 0) {
    return {
      remaining,
      daysToDeadline,
      weeksToDeadline,
      pace: null,
      severity: "none",
      message: "All of this year's annual leave is booked or taken.",
    };
  }

  // Booking a week takes 5 days; if there aren't enough weeks left to absorb
  // what's owed, the employee needs to act now rather than pace it.
  const bookableWeeks = Math.floor(weeksToDeadline);
  const tight = remaining > bookableWeeks * 5;
  const perMonth = Math.ceil(remaining / monthsLeft);

  return {
    remaining,
    daysToDeadline,
    weeksToDeadline,
    pace: `about ${perMonth} day${perMonth === 1 ? "" : "s"} a month`,
    severity: tight ? "urgent" : daysToDeadline <= 120 ? "warning" : "info",
    message: tight
      ? `${remaining} days left with only ${weeksToDeadline} weeks to go — book soon, there may not be room for all of it.`
      : `${remaining} days left to use before the year ends — that's about ${perMonth} day${
          perMonth === 1 ? "" : "s"
        } a month.`,
  };
}

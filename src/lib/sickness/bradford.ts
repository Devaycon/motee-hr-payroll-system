/**
 * Bradford Factor engine — B = S² × D.
 *
 *   S = separate sickness episodes in the window
 *   D = qualifying sickness days in the window
 *
 * Steps (client brief, "Build the calculation engine"):
 *  1. Take the employee's sickness records for the rolling window (52 weeks by default).
 *  2. Drop what doesn't qualify: cancelled/rejected/draft, planned medical
 *     procedures, and absences HR has excluded (disability, pregnancy…).
 *  3. Turn each record into absent working days using the employee's work
 *     pattern and public holidays — half days count 0.5; an overnight shift
 *     belongs to the day it started.
 *  4. Merge overlapping or duplicate records day by day, so a corrected or
 *     double-entered absence is never counted twice.
 *  5. Group the absent days into episodes. Non-working days between two
 *     absences don't break a spell (off Friday and Monday = one episode).
 *  6. An episode that crosses the window boundary still counts once, but only
 *     its days inside the window are counted.
 *  7. Score, then band against the employer's own thresholds.
 *
 * The score is an HR monitoring indicator only — it has nothing to do with pay
 * and must never trigger an automatic sanction. Bands only *suggest* a review.
 */

import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  subDays,
  subWeeks,
} from "date-fns";
import type {
  BradfordAction,
  BradfordSettings,
  BradfordThreshold,
  SicknessRecord,
} from "@/src/lib/types/sickness";

export type WorkSchedule = Record<string, { start: string; end: string } | null>;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export const DEFAULT_SCHEDULE: WorkSchedule = {
  mon: { start: "09:00", end: "17:30" },
  tue: { start: "09:00", end: "17:30" },
  wed: { start: "09:00", end: "17:30" },
  thu: { start: "09:00", end: "17:30" },
  fri: { start: "09:00", end: "17:30" },
  sat: null,
  sun: null,
};

export const DEFAULT_THRESHOLDS: BradfordThreshold[] = [
  { id: "th-0", min: 0, label: "0–49", action: "monitor" },
  { id: "th-50", min: 50, label: "50–199", action: "manager_review" },
  { id: "th-200", min: 200, label: "200–399", action: "formal_review" },
  { id: "th-400", min: 400, label: "400+", action: "senior_hr_review" },
];

export const DEFAULT_BRADFORD_SETTINGS: BradfordSettings = {
  windowWeeks: 52,
  mergeAcrossNonWorkingDays: true,
  thresholds: DEFAULT_THRESHOLDS,
  halfDaysAsHalf: true,
  honourExclusions: true,
  calcVersion: 1,
};

export interface BradfordEpisode {
  start: string;
  end: string;
  /** Qualifying days inside the window. */
  days: number;
  recordIds: string[];
  /** Part of the episode falls outside the window. */
  clipped: boolean;
}

export interface BradfordResult {
  employeeId: string;
  windowStart: string;
  windowEnd: string;
  episodes: BradfordEpisode[];
  S: number;
  D: number;
  score: number;
  action: BradfordAction;
  threshold: BradfordThreshold;
  excluded: Array<{ recordId: string; reason: string }>;
  calcVersion: number;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/** Does this record count towards the score at all? */
export function qualifies(r: SicknessRecord, settings: BradfordSettings): { ok: boolean; reason?: string } {
  if (r.approvalStatus === "rejected" || r.approvalStatus === "cancelled" || r.approvalStatus === "draft") {
    return { ok: false, reason: `Record ${r.approvalStatus}` };
  }
  if (r.kind === "medical_procedure") return { ok: false, reason: "Planned medical procedure" };
  if (settings.honourExclusions && r.exclusion) {
    return { ok: false, reason: `Excluded by HR — ${r.exclusion.reason}` };
  }
  return { ok: true };
}

/** Calendar span a record covers, with overnight shifts assigned to their start day. */
export function recordSpan(r: SicknessRecord, asOf: string): { start: string; end: string } {
  let end = r.endDate ?? asOf;
  if (end < r.startDate) end = r.startDate;
  if (r.overnightShift && end > r.startDate) end = iso(subDays(parseISO(end), 1));
  return { start: r.startDate, end };
}

/** Weight of one calendar day of a record (0, 0.5 or 1). */
function dayWeight(
  r: SicknessRecord,
  day: string,
  span: { start: string; end: string },
  halfAsHalf: boolean,
): number {
  if (!halfAsHalf) return 1;
  if (day === span.start && r.startPortion !== "full") return 0.5;
  if (day === span.end && day !== span.start && r.endPortion !== "full") return 0.5;
  return 1;
}

export function isWorkingDay(date: Date, schedule: WorkSchedule | undefined, holidays: Set<string>): boolean {
  if (holidays.has(iso(date))) return false;
  const s = schedule ?? DEFAULT_SCHEDULE;
  return !!s[DAY_KEYS[date.getDay()]];
}

export function bandFor(score: number, thresholds: BradfordThreshold[]): BradfordThreshold {
  const sorted = [...thresholds].sort((a, b) => b.min - a.min);
  return sorted.find((t) => score >= t.min) ?? sorted[sorted.length - 1] ?? DEFAULT_THRESHOLDS[0];
}

export function calculateBradford(opts: {
  employeeId: string;
  records: SicknessRecord[];
  asOf: string;
  settings: BradfordSettings;
  schedule?: WorkSchedule;
  holidays?: string[];
}): BradfordResult {
  const { employeeId, asOf, settings } = opts;
  const holidays = new Set(opts.holidays ?? []);
  const windowEnd = asOf;
  const windowStart = iso(addDays(subWeeks(parseISO(asOf), settings.windowWeeks), 1));

  const excluded: BradfordResult["excluded"] = [];
  // date → { weight, recordIds } — merging overlaps day by day.
  const absent = new Map<string, { weight: number; recordIds: Set<string> }>();

  for (const r of opts.records) {
    if (r.employeeId !== employeeId) continue;
    const span = recordSpan(r, asOf);
    if (span.end < windowStart || span.start > windowEnd) continue;
    const q = qualifies(r, settings);
    if (!q.ok) {
      excluded.push({ recordId: r.id, reason: q.reason ?? "Excluded" });
      continue;
    }
    const total = differenceInCalendarDays(parseISO(span.end), parseISO(span.start));
    for (let i = 0; i <= total; i++) {
      const d = addDays(parseISO(span.start), i);
      if (!isWorkingDay(d, opts.schedule, holidays)) continue;
      const key = iso(d);
      const w = dayWeight(r, key, span, settings.halfDaysAsHalf);
      const cur = absent.get(key);
      if (cur) {
        cur.weight = Math.max(cur.weight, w);
        cur.recordIds.add(r.id);
      } else {
        absent.set(key, { weight: w, recordIds: new Set([r.id]) });
      }
    }
  }

  // Group consecutive absent working days into episodes.
  const days = [...absent.keys()].sort();
  const episodes: BradfordEpisode[] = [];
  let cur: { start: string; end: string; days: number; inWindow: number; ids: Set<string> } | null = null;

  const continues = (prevDay: string, nextDay: string): boolean => {
    const gap = differenceInCalendarDays(parseISO(nextDay), parseISO(prevDay));
    if (gap === 1) return true;
    if (!settings.mergeAcrossNonWorkingDays) return false;
    for (let i = 1; i < gap; i++) {
      if (isWorkingDay(addDays(parseISO(prevDay), i), opts.schedule, holidays)) return false;
    }
    return true;
  };

  for (const day of days) {
    const a = absent.get(day)!;
    const inside = day >= windowStart && day <= windowEnd;
    if (cur && continues(cur.end, day)) {
      cur.end = day;
      cur.days += a.weight;
      if (inside) cur.inWindow += a.weight;
      a.recordIds.forEach((id) => cur!.ids.add(id));
    } else {
      if (cur) episodes.push(close(cur));
      cur = { start: day, end: day, days: a.weight, inWindow: inside ? a.weight : 0, ids: new Set(a.recordIds) };
    }
  }
  if (cur) episodes.push(close(cur));

  function close(c: { start: string; end: string; days: number; inWindow: number; ids: Set<string> }): BradfordEpisode {
    return {
      start: c.start,
      end: c.end,
      days: c.inWindow,
      recordIds: [...c.ids],
      clipped: c.inWindow !== c.days || c.start < windowStart,
    };
  }

  const counted = episodes.filter((e) => e.days > 0);
  const S = counted.length;
  const D = Math.round(counted.reduce((s, e) => s + e.days, 0) * 2) / 2;
  const score = Math.round(S * S * D * 10) / 10;
  const threshold = bandFor(score, settings.thresholds);
  return {
    employeeId,
    windowStart,
    windowEnd,
    episodes: counted,
    S,
    D,
    score,
    action: threshold.action,
    threshold,
    excluded,
    calcVersion: settings.calcVersion,
  };
}

/** Continuous calendar days off for an ongoing or closed record. */
export function spellLength(r: SicknessRecord, asOf: string): number {
  const span = recordSpan(r, asOf);
  return differenceInCalendarDays(parseISO(span.end), parseISO(span.start)) + 1;
}

/** Working days lost to one record (no window, no merging) — for lists and costs. */
export function workingDaysLost(
  r: SicknessRecord,
  asOf: string,
  schedule?: WorkSchedule,
  holidays: string[] = [],
): number {
  const span = recordSpan(r, asOf);
  const hs = new Set(holidays);
  const total = differenceInCalendarDays(parseISO(span.end), parseISO(span.start));
  let n = 0;
  for (let i = 0; i <= total; i++) {
    const d = addDays(parseISO(span.start), i);
    if (isWorkingDay(d, schedule, hs)) n += dayWeight(r, iso(d), span, true);
  }
  return n;
}

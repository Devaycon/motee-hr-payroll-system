/**
 * One set of sickness figures for every screen — the Absence Records cards,
 * the HR dashboard's Sickness tab and Alerts & Reporting all call this, so a
 * number never differs between them.
 *
 * Rules:
 *  - A record counts unless it was rejected or cancelled (awaiting-approval
 *    absences are real time off and count).
 *  - Days lost are *working* days, from each person's work pattern, minus
 *    public holidays, half days as 0.5 — and clipped to the period, so an
 *    absence that started before the period only counts its days inside it.
 *  - Absence rate = days lost ÷ (headcount × working days in the period).
 */

import { addDays, differenceInCalendarDays, format, isWeekend, parseISO } from "date-fns";
import type { SicknessRecord } from "@/src/lib/types/sickness";
import { isWorkingDay, recordSpan, spellLength, type WorkSchedule } from "./bradford";

export interface StatsPerson {
  schedule?: WorkSchedule;
  /** Pay for one working day, for absence cost. */
  dailyCost?: number;
}

export interface StatsInput {
  records: SicknessRecord[];
  people: Map<string, StatsPerson>;
  /** Employees in scope — the denominator for rate and frequency. */
  headcount: number;
  holidays: string[];
  asOf: string;
  /** Period start (inclusive); omit for all time. */
  from?: string;
  longTermDays: number;
}

export interface StatsRow {
  r: SicknessRecord;
  /** Working days lost inside the period. */
  days: number;
  /** Calendar length of the whole spell. */
  span: number;
  cost: number;
  longTerm: boolean;
}

export interface SicknessStats {
  rows: StatsRow[];
  episodes: number;
  people: number;
  daysLost: number;
  cost: number;
  averageSpell: number;
  absenceRate: number;
  frequency: number;
  longTerm: { count: number; days: number };
  shortTerm: { count: number; days: number };
  ongoing: number;
  awaitingApproval: number;
  fitNotesOutstanding: number;
  rtwDue: number;
  workingDaysInPeriod: number;
}

export const counts = (r: SicknessRecord) => r.approvalStatus !== "rejected" && r.approvalStatus !== "cancelled";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/** Working days of one record that fall between `from` and `to` (inclusive). */
export function workingDaysBetween(
  r: SicknessRecord,
  asOf: string,
  from: string | undefined,
  to: string,
  schedule: WorkSchedule | undefined,
  holidays: Set<string>,
): number {
  const span = recordSpan(r, asOf);
  const start = from && from > span.start ? from : span.start;
  const end = to < span.end ? to : span.end;
  if (start > end) return 0;
  let n = 0;
  const total = differenceInCalendarDays(parseISO(end), parseISO(start));
  for (let i = 0; i <= total; i++) {
    const d = addDays(parseISO(start), i);
    if (!isWorkingDay(d, schedule, holidays)) continue;
    const day = iso(d);
    const half =
      (day === span.start && r.startPortion !== "full") ||
      (day === span.end && day !== span.start && r.endPortion !== "full");
    n += half ? 0.5 : 1;
  }
  return n;
}

function weekdaysBetween(from: string, to: string, holidays: Set<string>): number {
  let n = 0;
  const total = differenceInCalendarDays(parseISO(to), parseISO(from));
  for (let i = 0; i <= total; i++) {
    const d = addDays(parseISO(from), i);
    if (!isWeekend(d) && !holidays.has(iso(d))) n += 1;
  }
  return n;
}

export function sicknessStats(input: StatsInput): SicknessStats {
  const holidays = new Set(input.holidays);
  const { asOf, from } = input;
  const live = input.records.filter(counts);
  const inPeriod = live.filter((r) => {
    const span = recordSpan(r, asOf);
    return span.start <= asOf && (!from || span.end >= from);
  });
  const rows: StatsRow[] = inPeriod.map((r) => {
    const person = input.people.get(r.employeeId);
    const days = workingDaysBetween(r, asOf, from, asOf, person?.schedule, holidays);
    const span = spellLength(r, asOf);
    return { r, days, span, cost: days * (person?.dailyCost ?? 0), longTerm: span >= input.longTermDays };
  });

  const daysLost = rows.reduce((a, x) => a + x.days, 0);
  const earliest = rows.reduce((m, x) => (x.r.startDate < m ? x.r.startDate : m), asOf);
  const periodStart = from ?? earliest;
  const workingDaysInPeriod = weekdaysBetween(periodStart, asOf, holidays);
  const headcount = Math.max(1, input.headcount);
  const long = rows.filter((x) => x.longTerm);
  const short = rows.filter((x) => !x.longTerm);

  return {
    rows,
    episodes: rows.length,
    people: new Set(rows.map((x) => x.r.employeeId)).size,
    daysLost,
    cost: rows.reduce((a, x) => a + x.cost, 0),
    averageSpell: rows.length ? Math.round((daysLost / rows.length) * 10) / 10 : 0,
    absenceRate: workingDaysInPeriod ? Math.round((daysLost / (headcount * workingDaysInPeriod)) * 1000) / 10 : 0,
    frequency: Math.round((rows.length / headcount) * 100) / 100,
    longTerm: { count: long.length, days: long.reduce((a, x) => a + x.days, 0) },
    shortTerm: { count: short.length, days: short.reduce((a, x) => a + x.days, 0) },
    // Point-in-time counts look at every live record, not just the period.
    ongoing: live.filter((r) => r.absenceState === "ongoing").length,
    awaitingApproval: live.filter((r) => r.approvalStatus === "awaiting_approval").length,
    fitNotesOutstanding: live.filter((r) => r.fitNoteStatus === "awaiting" || r.fitNoteStatus === "expired").length,
    rtwDue: live.filter((r) => r.rtw.status === "pending").length,
    workingDaysInPeriod,
  };
}

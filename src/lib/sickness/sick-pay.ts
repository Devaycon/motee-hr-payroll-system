/**
 * Sick pay — what each day of sickness is paid at, under the employee's
 * Occupational Sick Pay (OSP) scheme and UK Statutory Sick Pay (SSP).
 *
 * This is the payroll side of sickness and is deliberately separate from the
 * Bradford Factor, which has nothing to do with pay.
 *
 * SSP rules are date-versioned: the version in force on the day of absence
 * applies. The Employment Rights Act 2025 changed SSP from 6 April 2026 —
 * no waiting days, no lower earnings limit, and pay is the lower of the flat
 * weekly rate or 80% of normal weekly earnings.
 */

import { addDays, differenceInCalendarDays, differenceInMonths, format, parseISO, subMonths } from "date-fns";
import type { SchemeStep, SicknessRecord, SicknessScheme } from "@/src/lib/types/sickness";
import { isWorkingDay, recordSpan, type WorkSchedule } from "./bradford";

export interface SspRuleVersion {
  effectiveFrom: string;
  /** Flat weekly rate (£). */
  weeklyRate: number;
  /** Unpaid qualifying days at the start of each period of incapacity. */
  waitingDays: number;
  /** Weekly earnings needed to qualify; null = no earnings test. */
  lowerEarningsLimit: number | null;
  /** When set, SSP is capped at this % of normal weekly earnings. */
  earningsPercentCap: number | null;
  /** Calendar days apart within which two PIWs link into one. */
  linkingDays: number;
  maxWeeks: number;
  /** Source to verify against when the rates are reviewed each April. */
  note: string;
}

/**
 * Rates to confirm against GOV.UK each tax year — HR can override the table
 * in a tenant's settings without a code change.
 */
export const SSP_RULES: SspRuleVersion[] = [
  { effectiveFrom: "2024-04-06", weeklyRate: 116.75, waitingDays: 3, lowerEarningsLimit: 123, earningsPercentCap: null, linkingDays: 56, maxWeeks: 28, note: "2024/25 rates" },
  { effectiveFrom: "2025-04-06", weeklyRate: 118.75, waitingDays: 3, lowerEarningsLimit: 125, earningsPercentCap: null, linkingDays: 56, maxWeeks: 28, note: "2025/26 rates" },
  { effectiveFrom: "2026-04-06", weeklyRate: 123.25, waitingDays: 0, lowerEarningsLimit: null, earningsPercentCap: 80, linkingDays: 56, maxWeeks: 28, note: "Employment Rights Act 2025 reforms — verify rate on GOV.UK" },
];

export function sspRuleOn(date: string, rules: SspRuleVersion[] = SSP_RULES): SspRuleVersion {
  const sorted = [...rules].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return sorted.find((r) => r.effectiveFrom <= date) ?? sorted[sorted.length - 1];
}

export interface PayEmployee {
  id: string;
  startDate: string;
  employmentTypeId: string;
  /** Normal weekly earnings (£). */
  weeklyEarnings: number;
  daysPerWeek: number;
  weeklyHours: number;
  onProbation?: boolean;
  schedule?: WorkSchedule;
}

export interface SickPayDay {
  date: string;
  recordId: string;
  /** 1 for a full day, 0.5 for a half day. */
  portion: number;
  stepLabel: string;
  payPercent: number;
  /** Company pay for the day (£). */
  ospAmount: number;
  /** SSP for the day (£) — only where it beats company pay. */
  sspAmount: number;
  /** Why the day pays what it pays. */
  basis: string;
}

export interface EntitlementSummary {
  eligible: boolean;
  reason?: string;
  steps: Array<SchemeStep & { entitled: number; used: number; remaining: number }>;
  unit: SicknessScheme["unit"];
}

/** Steps for this employee: service band override, then part-time pro-rating. */
export function effectiveSteps(scheme: SicknessScheme, emp: PayEmployee, onDate: string): SchemeStep[] {
  const months = differenceInMonths(parseISO(onDate), parseISO(emp.startDate));
  const band = [...scheme.serviceBands]
    .sort((a, b) => b.minServiceMonths - a.minServiceMonths)
    .find((b) => months >= b.minServiceMonths);
  const steps = scheme.period === "length_of_service" && band ? band.steps : scheme.steps;
  let ratio = 1;
  if (scheme.partTimeFormula === "days_ratio" && emp.daysPerWeek < scheme.fullTimeDaysPerWeek) {
    ratio = emp.daysPerWeek / scheme.fullTimeDaysPerWeek;
  } else if (scheme.partTimeFormula === "hours_ratio" && emp.weeklyHours < scheme.fullTimeWeeklyHours) {
    ratio = emp.weeklyHours / scheme.fullTimeWeeklyHours;
  }
  return steps.map((s) => ({ ...s, amount: Math.round(s.amount * ratio * 2) / 2 }));
}

export function isEligible(scheme: SicknessScheme, emp: PayEmployee, onDate: string): { ok: boolean; reason?: string } {
  const served = differenceInCalendarDays(parseISO(onDate), parseISO(emp.startDate));
  if (served < scheme.eligibility.minServiceDays) {
    return { ok: false, reason: `Needs ${scheme.eligibility.minServiceDays} days' service (has ${Math.max(0, served)})` };
  }
  if (scheme.eligibility.employmentTypeIds.length && !scheme.eligibility.employmentTypeIds.includes(emp.employmentTypeId)) {
    return { ok: false, reason: "Employment type not covered by this scheme" };
  }
  if (scheme.eligibility.excludeProbation && emp.onProbation) {
    return { ok: false, reason: "On probation" };
  }
  return { ok: true };
}

/** Steps are measured in contracted days; weeks convert at the employee's days per week. */
function toDays(amount: number, scheme: SicknessScheme, emp: PayEmployee): number {
  if (scheme.unit === "weeks") return amount * emp.daysPerWeek;
  if (scheme.unit === "hours") return amount / Math.max(1, emp.weeklyHours / Math.max(1, emp.daysPerWeek));
  return amount;
}

/**
 * Day-by-day sick pay for every record of one employee, in date order, so
 * earlier absences use up entitlement before later ones.
 */
export function calculateSickPay(opts: {
  employee: PayEmployee;
  scheme: SicknessScheme | null;
  records: SicknessRecord[];
  asOf: string;
  holidays?: string[];
  sspRules?: SspRuleVersion[];
}): SickPayDay[] {
  const { employee: emp, scheme, asOf } = opts;
  const holidays = new Set(opts.holidays ?? []);
  const dailyPay = emp.weeklyEarnings / Math.max(1, emp.daysPerWeek);
  const records = opts.records
    .filter((r) => r.employeeId === emp.id && r.approvalStatus !== "rejected" && r.approvalStatus !== "cancelled")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const out: SickPayDay[] = [];
  /** OSP days paid, by date — the rolling-window lookback reads this. */
  const ospPaid: Array<{ date: string; days: number }> = [];
  let sspWeeksUsedInPiw = 0;
  let lastPiwEnd: string | null = null;
  let sspWaitingLeft = 0;

  for (const r of records) {
    const span = recordSpan(r, asOf);
    const spellDays = differenceInCalendarDays(parseISO(span.end), parseISO(span.start)) + 1;
    const rule = sspRuleOn(span.start, opts.sspRules);
    // A period of incapacity for work needs 4+ consecutive days, or links to an earlier one.
    const linked = lastPiwEnd != null && differenceInCalendarDays(parseISO(span.start), parseISO(lastPiwEnd)) <= rule.linkingDays;
    const isPiw = spellDays >= 4 || linked;
    if (isPiw && !linked) {
      sspWeeksUsedInPiw = 0;
      sspWaitingLeft = rule.waitingDays;
    }
    if (isPiw) lastPiwEnd = span.end;
    const eligible = scheme ? isEligible(scheme, emp, span.start) : { ok: false, reason: "No scheme" };
    let waitingLeft = scheme?.waitingDays ?? 0;
    let spellUsed = 0;

    for (let i = 0; i < spellDays; i++) {
      const d = addDays(parseISO(span.start), i);
      const date = format(d, "yyyy-MM-dd");
      if (!isWorkingDay(d, emp.schedule, holidays)) continue;
      if (scheme?.publicHoliday === "holiday_precedence" && holidays.has(date)) continue;
      const portion = (date === span.start && r.startPortion !== "full") || (date === span.end && date !== span.start && r.endPortion !== "full") ? 0.5 : 1;

      // ── SSP for the day
      const dayRule = sspRuleOn(date, opts.sspRules);
      let ssp = 0;
      let sspBasis = "";
      const meetsLel = dayRule.lowerEarningsLimit == null || emp.weeklyEarnings >= dayRule.lowerEarningsLimit;
      if (scheme?.applyStatutory !== false && isPiw && meetsLel && sspWeeksUsedInPiw < dayRule.maxWeeks) {
        if (sspWaitingLeft > 0) {
          sspWaitingLeft -= 1;
          sspBasis = "SSP waiting day";
        } else {
          let weekly = dayRule.weeklyRate;
          if (dayRule.earningsPercentCap != null) weekly = Math.min(weekly, (emp.weeklyEarnings * dayRule.earningsPercentCap) / 100);
          ssp = (weekly / Math.max(1, emp.daysPerWeek)) * portion;
          sspWeeksUsedInPiw += portion / Math.max(1, emp.daysPerWeek);
          sspBasis = `SSP (${dayRule.note})`;
        }
      } else if (!meetsLel) {
        sspBasis = "Earnings below SSP lower earnings limit";
      } else if (!isPiw) {
        sspBasis = "Not a period of incapacity (under 4 days)";
      }

      // ── Company sick pay for the day
      let stepLabel = "Unpaid";
      let payPercent = 0;
      let basis = sspBasis || "No sick pay";
      if (scheme && eligible.ok) {
        if (waitingLeft > 0) {
          waitingLeft -= 1;
          basis = "Scheme waiting day";
        } else {
          const steps = effectiveSteps(scheme, emp, date);
          const used =
            scheme.period === "per_spell"
              ? spellUsed
              : ospPaid
                  .filter((p) => p.date >= periodStart(scheme, date, emp) && p.date < date)
                  .reduce((s, p) => s + p.days, 0);
          let cursor = 0;
          for (const s of steps) {
            const cap = toDays(s.amount, scheme, emp);
            if (used < cursor + cap) {
              stepLabel = s.label;
              payPercent = s.payPercent;
              basis = `${scheme.name}: ${s.label}`;
              break;
            }
            cursor += cap;
          }
          if (stepLabel !== "Unpaid") {
            ospPaid.push({ date, days: portion });
            spellUsed += portion;
          } else {
            basis = `${scheme.name}: entitlement exhausted`;
          }
        }
      } else if (scheme && !eligible.ok) {
        basis = `${eligible.reason}${sspBasis ? ` · ${sspBasis}` : ""}`;
      }

      const osp = (dailyPay * payPercent * portion) / 100;
      out.push({
        date,
        recordId: r.id,
        portion,
        stepLabel,
        payPercent,
        ospAmount: Math.round(osp * 100) / 100,
        // SSP counts towards company pay — only top up where SSP is higher.
        sspAmount: Math.round(Math.max(0, ssp - osp) * 100) / 100,
        basis,
      });
    }
  }
  return out;
}

function periodStart(scheme: SicknessScheme, date: string, emp: PayEmployee): string {
  const d = parseISO(date);
  if (scheme.period === "leave_year") return `${d.getFullYear()}-01-01`;
  if (scheme.period === "length_of_service") {
    // Service-based entitlement renews on each anniversary of joining.
    const start = parseISO(emp.startDate);
    const anniversary = new Date(d.getFullYear(), start.getMonth(), start.getDate());
    return format(anniversary > d ? new Date(d.getFullYear() - 1, start.getMonth(), start.getDate()) : anniversary, "yyyy-MM-dd");
  }
  return format(subMonths(d, scheme.rollingMonths || 12), "yyyy-MM-dd");
}

/** Remaining entitlement per step as at `asOf`. */
export function entitlementSummary(opts: {
  employee: PayEmployee;
  scheme: SicknessScheme;
  records: SicknessRecord[];
  asOf: string;
  holidays?: string[];
}): EntitlementSummary {
  const { scheme, employee, asOf } = opts;
  const eligible = isEligible(scheme, employee, asOf);
  const days = calculateSickPay({ ...opts, scheme });
  const from = scheme.period === "per_spell" ? asOf : periodStart(scheme, asOf, employee);
  const steps = effectiveSteps(scheme, employee, asOf);
  // Days paid from a scheme step (any rate, including a 0% "SSP only" step).
  let remainingUsed = days
    .filter((d) => d.date >= from && d.date <= asOf && d.stepLabel !== "Unpaid")
    .reduce((s, d) => s + d.portion, 0);
  return {
    eligible: eligible.ok,
    reason: eligible.reason,
    unit: scheme.unit,
    steps: steps.map((s) => {
      const entitled = s.amount;
      const cap = toDays(s.amount, scheme, employee);
      const usedDays = Math.min(cap, remainingUsed);
      remainingUsed -= usedDays;
      const used = scheme.unit === "weeks" ? Math.round((usedDays / Math.max(1, employee.daysPerWeek)) * 10) / 10 : usedDays;
      return { ...s, entitled, used, remaining: Math.max(0, Math.round((entitled - used) * 10) / 10) };
    }),
  };
}

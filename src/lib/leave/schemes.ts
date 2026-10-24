/**
 * Leave scheme entitlement engine — what an employee is entitled to, per leave
 * type, in the current leave year, and how much of it is left.
 *
 *   entitlement = base × part-time ratio × joiner pro-rata
 *               + length-of-service extra (annual leave only, capped)
 *               + carried over from last year (capped, may have expired)
 *   accrued     = entitlement × months elapsed / 12 (monthly accrual only)
 *   remaining   = (accrued or entitlement) − taken − booked
 */

import { addMonths, differenceInCalendarMonths, differenceInYears, format, parseISO } from "date-fns";
import type { LeaveTypeName } from "@/src/lib/types/leave";
import type { LeaveEntitlementRule, LeaveScheme } from "@/src/lib/types/leave-schemes";

export interface SchemeEmployee {
  startDate: string;
  employmentTypeId: string;
  daysPerWeek: number;
  weeklyHours: number;
}

export interface TakenLeave {
  leaveType: LeaveTypeName;
  startDate: string;
  totalDays: number;
  status: "approved" | "pending";
}

export interface EntitlementLine {
  leaveType: LeaveEntitlementRule["leaveType"];
  /** Full-year allowance after part-time and service adjustments, in days. */
  base: number;
  serviceExtra: number;
  carriedOver: number;
  /** Allowance for this year (joiner pro-rata applied) + carry-over. */
  entitlement: number;
  /** What has built up so far under monthly accrual (= entitlement if upfront). */
  available: number;
  taken: number;
  booked: number;
  remaining: number;
  paid: boolean;
}

export interface EntitlementResult {
  eligible: boolean;
  reason?: string;
  yearStart: string;
  yearEnd: string;
  lines: EntitlementLine[];
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const r1 = (n: number) => Math.round(n * 2) / 2;

/** The leave year containing `asOf`, for a scheme starting in `startMonth` (1–12). */
export function leaveYear(asOf: string, startMonth: number): { start: string; end: string } {
  const d = parseISO(asOf);
  const y = d.getMonth() + 1 >= startMonth ? d.getFullYear() : d.getFullYear() - 1;
  const start = new Date(y, startMonth - 1, 1);
  const end = addMonths(start, 12);
  end.setDate(end.getDate() - 1);
  return { start: iso(start), end: iso(end) };
}

export function partTimeRatio(scheme: LeaveScheme, emp: SchemeEmployee): number {
  if (scheme.partTimeFormula === "days_ratio") return Math.min(1, emp.daysPerWeek / scheme.fullTimeDaysPerWeek);
  if (scheme.partTimeFormula === "hours_ratio") return Math.min(1, emp.weeklyHours / scheme.fullTimeWeeklyHours);
  return 1;
}

export function serviceExtra(scheme: LeaveScheme, emp: SchemeEmployee, onDate: string): number {
  const years = differenceInYears(parseISO(onDate), parseISO(emp.startDate));
  const best = [...scheme.serviceIncrements]
    .filter((s) => years >= s.afterYears)
    .reduce((m, s) => Math.max(m, s.extraDays), 0);
  return Math.min(best, scheme.maxServiceExtraDays || best);
}

function toDays(rule: LeaveEntitlementRule, scheme: LeaveScheme): number {
  return rule.unit === "weeks" ? rule.amount * scheme.fullTimeDaysPerWeek : rule.amount;
}

export function calculateEntitlements(opts: {
  scheme: LeaveScheme;
  employee: SchemeEmployee;
  leave: TakenLeave[];
  asOf: string;
  /** Unused days left at the end of last leave year, per type. */
  lastYearRemaining?: Partial<Record<LeaveTypeName, number>>;
}): EntitlementResult {
  const { scheme, employee: emp, asOf } = opts;
  const { start, end } = leaveYear(asOf, scheme.leaveYearStartMonth);
  const served = Math.round((parseISO(asOf).getTime() - parseISO(emp.startDate).getTime()) / 86400000);
  let eligible = true;
  let reason: string | undefined;
  if (served < scheme.eligibility.minServiceDays) {
    eligible = false;
    reason = `Eligible after ${scheme.eligibility.minServiceDays} days' service`;
  } else if (scheme.eligibility.employmentTypeIds.length && !scheme.eligibility.employmentTypeIds.includes(emp.employmentTypeId)) {
    eligible = false;
    reason = "Employment type not covered by this scheme";
  }

  const ratio = partTimeRatio(scheme, emp);
  // Joiners mid-year get the months left from their start date.
  const joinedThisYear = emp.startDate > start;
  const monthsInYear = joinedThisYear ? Math.max(0, 12 - differenceInCalendarMonths(parseISO(emp.startDate), parseISO(start))) : 12;
  const elapsed = Math.min(12, differenceInCalendarMonths(parseISO(asOf), parseISO(joinedThisYear ? emp.startDate : start)) + 1);

  const lines = scheme.entitlements.map((rule): EntitlementLine => {
    const fullYear = toDays(rule, scheme) * ratio;
    const extra = rule.leaveType === "annual" ? serviceExtra(scheme, emp, asOf) * ratio : 0;
    const yearShare = rule.proRataJoiners ? monthsInYear / 12 : 1;
    const allowance = (fullYear + extra) * yearShare;
    const carryExpiry = rule.carryOverExpiryMonths ? iso(addMonths(parseISO(start), rule.carryOverExpiryMonths)) : null;
    const carried =
      rule.carryOverMax > 0 && (!carryExpiry || asOf < carryExpiry)
        ? Math.min(rule.carryOverMax, Math.max(0, opts.lastYearRemaining?.[rule.leaveType] ?? 0))
        : 0;
    const entitlement = r1(allowance + carried);
    const available = rule.accrual === "monthly" ? r1((allowance * elapsed) / Math.max(1, monthsInYear) + carried) : entitlement;
    const inYear = opts.leave.filter((l) => l.leaveType === rule.leaveType && l.startDate >= start && l.startDate <= end);
    const taken = inYear.filter((l) => l.status === "approved").reduce((a, l) => a + l.totalDays, 0);
    const booked = inYear.filter((l) => l.status === "pending").reduce((a, l) => a + l.totalDays, 0);
    return {
      leaveType: rule.leaveType,
      base: r1(fullYear),
      serviceExtra: r1(extra),
      carriedOver: carried,
      entitlement: eligible ? entitlement : 0,
      available: eligible ? available : 0,
      taken,
      booked,
      remaining: eligible ? r1(available - taken - booked) : -(taken + booked),
      paid: rule.paid,
    };
  });

  return { eligible, reason, yearStart: start, yearEnd: end, lines };
}

export function schemeSummary(s: LeaveScheme): string {
  const annual = s.entitlements.find((e) => e.leaveType === "annual");
  const parts = [annual ? `${annual.amount} ${annual.unit} annual leave` : "No annual leave"];
  if (s.serviceIncrements.length) parts.push(`up to +${s.maxServiceExtraDays} for service`);
  parts.push(s.publicHolidays === "included" ? "bank holidays included" : "plus bank holidays");
  return parts.join(" · ");
}

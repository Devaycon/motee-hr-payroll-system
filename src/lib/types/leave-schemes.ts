/**
 * Leave schemes — the entitlement packages employees are enrolled on.
 *
 * A *policy* (Leave Management → Policies) describes the rules of one leave
 * type. A *scheme* says how much of each leave type a group of employees gets
 * each leave year: the allowance, how it accrues, what carries over, how it
 * grows with service and how it's pro-rated for part-time staff.
 *
 * Sickness is deliberately not here — sick pay is a Sickness & Absence scheme.
 */

import type { LeaveTypeName } from "./leave";

export type LeaveUnit = "days" | "weeks";
export type AccrualMethod = "upfront" | "monthly";
export type LeavePartTimeFormula = "days_ratio" | "hours_ratio" | "no_proration";

export const ACCRUAL_LABELS: Record<AccrualMethod, string> = {
  upfront: "Full allowance at the start of the leave year",
  monthly: "Accrues monthly through the leave year",
};

export const LEAVE_PART_TIME_LABELS: Record<LeavePartTimeFormula, string> = {
  days_ratio: "Full time entitlement × (days worked per week / full time days per week)",
  hours_ratio: "Full time entitlement × (weekly hours / full time weekly hours)",
  no_proration: "No pro-rating — part-time staff get the full entitlement",
};

/** One leave type's allowance inside a scheme. */
export interface LeaveEntitlementRule {
  id: string;
  leaveType: Exclude<LeaveTypeName, "sick">;
  amount: number;
  unit: LeaveUnit;
  accrual: AccrualMethod;
  /** Pro-rate for joiners/leavers part-way through the leave year. */
  proRataJoiners: boolean;
  /** Most days that carry into the next leave year (0 = none). */
  carryOverMax: number;
  /** Months into the new year before carried days expire (0 = never). */
  carryOverExpiryMonths: number;
  paid: boolean;
}

/** Extra annual leave after a length of service, e.g. +1 day after 2 years. */
export interface ServiceIncrement {
  id: string;
  afterYears: number;
  extraDays: number;
}

export interface LeaveScheme {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  reference?: string;
  status: "active" | "draft" | "archived";
  kind: "system" | "custom";

  /** 1–12: the month the leave year starts (1 = January). */
  leaveYearStartMonth: number;
  entitlements: LeaveEntitlementRule[];
  /** Applies to annual leave only. */
  serviceIncrements: ServiceIncrement[];
  /** Cap on service extras. */
  maxServiceExtraDays: number;

  /** Public holidays given on top of the allowance, or counted within it. */
  publicHolidays: "in_addition" | "included";
  fullTimeDaysPerWeek: number;
  fullTimeWeeklyHours: number;
  partTimeFormula: LeavePartTimeFormula;

  booking: {
    minNoticeDays: number;
    maxConsecutiveDays: number;
    allowHalfDays: boolean;
    /** Let people book into next year's allowance (go negative). */
    allowNegativeBalance: boolean;
  };
  eligibility: {
    minServiceDays: number;
    employmentTypeIds: string[];
  };
  notifyOnRequest: string[];
  notifyOnApproval: string[];

  lastModifiedBy: string;
  lastModifiedAt: string;
  createdAt: string;
}

export interface LeaveSchemeEnrolment {
  id: string;
  tenantId: string;
  employeeId: string;
  schemeId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  enrolledBy: string;
  enrolledAt: string;
}

export const LEAVE_NOTIFY_ROLES = [
  { id: "line_manager", label: "Manager" },
  { id: "hr_contact", label: "HR Contact" },
  { id: "hr_admin", label: "HR Administrator" },
  { id: "payroll", label: "Payroll" },
  { id: "approver", label: "Approver" },
  { id: "employee", label: "Employee" },
  { id: "relief", label: "Relief / cover colleague" },
] as const;

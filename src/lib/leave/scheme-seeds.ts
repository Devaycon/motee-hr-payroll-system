import type { LocaleBundle } from "@/src/lib/types/locale";
import type {
  LeaveEntitlementRule,
  LeaveScheme,
  LeaveSchemeEnrolment,
} from "@/src/lib/types/leave-schemes";

const SEED_DATE = "2026-01-01";

function rule(
  leaveType: LeaveEntitlementRule["leaveType"],
  amount: number,
  extra: Partial<LeaveEntitlementRule> = {},
): LeaveEntitlementRule {
  return {
    id: `${leaveType}`,
    leaveType,
    amount,
    unit: "days",
    accrual: "upfront",
    proRataJoiners: true,
    carryOverMax: 0,
    carryOverExpiryMonths: 0,
    paid: true,
    ...extra,
  };
}

function base(tenantId: string, id: string, name: string, description: string): Omit<LeaveScheme, "entitlements" | "serviceIncrements" | "maxServiceExtraDays" | "publicHolidays" | "leaveYearStartMonth"> {
  return {
    id: `${tenantId}-${id}`,
    tenantId,
    name,
    description,
    status: "active",
    kind: "system",
    fullTimeDaysPerWeek: 5,
    fullTimeWeeklyHours: 37.5,
    partTimeFormula: "days_ratio",
    booking: { minNoticeDays: 5, maxConsecutiveDays: 15, allowHalfDays: true, allowNegativeBalance: false },
    eligibility: { minServiceDays: 0, employmentTypeIds: [] },
    notifyOnRequest: ["line_manager"],
    notifyOnApproval: ["employee", "hr_contact"],
    lastModifiedBy: "System",
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
  };
}

/** Starter schemes per country, so HR edits rather than builds from nothing. */
export function defaultLeaveSchemes(tenantId: string, country: string): LeaveScheme[] {
  if (country === "ng") {
    return [
      {
        ...base(tenantId, "LVS-STANDARD", "Standard Leave Scheme", "20 working days' annual leave, rising with service, plus statutory maternity and paternity leave."),
        leaveYearStartMonth: 1,
        publicHolidays: "in_addition",
        entitlements: [
          rule("annual", 20, { carryOverMax: 5, carryOverExpiryMonths: 3 }),
          rule("maternity", 12, { unit: "weeks", proRataJoiners: false }),
          rule("paternity", 5, { proRataJoiners: false }),
          rule("compassionate", 5, { proRataJoiners: false }),
          rule("study", 10),
          rule("religious", 14, { proRataJoiners: false, paid: false }),
        ],
        serviceIncrements: [
          { id: "s5", afterYears: 5, extraDays: 2 },
          { id: "s10", afterYears: 10, extraDays: 5 },
        ],
        maxServiceExtraDays: 5,
      },
      {
        ...base(tenantId, "LVS-CONTRACT", "Contract Staff Leave Scheme", "Accruing annual leave for fixed-term contract staff."),
        leaveYearStartMonth: 1,
        publicHolidays: "in_addition",
        entitlements: [rule("annual", 15, { accrual: "monthly" }), rule("compassionate", 3, { proRataJoiners: false })],
        serviceIncrements: [],
        maxServiceExtraDays: 0,
      },
    ];
  }
  return [
    {
      ...base(tenantId, "LVS-STANDARD", "Standard UK Holiday Scheme", "5.6 weeks' statutory holiday (28 days including bank holidays), one extra day per year after two years' service up to five, and family leave."),
      leaveYearStartMonth: 1,
      publicHolidays: "included",
      entitlements: [
        rule("annual", 28, { carryOverMax: 5, carryOverExpiryMonths: 3 }),
        rule("maternity", 52, { unit: "weeks", proRataJoiners: false }),
        rule("paternity", 2, { unit: "weeks", proRataJoiners: false }),
        rule("compassionate", 5, { proRataJoiners: false }),
        rule("study", 5),
        rule("unpaid", 10, { proRataJoiners: false, paid: false }),
      ],
      serviceIncrements: [
        { id: "s2", afterYears: 2, extraDays: 1 },
        { id: "s3", afterYears: 3, extraDays: 2 },
        { id: "s4", afterYears: 4, extraDays: 3 },
        { id: "s5", afterYears: 5, extraDays: 4 },
        { id: "s6", afterYears: 6, extraDays: 5 },
      ],
      maxServiceExtraDays: 5,
    },
    {
      ...base(tenantId, "LVS-SENIOR", "Senior Leadership Holiday Scheme", "30 days plus bank holidays, with a larger carry-over."),
      leaveYearStartMonth: 4,
      publicHolidays: "in_addition",
      entitlements: [
        rule("annual", 30, { carryOverMax: 10, carryOverExpiryMonths: 6 }),
        rule("maternity", 52, { unit: "weeks", proRataJoiners: false }),
        rule("paternity", 2, { unit: "weeks", proRataJoiners: false }),
        rule("compassionate", 10, { proRataJoiners: false }),
        rule("study", 10),
      ],
      serviceIncrements: [],
      maxServiceExtraDays: 0,
    },
  ];
}

/** Everyone on the standard scheme; the senior scheme for top-level managers. */
export function defaultLeaveEnrolments(bundle: LocaleBundle, schemes: LeaveScheme[]): LeaveSchemeEnrolment[] {
  const standard = schemes[0];
  const senior = schemes.find((s) => /senior/i.test(s.name));
  const managers = new Set(bundle.employees.map((e) => e.managerId).filter(Boolean));
  return bundle.employees.map((e) => ({
    id: `LVE-${e.id}`,
    tenantId: bundle.tenant.id,
    employeeId: e.id,
    schemeId: senior && !e.managerId && managers.has(e.id) ? senior.id : standard.id,
    effectiveFrom: e.startDate,
    enrolledBy: "System",
    enrolledAt: SEED_DATE,
  }));
}

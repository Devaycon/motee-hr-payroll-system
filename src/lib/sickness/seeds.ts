import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { sicknessReasonCategory } from "@/src/lib/constants/sickness";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type {
  SchemeEnrolment,
  SicknessRecord,
  SicknessScheme,
  SicknessSettings,
} from "@/src/lib/types/sickness";
import { DEFAULT_BRADFORD_SETTINGS } from "./bradford";

export const DEFAULT_SICKNESS_SETTINGS: SicknessSettings = {
  bradford: DEFAULT_BRADFORD_SETTINGS,
  longTermDays: 28,
  ohTriggerDays: 28,
  selfCertDays: 7,
  retentionMonths: 72,
};

const SEED_DATE = "2026-01-01";

function base(tenantId: string, id: string): Pick<
  SicknessScheme,
  | "id" | "tenantId" | "status" | "kind" | "publicHoliday" | "fullTimeWeeklyHours" | "fullTimeDaysPerWeek"
  | "partTimeFormula" | "notifyOnSick" | "notifyOnReturn" | "lastModifiedBy" | "lastModifiedAt" | "createdAt"
  | "serviceBands" | "linkingDays" | "waitingDays"
> {
  return {
    id,
    tenantId,
    status: "active",
    kind: "system",
    publicHoliday: "holiday_precedence",
    fullTimeWeeklyHours: 40,
    fullTimeDaysPerWeek: 5,
    partTimeFormula: "days_ratio",
    notifyOnSick: ["hr_contact", "line_manager"],
    notifyOnReturn: ["line_manager", "hr_contact"],
    lastModifiedBy: "System",
    lastModifiedAt: SEED_DATE,
    createdAt: SEED_DATE,
    serviceBands: [],
    linkingDays: 56,
    waitingDays: 0,
  };
}

/** Starter schemes so "set up sick pay" doesn't begin from a blank page. */
export function defaultSchemes(tenantId: string, country: string): SicknessScheme[] {
  const advanced = (ohDays = 28): SicknessScheme["advanced"] => ({
    selfCertDays: 7,
    rtwInterview: "always",
    rtwAfterDays: 0,
    ohReferralAfterDays: ohDays,
    exportToPayroll: true,
  });
  if (country === "ng") {
    return [
      {
        ...base(tenantId, `${tenantId}-SCH-LABOUR-ACT`),
        name: "Statutory Sick Leave (Labour Act)",
        description:
          "Up to 12 working days' paid sick leave a year, supported by a medical certificate (Labour Act, s.16).",
        period: "leave_year",
        rollingMonths: 12,
        unit: "contracted_days",
        steps: [{ id: "s1", label: "Sick at full pay", amount: 12, payPercent: 100 }],
        eligibility: { minServiceDays: 0, employmentTypeIds: [], excludeProbation: false },
        applyStatutory: false,
        advanced: { ...advanced(), selfCertDays: 2 },
      },
      {
        ...base(tenantId, `${tenantId}-SCH-ENHANCED`),
        name: "Enhanced Company Sick Pay",
        description: "One month at full pay then one month at half pay in any rolling 12 months, after probation.",
        period: "rolling",
        rollingMonths: 12,
        unit: "contracted_days",
        steps: [
          { id: "s1", label: "Sick at full pay", amount: 22, payPercent: 100 },
          { id: "s2", label: "Sick at half pay", amount: 22, payPercent: 50 },
        ],
        eligibility: { minServiceDays: 90, employmentTypeIds: [], excludeProbation: true },
        applyStatutory: false,
        advanced: advanced(),
      },
    ];
  }
  return [
    {
      ...base(tenantId, `${tenantId}-SCH-SSP`),
      name: "Statutory Sick Pay only",
      description: "No company sick pay — eligible employees receive SSP at the rate in force on each day.",
      period: "rolling",
      rollingMonths: 12,
      unit: "contracted_days",
      steps: [],
      eligibility: { minServiceDays: 0, employmentTypeIds: [], excludeProbation: false },
      applyStatutory: true,
      advanced: advanced(),
    },
    {
      ...base(tenantId, `${tenantId}-SCH-ROLLING`),
      name: "Rolling Occupational Sick Scheme (Days)",
      description:
        "Entitles the employee to 10 days at full pay followed by 5 days at half pay in any rolling 12 month period, assuming a 5 day working week. Entitlement will scale up or down based on the average days per week worked.",
      period: "rolling",
      rollingMonths: 12,
      unit: "contracted_days",
      steps: [
        { id: "s1", label: "Sick at full pay", amount: 10, payPercent: 100 },
        { id: "s2", label: "Sick at half pay", amount: 5, payPercent: 50 },
      ],
      eligibility: { minServiceDays: 0, employmentTypeIds: [], excludeProbation: false },
      applyStatutory: true,
      advanced: advanced(),
    },
    {
      ...base(tenantId, `${tenantId}-SCH-SERVICE`),
      name: "Service-based Company Sick Pay",
      description: "Full and half pay that grows with length of service, renewed each service year.",
      period: "length_of_service",
      rollingMonths: 12,
      unit: "weeks",
      steps: [{ id: "s1", label: "Sick at full pay", amount: 1, payPercent: 100 }],
      serviceBands: [
        { id: "b0", minServiceMonths: 0, steps: [{ id: "s1", label: "Sick at full pay", amount: 1, payPercent: 100 }] },
        { id: "b1", minServiceMonths: 12, steps: [{ id: "s1", label: "Sick at full pay", amount: 4, payPercent: 100 }, { id: "s2", label: "Sick at half pay", amount: 4, payPercent: 50 }] },
        { id: "b2", minServiceMonths: 24, steps: [{ id: "s1", label: "Sick at full pay", amount: 8, payPercent: 100 }, { id: "s2", label: "Sick at half pay", amount: 8, payPercent: 50 }] },
        { id: "b3", minServiceMonths: 60, steps: [{ id: "s1", label: "Sick at full pay", amount: 26, payPercent: 100 }, { id: "s2", label: "Sick at half pay", amount: 26, payPercent: 50 }] },
      ],
      eligibility: { minServiceDays: 0, employmentTypeIds: [], excludeProbation: true },
      applyStatutory: true,
      advanced: advanced(),
    },
  ];
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/** Deterministic pseudo-random in [0,1) from a string, so seeds are stable. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Turns the bundle's historic sick leave into sickness records — the one-off
 * move out of Leave Management. Statuses, fit notes and return-to-work are
 * derived from each spell's length and dates, deterministically.
 */
export function seedSicknessRecords(bundle: LocaleBundle, today: string): SicknessRecord[] {
  const tenantId = bundle.tenant.id;
  const employees = new Map(bundle.employees.map((e) => [e.id, e]));
  const out: SicknessRecord[] = [];
  for (const raw of bundle.leaveRequests ?? []) {
    const r = raw as unknown as Record<string, string>;
    const type = r.leaveType ?? r.type ?? "";
    if (!/sick/i.test(type)) continue;
    const emp = employees.get(r.employeeId);
    if (!emp) continue;
    const h = hash(r.id);
    const status = r.status === "approved" ? "approved" : r.status === "rejected" ? "rejected" : "awaiting_approval";
    // A spell that reaches today and was approved is still going on.
    const ongoing = status === "approved" && r.endDate >= today && r.startDate <= today;
    const endDate = ongoing ? null : r.endDate;
    const calendarDays = differenceInCalendarDays(parseISO(r.endDate), parseISO(r.startDate)) + 1;
    const needsFitNote = calendarDays > 7;
    const returned = !ongoing && r.endDate < today && status === "approved";
    const returnDate = returned ? iso(addDays(parseISO(r.endDate), 1)) : undefined;
    const rtwDone = returned && h < 0.8;
    const reasonCategory = sicknessReasonCategory(r.reason);
    out.push({
      id: `SCK-${r.id}`,
      tenantId,
      employeeId: emp.id,
      employeeName: emp.fullName,
      employeeInitials: emp.initials,
      department: emp.departmentName,
      branchId: emp.branchId,
      managerId: emp.managerId,
      kind: reasonCategory === "Surgery Recovery" && h > 0.5 ? "medical_procedure" : "sickness",
      startDate: r.startDate,
      startPortion: "full",
      endDate,
      endPortion: "full",
      expectedReturnDate: ongoing ? iso(addDays(parseISO(r.endDate), 1)) : undefined,
      reasonCategory,
      reasonDetail: r.reason,
      notifiedAt: r.startDate,
      hospitalised: reasonCategory === "Surgery Recovery",
      source: h < 0.5 ? "self" : h < 0.8 ? "manager" : "hr",
      reportedBy: { name: h < 0.5 ? emp.fullName : h < 0.8 ? "Line manager" : "HR" },
      reportedAt: `${r.startDate}T09:00:00.000Z`,
      approvalStatus: status,
      absenceState: ongoing ? "ongoing" : "returned",
      fitNoteStatus: !needsFitNote ? "self_certified" : h < 0.7 ? "received" : "awaiting",
      documents:
        needsFitNote && h < 0.7
          ? [{ id: `DOC-${r.id}`, kind: "fit_note", name: "Fit note.pdf", validFrom: r.startDate, validTo: r.endDate, uploadedAt: r.startDate, uploadedBy: "HR" }]
          : [],
      rtw: {
        status: rtwDone ? "completed" : returned ? "pending" : "not_due",
        interviewRequired: true,
        returnDate,
        lastSickDay: returned ? r.endDate : undefined,
        interviewHeld: rtwDone ? true : undefined,
        interviewDate: rtwDone ? returnDate : undefined,
        interviewer: rtwDone ? "Line manager" : undefined,
        safeToReturn: rtwDone ? true : undefined,
        completedAt: rtwDone ? returnDate : undefined,
        completedBy: rtwDone ? "Line manager" : undefined,
      },
      createdAt: `${r.startDate}T09:00:00.000Z`,
      updatedAt: `${r.endDate}T17:00:00.000Z`,
    });
  }
  return out;
}

/** Everyone on the default scheme for their country from their start date. */
export function seedEnrolments(bundle: LocaleBundle, schemes: SicknessScheme[], country: string): SchemeEnrolment[] {
  const pick = (empId: string) => {
    const h = hash(empId);
    if (country === "ng") return schemes[h < 0.7 ? 0 : 1];
    return schemes[h < 0.15 ? 0 : h < 0.75 ? 1 : 2];
  };
  return bundle.employees.map((e) => ({
    id: `ENR-${e.id}`,
    tenantId: bundle.tenant.id,
    employeeId: e.id,
    schemeId: pick(e.id).id,
    effectiveFrom: e.startDate,
    enrolledBy: "System",
    enrolledAt: SEED_DATE,
  }));
}

import { describe, expect, it } from "vitest";
import type { SicknessRecord, SicknessScheme } from "@/src/lib/types/sickness";
import { DEFAULT_BRADFORD_SETTINGS, calculateBradford, workingDaysLost } from "./bradford";
import { calculateSickPay, entitlementSummary, sspRuleOn, type PayEmployee } from "./sick-pay";

let n = 0;
function rec(start: string, end: string | null, extra: Partial<SicknessRecord> = {}): SicknessRecord {
  n += 1;
  return {
    id: `R${n}`,
    tenantId: "t",
    employeeId: "E1",
    employeeName: "E",
    employeeInitials: "E",
    department: "D",
    kind: "sickness",
    startDate: start,
    startPortion: "full",
    endDate: end,
    endPortion: "full",
    reasonCategory: "Cold / Flu",
    notifiedAt: start,
    hospitalised: false,
    source: "hr",
    reportedBy: { name: "HR" },
    reportedAt: start,
    approvalStatus: "approved",
    absenceState: end ? "returned" : "ongoing",
    fitNoteStatus: "not_required",
    documents: [],
    rtw: { status: "not_due", interviewRequired: false },
    createdAt: start,
    updatedAt: start,
    ...extra,
  };
}

const AS_OF = "2026-06-30";
const score = (records: SicknessRecord[], settings = DEFAULT_BRADFORD_SETTINGS) =>
  calculateBradford({ employeeId: "E1", records, asOf: AS_OF, settings });

describe("Bradford Factor — the brief's worked examples", () => {
  it("one absence of 10 days scores 10", () => {
    // Mon 2 Mar → Fri 13 Mar = 10 working days.
    const r = score([rec("2026-03-02", "2026-03-13")]);
    expect([r.S, r.D, r.score]).toEqual([1, 10, 10]);
  });

  it("two absences of 5 days score 40", () => {
    const r = score([rec("2026-03-02", "2026-03-06"), rec("2026-04-13", "2026-04-17")]);
    expect([r.S, r.D, r.score]).toEqual([2, 10, 40]);
  });

  it("five absences of 2 days score 250", () => {
    const r = score([
      rec("2026-01-13", "2026-01-14"),
      rec("2026-02-10", "2026-02-11"),
      rec("2026-03-10", "2026-03-11"),
      rec("2026-04-14", "2026-04-15"),
      rec("2026-05-12", "2026-05-13"),
    ]);
    expect([r.S, r.D, r.score]).toEqual([5, 10, 250]);
  });

  it("four episodes over ten days score 160", () => {
    const r = score([
      rec("2026-01-12", "2026-01-14"),
      rec("2026-02-09", "2026-02-11"),
      rec("2026-03-10", "2026-03-11"),
      rec("2026-04-14", "2026-04-15"),
    ]);
    expect(r.score).toBe(160);
  });
});

describe("Bradford Factor — edge cases", () => {
  it("treats Friday and the following Monday as one episode", () => {
    const r = score([rec("2026-03-06", "2026-03-06"), rec("2026-03-09", "2026-03-09")]);
    expect([r.S, r.D]).toEqual([1, 2]);
  });

  it("can be told not to merge across weekends", () => {
    const r = score([rec("2026-03-06", "2026-03-06"), rec("2026-03-09", "2026-03-09")], {
      ...DEFAULT_BRADFORD_SETTINGS,
      mergeAcrossNonWorkingDays: false,
    });
    expect(r.S).toBe(2);
  });

  it("never double-counts overlapping or duplicate records", () => {
    const r = score([rec("2026-03-02", "2026-03-04"), rec("2026-03-03", "2026-03-05")]);
    expect([r.S, r.D]).toEqual([1, 4]);
  });

  it("counts half days as half", () => {
    const r = score([rec("2026-03-02", "2026-03-03", { startPortion: "pm" })]);
    expect(r.D).toBe(1.5);
  });

  it("leaves out absences HR has excluded, with the reason", () => {
    const excluded = rec("2026-03-02", "2026-03-06", {
      exclusion: { category: "pregnancy", reason: "Pregnancy-related illness", approvedBy: "HR", approvedAt: "2026-03-10" },
    });
    const r = score([excluded, rec("2026-04-13", "2026-04-14")]);
    expect([r.S, r.D]).toEqual([1, 2]);
    expect(r.excluded[0].reason).toMatch(/Pregnancy/);
  });

  it("ignores rejected records and planned procedures", () => {
    const r = score([
      rec("2026-03-02", "2026-03-06", { approvalStatus: "rejected" }),
      rec("2026-04-13", "2026-04-14", { kind: "medical_procedure" }),
    ]);
    expect(r.score).toBe(0);
    expect(r.excluded).toHaveLength(2);
  });

  it("counts an episode crossing the window start once, with only its in-window days", () => {
    // 52 weeks = 364 days, so the window is 2 Jul 2025 → 30 Jun 2026.
    // Absence Mon 23 Jun → Fri 4 Jul 2025.
    const r = score([rec("2025-06-23", "2025-07-04")]);
    expect(r.windowStart).toBe("2025-07-02");
    expect(r.S).toBe(1);
    expect(r.D).toBe(3); // 2–4 Jul
    expect(r.episodes[0].clipped).toBe(true);
  });

  it("assigns an overnight shift to the day it started", () => {
    const r = score([rec("2026-03-03", "2026-03-04", { overnightShift: true })]);
    expect(r.D).toBe(1);
  });

  it("follows the employee's own work pattern", () => {
    const partTime = { mon: { start: "09:00", end: "17:00" }, tue: null, wed: { start: "09:00", end: "17:00" }, thu: null, fri: null, sat: null, sun: null };
    const r = calculateBradford({ employeeId: "E1", records: [rec("2026-03-02", "2026-03-06")], asOf: AS_OF, settings: DEFAULT_BRADFORD_SETTINGS, schedule: partTime });
    expect(r.D).toBe(2);
  });

  it("skips public holidays", () => {
    const r = calculateBradford({ employeeId: "E1", records: [rec("2026-04-02", "2026-04-07")], asOf: AS_OF, settings: DEFAULT_BRADFORD_SETTINGS, holidays: ["2026-04-03", "2026-04-06"] });
    expect(r.D).toBe(2);
  });

  it("bands the score against the configured thresholds", () => {
    expect(score([rec("2026-03-02", "2026-03-13")]).action).toBe("monitor");
    expect(
      score([rec("2026-01-13", "2026-01-14"), rec("2026-02-10", "2026-02-11"), rec("2026-03-10", "2026-03-11"), rec("2026-04-14", "2026-04-15"), rec("2026-05-12", "2026-05-13")]).action,
    ).toBe("formal_review");
  });

  it("counts an ongoing absence up to today", () => {
    expect(workingDaysLost(rec("2026-06-29", null), AS_OF)).toBe(2);
  });
});

const scheme: SicknessScheme = {
  id: "S1",
  tenantId: "t",
  name: "Rolling OSP",
  description: "",
  status: "active",
  kind: "custom",
  period: "rolling",
  rollingMonths: 12,
  unit: "contracted_days",
  steps: [
    { id: "a", label: "Full pay", amount: 10, payPercent: 100 },
    { id: "b", label: "Half pay", amount: 5, payPercent: 50 },
  ],
  serviceBands: [],
  publicHoliday: "holiday_precedence",
  fullTimeWeeklyHours: 40,
  fullTimeDaysPerWeek: 5,
  partTimeFormula: "days_ratio",
  eligibility: { minServiceDays: 0, employmentTypeIds: [], excludeProbation: false },
  waitingDays: 0,
  linkingDays: 56,
  applyStatutory: true,
  notifyOnSick: [],
  notifyOnReturn: [],
  advanced: { selfCertDays: 7, rtwInterview: "always", rtwAfterDays: 0, ohReferralAfterDays: 28, exportToPayroll: true },
  lastModifiedBy: "",
  lastModifiedAt: "",
  createdAt: "",
};

const emp: PayEmployee = { id: "E1", startDate: "2020-01-01", employmentTypeId: "ET-FT", weeklyEarnings: 600, daysPerWeek: 5, weeklyHours: 37.5 };

describe("Occupational sick pay", () => {
  it("uses full pay, then half pay, then nothing", () => {
    // 20 working days: Mon 2 Mar → Fri 27 Mar 2026.
    const days = calculateSickPay({ employee: emp, scheme, records: [rec("2026-03-02", "2026-03-27")], asOf: AS_OF });
    expect(days.filter((d) => d.payPercent === 100)).toHaveLength(10);
    expect(days.filter((d) => d.payPercent === 50)).toHaveLength(5);
    expect(days.filter((d) => d.stepLabel === "Unpaid")).toHaveLength(5);
  });

  it("pro-rates part-time entitlement", () => {
    const pt = { ...emp, daysPerWeek: 2.5, weeklyHours: 18.75 };
    const s = entitlementSummary({ employee: pt, scheme, records: [], asOf: AS_OF });
    expect(s.steps.map((x) => x.entitled)).toEqual([5, 2.5]);
  });

  it("reports what is left", () => {
    const s = entitlementSummary({ employee: emp, scheme, records: [rec("2026-03-02", "2026-03-06")], asOf: AS_OF });
    expect(s.steps[0]).toMatchObject({ used: 5, remaining: 5 });
  });
});

describe("Statutory sick pay rule versions", () => {
  it("applies three waiting days before 6 April 2026 and none after", () => {
    expect(sspRuleOn("2026-04-05").waitingDays).toBe(3);
    expect(sspRuleOn("2026-04-06").waitingDays).toBe(0);
    expect(sspRuleOn("2026-04-06").lowerEarningsLimit).toBeNull();
  });

  it("pays SSP from the first day of a period of incapacity after the 2026 reforms", () => {
    const noScheme = calculateSickPay({ employee: emp, scheme: null, records: [rec("2026-05-04", "2026-05-08")], asOf: AS_OF });
    expect(noScheme[0].sspAmount).toBeGreaterThan(0);
    const before = calculateSickPay({ employee: emp, scheme: null, records: [rec("2026-03-02", "2026-03-06")], asOf: AS_OF });
    expect(before.slice(0, 3).every((d) => d.sspAmount === 0)).toBe(true);
    expect(before[3].sspAmount).toBeGreaterThan(0);
  });

  it("caps post-2026 SSP at 80% of earnings for low earners", () => {
    const low = { ...emp, weeklyEarnings: 100 };
    const days = calculateSickPay({ employee: low, scheme: null, records: [rec("2026-05-04", "2026-05-08")], asOf: AS_OF });
    expect(days[0].sspAmount).toBeCloseTo(16, 2); // 80% × £100 / 5 days
  });
});

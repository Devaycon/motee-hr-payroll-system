import { describe, expect, it } from "vitest";
import uk from "@/src/data/locale/uk.json";
import ng from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { SicknessRecord } from "@/src/lib/types/sickness";
import { mapLeaveType } from "@/src/components/hr/leave/hooks";
import { seedSicknessRecords } from "./seeds";
import { sicknessStats, workingDaysBetween } from "./stats";

function rec(id: string, start: string, end: string | null, extra: Partial<SicknessRecord> = {}): SicknessRecord {
  return {
    id, tenantId: "t", employeeId: "E1", employeeName: "E", employeeInitials: "E", department: "D",
    kind: "sickness", startDate: start, startPortion: "full", endDate: end, endPortion: "full",
    reasonCategory: "Cold / Flu", notifiedAt: start, hospitalised: false, source: "hr", reportedBy: { name: "HR" },
    reportedAt: start, approvalStatus: "approved", absenceState: end ? "returned" : "ongoing",
    fitNoteStatus: "not_required", documents: [], rtw: { status: "not_due", interviewRequired: true },
    createdAt: start, updatedAt: start, ...extra,
  };
}

const people = new Map([["E1", { dailyCost: 100 }]]);

describe("sicknessStats", () => {
  it("clips an absence to the reporting period", () => {
    // Mon 29 Sep → Fri 10 Oct 2025 = 10 working days; from 6 Oct only 5 count.
    const s = sicknessStats({ records: [rec("a", "2025-09-29", "2025-10-10")], people, headcount: 1, holidays: [], asOf: "2025-10-31", from: "2025-10-06", longTermDays: 28 });
    expect(s.daysLost).toBe(5);
    expect(s.cost).toBe(500);
  });

  it("leaves rejected and cancelled absences out of every figure", () => {
    const s = sicknessStats({
      records: [rec("a", "2025-10-06", "2025-10-07"), rec("b", "2025-10-13", "2025-10-14", { approvalStatus: "rejected" }), rec("c", "2025-10-20", null, { approvalStatus: "cancelled" })],
      people, headcount: 1, holidays: [], asOf: "2025-10-31", from: "2025-10-01", longTermDays: 28,
    });
    expect([s.episodes, s.daysLost, s.ongoing]).toEqual([1, 2, 0]);
  });

  it("computes absence rate over working days in the period", () => {
    // October 2025 has 23 weekdays; 2 days off for 1 person = 8.7%.
    const s = sicknessStats({ records: [rec("a", "2025-10-06", "2025-10-07")], people, headcount: 1, holidays: [], asOf: "2025-10-31", from: "2025-10-01", longTermDays: 28 });
    expect(s.workingDaysInPeriod).toBe(23);
    expect(s.absenceRate).toBe(8.7);
  });

  it("counts half days and skips public holidays", () => {
    const r = rec("a", "2025-12-24", "2025-12-26", { startPortion: "pm" });
    expect(workingDaysBetween(r, "2025-12-31", undefined, "2025-12-31", undefined, new Set(["2025-12-25", "2025-12-26"]))).toBe(0.5);
  });

  it("splits long- and short-term absence by spell length", () => {
    const s = sicknessStats({ records: [rec("a", "2025-09-01", "2025-10-10"), rec("b", "2025-10-20", "2025-10-21")], people, headcount: 2, holidays: [], asOf: "2025-10-31", longTermDays: 28 });
    expect(s.longTerm.count).toBe(1);
    expect(s.shortTerm.count).toBe(1);
    expect(s.longTerm.days + s.shortTerm.days).toBe(s.daysLost);
  });

  it.each([["uk", uk], ["nigeria", ng]])("%s: totals equal the sum of the rows", (_n, bundle) => {
    const b = bundle as unknown as LocaleBundle;
    const records = seedSicknessRecords(b, "2026-10-17");
    const s = sicknessStats({ records, people: new Map(), headcount: b.employees.length, holidays: [], asOf: "2026-10-17", from: "2025-10-17", longTermDays: 28 });
    expect(s.daysLost).toBe(s.rows.reduce((a, x) => a + x.days, 0));
    expect(s.daysLost).toBeGreaterThan(0);
    expect(s.absenceRate).toBeGreaterThan(0);
    expect(s.absenceRate).toBeLessThan(100);
  });
});

describe("leave types are read from their names", () => {
  it.each([
    ["Annual Leave", "annual"],
    ["Sick Leave", "sick"],
    ["Maternity Leave", "maternity"],
    ["Paternity Leave", "paternity"],
    ["Compassionate Leave", "compassionate"],
    ["Study Leave", "study"],
    ["Hajj/Pilgrimage Leave", "religious"],
    ["annual", "annual"],
  ])("%s → %s", (name, key) => {
    expect(mapLeaveType(name)).toBe(key);
  });

  it("no longer labels the whole bundle annual", () => {
    const types = new Set((uk as unknown as LocaleBundle).leaveRequests.map((r) => mapLeaveType((r as unknown as { leaveType: string }).leaveType)));
    expect(types.size).toBeGreaterThan(4);
  });
});

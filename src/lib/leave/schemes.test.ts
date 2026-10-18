import { describe, expect, it } from "vitest";
import uk from "@/src/data/locale/uk.json";
import ng from "@/src/data/locale/nigeria.json";
import type { LocaleBundle } from "@/src/lib/types/locale";
import { calculateEntitlements, leaveYear, type SchemeEmployee } from "./schemes";
import { defaultLeaveEnrolments, defaultLeaveSchemes } from "./scheme-seeds";

const [standard] = defaultLeaveSchemes("t", "uk");
const fullTimer: SchemeEmployee = { startDate: "2018-03-01", employmentTypeId: "ET-FT", daysPerWeek: 5, weeklyHours: 37.5 };
const annual = (r: ReturnType<typeof calculateEntitlements>) => r.lines.find((l) => l.leaveType === "annual")!;

describe("leave year", () => {
  it("starts on the scheme's month", () => {
    expect(leaveYear("2026-10-17", 1)).toEqual({ start: "2026-01-01", end: "2026-12-31" });
    expect(leaveYear("2026-02-10", 4)).toEqual({ start: "2025-04-01", end: "2026-03-31" });
  });
});

describe("leave entitlements", () => {
  it("adds length-of-service days up to the cap", () => {
    const r = calculateEntitlements({ scheme: standard, employee: fullTimer, leave: [], asOf: "2026-10-17" });
    expect(annual(r)).toMatchObject({ base: 28, serviceExtra: 5, entitlement: 33 });
  });

  it("pro-rates part-time staff by days worked", () => {
    const r = calculateEntitlements({ scheme: standard, employee: { ...fullTimer, startDate: "2025-01-01", daysPerWeek: 3 }, leave: [], asOf: "2026-10-17" });
    expect(annual(r).base).toBe(17); // 28 × 3/5 = 16.8 → 17 (half-day rounding)
  });

  it("pro-rates joiners part-way through the year", () => {
    const r = calculateEntitlements({ scheme: standard, employee: { ...fullTimer, startDate: "2026-07-01" }, leave: [], asOf: "2026-10-17" });
    expect(annual(r).entitlement).toBe(14); // 6 of 12 months
  });

  it("subtracts taken and booked leave in this leave year only", () => {
    const r = calculateEntitlements({
      scheme: standard,
      employee: { ...fullTimer, startDate: "2025-06-01" },
      leave: [
        { leaveType: "annual", startDate: "2026-03-02", totalDays: 5, status: "approved" },
        { leaveType: "annual", startDate: "2026-11-02", totalDays: 2, status: "pending" },
        { leaveType: "annual", startDate: "2025-12-01", totalDays: 4, status: "approved" },
      ],
      asOf: "2026-10-17",
    });
    expect(annual(r)).toMatchObject({ entitlement: 28, taken: 5, booked: 2, remaining: 21 });
  });

  it("carries over unused days, capped, until they expire", () => {
    const early = calculateEntitlements({ scheme: standard, employee: { ...fullTimer, startDate: "2025-06-01" }, leave: [], asOf: "2026-02-10", lastYearRemaining: { annual: 9 } });
    expect(annual(early).carriedOver).toBe(5);
    const late = calculateEntitlements({ scheme: standard, employee: { ...fullTimer, startDate: "2025-06-01" }, leave: [], asOf: "2026-05-10", lastYearRemaining: { annual: 9 } });
    expect(annual(late).carriedOver).toBe(0); // expired after 3 months
  });

  it("accrues monthly where the scheme says so", () => {
    const [, contract] = defaultLeaveSchemes("t", "ng");
    const r = calculateEntitlements({ scheme: contract, employee: { ...fullTimer, startDate: "2020-01-01" }, leave: [], asOf: "2026-03-15" });
    expect(annual(r)).toMatchObject({ entitlement: 15, available: 4 }); // 3 of 12 months
  });

  it("gives nothing before the eligibility service is met", () => {
    const scheme = { ...standard, eligibility: { ...standard.eligibility, minServiceDays: 90 } };
    const r = calculateEntitlements({ scheme, employee: { ...fullTimer, startDate: "2026-10-01" }, leave: [], asOf: "2026-10-17" });
    expect(r.eligible).toBe(false);
    expect(annual(r).entitlement).toBe(0);
  });

  it("never includes sickness", () => {
    for (const c of ["uk", "ng"]) {
      for (const s of defaultLeaveSchemes("t", c)) expect(s.entitlements.some((e) => (e.leaveType as string) === "sick")).toBe(false);
    }
  });

  it.each([["uk", uk], ["nigeria", ng]])("%s: enrols every employee on a scheme", (_n, b) => {
    const bundle = b as unknown as LocaleBundle;
    const schemes = defaultLeaveSchemes(bundle.tenant.id, _n === "uk" ? "uk" : "ng");
    const enrolments = defaultLeaveEnrolments(bundle, schemes);
    expect(enrolments).toHaveLength(bundle.employees.length);
    expect(enrolments.every((e) => schemes.some((s) => s.id === e.schemeId))).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { addWorkingDays, isWorkingDay, ngPublicHolidays, nonWorkingReason, previousWorkingDay } from "./calendar";
import { makePeriod } from "./engine";

describe("NG payroll calendar", () => {
  it("moves a pay day on a weekend or public holiday back to the working day before", () => {
    // 25 Oct 2026 is a Sunday; 25 Dec 2026 is Christmas Day (a Friday).
    expect(makePeriod(2026, 10).payDate).toBe("2026-10-23");
    expect(makePeriod(2026, 10).scheduledPayDate).toBe("2026-10-25");
    expect(makePeriod(2026, 10).payDateNote).toBe("Sunday");
    expect(makePeriod(2026, 12).payDate).toBe("2026-12-24");
    expect(makePeriod(2026, 12).payDateNote).toBe("Christmas Day");
  });

  it("leaves a working pay day alone", () => {
    const nov = makePeriod(2026, 11);
    expect(nov.payDate).toBe("2026-11-25");
    expect(nov.scheduledPayDate).toBeUndefined();
  });

  it("pays a short month on its last working day", () => {
    // Pay day 31 in Feb 2026 → 28 Feb is a Saturday → Fri 27 Feb.
    expect(makePeriod(2026, 2, 31).payDate).toBe("2026-02-27");
  });

  it("derives fixed and Easter holidays for other years, with weekend substitutes", () => {
    const h2027 = ngPublicHolidays(2027).map((h) => h.date);
    expect(h2027).toContain("2027-03-26"); // Good Friday
    expect(h2027).toContain("2027-03-29"); // Easter Monday
    // 25–26 Dec 2027 fall on Sat–Sun → Mon 27 and Tue 28.
    expect(h2027).toContain("2027-12-27");
    expect(h2027).toContain("2027-12-28");
    expect(nonWorkingReason("2027-12-27")).toBe("Christmas Day (substitute)");
  });

  it("counts working days past weekends and holidays", () => {
    expect(isWorkingDay("2026-10-01")).toBe(false); // Independence Day
    expect(previousWorkingDay("2026-12-28")).toBe("2026-12-24"); // Boxing Day sub, weekend, Christmas
    // Pension due 7 working days after Thu 24 Dec 2026: 29, 30, 31 Dec, (1 Jan holiday, weekend) 4, 5, 6, 7 Jan.
    expect(addWorkingDays("2026-12-24", 7)).toBe("2027-01-07");
  });
});

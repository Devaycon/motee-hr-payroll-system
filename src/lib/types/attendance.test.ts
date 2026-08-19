import { describe, expect, it } from "vitest";
import {
  breakCompliance,
  breakSeconds,
  contractedWeeklyHours,
  isoDateOf,
  overtimeHours,
  punchStatus,
  punctualityRate,
  scheduleForDay,
  scheduledHours,
  weekStartOf,
  weeklyTotals,
  workDayLabel,
  workedSeconds,
  type ClockSession,
  type DailyEntry,
} from "./attendance";
import type { LocaleWorkPattern } from "./locale";

/** A standard 5-day pattern, 09:00–17:30 with an hour unpaid — matches the UK fixture. */
function pattern(over: Partial<LocaleWorkPattern> = {}): LocaleWorkPattern {
  const day = { start: "09:00", end: "17:30" };
  return {
    weeklyHours: 37.5,
    daysPerWeek: 5,
    schedule: {
      mon: day,
      tue: day,
      wed: day,
      thu: day,
      fri: day,
      sat: null,
      sun: null,
    },
    breakMinutes: 60,
    holidayEntitlementDays: 25,
    publicHolidayDays: 8,
    contractType: "full_time",
    ...over,
  } as LocaleWorkPattern;
}

/** A session clocked in at a given local time on 2026-08-17 (a Monday). */
function session(over: Partial<ClockSession> = {}): ClockSession {
  return {
    employeeId: "GB-EMP-0001",
    date: "2026-08-17",
    state: "clocked_in",
    clockInAt: new Date(2026, 7, 17, 9, 0, 0).toISOString(),
    breaks: [],
    location: "office",
    source: "web",
    ...over,
  };
}

function entry(over: Partial<DailyEntry> = {}): DailyEntry {
  return {
    date: "2026-08-17",
    day: "Mon",
    breakMinutes: 60,
    totalHours: 7.5,
    status: "present",
    ...over,
  };
}

describe("scheduleForDay", () => {
  it("returns the contracted hours for a working day", () => {
    expect(scheduleForDay(pattern(), "2026-08-17")).toEqual({
      start: "09:00",
      end: "17:30",
      breakMinutes: 60,
    });
  });

  it("returns null for a non-working day rather than a zero-length shift", () => {
    // 2026-08-16 is a Sunday.
    expect(scheduleForDay(pattern(), "2026-08-16")).toBeNull();
  });

  it("respects a compressed week where a weekday is not worked", () => {
    const compressed = pattern({
      daysPerWeek: 4,
      schedule: {
        mon: { start: "08:00", end: "18:00" },
        tue: { start: "08:00", end: "18:00" },
        wed: { start: "08:00", end: "18:00" },
        thu: { start: "08:00", end: "18:00" },
        fri: null,
        sat: null,
        sun: null,
      },
    });
    expect(scheduleForDay(compressed, "2026-08-21")).toBeNull(); // Friday
    expect(scheduleForDay(compressed, "2026-08-20")).not.toBeNull(); // Thursday
  });

  it("treats a missing pattern as no schedule rather than crashing", () => {
    expect(scheduleForDay(undefined, "2026-08-17")).toBeNull();
  });

  it("reads the weekday from the local calendar, not UTC", () => {
    // Parsed as UTC this would be Sunday the 16th in western timezones.
    expect(workDayLabel("2026-08-17")).toBe("Mon");
  });
});

describe("scheduledHours", () => {
  it("subtracts the unpaid break from the span", () => {
    expect(scheduledHours({ start: "09:00", end: "17:30", breakMinutes: 60 })).toBe(7.5);
  });

  it("is zero for a non-working day", () => {
    expect(scheduledHours(null)).toBe(0);
  });
});

describe("punchStatus", () => {
  it("counts an arrival inside the grace period as present", () => {
    const at = new Date(2026, 7, 17, 9, 8, 0);
    expect(punchStatus(at, "09:00")).toBe("present");
  });

  it("counts an arrival past the grace period as late", () => {
    const at = new Date(2026, 7, 17, 9, 18, 0);
    expect(punchStatus(at, "09:00")).toBe("late");
  });

  it("measures grace against the employee's own start time", () => {
    const at = new Date(2026, 7, 17, 8, 20, 0);
    expect(punchStatus(at, "09:00")).toBe("present");
    expect(punchStatus(at, "08:00")).toBe("late");
  });
});

describe("workedSeconds and breakSeconds", () => {
  const now = new Date(2026, 7, 17, 17, 0, 0);

  it("is zero before clocking in", () => {
    expect(workedSeconds(session({ state: "idle", clockInAt: undefined }), now)).toBe(0);
  });

  it("counts elapsed time since clock-in", () => {
    expect(workedSeconds(session(), now)).toBe(8 * 3600);
  });

  it("excludes completed breaks from worked time", () => {
    const s = session({
      breaks: [
        {
          start: new Date(2026, 7, 17, 12, 0, 0).toISOString(),
          end: new Date(2026, 7, 17, 13, 0, 0).toISOString(),
        },
      ],
    });
    expect(breakSeconds(s, now)).toBe(3600);
    expect(workedSeconds(s, now)).toBe(7 * 3600);
  });

  it("counts an open break up to now while it is running", () => {
    const s = session({
      state: "on_break",
      breaks: [{ start: new Date(2026, 7, 17, 16, 30, 0).toISOString() }],
    });
    expect(breakSeconds(s, now)).toBe(1800);
  });

  it("stops accruing once the day is closed, even if a break was left open", () => {
    const s = session({
      state: "clocked_out",
      clockOutAt: new Date(2026, 7, 17, 17, 0, 0).toISOString(),
      breaks: [{ start: new Date(2026, 7, 17, 16, 30, 0).toISOString() }],
    });
    const muchLater = new Date(2026, 7, 18, 9, 0, 0);
    expect(breakSeconds(s, muchLater)).toBe(1800);
    expect(workedSeconds(s, muchLater)).toBe(7.5 * 3600);
  });

  it("never reports negative time if the clocks disagree", () => {
    const s = session({ clockInAt: new Date(2026, 7, 17, 18, 0, 0).toISOString() });
    expect(workedSeconds(s, now)).toBe(0);
  });
});

describe("overtimeHours", () => {
  it("reports hours beyond the contracted figure", () => {
    expect(overtimeHours(9, 7.5)).toBe(1.5);
  });

  it("treats undertime as no overtime rather than negative overtime", () => {
    expect(overtimeHours(6, 7.5)).toBe(0);
  });
});

describe("breakCompliance", () => {
  it("flags a short break with the shortfall", () => {
    expect(breakCompliance(20, 60)).toMatchObject({
      compliant: false,
      shortfallMinutes: 40,
    });
  });

  it("is satisfied by an over-long break", () => {
    expect(breakCompliance(75, 60).compliant).toBe(true);
  });

  it("is always satisfied when no break is required", () => {
    expect(breakCompliance(0, 0).compliant).toBe(true);
  });
});

describe("contractedWeeklyHours", () => {
  it("prefers the contracted figure when the pattern states one", () => {
    expect(contractedWeeklyHours(pattern())).toBe(37.5);
  });

  it("derives from the schedule when no weekly figure is stated", () => {
    const p = pattern({ weeklyHours: 0 });
    // 5 days x (8.5h span - 1h break) = 37.5
    expect(contractedWeeklyHours(p)).toBe(37.5);
  });

  it("is zero for a missing pattern", () => {
    expect(contractedWeeklyHours(undefined)).toBe(0);
  });
});

describe("weeklyTotals", () => {
  it("rolls a week into timesheet header figures", () => {
    const week = [
      entry({ date: "2026-08-17", totalHours: 7.5 }),
      entry({ date: "2026-08-18", totalHours: 8, status: "late" }),
      entry({ date: "2026-08-19", totalHours: 7.5 }),
      entry({ date: "2026-08-20", totalHours: 0, status: "absent" }),
      entry({ date: "2026-08-21", totalHours: 7.5 }),
    ];
    expect(weeklyTotals(week, 30)).toEqual({
      totalHours: 30.5,
      overtimeHours: 0.5,
      daysPresent: 4,
      daysLate: 1,
      daysAbsent: 1,
    });
  });

  it("counts a late day as present as well as late", () => {
    const totals = weeklyTotals([entry({ status: "late" })], 7.5);
    expect(totals.daysPresent).toBe(1);
    expect(totals.daysLate).toBe(1);
  });
});

describe("punctualityRate", () => {
  it("is the share of attended days arrived on time", () => {
    expect(
      punctualityRate([entry(), entry({ status: "late" }), entry(), entry()]),
    ).toBe(75);
  });

  it("ignores days that were never attended", () => {
    expect(punctualityRate([entry(), entry({ status: "absent" })])).toBe(100);
  });

  it("is 100 when there is nothing to judge", () => {
    expect(punctualityRate([])).toBe(100);
  });
});

describe("weekStartOf", () => {
  it("anchors on Monday", () => {
    expect(weekStartOf("2026-08-19")).toBe("2026-08-17");
  });

  it("treats Sunday as the end of the week it closes, not the start of a new one", () => {
    expect(weekStartOf("2026-08-23")).toBe("2026-08-17");
  });

  it("is stable on a Monday", () => {
    expect(weekStartOf("2026-08-17")).toBe("2026-08-17");
  });
});

describe("isoDateOf", () => {
  it("formats a local date without shifting across the timezone boundary", () => {
    expect(isoDateOf(new Date(2026, 7, 17, 23, 30, 0))).toBe("2026-08-17");
    expect(isoDateOf(new Date(2026, 7, 17, 0, 30, 0))).toBe("2026-08-17");
  });
});

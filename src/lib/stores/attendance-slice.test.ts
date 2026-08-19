import { describe, expect, it } from "vitest";
import reducer, {
  approveTimesheet,
  clockIn,
  clockOut,
  endBreak,
  hydrate,
  rejectTimesheet,
  requestCorrection,
  startBreak,
  submitTimesheet,
} from "./attendance-slice";
import collectionReducer, {
  addRecord,
  updateRecord,
} from "./collection-edits-slice";
import { applyCollection } from "@/src/lib/profile/collection-edits";
import { workedSeconds } from "@/src/lib/types/attendance";
import type { ClockSession, TimesheetRecord } from "@/src/lib/types/attendance";

const EMP = "GB-EMP-0001";
const DATE = "2026-08-17";
const at = (h: number, m = 0) => new Date(2026, 7, 17, h, m, 0).toISOString();

function freshState() {
  return reducer(undefined, { type: "@@INIT" });
}

/** Walk the punch actions in order and return the resulting session. */
function run(actions: { type: string; payload?: unknown }[]): ClockSession {
  let state = freshState();
  for (const a of actions) state = reducer(state, a as never);
  return state.sessions[EMP];
}

const CLOCK_IN = clockIn({
  employeeId: EMP,
  date: DATE,
  at: at(9),
  location: "office",
  locationName: "Desk 14",
  bookingId: "LB-1",
  logId: "ATT-1",
});

describe("punch state machine", () => {
  it("opens a session on clock-in, carrying the booking it was made against", () => {
    const s = run([CLOCK_IN]);
    expect(s.state).toBe("clocked_in");
    expect(s.clockInAt).toBe(at(9));
    expect(s.bookingId).toBe("LB-1");
    expect(s.logId).toBe("ATT-1");
  });

  it("records a break as an interval, not a running total", () => {
    const s = run([
      CLOCK_IN,
      startBreak({ employeeId: EMP, at: at(12) }),
      endBreak({ employeeId: EMP, at: at(13) }),
    ]);
    expect(s.state).toBe("clocked_in");
    expect(s.breaks).toEqual([{ start: at(12), end: at(13) }]);
  });

  it("ignores a break that starts while already on break", () => {
    const s = run([
      CLOCK_IN,
      startBreak({ employeeId: EMP, at: at(12) }),
      startBreak({ employeeId: EMP, at: at(12, 30) }),
    ]);
    expect(s.breaks).toHaveLength(1);
  });

  it("ignores an end-break when no break is running", () => {
    const s = run([CLOCK_IN, endBreak({ employeeId: EMP, at: at(12) })]);
    expect(s.state).toBe("clocked_in");
    expect(s.breaks).toHaveLength(0);
  });

  it("closes an open break on clock-out so it cannot accrue forever", () => {
    const s = run([
      CLOCK_IN,
      startBreak({ employeeId: EMP, at: at(16, 30) }),
      clockOut({ employeeId: EMP, at: at(17) }),
    ]);
    expect(s.state).toBe("clocked_out");
    expect(s.breaks[0].end).toBe(at(17));
    // 8h elapsed less the 30m break that was still open.
    expect(workedSeconds(s, new Date(2026, 7, 18))).toBe(7.5 * 3600);
  });

  it("refuses to clock out a day that never started", () => {
    let state = freshState();
    state = reducer(state, clockOut({ employeeId: EMP, at: at(17) }));
    expect(state.sessions[EMP]).toBeUndefined();
  });

  it("survives a hydrate from cache with the session intact", () => {
    const live = run([CLOCK_IN, startBreak({ employeeId: EMP, at: at(12) })]);
    const roundTripped = JSON.parse(JSON.stringify({ [EMP]: live }));
    const rehydrated = reducer(freshState(), hydrate({ sessions: roundTripped }));
    expect(rehydrated.sessions[EMP]).toEqual(live);
  });
});

describe("timesheet approval loop", () => {
  const sheet: TimesheetRecord = {
    id: "ts-me-1",
    employeeName: "Arjun Taylor",
    employeeInitials: "AT",
    department: "Engineering",
    weekStart: "2026-08-17",
    weekEnd: "2026-08-23",
    totalHours: 37.5,
    overtimeHours: 0,
    daysPresent: 5,
    daysAbsent: 0,
    daysLate: 0,
    status: "pending",
    dailyEntries: [],
  };

  it("puts a submission into the queue the HR screen reads", () => {
    const state = reducer(
      freshState(),
      submitTimesheet({ timesheet: sheet, submittedAt: at(18) }),
    );
    const found = state.timesheets.find((t) => t.id === sheet.id);
    expect(found?.status).toBe("submitted");
    expect(found?.submittedAt).toBe(at(18));
  });

  it("clears a previous rejection when the week is resubmitted", () => {
    let state = reducer(
      freshState(),
      submitTimesheet({ timesheet: sheet, submittedAt: at(18) }),
    );
    state = reducer(
      state,
      rejectTimesheet({ id: sheet.id, reason: "Thursday is missing" }),
    );
    expect(
      state.timesheets.find((t) => t.id === sheet.id)?.rejectionReason,
    ).toBe("Thursday is missing");

    state = reducer(
      state,
      submitTimesheet({ timesheet: sheet, submittedAt: at(19) }),
    );
    const resubmitted = state.timesheets.find((t) => t.id === sheet.id);
    expect(resubmitted?.status).toBe("submitted");
    expect(resubmitted?.rejectionReason).toBeUndefined();
  });

  it("records who approved it", () => {
    let state = reducer(
      freshState(),
      submitTimesheet({ timesheet: sheet, submittedAt: at(18) }),
    );
    state = reducer(
      state,
      approveTimesheet({ id: sheet.id, approvedBy: "HR Manager", at: at(19) }),
    );
    const approved = state.timesheets.find((t) => t.id === sheet.id);
    expect(approved?.status).toBe("approved");
    expect(approved?.approvedBy).toBe("HR Manager");
  });

  it("does not resubmit the same week twice as two rows", () => {
    let state = reducer(
      freshState(),
      submitTimesheet({ timesheet: sheet, submittedAt: at(18) }),
    );
    state = reducer(
      state,
      submitTimesheet({ timesheet: sheet, submittedAt: at(19) }),
    );
    expect(state.timesheets.filter((t) => t.id === sheet.id)).toHaveLength(1);
  });
});

describe("corrections", () => {
  it("lands as pending rather than editing the record", () => {
    const state = reducer(
      freshState(),
      requestCorrection({
        employeeId: EMP,
        logId: "ATT-1",
        date: DATE,
        requestedClockOut: "17:30",
        reason: "Forgot to clock out",
      }),
    );
    expect(state.corrections[0]).toMatchObject({
      status: "pending",
      logId: "ATT-1",
      requestedClockOut: "17:30",
    });
  });
});

/**
 * The contract that makes the clock show up on the employee profile: a punch
 * writes into the shared `attendance` collection, and the profile's Time Logs
 * tab reads that same collection back through `applyCollection`.
 */
describe("time-log integration", () => {
  const BUNDLE = [
    {
      id: "GB-ATT-0001",
      employeeId: EMP,
      date: "2025-11-14",
      clockIn: "09:14",
      clockOut: "17:55",
      hoursWorked: 8.68,
      status: "present",
    },
  ];

  it("shows an in-progress day as soon as the employee clocks in", () => {
    const edits = collectionReducer(
      undefined,
      addRecord({
        key: "attendance",
        record: {
          id: "ATT-1",
          employeeId: EMP,
          date: DATE,
          clockIn: "09:00",
          clockOut: null,
          status: "present",
          location: "Desk 14",
          source: "web",
        },
      }),
    );
    const merged = applyCollection(BUNDLE, "attendance", edits);
    const today = merged.find((r) => r.date === DATE);
    expect(today).toBeDefined();
    expect(today?.clockOut).toBeNull();
    // The bundle history is still there alongside it.
    expect(merged).toHaveLength(2);
  });

  it("patches the same row on clock-out instead of adding a second one", () => {
    let edits = collectionReducer(
      undefined,
      addRecord({
        key: "attendance",
        record: {
          id: "ATT-1",
          employeeId: EMP,
          date: DATE,
          clockIn: "09:00",
          clockOut: null,
          status: "present",
        },
      }),
    );
    edits = collectionReducer(
      edits,
      updateRecord({
        key: "attendance",
        id: "ATT-1",
        patch: { clockOut: "17:00", hoursWorked: 7.5 },
      }),
    );
    const merged = applyCollection(BUNDLE, "attendance", edits);
    expect(merged.filter((r) => r.date === DATE)).toHaveLength(1);
    expect(merged.find((r) => r.date === DATE)).toMatchObject({
      clockOut: "17:00",
      hoursWorked: 7.5,
    });
  });

  it("falls inside the profile's 30-day window, which is anchored on the reference date", () => {
    const referenceDate = "2025-11-15";
    const cutoff = new Date(referenceDate);
    cutoff.setDate(cutoff.getDate() - 30);
    const cut = cutoff.toISOString().slice(0, 10);

    const edits = collectionReducer(
      undefined,
      addRecord({
        key: "attendance",
        record: { id: "ATT-1", employeeId: EMP, date: DATE, status: "present" },
      }),
    );
    const visible = applyCollection(BUNDLE, "attendance", edits).filter(
      (r) => r.employeeId === EMP && r.date >= cut,
    );
    // Both the fixture history and today's fresh punch are inside the window —
    // the bug this replaced anchored on wall-clock today and showed neither.
    expect(visible.map((r) => r.date).sort()).toEqual(["2025-11-14", DATE]);
  });
});

describe("location booking integration", () => {
  it("a desk booked from the clock appears in the bookings collection", () => {
    const edits = collectionReducer(
      undefined,
      addRecord({
        key: "locationBookings",
        record: {
          id: "LB-9",
          employeeId: EMP,
          locationType: "desk",
          locationName: "Desk 14",
          date: DATE,
          startTime: "09:00",
          endTime: "17:30",
          status: "confirmed",
          notes: "Booked from the attendance clock",
        },
      }),
    );
    const merged = applyCollection([], "locationBookings", edits);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      locationName: "Desk 14",
      locationType: "desk",
      status: "confirmed",
    });
  });
});

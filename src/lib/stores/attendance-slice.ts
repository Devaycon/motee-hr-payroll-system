import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TIMESHEETS } from "@/src/data/attendance-demo";
import type {
  ClockSession,
  CorrectionRequest,
  PunchSource,
  TimesheetRecord,
  WorkLocation,
} from "@/src/lib/types/attendance";

/**
 * Live time & attendance — the part of the domain that is still happening.
 *
 * Sessions are keyed by employee and hold *instants*, not durations: the clock
 * on screen is recomputed from `clockInAt` against the current time on every
 * tick. That is what lets a running session survive a refresh, which the old
 * `useState` clock could not do.
 *
 * The stored side of attendance does not live here. Completed days are written
 * into the shared `attendance` collection through `collectionEdits`, so that the
 * profile's Time Logs tab and the HR employee record show them without this
 * slice having to know either screen exists.
 */
interface AttendanceState {
  /** employeeId → their current (or most recently closed) session. */
  sessions: Record<string, ClockSession>;
  timesheets: TimesheetRecord[];
  corrections: CorrectionRequest[];
}

const initialState: AttendanceState = {
  sessions: {},
  timesheets: TIMESHEETS,
  corrections: [],
};

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{
        sessions?: Record<string, ClockSession>;
        timesheets?: TimesheetRecord[];
        corrections?: CorrectionRequest[];
      }>,
    ) {
      const { sessions, timesheets, corrections } = action.payload;
      if (sessions && typeof sessions === "object") state.sessions = sessions;
      if (Array.isArray(timesheets) && timesheets.length) {
        state.timesheets = timesheets;
      }
      if (Array.isArray(corrections)) state.corrections = corrections;
    },

    // ── punches ─────────────────────────────────────────────────────────────

    clockIn(
      state,
      action: PayloadAction<{
        employeeId: string;
        date: string;
        at: string;
        location: WorkLocation;
        locationName?: string;
        bookingId?: string;
        source?: PunchSource;
        /** Id of the attendance row opened for this day. */
        logId?: string;
      }>,
    ) {
      const { employeeId, date, at, location, locationName, bookingId, logId } =
        action.payload;
      state.sessions[employeeId] = {
        employeeId,
        date,
        state: "clocked_in",
        clockInAt: at,
        breaks: [],
        location,
        locationName,
        bookingId,
        source: action.payload.source ?? "web",
        logId,
      };
    },

    startBreak(
      state,
      action: PayloadAction<{ employeeId: string; at: string }>,
    ) {
      const s = state.sessions[action.payload.employeeId];
      if (!s || s.state !== "clocked_in") return;
      s.breaks.push({ start: action.payload.at });
      s.state = "on_break";
    },

    endBreak(state, action: PayloadAction<{ employeeId: string; at: string }>) {
      const s = state.sessions[action.payload.employeeId];
      if (!s || s.state !== "on_break") return;
      const open = s.breaks[s.breaks.length - 1];
      if (open && !open.end) open.end = action.payload.at;
      s.state = "clocked_in";
    },

    clockOut(
      state,
      action: PayloadAction<{
        employeeId: string;
        at: string;
        note?: string;
      }>,
    ) {
      const s = state.sessions[action.payload.employeeId];
      if (!s || s.state === "idle" || s.state === "clocked_out") return;
      // Close an open break first, or it would keep accruing against the day.
      const open = s.breaks[s.breaks.length - 1];
      if (open && !open.end) open.end = action.payload.at;
      s.clockOutAt = action.payload.at;
      s.state = "clocked_out";
      s.note = action.payload.note;
    },

    /** Switch work location mid-session (moved desk, went home after lunch). */
    setLocation(
      state,
      action: PayloadAction<{
        employeeId: string;
        location: WorkLocation;
        locationName?: string;
        bookingId?: string;
      }>,
    ) {
      const s = state.sessions[action.payload.employeeId];
      if (!s) return;
      s.location = action.payload.location;
      s.locationName = action.payload.locationName;
      s.bookingId = action.payload.bookingId;
    },

    /** Drops a session so a new day starts clean. */
    clearSession(state, action: PayloadAction<string>) {
      delete state.sessions[action.payload];
    },

    // ── timesheets ──────────────────────────────────────────────────────────

    upsertTimesheet(state, action: PayloadAction<TimesheetRecord>) {
      const i = state.timesheets.findIndex((t) => t.id === action.payload.id);
      if (i >= 0) state.timesheets[i] = action.payload;
      else state.timesheets.unshift(action.payload);
    },

    submitTimesheet(
      state,
      action: PayloadAction<{ timesheet: TimesheetRecord; submittedAt: string }>,
    ) {
      const { timesheet, submittedAt } = action.payload;
      const submitted: TimesheetRecord = {
        ...timesheet,
        status: "submitted",
        submittedAt,
        // A resubmission must not carry the previous rejection with it.
        rejectionReason: undefined,
      };
      const i = state.timesheets.findIndex((t) => t.id === submitted.id);
      if (i >= 0) state.timesheets[i] = submitted;
      else state.timesheets.unshift(submitted);
    },

    approveTimesheet(
      state,
      action: PayloadAction<{ id: string; approvedBy: string; at: string }>,
    ) {
      const ts = state.timesheets.find((t) => t.id === action.payload.id);
      if (!ts) return;
      ts.status = "approved";
      ts.approvedAt = action.payload.at;
      ts.approvedBy = action.payload.approvedBy;
      ts.rejectionReason = undefined;
    },

    rejectTimesheet(
      state,
      action: PayloadAction<{ id: string; reason: string }>,
    ) {
      const ts = state.timesheets.find((t) => t.id === action.payload.id);
      if (!ts) return;
      ts.status = "rejected";
      ts.rejectionReason = action.payload.reason;
    },

    // ── corrections ─────────────────────────────────────────────────────────

    /**
     * A past punch is never edited in place by the employee — they ask, and the
     * amendment only lands on the record once someone approves it. Editing
     * silently would leave no trace that the original reading was different.
     */
    requestCorrection(
      state,
      action: PayloadAction<
        Omit<CorrectionRequest, "id" | "status" | "requestedAt">
      >,
    ) {
      state.corrections.unshift({
        ...action.payload,
        id: uid("COR"),
        status: "pending",
        requestedAt: new Date().toISOString(),
      });
    },

    resolveCorrection(
      state,
      action: PayloadAction<{
        id: string;
        status: "approved" | "rejected";
        resolvedBy: string;
        note?: string;
      }>,
    ) {
      const c = state.corrections.find((x) => x.id === action.payload.id);
      if (!c) return;
      c.status = action.payload.status;
      c.resolvedAt = new Date().toISOString();
      c.resolvedBy = action.payload.resolvedBy;
      c.resolutionNote = action.payload.note;
    },
  },
});

export const {
  hydrate,
  clockIn,
  startBreak,
  endBreak,
  clockOut,
  setLocation,
  clearSession,
  upsertTimesheet,
  submitTimesheet,
  approveTimesheet,
  rejectTimesheet,
  requestCorrection,
  resolveCorrection,
} = attendanceSlice.actions;
export default attendanceSlice.reducer;
export type { AttendanceState };

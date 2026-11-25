/**
 * Self-service attendance: sends the signed-in employee's own punches and
 * requests to `/attendance/mine/*` (signed in only, and only for actions on
 * the caller's own employee id — HR's screens use their own endpoints).
 *
 * - clockIn / startBreak / endBreak / clockOut / setLocation → /attendance/mine/…
 * - submitTimesheet   → POST /attendance/timesheets/mine/submit
 * - requestCorrection → POST /attendance/corrections/mine
 *
 * The screen updates its own copy first; a refused punch shows the server's
 * message (the attendance tags are re-read either way).
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/src/store/services/api";
import { attendanceApi } from "@/src/store/services/attendance";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  clockIn,
  clockOut,
  endBreak,
  requestCorrection,
  setLocation,
  startBreak,
  submitTimesheet,
} from "./attendance-slice";
import type { WorkLocation } from "@/src/types/attendance";

interface State {
  session: { is_loggedIn?: boolean; tenant_id?: string | null };
  auth: { user?: { employeeId?: string } | null };
}

const LOCATION: Record<string, WorkLocation> = {
  office: "office",
  remote: "remote",
  client_site: "clientSite",
};

/** "HH:MM" on a date → an ISO instant in the browser's time zone. */
function instant(date: string, hhmm: string | undefined): string | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(`${date}T00:00:00`);
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d.toISOString();
}

export const attendanceMineListener = createListenerMiddleware();

attendanceMineListener.startListening({
  matcher: isAnyOf(clockIn, startBreak, endBreak, clockOut, setLocation, submitTimesheet, requestCorrection),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as State;
    if (!state.session?.is_loggedIn || !state.session.tenant_id) return;
    const me = state.auth.user?.employeeId;
    const payload = action.payload as { employeeId?: string; timesheet?: { employeeId?: string } };
    const subject = payload.employeeId ?? payload.timesheet?.employeeId;
    if (!me || subject !== me) return;
    const dispatch = listenerApi.dispatch;
    const ep = attendanceApi.endpoints;

    try {
      if (clockIn.match(action)) {
        const p = action.payload;
        await dispatch(
          ep.clockIn.initiate({
            location: LOCATION[p.location] ?? "office",
            locationName: p.locationName ?? null,
            coordinates: p.coords ?? null,
            source: p.source ?? "web",
          }),
        ).unwrap();
      } else if (startBreak.match(action)) {
        await dispatch(ep.startBreak.initiate()).unwrap();
      } else if (endBreak.match(action)) {
        await dispatch(ep.endBreak.initiate()).unwrap();
      } else if (clockOut.match(action)) {
        const p = action.payload;
        await dispatch(ep.clockOut.initiate({ coordinates: p.coords ?? null, note: p.note ?? null })).unwrap();
      } else if (setLocation.match(action)) {
        const p = action.payload;
        await dispatch(
          ep.setWorkLocation.initiate({
            location: LOCATION[p.location] ?? "office",
            locationName: p.locationName ?? null,
          }),
        ).unwrap();
      } else if (submitTimesheet.match(action)) {
        await dispatch(
          ep.submitMyTimesheet.initiate({ weekStart: action.payload.timesheet.weekStart }),
        ).unwrap();
      } else if (requestCorrection.match(action)) {
        const p = action.payload;
        await dispatch(
          ep.requestAttendanceCorrection.initiate({
            date: p.date,
            clockInAt: instant(p.date, p.requestedClockIn),
            clockOutAt: instant(p.date, p.requestedClockOut),
            reason: p.reason,
          }),
        ).unwrap();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "The attendance server did not accept that."));
    }
    dispatch(api.util.invalidateTags(["Attendance", "Timesheets", "AttendanceCorrections"]));
  },
});

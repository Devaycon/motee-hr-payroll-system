/**
 * Sends the shift screens' store actions to the API (signed in only):
 *
 * - addTemplate / updateTemplate / deleteTemplate → /attendance/schedules
 * - setAssignment   → POST /shifts/assignments (a reassignment deletes the old one first)
 * - clearAssignment → DELETE /shifts/assignments/{id}
 * - setAssignmentStatus "cancelled" → POST /shifts/assignments/{id}/cancel
 *
 * Schedules and the roster are re-read afterwards, replacing the local copy.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/src/store/services/api";
import { attendanceApi } from "@/src/store/services/attendance";
import { shiftsApi } from "@/src/store/services/shifts";
import { scheduleToRequest } from "@/src/lib/attendance/api-mapping";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  addTemplate,
  clearAssignment,
  deleteTemplate,
  setAssignment,
  setAssignmentStatus,
  updateTemplate,
} from "./shifts-slice";
import type { ShiftAssignment } from "@/src/lib/types/shifts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isServerId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);

interface State {
  session: { is_loggedIn?: boolean; tenant_id?: string | null };
  shifts: { assignments: ShiftAssignment[] };
}

export const shiftsApiListener = createListenerMiddleware();

shiftsApiListener.startListening({
  matcher: isAnyOf(addTemplate, updateTemplate, deleteTemplate, setAssignment, clearAssignment, setAssignmentStatus),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as State;
    if (!state.session?.is_loggedIn || !state.session.tenant_id) return;
    const before = listenerApi.getOriginalState() as State;
    const dispatch = listenerApi.dispatch;
    const att = attendanceApi.endpoints;
    const sh = shiftsApi.endpoints;
    const findOld = (employeeId: string, date: string) =>
      before.shifts.assignments.find((a) => a.employeeId === employeeId && a.date === date);

    try {
      if (addTemplate.match(action)) {
        await dispatch(att.createWorkSchedule.initiate(scheduleToRequest(action.payload))).unwrap();
      } else if (updateTemplate.match(action)) {
        if (!isServerId(action.payload.id)) return;
        await dispatch(
          att.updateWorkSchedule.initiate({ id: action.payload.id, body: scheduleToRequest(action.payload.patch) }),
        ).unwrap();
      } else if (deleteTemplate.match(action)) {
        if (!isServerId(action.payload)) return;
        await dispatch(att.deleteWorkSchedule.initiate(action.payload)).unwrap();
      } else if (setAssignment.match(action)) {
        const { employeeId, date, templateId, note } = action.payload;
        if (!isServerId(templateId) || !isServerId(employeeId)) return;
        const old = findOld(employeeId, date);
        if (old && isServerId(old.id)) {
          if (old.templateId === templateId && old.status === "scheduled") return;
          await dispatch(sh.deleteShiftAssignment.initiate(old.id)).unwrap();
        }
        await dispatch(
          sh.createShiftAssignment.initiate({ employeeId, workScheduleId: templateId, date, note: note ?? null }),
        ).unwrap();
      } else if (clearAssignment.match(action)) {
        const old = findOld(action.payload.employeeId, action.payload.date);
        if (!old || !isServerId(old.id)) return;
        await dispatch(sh.deleteShiftAssignment.initiate(old.id)).unwrap();
      } else if (setAssignmentStatus.match(action)) {
        if (action.payload.status !== "cancelled" || !isServerId(action.payload.id)) return;
        await dispatch(sh.cancelShiftAssignment.initiate(action.payload.id)).unwrap();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the shift change."));
    }
    dispatch(api.util.invalidateTags(["Shifts", "WorkSchedules"]));
  },
});

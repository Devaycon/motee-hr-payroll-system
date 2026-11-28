/**
 * Profile change requests on the API (signed in). The profile screens record
 * a request or decision in the profile-edits slice first; this sends it, and
 * the change-request reads it invalidates bring the server's copy back to
 * replace the local one (`useDemoChangeRequests`):
 *
 * - requestEdit    → POST /employees/me/change-requests  { field, requestedValue }
 *                    (keys are flat, e.g. `accountNumber`; a photo can't be
 *                    requested: the API has no photo field — backend, 28 Nov)
 * - approveRequest → POST /change-requests/{id}/approve (the server applies
 *                    the change to the record itself)
 * - rejectRequest  → POST /change-requests/{id}/reject  { reason }
 * - cancelRequest  → POST /employees/me/change-requests/{id}/withdraw
 *
 * The API only lets employees request changes to their own record, and only
 * to the fields `GET /employees/me/change-requests/fields` lists; anything
 * else is refused here with a message and its placeholder row removed.
 * Demo requests (non-UUID ids) are left alone.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/src/store/services/api";
import { changeRequestsApi } from "@/src/store/services/change-requests";
import { isSameField } from "@/src/lib/employees/profile-field-sync";
import { getApiErrorMessage } from "@/src/lib/utils";
import type { ChangeRequest } from "@/src/lib/types/profile-edits";
import {
  approveRequest,
  cancelRequest,
  clearOverrides,
  rejectRequest,
  requestEdit,
} from "./profile-edits-slice";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface State {
  session: { is_loggedIn?: boolean; tenant_id?: string | null };
  auth: { user?: { employeeId?: string | null } | null };
  profileEdits: { requests: ChangeRequest[] };
}

const loose = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export const changeRequestsApiListener = createListenerMiddleware();

changeRequestsApiListener.startListening({
  matcher: isAnyOf(requestEdit, approveRequest, rejectRequest, cancelRequest),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as State;
    if (!state.session?.is_loggedIn || !state.session.tenant_id) return;
    const dispatch = listenerApi.dispatch;
    const ep = changeRequestsApi.endpoints;
    /** Re-reads the logs, so the server's copy replaces what is on screen. */
    const refresh = () => dispatch(api.util.invalidateTags(["ChangeRequests"]));

    // ── Raising ──────────────────────────────────────────────────────────
    if (requestEdit.match(action)) {
      const { employeeId, field, label, requestedValue, reason } = action.payload;
      // The row the slice just added, to take back if the server won't have it.
      const placeholder = state.profileEdits.requests.find(
        (r) =>
          r.employeeId === employeeId &&
          r.field === field &&
          r.status === "pending" &&
          !UUID.test(r.id),
      );
      const withdrawPlaceholder = () => {
        if (placeholder) dispatch(cancelRequest(placeholder.id));
      };

      // No photo field on the API, and approval would not set the avatar.
      if (field === "photoUrl" || requestedValue.startsWith("data:")) {
        toast.error("A new profile photo can't be requested yet. Ask HR to update it.");
        withdrawPlaceholder();
        return;
      }

      if (employeeId !== state.auth.user?.employeeId) {
        toast.error("Change requests can only be raised by the employee for their own record.");
        withdrawPlaceholder();
        return;
      }

      try {
        const fieldsRead = dispatch(ep.getRequestableFields.initiate());
        let requestable;
        try {
          requestable = (await fieldsRead.unwrap()).data ?? [];
        } finally {
          fieldsRead.unsubscribe();
        }
        const target =
          requestable.find((f) => isSameField(field, f.key)) ??
          requestable.find((f) => loose(f.label) === loose(label));
        if (!target) {
          toast.error(`${label} can't be changed by request yet.`);
          withdrawPlaceholder();
          return;
        }

        await dispatch(
          ep.raiseChangeRequest.initiate({
            field: target.key,
            requestedValue,
            reason,
            fileId: null,
          }),
        ).unwrap();
      } catch (err) {
        toast.error(getApiErrorMessage(err, `Could not request the change to ${label}.`));
        withdrawPlaceholder();
        refresh();
      }
      return;
    }

    // ── Deciding and withdrawing (server requests only) ─────────────────
    const id = cancelRequest.match(action)
      ? action.payload
      : approveRequest.match(action) || rejectRequest.match(action)
        ? action.payload.id
        : "";
    if (!UUID.test(id)) return;

    try {
      if (approveRequest.match(action)) {
        const request = state.profileEdits.requests.find((r) => r.id === id);
        try {
          await dispatch(ep.approveChangeRequest.initiate({ id })).unwrap();
        } finally {
          // The approval layered the new value on screen; the server's record
          // (re-read via the invalidated tags) is now the source of truth.
          if (request) {
            dispatch(
              clearOverrides({ employeeId: request.employeeId, fields: [request.field] }),
            );
          }
        }
      } else if (rejectRequest.match(action)) {
        await dispatch(
          ep.rejectChangeRequest.initiate({
            id,
            body: { reason: action.payload.note?.trim() || "Rejected" },
          }),
        ).unwrap();
      } else if (cancelRequest.match(action)) {
        await dispatch(ep.withdrawChangeRequest.initiate(id)).unwrap();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the decision on this change request."));
      refresh();
    }
  },
});

/**
 * Sends offboarding changes to the API.
 *
 * The offboarding screens change records through slice actions dispatched from
 * a dozen handlers. Listening for those actions here keeps every one of them
 * on the server without touching the handlers; the slice change that already
 * happened is what the user sees until the refetch replaces it. A refused call
 * refetches too, which rolls the screen back to the truth.
 */
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { toast } from "sonner";
import type { AppDispatch, RootState } from "./store";
import {
  addRecord,
  approveRecord,
  completeRecord,
  disapproveRecord,
  generateExitDocuments,
  reactivateRecord,
  removeRecord,
  revokeSystemAccess,
  scheduleExitInterview,
  toggleClearanceItem,
  updateExitInterview,
  updateRecord,
} from "./offboarding-slice";
import type { ExitReason } from "@/src/lib/types/offboarding";
import { getApiErrorMessage } from "@/src/lib/utils";
import { offboardingSchema } from "@/src/lib/validations/offboarding";
import api from "@/src/store/services/api";
import { offboardingApi } from "@/src/store/services/offboarding";

const { endpoints } = offboardingApi;

const exitReasonToApi = (reason: ExitReason) =>
  reason === "contract_end" ? ("contractEnd" as const) : reason;

export const offboardingListener = createListenerMiddleware();

/** Runs one API call; on failure reports it and resyncs from the server. */
async function send(
  dispatch: AppDispatch,
  call: () => Promise<unknown>,
  fallback: string,
): Promise<boolean> {
  try {
    await call();
    return true;
  } catch (err) {
    toast.error(getApiErrorMessage(err, fallback));
    dispatch(api.util.invalidateTags(["Offboarding"]));
    return false;
  }
}

offboardingListener.startListening({
  predicate: (action) => action.type.startsWith("offboarding/"),
  effect: async (action, listenerApi) => {
    const dispatch = listenerApi.dispatch as AppDispatch;
    const before = (listenerApi.getOriginalState() as RootState).offboarding;
    const after = (listenerApi.getState() as RootState).offboarding;
    const previous = (id: string) => before.records.find((r) => r.id === id);
    const current = (id: string) => after.records.find((r) => r.id === id);

    /** The slice completes an exit on its own once the last step is done;
     *  the server needs to be told. */
    const completeIfFinished = async (id: string) => {
      if (
        previous(id)?.status !== "completed" &&
        current(id)?.status === "completed"
      ) {
        await send(
          dispatch,
          () =>
            dispatch(
              endpoints.runOffboardingAction.initiate({
                id,
                action: "complete",
              }),
            ).unwrap(),
          "Could not complete the offboarding.",
        );
      }
    };

    if (addRecord.match(action)) {
      const record = action.payload;
      const parsed = offboardingSchema.safeParse({
        employeeId: record.employeeId,
        exitReason: exitReasonToApi(record.exitReason),
        lastWorkingDate: record.lastWorkingDate,
        notes: record.exitInterviewNotes || null,
      });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        dispatch(api.util.invalidateTags(["Offboarding"]));
        return;
      }
      await send(
        dispatch,
        () => dispatch(endpoints.initiateOffboarding.initiate(parsed.data)).unwrap(),
        "Could not start the offboarding.",
      );
      return;
    }

    if (updateRecord.match(action)) {
      const record = current(action.payload.id);
      if (!record) return;
      await send(
        dispatch,
        () =>
          dispatch(
            endpoints.updateOffboarding.initiate({
              id: record.id,
              body: {
                exitReason: exitReasonToApi(record.exitReason),
                lastWorkingDate: record.lastWorkingDate,
                notes: record.exitInterviewNotes || null,
              },
            }),
          ).unwrap(),
        "Could not update the offboarding.",
      );
      return;
    }

    if (removeRecord.match(action)) {
      await send(
        dispatch,
        () =>
          dispatch(endpoints.deleteOffboarding.initiate(action.payload)).unwrap(),
        "Could not remove the offboarding.",
      );
      return;
    }

    if (approveRecord.match(action)) {
      await send(
        dispatch,
        () =>
          dispatch(
            endpoints.runOffboardingAction.initiate({
              id: action.payload.id,
              action: "approve",
            }),
          ).unwrap(),
        "Could not approve the offboarding.",
      );
      return;
    }

    if (disapproveRecord.match(action)) {
      await send(
        dispatch,
        () =>
          dispatch(
            endpoints.runOffboardingAction.initiate({
              id: action.payload.id,
              action: "disapprove",
              body: { reason: action.payload.reason },
            }),
          ).unwrap(),
        "Could not disapprove the offboarding.",
      );
      return;
    }

    if (reactivateRecord.match(action)) {
      await send(
        dispatch,
        () =>
          dispatch(
            endpoints.runOffboardingAction.initiate({
              id: action.payload.id,
              action: "reactivate",
            }),
          ).unwrap(),
        "Could not reactivate the employee.",
      );
      return;
    }

    if (revokeSystemAccess.match(action)) {
      await send(
        dispatch,
        () =>
          dispatch(
            endpoints.revokeOffboardingAccess.initiate(action.payload),
          ).unwrap(),
        "Could not revoke system access.",
      );
      return;
    }

    if (scheduleExitInterview.match(action)) {
      await send(
        dispatch,
        () =>
          dispatch(
            endpoints.scheduleExitInterview.initiate({
              id: action.payload.id,
              body: { scheduledAt: new Date(action.payload.date).toISOString() },
            }),
          ).unwrap(),
        "Could not schedule the exit interview.",
      );
      return;
    }

    if (generateExitDocuments.match(action)) {
      await send(
        dispatch,
        () =>
          dispatch(
            endpoints.generateExitDocuments.initiate(action.payload),
          ).unwrap(),
        "Could not generate the exit documents.",
      );
      return;
    }

    if (toggleClearanceItem.match(action)) {
      const { id, itemId } = action.payload;
      const was = previous(id)?.clearanceItems.find((i) => i.id === itemId);
      if (was?.completed) {
        toast.info("A completed clearance step cannot be reopened.");
        dispatch(api.util.invalidateTags(["Offboarding"]));
        return;
      }
      // Clearance can only be worked once it has been started.
      if (previous(id)?.status === "approved") {
        const started = await send(
          dispatch,
          () =>
            dispatch(
              endpoints.runOffboardingAction.initiate({
                id,
                action: "startClearance",
              }),
            ).unwrap(),
          "Could not start clearance.",
        );
        if (!started) return;
      }
      const done = await send(
        dispatch,
        () =>
          dispatch(
            endpoints.completeClearanceItem.initiate({ id, itemId }),
          ).unwrap(),
        "Could not complete the clearance step.",
      );
      if (done) await completeIfFinished(id);
      return;
    }

    if (updateExitInterview.match(action)) {
      const { id, notes, completed } = action.payload;
      // Only completion is stored; notes travel with it.
      if (!completed || previous(id)?.exitInterviewCompleted) return;
      const done = await send(
        dispatch,
        () =>
          dispatch(
            endpoints.completeExitInterview.initiate({
              id,
              body: { notes: notes || null },
            }),
          ).unwrap(),
        "Could not complete the exit interview.",
      );
      if (done) await completeIfFinished(id);
      return;
    }

    if (completeRecord.match(action)) {
      await send(
        dispatch,
        () =>
          dispatch(
            endpoints.runOffboardingAction.initiate({
              id: action.payload,
              action: "complete",
            }),
          ).unwrap(),
        "Could not complete the offboarding.",
      );
    }
  },
});

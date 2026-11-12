/**
 * Sends sickness changes to the API.
 *
 * Same arrangement as leave: the sickness screens dispatch slice actions, this
 * turns each into its API call, and the refetch that follows replaces the
 * slice's optimistic copy with the server's. A refused call refetches too,
 * which undoes it. New absences are created by the report form itself (it
 * needs the server's id to open the record), so `reportSickness` is not sent
 * from here.
 *
 * The demo listener in `sickness-listener.ts` still derives Bradford snapshots
 * and review cases locally from the same actions.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import type { AppDispatch, RootState } from "./store";
import {
  addDocument,
  recordReturn,
  setApproval,
  setExclusion,
  updateRecord,
} from "./sickness-slice";
import {
  documentKind,
  fileFromDataUrl,
  isServerId,
  protectedCategory,
  sicknessRecordToApi,
} from "@/src/lib/sickness/api-mapping";
import { getApiErrorMessage } from "@/src/lib/utils";
import api from "@/src/store/services/api";
import { filesApi } from "@/src/store/services/files";
import { sicknessApi } from "@/src/store/services/sickness";

export const sicknessApiListener = createListenerMiddleware();

sicknessApiListener.startListening({
  matcher: isAnyOf(setApproval, setExclusion, updateRecord, addDocument, recordReturn),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as RootState;
    if (!state.session.is_loggedIn) return;
    const dispatch = listenerApi.dispatch as AppDispatch;
    const id = (action.payload as { id: string }).id;
    // A record still waiting for its server id has nothing to update yet.
    if (!isServerId(id)) return;
    const record = state.sickness.records.find((r) => r.id === id);
    const before = (listenerApi.getOriginalState() as RootState).sickness.records.find(
      (r) => r.id === id,
    );
    const resync = () => dispatch(api.util.invalidateTags(["Sickness"]));
    const send = async (call: () => Promise<unknown>, fallback: string) => {
      try {
        await call();
      } catch (err) {
        toast.error(getApiErrorMessage(err, fallback));
      }
      resync();
    };
    const ep = sicknessApi.endpoints;

    if (setApproval.match(action)) {
      const reason = action.payload.note ?? "";
      const { status } = action.payload;
      await send(() => {
        if (status === "approved") {
          return dispatch(ep.approveSicknessRecord.initiate(id)).unwrap();
        }
        if (status === "rejected") {
          return dispatch(
            ep.rejectSicknessRecord.initiate({ id, body: { reason: reason || "Not confirmed" } }),
          ).unwrap();
        }
        return dispatch(
          ep.cancelSicknessRecord.initiate({ id, body: { reason: reason || "Cancelled" } }),
        ).unwrap();
      }, "Could not save the decision.");
      return;
    }

    if (setExclusion.match(action)) {
      const ex = action.payload.exclusion;
      await send(() => {
        if (!ex) return dispatch(ep.clearSicknessExclusion.initiate(id)).unwrap();
        return dispatch(
          ep.setSicknessExclusion.initiate({
            id,
            body: { category: protectedCategory.toApi(ex.category), reason: ex.reason },
          }),
        ).unwrap();
      }, "Could not save the Bradford exclusion.");
      return;
    }

    if (updateRecord.match(action)) {
      if (!record || !before) return;
      const body = sicknessRecordToApi(record);
      // Only fields the API stores are sent; a fit-note status follows the
      // documents on the server, so a change to it alone has nothing to send.
      if (JSON.stringify(body) === JSON.stringify(sicknessRecordToApi(before))) return;
      await send(
        () => dispatch(ep.updateSicknessRecord.initiate({ id, body })).unwrap(),
        "Could not update the absence.",
      );
      return;
    }

    if (addDocument.match(action)) {
      const doc = action.payload.document;
      await send(async () => {
        let fileId: string | null = null;
        const file = doc.dataUrl ? fileFromDataUrl(doc.dataUrl, doc.name) : null;
        if (file) {
          const uploaded = await dispatch(
            filesApi.endpoints.uploadFile.initiate({
              file,
              purpose: "employeeDocument",
              ownerId: record?.employeeId,
            }),
          ).unwrap();
          fileId = uploaded.data?.id ?? null;
        }
        await dispatch(
          ep.attachSicknessDocument.initiate({
            id,
            body: {
              kind: documentKind.toApi(doc.kind),
              name: doc.name,
              fileId,
              validFrom: doc.validFrom ?? null,
              validTo: doc.validTo ?? null,
            },
          }),
        ).unwrap();
      }, "Could not attach the document.");
      return;
    }

    if (recordReturn.match(action)) {
      const { rtw, endDate } = action.payload;
      const people = state.locale.data?.employees ?? [];
      await send(async () => {
        // Closing the spell, unless it was already closed.
        if (before?.absenceState !== "returned") {
          await dispatch(
            ep.recordSicknessReturn.initiate({
              id,
              body: {
                lastSickDay: endDate,
                lastDayPortion: rtw.lastDayPortion ?? "full",
                returnDate: rtw.returnDate ?? null,
              },
            }),
          ).unwrap();
        }
        // The interview form, when HR filled it in (self-service only confirms the return).
        if (rtw.interviewHeld || rtw.status === "completed" || rtw.notes) {
          await dispatch(
            ep.recordReturnToWork.initiate({
              id,
              body: {
                interviewHeld: !!rtw.interviewHeld,
                interviewDate: rtw.interviewDate ?? null,
                interviewerEmployeeId: rtw.interviewer
                  ? (people.find((e) => e.fullName === rtw.interviewer)?.id ?? null)
                  : null,
                safeToReturn: !!rtw.safeToReturn,
                notes: rtw.notes ?? null,
                adjustmentsRecommended: !!rtw.adjustmentsRecommended,
                ohReferralRecommended: !!rtw.ohReferralRecommended,
              },
            }),
          ).unwrap();
        }
      }, "Could not record the return to work.");
    }
  },
});

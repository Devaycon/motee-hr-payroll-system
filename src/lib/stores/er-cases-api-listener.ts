/**
 * Sends the Employee Relations screens' slice actions to the API (signed in
 * only). The screens change the slice first; each change is then sent and the
 * register re-read, so a refused call is replaced by the server's copy.
 *
 * - addCase    → POST /er-cases, then the local id becomes the server's
 * - updateCase → PATCH …/stage for a stage change, POST …/meetings for new
 *                meetings, and PUT /er-cases/{id} for the other fields
 * - addNote    → POST …/notes
 * - deleteCase → DELETE /er-cases/{id}
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/src/store/services/api";
import { erCasesApi } from "@/src/store/services/er-cases";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  caseToRequest,
  meetingToRequest,
  stageToApi,
  visibilityToApi,
} from "@/src/lib/er-cases/api-mapping";
import { addCase, addNote, adoptServerId, deleteCase, updateCase } from "./er-cases-slice";
import type { ERCase } from "@/src/lib/types/grievance";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isServerId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);

interface State {
  session: { is_loggedIn?: boolean; tenant_id?: string | null };
  erCases: { byCountry: Record<string, ERCase[]> };
  locale: { data?: { employees?: { id: string; fullName: string }[] } | null };
}

/** Fields that `PUT /er-cases/{id}` carries. */
const EDITABLE: (keyof ERCase)[] = [
  "complaintType", "employeeId", "employeeName", "incidentDate", "description", "priority",
  "confidentialityLevel", "assignedTo", "assignedToId", "caseOwner", "targetResolutionDate",
  "investigationDueDate", "outcomeDueDate", "witnesses", "hearingDate", "hearingPanel",
  "hearingPanelIds", "outcome", "outcomeDate", "suspensionDays", "appealReviewer",
  "appealReviewerId", "appealGrounds", "retentionPeriod",
];

export const erCasesApiListener = createListenerMiddleware();

erCasesApiListener.startListening({
  matcher: isAnyOf(addCase, updateCase, addNote, deleteCase),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as State;
    if (!state.session?.is_loggedIn || !state.session.tenant_id) return;
    const before = listenerApi.getOriginalState() as State;
    const dispatch = listenerApi.dispatch;
    const people = state.locale.data?.employees ?? [];
    const byName = new Map(people.map((e) => [e.fullName.trim().toLowerCase(), e.id]));
    const idOf = (name: string | null | undefined) =>
      name ? byName.get(name.trim().toLowerCase()) : undefined;
    const run = <T,>(p: { unwrap: () => Promise<T> }) => p.unwrap();

    try {
      if (addCase.match(action)) {
        const { country, case: c } = action.payload;
        const res = await run(dispatch(erCasesApi.endpoints.createErCase.initiate(caseToRequest(c, idOf))));
        dispatch(
          adoptServerId({ country, localId: c.id, serverId: res.data.case.id, caseNumber: res.data.case.caseNumber }),
        );
      } else if (updateCase.match(action)) {
        const { country, id, patch } = action.payload;
        if (!isServerId(id)) return;
        const prev = before.erCases.byCountry[country]?.find((c) => c.id === id);
        const next = state.erCases.byCountry[country]?.find((c) => c.id === id);
        if (!prev || !next) return;
        const fieldsChanged = EDITABLE.some(
          (k) => k in patch && JSON.stringify(prev[k]) !== JSON.stringify(next[k]),
        );
        if (fieldsChanged) {
          await run(dispatch(erCasesApi.endpoints.updateErCase.initiate({ id, body: caseToRequest(next, idOf) })));
        }
        const known = new Set((prev.meetings ?? []).map((m) => m.id));
        for (const m of (next.meetings ?? []).filter((x) => !known.has(x.id))) {
          await run(dispatch(erCasesApi.endpoints.addErCaseMeeting.initiate({ id, body: meetingToRequest(m) })));
        }
        if (patch.stage && patch.stage !== prev.stage) {
          await run(
            dispatch(erCasesApi.endpoints.moveErCaseStage.initiate({ id, body: { stage: stageToApi(patch.stage) } })),
          );
        }
      } else if (addNote.match(action)) {
        const { id, note } = action.payload;
        if (!isServerId(id)) return;
        await run(
          dispatch(
            erCasesApi.endpoints.addErCaseNote.initiate({
              id,
              body: { content: note.content, visibility: visibilityToApi(note.visibility ?? "hr_only") },
            }),
          ),
        );
      } else if (deleteCase.match(action)) {
        if (!isServerId(action.payload.id)) return;
        await run(dispatch(erCasesApi.endpoints.deleteErCase.initiate(action.payload.id)));
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the case."));
    }
    dispatch(api.util.invalidateTags(["ErCases"]));
  },
});

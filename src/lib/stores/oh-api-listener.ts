/**
 * Occupational Health on the API (signed in only). The OH screens and the
 * sickness record's "Refer to OH" change the sickness slice first; this sends
 * the change and re-reads the OH cases:
 *
 * - referToOH    → POST /occupational-health
 * - updateOHCase → POST …/stage for a stage change, PUT /occupational-health/{id}
 *                  for the case fields, and for adjustments POST (new),
 *                  PUT (edited) and POST …/adjustments/{id}/stage (moved on)
 *
 * - linking absences → PUT /occupational-health/{id}/sickness-records with the
 *   whole set (it replaces the list). A referral that also links earlier
 *   absences creates the case with the first one, then sends the full set.
 *   The server refuses an absence that belongs to someone else.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/src/store/services/api";
import { occupationalHealthApi } from "@/src/store/services/occupational-health";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  adjustmentToRequest,
  ohCaseToRequest,
  stageToApi,
} from "@/src/lib/occupational-health/api-mapping";
import { referToOH, updateOHCase } from "./sickness-slice";
import type { OHReferral } from "@/src/lib/types/occupational-health";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isServerId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);

interface State {
  session: { is_loggedIn?: boolean; tenant_id?: string | null };
  sickness: { ohCases: OHReferral[] };
  locale: { data?: { employees?: { id: string; fullName: string }[] } | null };
}

const CASE_FIELDS: (keyof OHReferral)[] = [
  "fitnessStatus", "assessmentDate", "expectedReturnDate", "reviewDate", "caseNotes",
  "equalityActConsidered", "referralDate", "caseOwner",
];

export const ohApiListener = createListenerMiddleware();

ohApiListener.startListening({
  matcher: isAnyOf(referToOH, updateOHCase),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as State;
    if (!state.session?.is_loggedIn || !state.session.tenant_id) return;
    const before = listenerApi.getOriginalState() as State;
    const dispatch = listenerApi.dispatch;
    const ep = occupationalHealthApi.endpoints;
    const byName = new Map((state.locale.data?.employees ?? []).map((e) => [e.fullName.trim().toLowerCase(), e.id]));
    const idOf = (n: string | null | undefined) => (n ? byName.get(n.trim().toLowerCase()) : undefined);

    try {
      if (referToOH.match(action)) {
        const { referral, recordIds } = action.payload;
        if (!isServerId(referral.employeeId)) return;
        const ids = recordIds.filter(isServerId);
        const created = await dispatch(
          ep.createOhReferral.initiate(ohCaseToRequest(referral, idOf, ids[0] ?? null)),
        ).unwrap();
        const caseId = created.data?.id;
        if (ids.length > 1 && isServerId(caseId)) {
          await dispatch(
            ep.linkOhAbsences.initiate({ id: caseId, body: { sicknessRecordIds: ids } }),
          ).unwrap();
        }
      } else if (updateOHCase.match(action)) {
        const { id, changes } = action.payload;
        if (!isServerId(id)) return;
        const prev = before.sickness.ohCases.find((c) => c.id === id);
        const next = state.sickness.ohCases.find((c) => c.id === id);
        if (!prev || !next) return;

        if (CASE_FIELDS.some((k) => k in changes && JSON.stringify(prev[k]) !== JSON.stringify(next[k]))) {
          await dispatch(ep.updateOhReferral.initiate({ id, body: ohCaseToRequest(next, idOf) })).unwrap();
        }
        if (changes.linkedSicknessIds) {
          const ids = [...new Set(changes.linkedSicknessIds.filter(isServerId))];
          const had = [...new Set((prev.linkedSicknessIds ?? []).filter(isServerId))];
          const same = ids.length === had.length && ids.every((x) => had.includes(x));
          if (!same) {
            await dispatch(
              ep.linkOhAbsences.initiate({ id, body: { sicknessRecordIds: ids } }),
            ).unwrap();
          }
        }
        if (changes.status && changes.status !== prev.status) {
          await dispatch(ep.moveOhReferralStage.initiate({ id, body: { stage: stageToApi(changes.status) } })).unwrap();
        }
        if (changes.adjustments) {
          const old = new Map(prev.adjustments.map((a) => [a.id, a]));
          for (const adj of next.adjustments) {
            const was = old.get(adj.id);
            if (!was || !isServerId(adj.id)) {
              if (!was) {
                await dispatch(
                  ep.addOhAdjustment.initiate({ id, body: adjustmentToRequest(adj, idOf) }),
                ).unwrap();
              }
              continue;
            }
            const { status: s1, ...rest1 } = was;
            const { status: s2, ...rest2 } = adj;
            if (JSON.stringify(rest1) !== JSON.stringify(rest2)) {
              await dispatch(
                ep.updateOhAdjustment.initiate({ id, adjustmentId: adj.id, body: adjustmentToRequest(adj, idOf) }),
              ).unwrap();
            }
            if (s1 !== s2) {
              await dispatch(
                ep.moveOhAdjustmentStage.initiate({ id, adjustmentId: adj.id, body: { stage: s2 } }),
              ).unwrap();
            }
          }
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the occupational health case."));
    }
    dispatch(api.util.invalidateTags(["OccupationalHealth"]));
  },
});

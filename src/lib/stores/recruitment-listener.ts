/**
 * Sends recruitment changes to the API.
 *
 * Same arrangement as leave: the recruitment screens dispatch slice actions,
 * this turns each into its API call, and the refetch that follows replaces the
 * slice's optimistic copy (keeping what the API does not store). A refused
 * call refetches as well, which undoes it. Signed out, nothing is sent.
 */
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { toast } from "sonner";
import type { AppDispatch, RootState } from "./store";
import {
  addCandidate,
  addRequisition,
  addScorecard,
  adoptServerId,
  cancelInterview,
  moveStage,
  reassignCandidate,
  recordInterviewScores,
  respondToOffer,
  scheduleInterview,
  sendOffer,
  setCandidateStatus,
  setInterviewStatus,
  setRequisitionStatus,
  updateCandidate,
  updateRequisition,
  type RecruitmentBucket,
} from "./recruitment-slice";
import {
  CANDIDATE_LOCAL_FIELDS,
  candidateToRequest,
  interviewToRequest,
  recommendationToApi,
  REQUISITION_LOCAL_FIELDS,
  requisitionToRequest,
} from "@/src/lib/recruitment/api-mapping";
import type {
  Candidate,
  JobRequisition,
  RequisitionStatus,
} from "@/src/lib/types/recruitment";
import { getApiErrorMessage } from "@/src/lib/utils";
import api from "@/src/store/services/api";
import { candidatesApi } from "@/src/store/services/candidates";
import { interviewsApi } from "@/src/store/services/interviews";
import { requisitionsApi } from "@/src/store/services/requisitions";

const RECRUITMENT_TAGS = ["Requisitions", "Candidates", "Interviews"] as const;

/** Statuses the server derives from the pipeline; nothing to send for them. */
const DERIVED_STATUSES = new Set<RequisitionStatus>([
  "interviewing",
  "offer_stage",
  "filled",
]);

export const recruitmentListener = createListenerMiddleware();

recruitmentListener.startListening({
  predicate: (action, state) =>
    action.type.startsWith("recruitment/") &&
    (state as RootState).session.is_loggedIn &&
    !!(state as RootState).session.tenant_id,
  effect: async (action, listenerApi) => {
    const dispatch = listenerApi.dispatch as AppDispatch;
    const original = listenerApi.getOriginalState() as RootState;
    const current = listenerApi.getState() as RootState;
    const bucketOf = (s: RootState, country: string): RecruitmentBucket | undefined =>
      s.recruitment.byCountry[country];
    const departmentIdByName = new Map(
      (current.locale.data?.departments ?? []).map((d) => [d.name, d.id] as const),
    );
    const resync = () => dispatch(api.util.invalidateTags([...RECRUITMENT_TAGS]));

    const send = async (call: () => Promise<unknown>, fallback: string) => {
      try {
        await call();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, fallback));
        return false;
      }
    };
    const run = <T,>(thunk: { unwrap: () => Promise<T> }) => thunk.unwrap();

    /** Moves a vacancy to the status the screen set, through the lifecycle calls. */
    const transition = async (id: string, from: RequisitionStatus, to: RequisitionStatus) => {
      if (from === to || DERIVED_STATUSES.has(to)) return;
      const ep = requisitionsApi.endpoints;
      if (to === "open") {
        await run(
          dispatch(
            from === "on_hold"
              ? ep.resumeRequisition.initiate(id)
              : ep.publishRequisition.initiate(id),
          ),
        );
      } else if (to === "on_hold") {
        await run(dispatch(ep.holdRequisition.initiate(id)));
      } else if (to === "closed") {
        await run(dispatch(ep.closeRequisition.initiate({ id })));
      } else if (to === "cancelled") {
        await run(dispatch(ep.cancelRequisition.initiate({ id })));
      }
    };

    const putRequisition = (req: JobRequisition) =>
      run(
        dispatch(
          requisitionsApi.endpoints.updateRequisition.initiate({
            id: req.id,
            body: requisitionToRequest(req, departmentIdByName),
          }),
        ),
      );

    const putCandidate = (c: Candidate) =>
      run(
        dispatch(
          candidatesApi.endpoints.updateCandidate.initiate({
            id: c.id,
            body: candidateToRequest(c),
          }),
        ),
      );

    /** True when a patch touches something the API stores. */
    const sendsFields = <T,>(patch: Partial<T>, localOnly: (keyof T)[]) =>
      Object.keys(patch).some((k) => !localOnly.includes(k as keyof T));

    // ── Vacancies ──
    if (addRequisition.match(action)) {
      const { country, requisition } = action.payload;
      await send(async () => {
        const created = (
          await run(
            dispatch(
              requisitionsApi.endpoints.createRequisition.initiate(
                requisitionToRequest(requisition, departmentIdByName),
              ),
            ),
          )
        ).data;
        dispatch(
          adoptServerId({
            country,
            kind: "requisition",
            localId: requisition.id,
            serverId: created.id,
          }),
        );
        if (requisition.status === "open") {
          await transition(created.id, "draft", "open");
        }
      }, "Could not save the vacancy.");
      resync();
      return;
    }

    if (updateRequisition.match(action)) {
      const { country, id, patch } = action.payload;
      const before = bucketOf(original, country)?.requisitions.find((r) => r.id === id);
      const after = bucketOf(current, country)?.requisitions.find((r) => r.id === id);
      if (!before || !after) return;
      const changesFields = sendsFields(
        { ...patch, status: undefined },
        [...REQUISITION_LOCAL_FIELDS, "status"],
      );
      if (!changesFields && !patch.status) return;
      await send(async () => {
        if (changesFields) await putRequisition(after);
        if (patch.status) await transition(id, before.status, patch.status);
      }, "Could not update the vacancy.");
      resync();
      return;
    }

    if (setRequisitionStatus.match(action)) {
      const { country, id, status } = action.payload;
      const before = bucketOf(original, country)?.requisitions.find((r) => r.id === id);
      if (!before) return;
      await send(() => transition(id, before.status, status), "Could not change the vacancy status.");
      resync();
      return;
    }

    // ── Applicants ──
    if (addCandidate.match(action)) {
      const { country, candidate } = action.payload;
      await send(async () => {
        const created = (
          await run(
            dispatch(
              candidatesApi.endpoints.createCandidate.initiate(
                candidateToRequest(candidate),
              ),
            ),
          )
        ).data;
        dispatch(
          adoptServerId({
            country,
            kind: "candidate",
            localId: candidate.id,
            serverId: created.id,
          }),
        );
        // Added straight into a later stage (e.g. an internal transfer).
        if (candidate.stage !== "applicants") {
          await run(
            dispatch(
              candidatesApi.endpoints.moveCandidate.initiate({
                id: created.id,
                body: { to: candidate.stage },
              }),
            ),
          );
        }
      }, "Could not add the applicant.");
      resync();
      return;
    }

    if (updateCandidate.match(action)) {
      const { country, id, patch } = action.payload;
      const after = bucketOf(current, country)?.candidates.find((c) => c.id === id);
      if (!after) return;
      const invited =
        !!patch.onboardingInvitedAt &&
        !bucketOf(original, country)?.candidates.find((c) => c.id === id)
          ?.onboardingInvitedAt;
      const changesFields = sendsFields(patch, CANDIDATE_LOCAL_FIELDS);
      if (!changesFields && !invited) return;
      await send(async () => {
        if (changesFields) await putCandidate(after);
        if (invited) {
          await run(dispatch(candidatesApi.endpoints.sendCandidateToOnboarding.initiate(id)));
          dispatch(api.util.invalidateTags(["Onboarding"]));
        }
      }, invited ? "Could not start onboarding." : "Could not update the applicant.");
      resync();
      return;
    }

    if (reassignCandidate.match(action)) {
      const { ids, employeeId } = action.payload;
      await send(async () => {
        for (const id of ids) {
          await run(
            dispatch(
              candidatesApi.endpoints.assignCandidateOwner.initiate({
                id,
                body: { ownerEmployeeId: employeeId || null },
              }),
            ),
          );
        }
      }, "Could not reassign the applicant.");
      resync();
      return;
    }

    if (moveStage.match(action)) {
      const { country, ids, stage } = action.payload;
      const before = bucketOf(original, country);
      await send(async () => {
        for (const id of ids) {
          // Moving re-activates on the screen; the server needs it restored first.
          if (before?.candidates.find((c) => c.id === id)?.status === "rejected") {
            await run(dispatch(candidatesApi.endpoints.restoreCandidate.initiate(id)));
          }
          await run(
            dispatch(
              candidatesApi.endpoints.moveCandidate.initiate({ id, body: { to: stage } }),
            ),
          );
        }
      }, "Could not move the applicant.");
      resync();
      return;
    }

    if (setCandidateStatus.match(action)) {
      const { country, ids, status } = action.payload;
      const after = bucketOf(current, country);
      await send(async () => {
        for (const id of ids) {
          if (status === "rejected") {
            const reason =
              after?.candidates.find((c) => c.id === id)?.rejectionReason ||
              "Rejected by the hiring team";
            await run(
              dispatch(candidatesApi.endpoints.rejectCandidate.initiate({ id, body: { reason } })),
            );
          } else {
            await run(dispatch(candidatesApi.endpoints.restoreCandidate.initiate(id)));
          }
        }
      }, status === "rejected" ? "Could not reject the applicant." : "Could not restore the applicant.");
      resync();
      return;
    }

    if (sendOffer.match(action)) {
      const { candidateId, salary, startDate, notes } = action.payload;
      await send(
        () =>
          run(
            dispatch(
              candidatesApi.endpoints.makeCandidateOffer.initiate({
                id: candidateId,
                body: {
                  salary: salary ?? null,
                  startDate: startDate || null,
                  notes: notes || null,
                },
              }),
            ),
          ),
        "Could not send the offer.",
      );
      resync();
      return;
    }

    if (respondToOffer.match(action)) {
      const { country, candidateId, accepted, note } = action.payload;
      const offer = bucketOf(original, country)
        ?.candidates.find((c) => c.id === candidateId)
        ?.offers.at(-1);
      if (!offer) return;
      await send(
        () =>
          run(
            dispatch(
              candidatesApi.endpoints.respondToCandidateOffer.initiate({
                id: candidateId,
                offerId: offer.id,
                body: {
                  status: accepted ? "accepted" : "rejected",
                  responseNote: note?.trim() || null,
                },
              }),
            ),
          ),
        "Could not record the response.",
      );
      resync();
      return;
    }

    if (addScorecard.match(action)) {
      const { candidateId, scorecard } = action.payload;
      await send(
        () =>
          run(
            dispatch(
              candidatesApi.endpoints.addCandidateScorecard.initiate({
                id: candidateId,
                body: {
                  interviewId: scorecard.interviewId ?? null,
                  criteria: scorecard.criteria,
                  recommendation: recommendationToApi(scorecard.recommendation),
                  comment: scorecard.comment ?? null,
                },
              }),
            ),
          ),
        "Could not save the scorecard.",
      );
      resync();
      return;
    }

    // ── Interviews ──
    if (scheduleInterview.match(action)) {
      const { country, interview } = action.payload;
      await send(async () => {
        const created = (
          await run(
            dispatch(
              interviewsApi.endpoints.scheduleInterview.initiate(
                interviewToRequest(interview),
              ),
            ),
          )
        ).data;
        dispatch(
          adoptServerId({
            country,
            kind: "interview",
            localId: interview.id,
            serverId: created.id,
          }),
        );
      }, "Could not schedule the interview.");
      resync();
      return;
    }

    if (cancelInterview.match(action)) {
      await send(
        () => run(dispatch(interviewsApi.endpoints.cancelInterview.initiate(action.payload.id))),
        "Could not cancel the interview.",
      );
      resync();
      return;
    }

    if (setInterviewStatus.match(action)) {
      const { id, status } = action.payload;
      if (status === "scheduled") return;
      const ep = interviewsApi.endpoints;
      await send(
        () =>
          run(
            dispatch(
              status === "completed" ? ep.completeInterview.initiate(id) : ep.cancelInterview.initiate(id),
            ),
          ),
        "Could not update the interview.",
      );
      resync();
      return;
    }

    /** Scores each interviewee, closes their interview and moves them on. */
    if (recordInterviewScores.match(action)) {
      const { country, entries, advanceTo } = action.payload;
      const before = bucketOf(original, country);
      await send(async () => {
        for (const entry of entries) {
          const open = before?.interviews.filter(
            (iv) => iv.candidateId === entry.candidateId && iv.status === "scheduled",
          );
          for (const iv of open ?? []) {
            await run(dispatch(interviewsApi.endpoints.completeInterview.initiate(iv.id)));
          }
          await run(
            dispatch(
              candidatesApi.endpoints.addCandidateScorecard.initiate({
                id: entry.candidateId,
                body: {
                  interviewId: open?.[0]?.id ?? null,
                  criteria: [{ label: "Interview", score: entry.score }],
                  recommendation: recommendationToApi(
                    entry.recommendation ?? (entry.score >= 4 ? "yes" : "no"),
                  ),
                  comment: entry.comment?.trim() || null,
                },
              }),
            ),
          );
          if (advanceTo) {
            await run(
              dispatch(
                candidatesApi.endpoints.moveCandidate.initiate({
                  id: entry.candidateId,
                  body: { to: advanceTo },
                }),
              ),
            );
          }
        }
      }, "Could not record the interview scores.");
      resync();
    }
  },
});

"use client";

import { useEffect } from "react";
import { useStore } from "react-redux";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import type { RootState } from "@/src/lib/stores/store";
import {
  replaceFromApi,
  seedBucketFromBundle,
  seedCountry,
  SEED_VERSION,
  type RecruitmentBucket,
} from "@/src/lib/stores/recruitment-slice";
import {
  CANDIDATE_LOCAL_FIELDS,
  mergeLocal,
  REQUISITION_LOCAL_FIELDS,
  toCandidate,
  toInterview,
  toJobRequisition,
} from "@/src/lib/recruitment/api-mapping";
import {
  useGetAllCandidatesQuery,
  useGetAllRequisitionsQuery,
} from "@/src/store/services/collections";
import { useGetInterviewsQuery } from "@/src/store/services/interviews";
import type {
  Candidate,
  JobRequisition,
  PipelineCounters,
} from "@/src/lib/types/recruitment";

const EMPTY: RecruitmentBucket = {
  requisitions: [],
  candidates: [],
  interviews: [],
  templates: [],
};

/**
 * Recruitment data for the active country. Signed in, vacancies, applicants
 * and interviews are mirrored from the API into the recruitment slice the
 * screens read (writes go out through `recruitment-listener`); what the API
 * does not store is kept from the local copy. Signed out, the bucket is
 * seeded once from the locale bundle as before.
 */
export function useRecruitment() {
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const bundle = useAppSelector((s) => s.locale.data);
  const bucket = useAppSelector((s) => s.recruitment.byCountry[country]);
  const live = useAppSelector(
    (s) => s.session.is_loggedIn && !!s.session.tenant_id,
  );

  const requisitions = useGetAllRequisitionsQuery(undefined, { skip: !live });
  const candidates = useGetAllCandidatesQuery(undefined, { skip: !live });
  const interviews = useGetInterviewsQuery(undefined, { skip: !live });

  // The local bucket is read, not depended on: the mirror runs when the
  // server's data changes, and writing it changes the bucket.
  const store = useStore<RootState>();

  useEffect(() => {
    if (live) return;
    // Seed when missing, or reseed once when the demo seed version changed.
    if (bundle && (!bucket || bucket.seedVersion !== SEED_VERSION)) {
      dispatch(seedCountry({ country, bucket: seedBucketFromBundle(bundle) }));
    }
  }, [live, bundle, bucket, country, dispatch]);

  useEffect(() => {
    if (!live || !requisitions.data || !candidates.data || !interviews.data) return;
    const local = store.getState().recruitment.byCountry[country] ?? EMPTY;
    dispatch(
      replaceFromApi({
        country,
        requisitions: mergeLocal(
          requisitions.data.map(toJobRequisition),
          local.requisitions,
          REQUISITION_LOCAL_FIELDS,
        ),
        candidates: mergeLocal(
          candidates.data.map(toCandidate),
          local.candidates,
          CANDIDATE_LOCAL_FIELDS,
        ),
        interviews: (interviews.data.data ?? []).map(toInterview),
      }),
    );
  }, [live, requisitions.data, candidates.data, interviews.data, country, dispatch, store]);

  const waiting =
    live && (!requisitions.data || !candidates.data || !interviews.data);
  return {
    country,
    loading: !bucket || waiting,
    bucket: bucket ?? EMPTY,
  };
}

/** Derive pipeline counters for a requisition from its candidates + offers. */
export function pipelineCounters(
  req: JobRequisition,
  candidates: Candidate[],
): PipelineCounters {
  const mine = candidates.filter((c) => c.requisitionId === req.id);
  const hired = mine.filter((c) => c.stage === "hired").length;
  let offerSent = 0;
  let offerAccepted = 0;
  let offerRejected = 0;
  for (const c of mine) {
    for (const o of c.offers) {
      if (o.status === "sent") offerSent++;
      else if (o.status === "accepted") offerAccepted++;
      else if (o.status === "rejected") offerRejected++;
    }
  }
  return {
    openings: req.openings,
    hired,
    remaining: Math.max(0, req.openings - hired),
    offerSent,
    offerAccepted,
    offerRejected,
  };
}

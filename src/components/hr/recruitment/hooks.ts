"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  seedBucketFromBundle,
  seedCountry,
  SEED_VERSION,
  type RecruitmentBucket,
} from "@/src/lib/stores/recruitment-slice";
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
 * Recruitment data for the active country. The bucket is seeded once from the
 * locale bundle (per country) and thereafter mutated through the recruitment
 * slice, so the country switcher keeps working while edits persist.
 */
export function useRecruitment() {
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const bundle = useAppSelector((s) => s.locale.data);
  const bucket = useAppSelector((s) => s.recruitment.byCountry[country]);

  useEffect(() => {
    // Seed when missing, or reseed once when the demo seed version changed.
    if (bundle && (!bucket || bucket.seedVersion !== SEED_VERSION)) {
      dispatch(seedCountry({ country, bucket: seedBucketFromBundle(bundle) }));
    }
  }, [bundle, bucket, country, dispatch]);

  return {
    country,
    loading: !bucket,
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

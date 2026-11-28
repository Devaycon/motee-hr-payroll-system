"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { ohCaseFromApi } from "@/src/lib/occupational-health/api-mapping";
import { replaceOhFromApi } from "@/src/lib/stores/sickness-slice";
import { useGetAllOhReferralsQuery } from "@/src/store/services/collections";
import { OH_REFERRALS } from "@/src/data/occupational-health-demo";
import type { OHReferral } from "@/src/lib/types/occupational-health";
import type { SicknessRecord } from "@/src/lib/types/sickness";

export type MergedReferral = OHReferral & { linkedSicknessIds: string[] };

/**
 * OH cases: the demo set with HR's edits applied, plus cases referred
 * straight from a sickness absence. Each carries the sickness records it is
 * linked to, so OH and Sickness & Absence share one story.
 */
export function useOHReferrals(): MergedReferral[] {
  // Signed in: the OH cases on the API are mirrored into the sickness slice
  // (writes go out through oh-api-listener) and the demo set is left out.
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const q = useGetAllOhReferralsQuery(undefined, { skip: !live });
  useEffect(() => {
    if (live && q.data) dispatch(replaceOhFromApi(q.data.map((c) => ohCaseFromApi(c))));
  }, [live, q.data, dispatch]);
  const edits = useAppSelector((s) => s.sickness.ohEdits);
  const own = useAppSelector((s) => s.sickness.ohCases);
  const records = useAppSelector((s) => s.sickness.records);
  return useMemo(() => {
    const linked = (id: string, extra: string[] = []) =>
      [...new Set([...records.filter((r: SicknessRecord) => r.ohReferralId === id).map((r) => r.id), ...extra])];
    const demo = (live ? [] : OH_REFERRALS).map((r) => {
      const e = edits[r.id] ?? {};
      return { ...r, ...e, linkedSicknessIds: linked(r.id, e.linkedSicknessIds) };
    });
    return [...own.map((r) => ({ ...r, linkedSicknessIds: linked(r.id, r.linkedSicknessIds) })), ...demo];
  }, [live, edits, own, records]);
}

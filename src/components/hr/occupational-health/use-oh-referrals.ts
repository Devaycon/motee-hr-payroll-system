"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
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
  const edits = useAppSelector((s) => s.sickness.ohEdits);
  const own = useAppSelector((s) => s.sickness.ohCases);
  const records = useAppSelector((s) => s.sickness.records);
  return useMemo(() => {
    const linked = (id: string, extra: string[] = []) =>
      [...new Set([...records.filter((r: SicknessRecord) => r.ohReferralId === id).map((r) => r.id), ...extra])];
    const demo = OH_REFERRALS.map((r) => {
      const e = edits[r.id] ?? {};
      return { ...r, ...e, linkedSicknessIds: linked(r.id, e.linkedSicknessIds) };
    });
    return [...own.map((r) => ({ ...r, linkedSicknessIds: linked(r.id) })), ...demo];
  }, [edits, own, records]);
}

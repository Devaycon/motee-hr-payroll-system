"use client";

import { useEffect } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { isServerId, useIsLive } from "@/src/lib/live/use-is-live";
import { caseFromApi, caseFromRow } from "@/src/lib/er-cases/api-mapping";
import { replaceFromApi, upsertFromApi } from "@/src/lib/stores/er-cases-slice";
import { useGetAllErCasesQuery } from "@/src/store/services/collections";
import {
  useGetErCaseActivityQuery,
  useGetErCaseQuery,
  useGetMyErCasesQuery,
} from "@/src/store/services/er-cases";
import type { ERCase } from "@/src/lib/types/grievance";
import { buildCases } from "./build-cases";

/** The demo seed. Signed in the slice is filled from the API instead. */
export function useCasesData() {
  return useLocaleSection<ERCase[]>(buildCases);
}

/**
 * Signed in: mirrors the case register into the shared ER slice — every case
 * for HR, or the caller's own (`/er-cases/mine`) for self-service. Returns
 * whether the API is in play, so callers skip the demo seed.
 */
export function useErCasesLive(scope: "all" | "mine" = "all"): boolean {
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const all = useGetAllErCasesQuery(undefined, { skip: !live || scope !== "all" });
  const mine = useGetMyErCasesQuery({ PageSize: 200 }, { skip: !live || scope !== "mine" });
  const rows = scope === "all" ? all.data : mine.data?.data?.items;
  useEffect(() => {
    if (!live || !rows) return;
    dispatch(replaceFromApi({ country, cases: rows.map(caseFromRow) }));
  }, [live, rows, country, dispatch]);
  return live;
}

/** Signed in: reads one case's full detail (notes, meetings, evidence, activity) into the slice. */
export function useErCaseDetailLive(id: string) {
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const skip = !live || !isServerId(id);
  const detail = useGetErCaseQuery(id, { skip });
  const activity = useGetErCaseActivityQuery(id, { skip });
  useEffect(() => {
    const dto = detail.data?.data;
    if (!dto) return;
    dispatch(upsertFromApi({ country, case: caseFromApi(dto, activity.data?.data ?? []) }));
  }, [detail.data, activity.data, country, dispatch]);
  return live;
}

"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  backfillWorkforceRequests,
  buildChainForOnboarding,
  buildHiringChain,
} from "@/src/lib/demo/hiring-chain";
import { mergeSeed as mergeRequisitions } from "@/src/lib/stores/requisitions-slice";
import { mergeSeed as mergeWorkforceRequests } from "@/src/lib/stores/workforce-requests-slice";
import { useRecruitment } from "@/src/components/hr/recruitment/hooks";
import {
  findHiringDetail,
  resolveHiringRows,
  type HiringDetail,
  type HiringRow,
  type HiringSources,
  type HiringStageId,
} from "@/src/lib/hiring/resolve-stage";
import { useGetHireTrackerQuery } from "@/src/store/services/hire-tracker";
import type { HiringStage as ApiHiringStage } from "@/src/types/hire-tracker";

/**
 * The tracker's view of the world: the real slices, plus the chain back-filled
 * for anything that would otherwise start halfway through the process.
 *
 * The synthetic vacancy and candidate minted for an unlinked onboarding record
 * live here and are deliberately never dispatched. Recruitment should not gain
 * a vacancy nobody ever advertised just so a timeline reads nicely.
 */
function useHiringSources(): HiringSources {
  const country = useAppSelector((s) => s.locale.country);
  const workforceRequests = useAppSelector(
    (s) => s.workforceRequests.byCountry[country],
  );
  const requisitions = useAppSelector((s) => s.requisitions.byCountry[country]);
  const recruitment = useAppSelector((s) => s.recruitment.byCountry[country]);
  const onboarding = useAppSelector((s) => s.onboardingRecords.records);

  return useMemo(() => {
    const vacancies = recruitment?.requisitions ?? [];
    const candidates = recruitment?.candidates ?? [];

    // A hire that already came through a pipeline needs nothing minted.
    const linked = new Set(candidates.map((c) => c.id));
    const backfill = buildChainForOnboarding(onboarding, linked);

    const allRequisitions = [...(requisitions ?? []), ...backfill.requisitions];
    const allWorkforceRequests = [
      ...(workforceRequests ?? []),
      ...backfill.workforceRequests,
    ];

    return {
      workforceRequests: [
        ...allWorkforceRequests,
        // Last hole: a requisition whose workforce request has not loaded yet.
        ...backfillWorkforceRequests(allRequisitions, allWorkforceRequests),
      ],
      requisitions: allRequisitions,
      vacancies: [...vacancies, ...backfill.vacancies],
      candidates: [...candidates, ...backfill.candidates],
      onboarding,
    };
  }, [workforceRequests, requisitions, recruitment, onboarding]);
}

/**
 * Every hiring effort in the country, resolved to one lifecycle stage each.
 *
 * Reads the same five slices the individual modules read — this page owns no
 * data of its own, it just joins them up, which is the one thing none of them
 * could do alone.
 */
export function useHiringRows(): HiringRow[] {
  const sources = useHiringSources();
  const server = useServerHiringRows();
  // The server joins the chain itself; the local join covers the wait for it.
  return useMemo(
    () => server?.map((s) => s.row) ?? resolveHiringRows(sources),
    [server, sources],
  );
}

const STAGE_FROM_API: Record<ApiHiringStage, HiringStageId> = {
  workforcePlanning: "workforce-planning",
  requisition: "requisition",
  attract: "attract",
  select: "select",
  preEmployment: "pre-employment",
  onboard: "onboard",
};

/** Every hiring effort as the server tracks it, one lifecycle stage each. */
function useServerHiringRows() {
  const { data } = useGetHireTrackerQuery();
  return useMemo(
    () =>
      data?.data?.map((dto) => ({
        dto,
        row: {
          id: dto.id,
          title: dto.title,
          department: dto.departmentName ?? "—",
          stageId: STAGE_FROM_API[dto.stage] ?? "workforce-planning",
          step: dto.step,
          detail: dto.detail,
          person: dto.person ?? undefined,
          owner: dto.hiringManagerName ?? "—",
          days: dto.daysSinceMoved,
          stalled: dto.stalled,
          href: `/talent/hire-tracker/${encodeURIComponent(dto.id)}`,
        } satisfies HiringRow,
      })) ?? null,
    [data],
  );
}

/** Everything behind one tracker row, for its detail page. */
export function useHiringDetail(id: string): HiringDetail | null {
  const sources = useHiringSources();
  const server = useServerHiringRows();
  return useMemo(() => {
    const local = findHiringDetail(sources, id);
    if (local) return local;
    // A server row: its linked records, where this device holds them.
    const hit = server?.find((s) => s.row.id === id);
    if (!hit) return null;
    const { dto, row } = hit;
    const requisition = dto.requisitionId
      ? sources.requisitions.find((r) => r.id === dto.requisitionId)
      : undefined;
    const workforceRequest = dto.workforceRequestId
      ? sources.workforceRequests.find((w) => w.id === dto.workforceRequestId)
      : undefined;
    return { row, requisition, workforceRequest, candidates: [], onboarding: [] };
  }, [sources, server, id]);
}

/**
 * Make sure every real vacancy's ancestors exist in their own modules.
 *
 * The recruitment seed links each vacancy to a requisition and a workforce
 * request, but those two slices seed themselves lazily from unrelated demo
 * files — so the ids the vacancy points at would dangle until someone happened
 * to visit those pages. This puts the records where they belong, additively,
 * so Workforce Requests and Requisition show the same chain the tracker does.
 *
 * Only real vacancies are back-filled this way; the ones minted for orphan
 * onboarding records stay inside the tracker.
 */
export function useHiringChainSeed(): void {
  const dispatch = useAppDispatch();
  const { country, bucket } = useRecruitment();
  const requisitions = useAppSelector((s) => s.requisitions.byCountry[country]);
  const workforceRequests = useAppSelector(
    (s) => s.workforceRequests.byCountry[country],
  );

  const chain = useMemo(
    () => buildHiringChain(bucket.requisitions),
    [bucket.requisitions],
  );

  useEffect(() => {
    if (chain.requisitions.length === 0) return;

    const knownReqs = new Set((requisitions ?? []).map((r) => r.id));
    const missingReqs = chain.requisitions.filter((r) => !knownReqs.has(r.id));
    if (missingReqs.length > 0) {
      dispatch(mergeRequisitions({ country, requisitions: missingReqs }));
    }

    const knownWfrs = new Set((workforceRequests ?? []).map((r) => r.id));
    const missingWfrs = chain.workforceRequests.filter(
      (r) => !knownWfrs.has(r.id),
    );
    if (missingWfrs.length > 0) {
      dispatch(mergeWorkforceRequests({ country, requests: missingWfrs }));
    }
  }, [chain, requisitions, workforceRequests, country, dispatch]);
}

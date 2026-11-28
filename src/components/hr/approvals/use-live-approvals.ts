"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { isServerId, useIsLive } from "@/src/lib/live/use-is-live";
import { approvalRequestFromApi } from "@/src/lib/approvals/api-mapping";
import {
  replaceRequestsFromApi,
  upsertRequestsFromApi,
} from "@/src/lib/stores/approvals-slice";
import {
  useGetAllApprovalsQuery,
  useGetAllMyApprovalQueueQuery,
  useGetAllMyApprovalsQuery,
} from "@/src/store/services/collections";
import { useGetApprovalQuery } from "@/src/store/services/approvals";
import type { ApprovalDto } from "@/src/types/common";

function useDirectory() {
  const employees = useAppSelector((s) => s.locale.data?.employees);
  return useMemo(
    () =>
      (employees ?? []).map((e) => ({
        id: e.id,
        fullName: e.fullName,
        departmentName: e.departmentName,
        email: e.email,
      })),
    [employees],
  );
}

/**
 * Signed in, mirrors the server's approvals into the approvals slice for the
 * Submissions screens:
 *
 * - HR: every approval in the tenant (GET /approvals) plus the viewer's queue.
 * - Self-service: what the viewer raised (GET /approvals/mine) plus their queue
 *   (GET /approvals/my-queue), so a manager still sees what waits on them.
 *
 * An HR viewer the register refuses falls back to the self-service pair.
 * Returns whether the page is live and still loading its first read.
 */
export function useLiveApprovals(variant: "hr" | "employee") {
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const directory = useDirectory();

  const register = useGetAllApprovalsQuery(undefined, { skip: !live || variant !== "hr" });
  const useOwn = live && (variant === "employee" || !!register.error);
  const mine = useGetAllMyApprovalsQuery(undefined, { skip: !useOwn });
  const queue = useGetAllMyApprovalQueueQuery(undefined, { skip: !live });

  useEffect(() => {
    if (!live) return;
    const sources: (ApprovalDto[] | undefined)[] = useOwn
      ? [mine.data, queue.data]
      : [register.data, queue.data];
    if (sources.some((s) => s === undefined)) return;
    const byId = new Map<string, ApprovalDto>();
    for (const list of sources) for (const dto of list ?? []) byId.set(dto.id, dto);
    dispatch(
      replaceRequestsFromApi(
        [...byId.values()].map((dto) => approvalRequestFromApi(dto, directory)),
      ),
    );
  }, [live, useOwn, register.data, mine.data, queue.data, directory, dispatch]);

  const loading =
    live &&
    (queue.isLoading || (useOwn ? mine.isLoading : register.isLoading));
  return { live, loading };
}

/** Signed in, keeps one server approval (the detail page's) in the slice. */
export function useLiveApproval(id: string) {
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const directory = useDirectory();
  const server = live && isServerId(id);
  const q = useGetApprovalQuery(id, { skip: !server });
  useEffect(() => {
    if (server && q.data?.data) {
      dispatch(upsertRequestsFromApi([approvalRequestFromApi(q.data.data, directory)]));
    }
  }, [server, q.data, directory, dispatch]);
  return { live: server, error: server && !!q.error };
}

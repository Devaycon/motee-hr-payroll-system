"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  replaceAllRequestsFromApi,
  seedRequests,
} from "@/src/lib/stores/profile-edits-slice";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { useUnscopedLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { changeRequestsFromApi } from "@/src/lib/profile/change-request-mapping";
import { demoChangeRequests } from "@/src/data/profile-change-requests-demo";
import { useGetAllChangeRequestsQuery } from "@/src/store/services/collections";
import { getApiErrorMessage } from "@/src/lib/utils";
import type { ChangeRequest } from "@/src/lib/types/profile-edits";
import type { LocaleEmployee } from "@/src/lib/types/locale";

/** A request with the employee it is about, for the company-wide queue. */
export interface QueueRow extends ChangeRequest {
  employeeName: string;
  departmentName: string;
  gender?: string;
}

/** How many employees the signed-out demo gives a change history. */
const DEMO_EMPLOYEES = 8;

/**
 * Every profile change request in the company, newest first.
 *
 * The rows live in the profile-edits slice, the same place each profile's
 * Change Request Log reads, so a decision made here or there shows in both
 * and goes to the API the same way (`change-requests-api-listener`).
 * Signed in, the slice is filled from `GET /change-requests`; signed out, a
 * few employees are given the demo history their profiles already show.
 */
export function useChangeRequestQueue() {
  const dispatch = useAppDispatch();
  const live = useIsLive();
  const { data: employees } = useUnscopedLocaleSection<LocaleEmployee[]>(
    (b) => b.employees,
  );
  const query = useGetAllChangeRequestsQuery(undefined, { skip: !live });
  const requests = useAppSelector((s) => s.profileEdits.requests);

  useEffect(() => {
    if (!live || !query.data) return;
    dispatch(replaceAllRequestsFromApi(changeRequestsFromApi(query.data)));
  }, [dispatch, live, query.data]);

  useEffect(() => {
    if (live || !employees) return;
    for (const e of employees.slice(0, DEMO_EMPLOYEES)) {
      dispatch(seedRequests(demoChangeRequests(e.id, e.fullName)));
    }
  }, [dispatch, live, employees]);

  const rows = useMemo<QueueRow[]>(() => {
    const byId = new Map((employees ?? []).map((e) => [e.id, e] as const));
    // The server names the employee on each request; the directory adds the
    // department and the avatar.
    const names = new Map(
      (query.data ?? []).map((d) => [d.employeeId, d.employeeName] as const),
    );
    return requests
      .map((r) => {
        const e = byId.get(r.employeeId);
        return {
          ...r,
          employeeName: e?.fullName ?? names.get(r.employeeId) ?? r.requestedBy,
          departmentName: e?.departmentName ?? "",
          gender: e?.gender,
        };
      })
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }, [requests, employees, query.data]);

  return {
    rows,
    loading: live ? query.isLoading : !employees,
    error: live && query.error ? getApiErrorMessage(query.error) : null,
  };
}

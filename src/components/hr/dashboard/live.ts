"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  useGetAttendanceDashboardQuery,
  useGetPeopleDashboardQuery,
} from "@/src/store/services/dashboard";
import type {
  AttendanceDashboardDto,
  PeopleDashboardDto,
} from "@/src/types/dashboard";

/** True once the viewer is signed in to a tenant, i.e. the API is in play. */
export function useDashboardLive(): boolean {
  return useAppSelector((s) => s.session.is_loggedIn && !!s.session.tenant_id);
}

/**
 * The server's dashboard figures. Signed out both are undefined and the
 * dashboard hooks keep computing from the locale bundle.
 */
export function useLiveDashboard(): {
  live: boolean;
  people?: PeopleDashboardDto;
  attendance?: AttendanceDashboardDto;
  loading: boolean;
} {
  const live = useDashboardLive();
  const people = useGetPeopleDashboardQuery(undefined, { skip: !live });
  const attendance = useGetAttendanceDashboardQuery(undefined, { skip: !live });
  return {
    live,
    people: people.data?.data,
    attendance: attendance.data?.data,
    loading: live && (people.isLoading || attendance.isLoading),
  };
}

/**
 * A dashboard hook's result with the live figure laid over it. While signed
 * in the bundle figure is never shown: until the API answers it reads as
 * loading.
 */
export function withLive<B extends { data: unknown; loading: boolean }>(
  base: B,
  live: boolean,
  liveData: B["data"] | undefined,
): B {
  if (!live) return base;
  return { ...base, data: liveData ?? null, loading: liveData == null };
}

export function shortMonth(isoOrMonth: string): string {
  const date = isoOrMonth.length === 7 ? `${isoOrMonth}-01` : isoOrMonth.slice(0, 10);
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { month: "short" });
}

export function shortDay(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", {
    month: "short",
    day: "2-digit",
  });
}

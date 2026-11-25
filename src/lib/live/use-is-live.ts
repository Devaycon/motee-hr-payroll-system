"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import api from "@/src/store/services/api";

type TagType = Parameters<typeof api.util.invalidateTags>[0][number] & string;
import { getApiErrorMessage } from "@/src/lib/utils";

/**
 * True once the viewer is signed in to a tenant, i.e. the API is in play.
 * Signed out, screens keep running on the demo bundle.
 */
export function useIsLive(): boolean {
  return useAppSelector((s) => s.session.is_loggedIn && !!s.session.tenant_id);
}

/** The signed-in user's employee record id ("" when they have none). */
export function useMyEmployeeId(): string {
  return useAppSelector((s) => s.auth.user?.employeeId ?? "");
}

/**
 * Wraps an API call for an action hook: resolves `true` on success, shows the
 * server's message (or the fallback) and resolves `false` on failure.
 */
export function useApiRunner() {
  return useCallback(
    async (call: () => Promise<unknown>, failure: string): Promise<boolean> => {
      try {
        await call();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, failure));
        return false;
      }
    },
    [],
  );
}

/**
 * For screens that change their local copy first and send the change after:
 * a refused call shows the server's message and refetches the given tags, so
 * the local copy is replaced by the server's again. Resolves true on success.
 */
export function useLiveSender(tags: readonly TagType[]) {
  const dispatch = useAppDispatch();
  const key = tags.join("|");
  return useCallback(
    async (call: () => Promise<unknown>, failure: string): Promise<boolean> => {
      try {
        await call();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, failure));
        dispatch(api.util.invalidateTags(key.split("|") as TagType[]));
        return false;
      }
    },
    [dispatch, key],
  );
}

/** The directory (live employees when signed in), for name ↔ id lookups. */
export function usePeopleDirectory() {
  const employees = useAppSelector((s) => s.locale.data?.employees);
  return useMemo(() => {
    const list = employees ?? [];
    const byId = new Map(list.map((e) => [e.id, e]));
    const byName = new Map(list.map((e) => [e.fullName.trim().toLowerCase(), e]));
    return {
      list,
      byId,
      /** The employee id for a display name, or undefined when unknown. */
      idOf: (name: string | null | undefined) =>
        name ? byName.get(name.trim().toLowerCase())?.id : undefined,
    };
  }, [employees]);
}

/** Unwraps `{ data: { data } }` from an RTK Query result. */
export function payload<T>(result: { data?: { data?: T | null } | undefined }): T | undefined {
  return result.data?.data ?? undefined;
}

/** Server ids are UUIDs; demo/local ids are not. */
export function isServerId(id: string | null | undefined): id is string {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

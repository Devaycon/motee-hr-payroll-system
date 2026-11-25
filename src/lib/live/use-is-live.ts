"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
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

/** Unwraps `{ data: { data } }` from an RTK Query result. */
export function payload<T>(result: { data?: { data?: T | null } | undefined }): T | undefined {
  return result.data?.data ?? undefined;
}

/** Server ids are UUIDs; demo/local ids are not. */
export function isServerId(id: string | null | undefined): id is string {
  return !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

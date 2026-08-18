"use client";

import type { Route } from "./routes";
import { getModuleByLink } from "@/src/lib/permissions/modules";
import { useEffectiveAccess } from "@/src/lib/permissions/use-can";

/**
 * Links every HR user can see regardless of access level. The `/my-*` entries
 * were removed when self-service moved out of the admin shell (§4.3).
 */
const PERSONAL_LINKS = new Set<string>([
  "/welcome",
  "/hr",
  "/hr-action-center",
  "/hr-action-center/tasks",
  "/hr-action-center/events",
  "/hr-action-center/workflows",
  "/hr-action-center/submissions",
]);

/**
 * Reads through the shared permission seam rather than the user's primary role
 * directly, so the sidebar honours a §1.10 "Test as Role" preview and the
 * §1.13 multi-role union. Resolving it separately here is how the sidebar ends
 * up disagreeing with the page it navigates to.
 */
export function useVisibleRoutes(routes: Route[]): Route[] {
  const access = useEffectiveAccess();

  // No resolvable role (pre-login, demo links) — show everything, as before.
  if (access.unresolved) return routes;

  return routes.filter((route) => {
    if (PERSONAL_LINKS.has(route.link)) return true;
    const moduleEntry = getModuleByLink(route.link);
    if (!moduleEntry) return true;
    const perm = access.permissions.find((p) => p.module === moduleEntry.id);
    return perm?.access === true;
  });
}

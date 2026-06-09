"use client";

import type { Route } from "./routes";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { getModuleByLink } from "@/src/lib/permissions/modules";

const PERSONAL_LINKS = new Set<string>([
  "/welcome",
  "/hr",
  "/hr-action-center",
  "/hr-action-center/tasks",
  "/hr-action-center/events",
  "/hr-action-center/workflows",
  "/hr-action-center/submissions",
  "/my-profile/profile",
  "/my-profile/documents",
  "/my-profile/assets",
  "/my-profile/contracts",
  "/my-time-off/request",
  "/my-time-off/balance",
  "/my-time-off/attendance",
  "/my-growth/performance",
  "/my-growth/training",
]);

export function useVisibleRoutes(routes: Route[]): Route[] {
  const accessLevelId = useAppSelector((s) => s.auth.user?.accessLevelId);
  const levels = useAppSelector((s) => s.accessLevels.levels);

  if (!accessLevelId) return routes;
  const level = levels.find((l) => l.id === accessLevelId);
  if (!level) return routes;

  return routes.filter((route) => {
    if (PERSONAL_LINKS.has(route.link)) return true;
    const moduleEntry = getModuleByLink(route.link);
    if (!moduleEntry) return true;
    const perm = level.permissions.find((p) => p.module === moduleEntry.id);
    return perm?.access === true;
  });
}

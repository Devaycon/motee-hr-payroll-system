"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";
import type { PermissionAction } from "@/src/lib/types/access-levels";

/**
 * `useCan("organization.employees", "create")` → `true` if the active user's
 * access level has both `access: true` AND the action listed for that module.
 *
 * When no user is logged in (demo links bypass) the hook returns `true` so
 * pre-login UI isn't broken. When the user's access level isn't in the store
 * it also falls open.
 */
export function useCan(moduleId: string, action: PermissionAction): boolean {
  const accessLevelId = useAppSelector((s) => s.auth.user?.accessLevelId);
  const levels = useAppSelector((s) => s.accessLevels.levels);

  if (!accessLevelId) return true;
  const level = levels.find((l) => l.id === accessLevelId);
  if (!level) return true;
  const perm = level.permissions.find((p) => p.module === moduleId);
  if (!perm?.access) return false;
  return perm.actions.includes(action);
}

export function useCanAny(
  moduleId: string,
  actions: PermissionAction[],
): boolean {
  const accessLevelId = useAppSelector((s) => s.auth.user?.accessLevelId);
  const levels = useAppSelector((s) => s.accessLevels.levels);

  if (!accessLevelId) return true;
  const level = levels.find((l) => l.id === accessLevelId);
  if (!level) return true;
  const perm = level.permissions.find((p) => p.module === moduleId);
  if (!perm?.access) return false;
  return actions.some((a) => perm.actions.includes(a));
}

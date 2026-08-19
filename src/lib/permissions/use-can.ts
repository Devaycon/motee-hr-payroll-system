"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";
import type { DataScope, PermissionAction } from "@/src/lib/types/access-levels";
import {
  allows,
  allowsAny,
  findConflicts,
  findScopeConflict,
  resolveEffectiveLevel,
  type EffectiveAccess,
  type PermissionConflict,
  type ScopeConflict,
} from "./resolve";

/**
 * The user's resolved access — the union of every role they hold (§1.13), or
 * the previewed role when "Test as Role" is on (§1.10). Every permission hook
 * below is a thin read off this, so the merge rules live in exactly one place.
 */
export function useEffectiveAccess(): EffectiveAccess {
  const accessLevelId = useAppSelector((s) => s.auth.user?.accessLevelId);
  const accessLevelIds = useAppSelector((s) => s.auth.user?.accessLevelIds);
  const previewLevelId = useAppSelector((s) => s.accessLevels.previewLevelId);
  const levels = useAppSelector((s) => s.accessLevels.levels);
  // §4.14 — the account's own state, which overrides whatever its roles grant.
  const roleId = useAppSelector((s) => s.auth.user?.roleId);
  const accountState = useAppSelector((s) =>
    roleId ? s.users.overrides[roleId]?.state : undefined,
  );

  return resolveEffectiveLevel(levels, {
    accessLevelId,
    accessLevelIds,
    previewLevelId,
    accountState,
  });
}

/**
 * `useCan("organization.employees", "create")` → `true` if the user's resolved
 * access has both `access: true` AND the action listed for that module.
 *
 * When no user is logged in (demo links bypass) or the roles aren't in the
 * store yet, this falls open so pre-login UI isn't broken.
 */
export function useCan(moduleId: string, action: PermissionAction): boolean {
  return allows(useEffectiveAccess(), moduleId, action);
}

export function useCanAny(
  moduleId: string,
  actions: PermissionAction[],
): boolean {
  return allowsAny(useEffectiveAccess(), moduleId, actions);
}

/**
 * The user's record-level scope (§1.4) — what to filter a list by once the
 * module itself is open. With several roles this is the *narrowest* of them
 * (§1.13), never the widest.
 */
export function useDataScope(): DataScope {
  return useEffectiveAccess().dataScope;
}

/** §1.10 — the role currently being previewed, or null. */
export function usePreviewedLevel() {
  const access = useEffectiveAccess();
  return access.previewing ? (access.sourceLevels[0] ?? null) : null;
}

/** §1.13 — where the user's roles disagree, for the conflict panel. */
export function useRoleConflicts(): {
  permissions: PermissionConflict[];
  scope: ScopeConflict | null;
  roleNames: string[];
} {
  const access = useEffectiveAccess();
  return {
    permissions: findConflicts(access.sourceLevels),
    scope: findScopeConflict(access.sourceLevels),
    roleNames: access.sourceLevels.map((l) => l.name),
  };
}

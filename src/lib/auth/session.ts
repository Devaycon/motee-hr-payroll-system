"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { logout as clearUser, setUser } from "@/src/lib/stores/auth-slice";
import { clearLocaleData } from "@/src/lib/stores/locale-slice";
import api from "@/src/store/services/api";
import {
  useGetCurrentUserQuery,
  useLogoutMutation,
} from "@/src/store/services/auth";
import { useGetUsersQuery } from "@/src/store/services/users";
import { logout as clearSession } from "@/src/store/reducers/authSlice";
import type { AuthUser } from "@/src/lib/types/locale";
import type { CurrentUserData } from "@/src/types/auth";
import type { TenantUser } from "@/src/types/users";

export const LOGIN_PATH = "/auth/login";
export const SETUP_PATH = "/onboarding";
export const HOME_PATH = "/welcome";
export const PLATFORM_PATH = "/tenants";

interface SessionShape {
  tenant_id?: string | null;
  onboarding_completed?: boolean;
}

/** Where a signed-in session belongs. */
export function landingPathForSession(session: SessionShape): string {
  // Platform staff are the only accounts that belong to no tenant.
  if (session.tenant_id === null) return PLATFORM_PATH;
  if (session.onboarding_completed === false) return SETUP_PATH;
  return HOME_PATH;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * The signed-in person as the rest of the app reads them. `/users` is the
 * source for name and roles; `/auth/me` fills in whatever it carries.
 */
export function buildSessionUser(
  userId: string,
  me: CurrentUserData | undefined,
  account: TenantUser | undefined,
): AuthUser {
  const email = account?.email ?? me?.email ?? "";
  const name = account?.name ?? me?.name ?? (email || "Account");
  const primary = account?.accessLevels[0];
  const isOwner = account?.isOwner ?? me?.isOwner ?? false;
  const roleName = isOwner
    ? "Owner"
    : (primary?.name ?? me?.role ?? "Member");

  return {
    roleId: primary?.id ?? userId,
    roleName,
    accessLevelId: primary?.id ?? "",
    accessLevelIds: account?.accessLevels.map((level) => level.id) ?? [],
    isOwner,
    name,
    email,
    employeeId: account?.employeeId ?? me?.employeeId ?? "",
    initials: account?.initials || initialsOf(name),
    jobTitle: account?.jobTitle ?? roleName,
    departmentName: account?.departmentName ?? "",
  };
}

/**
 * Resolves the session into `auth.user`. Mounted by every signed-in shell, so
 * a cold load with a persisted token ends up with the same identity a fresh
 * sign-in does.
 */
export function useSessionUser(): AuthUser | null {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector((s) => s.session.is_loggedIn);
  const userId = useAppSelector((s) => s.session.user_id);
  const tenantId = useAppSelector((s) => s.session.tenant_id);
  const user = useAppSelector((s) => s.auth.user);

  const { data: me, isLoading: meLoading } = useGetCurrentUserQuery(undefined, {
    skip: !isLoggedIn,
  });
  // Tenant accounts only: platform staff have no tenant to list users from.
  const { data: users, isLoading: usersLoading } = useGetUsersQuery(undefined, {
    skip: !isLoggedIn || !tenantId,
  });

  const resolved = useMemo(() => {
    if (!isLoggedIn || !userId || meLoading || usersLoading) return null;
    const account = users?.data?.find((u) => u.id === userId);
    return buildSessionUser(userId, me?.data ?? undefined, account);
  }, [isLoggedIn, userId, me, users, meLoading, usersLoading]);

  useEffect(() => {
    if (resolved) dispatch(setUser(resolved));
  }, [resolved, dispatch]);

  return isLoggedIn ? (user ?? resolved) : null;
}

export function useLogout(): () => Promise<void> {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logoutRequest] = useLogoutMutation();

  return useCallback(async () => {
    // The local session ends whether or not the server call succeeds.
    await logoutRequest().catch(() => undefined);
    dispatch(clearSession());
    dispatch(clearUser());
    dispatch(clearLocaleData());
    dispatch(api.util.resetApiState());
    router.replace(LOGIN_PATH);
  }, [dispatch, logoutRequest, router]);
}

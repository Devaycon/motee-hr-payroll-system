"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { loadLocale } from "@/src/lib/stores/locale-slice";
import { buildAuthUser, setUser } from "@/src/lib/stores/auth-slice";
import type { AuthUser } from "@/src/lib/types/locale";

/**
 * The one persona both portals fall back to when nobody has signed in.
 *
 * `auth` isn't persisted, so a hard refresh (or landing straight on a portal
 * URL) used to leave each shell inventing its own identity — the admin portal
 * said "Admin Officer" while self-service said "James Adeyemi", so the
 * Admin/Self-Service switch looked like it changed *who you were*. Resolving
 * both from the same role keeps one person across the two portals.
 */
export const DEMO_IDENTITY_ROLE_ID = "ROLE-HRADMIN";

/** Shown for the instant before the locale bundle resolves the real record. */
export const DEMO_IDENTITY_PLACEHOLDER = {
  name: "Motee User",
  initials: "MU",
  jobTitle: "HR Admin",
} as const;

/**
 * The signed-in user, falling back to {@link DEMO_IDENTITY_ROLE_ID}.
 *
 * Seeds the fallback into the store as well as returning it, so everything that
 * reads `auth.user` directly — permissions, My Profile, the leave planner —
 * resolves to the same person rather than to its own default.
 */
export function useCurrentUser(): AuthUser | null {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const bundle = useAppSelector((s) => s.locale.data);
  const status = useAppSelector((s) => s.locale.status);
  const country = useAppSelector((s) => s.locale.country);

  const fallback =
    !user && bundle ? buildAuthUser(bundle, DEMO_IDENTITY_ROLE_ID) : null;

  useEffect(() => {
    if (!user && !bundle && status === "idle") dispatch(loadLocale(country));
  }, [user, bundle, status, country, dispatch]);

  useEffect(() => {
    if (fallback) dispatch(setUser(fallback));
  }, [fallback, dispatch]);

  return user ?? fallback;
}

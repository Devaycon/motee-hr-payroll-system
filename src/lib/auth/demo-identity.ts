"use client";

import { useSessionUser } from "@/src/lib/auth/session";
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

/**
 * The persona chosen with the navbar's "View as" switch.
 *
 * `auth` is deliberately not persisted, so only the *choice* is stored here -
 * a role id, resolved to a user from the locale bundle exactly as a login
 * would be. Without it every refresh snaps back to HR Admin, and a per-person
 * inbox looks like one person owning everything, which is the impression the
 * whole change exists to remove.
 */
const DEMO_ROLE_KEY = "motee:demoRole";

export function readDemoRoleId(): string {
  if (typeof window === "undefined") return DEMO_IDENTITY_ROLE_ID;
  try {
    return window.localStorage.getItem(DEMO_ROLE_KEY) ?? DEMO_IDENTITY_ROLE_ID;
  } catch {
    return DEMO_IDENTITY_ROLE_ID;
  }
}

export function writeDemoRoleId(roleId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_ROLE_KEY, roleId);
  } catch {
    // ignore
  }
}

/** Shown for the instant before the locale bundle resolves the real record. */
export const DEMO_IDENTITY_PLACEHOLDER = {
  name: "Motee User",
  initials: "MU",
  jobTitle: "HR Admin",
} as const;

/**
 * The signed-in user, resolved from the API session. Kept at this path because
 * every shell and several screens already import it from here.
 */
export function useCurrentUser(): AuthUser | null {
  return useSessionUser();
}

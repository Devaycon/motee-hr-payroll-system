import type { AuthUser } from "@/src/lib/types/locale";

const EMPLOYEE_PORTAL = "/employee/dashboard";
const HR_PORTAL = "/hr";

/**
 * Roles / access levels whose users live in the employee self-service portal
 * rather than the HR portal. Line managers are scoped to the same experience as
 * a normal employee (plus a read-only "My Team" view of their direct reports).
 */
const EMPLOYEE_PORTAL_ROLES = new Set(["ROLE-EMP"]);
const EMPLOYEE_PORTAL_ACCESS_LEVELS = new Set(["AL-LINE-MANAGER"]);

/** The landing route for a freshly-authenticated user. */
export function landingPathForUser(
  user: Pick<AuthUser, "roleId" | "accessLevelId">,
): string {
  if (EMPLOYEE_PORTAL_ROLES.has(user.roleId)) return EMPLOYEE_PORTAL;
  if (EMPLOYEE_PORTAL_ACCESS_LEVELS.has(user.accessLevelId)) {
    return EMPLOYEE_PORTAL;
  }
  return HR_PORTAL;
}

/** Landing routes for the two portals, used by the Admin/Self-Service toggle. */
export const PORTAL_PATHS = {
  admin: HR_PORTAL,
  self: EMPLOYEE_PORTAL,
} as const;

/**
 * Whether this user may switch into the admin portal (client feedback §4.2).
 *
 * Fails open when there is no user, consistent with `useCan`,
 * `useVisibleRoutes` and `HrAccessGuard` — `auth` is not persisted, so a hard
 * refresh leaves `s.auth.user` null.
 */
export function canAccessAdminPortal(
  user: Pick<AuthUser, "roleId" | "accessLevelId"> | null | undefined,
): boolean {
  if (!user) return true;
  return landingPathForUser(user) === HR_PORTAL;
}

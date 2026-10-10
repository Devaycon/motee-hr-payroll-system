/**
 * Route prefixes backed by the live API.
 *
 * Everything else still runs on fixture data, so it is kept out of the
 * navigation and blocked by URL until its endpoints are integrated. Shipping a
 * module is: wire its screens to the API, then add its link here.
 */
export const LIVE_LINKS: readonly string[] = [
  "/welcome",
  "/hr-action-center/submissions",
  "/organization/branches",
  "/organization/departments",
  "/organization/employees",
  "/talent/onboarding",
  "/talent/offboarding",
  "/operations/assets",
  "/time-payroll/leave",
  "/admin/access-levels",
  "/admin/users",
  "/admin/audit-trail",
];

export function isLivePath(pathname: string): boolean {
  return LIVE_LINKS.some(
    (link) => pathname === link || pathname.startsWith(`${link}/`),
  );
}

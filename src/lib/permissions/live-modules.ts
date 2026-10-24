/**
 * Route prefixes backed by the live API.
 *
 * Everything else is still shown exactly as designed, but blurred and inert
 * with a "not integrated yet" message, so what remains to be done stays
 * visible. Shipping a module is: wire its screens to the API, then add its
 * link here.
 */
export const LIVE_LINKS: readonly string[] = [
  "/welcome",
  "/organization/branches",
  "/organization/departments",
  "/organization/employees",
  "/talent/onboarding",
  "/talent/offboarding",
  "/talent/performance",
  "/operations/assets",
  "/time-payroll/leave",
  "/time-payroll/attendance",
  "/admin/access-levels",
  "/admin/users",
  "/admin/audit-trail",
];

export function isLivePath(pathname: string): boolean {
  return LIVE_LINKS.some(
    (link) => pathname === link || pathname.startsWith(`${link}/`),
  );
}

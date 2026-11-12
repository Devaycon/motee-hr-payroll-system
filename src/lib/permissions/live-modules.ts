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
  "/hr",
  "/hr-action-center/events",
  "/hr-action-center/tasks",
  "/workspace/announcements",
  "/workspace/kudos",
  "/organization/branches",
  "/organization/departments",
  "/organization/employees",
  "/organization/employment-types",
  "/organization/roles",
  "/organization/benefit-plans",
  "/organization/employee-checklist",
  "/organization/loans",
  "/organization/headcount",
  "/operations/workforce",
  "/talent/onboarding",
  "/talent/offboarding",
  "/talent/performance",
  "/talent/recruitment",
  "/talent/hire-tracker",
  "/talent/workforce-requests",
  "/operations/assets",
  "/operations/contracts",
  "/operations/documents",
  "/time-payroll/leave",
  "/time-payroll/attendance",
  "/time-payroll/expenses",
  "/time-payroll/sickness",
  "/admin/access-levels",
  "/admin/users",
  "/admin/audit-trail",
];

/**
 * Pages under a live prefix that still have no endpoint, so they stay blurred:
 * sick-pay schemes and the sickness approval chain are not on the API yet.
 */
export const DEMO_ONLY_LINKS: readonly string[] = [
  "/time-payroll/sickness/schemes",
  "/time-payroll/sickness/approval-chain",
];

const under = (pathname: string, link: string) =>
  pathname === link || pathname.startsWith(`${link}/`);

export function isLivePath(pathname: string): boolean {
  return (
    LIVE_LINKS.some((link) => under(pathname, link)) &&
    !DEMO_ONLY_LINKS.some((link) => under(pathname, link))
  );
}

/**
 * Self-service pages backed by the live API. The rest of the employee portal
 * is shown as designed but blurred, the same as the admin shell.
 */
export const SELF_SERVICE_LIVE_LINKS: readonly string[] = [
  "/employee/tasks",
  "/employee/loans",
  "/profile/diversity",
  "/time-off/sickness",
  "/company/community",
];

export function isSelfServiceLivePath(pathname: string): boolean {
  return SELF_SERVICE_LIVE_LINKS.some((link) => under(pathname, link));
}

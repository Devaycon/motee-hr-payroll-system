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
  // GET /dashboard/lifecycle since 2026-11-27.
  "/lifecycle",
  "/hr-action-center/events",
  "/hr-action-center/tasks",
  "/hr-action-center/workflows",
  // The HR Action Centre itself: alerts from GET /dashboard/hr-actions since
  // 2026-11-27; its upcoming events, checklist and recent activity stay held.
  "/hr-action-center",
  // GET /approvals since 2026-11-27 (New Submission and Approval Chains stay held).
  "/hr-action-center/submissions",
  "/workspace/announcements",
  "/workspace/kudos",
  "/workspace/helpdesk",
  "/workspace/knowledge",
  "/workspace/community",
  "/workspace/suggestions",
  "/workspace/surveys",
  "/workspace/projects",
  "/organization/branches",
  "/organization/departments",
  // Reads the live directory; reporting-line edits save as the employee's
  // managerId (2026-11-27).
  "/organization/structure",
  "/organization/employees",
  // GET /change-requests and approve/reject since 2026-11-27.
  "/organization/change-requests",
  "/organization/employment-types",
  "/organization/roles",
  "/organization/benefit-plans",
  "/organization/employee-checklist",
  "/organization/loans",
  "/organization/headcount",
  "/organization/company",
  "/organization/eor",
  "/operations/workforce",
  "/talent/onboarding",
  "/talent/offboarding",
  "/talent/performance",
  "/talent/recruitment",
  "/talent/hire-tracker",
  "/talent/workforce-requests",
  "/talent/training",
  "/operations/assets",
  "/operations/contracts",
  "/operations/documents",
  // GET /reports/datasets, POST /reports/run and /reports/export since
  // 2026-11-27. Analytics (charts) has no endpoint and stays held.
  "/operations/reports",
  // Docu-Sign signs in the browser; "Save to Documents" is filed on the API by
  // the Documents page (fileSigned: POST /files + /documents).
  "/sign",
  "/time-payroll/leave",
  "/time-payroll/attendance",
  "/time-payroll/expenses",
  "/time-payroll/sickness",
  "/time-payroll/shifts",
  "/time-payroll/occupational-health",
  "/admin/access-levels",
  "/admin/users",
  "/admin/audit-trail",
  "/admin/settings",
  "/admin/grievance",
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
  "/growth/training",
  "/company/community",
  // GET /surveys/mine, /surveys/{id}, /my-response, POST responses (2026-11-28).
  "/company/surveys",
  "/company/helpdesk",
  "/company/knowledge",
  "/company/relations",
  "/company/announcements",
  "/profile/contracts",
  "/profile/documents",
  "/employee/documents",
  "/employee/expenses",
  "/time-off/balance",
  "/time-off/request",
  "/time-off/attendance",
  "/growth/performance",
  "/employee/events",
  "/profile/assets",
  "/company/org-chart",
  "/profile/my-profile",
  "/time-off/shifts",
  "/employee/dashboard",
  // GET /approvals/mine + /approvals/my-queue since 2026-11-27.
  "/employee/submissions",
];

export function isSelfServiceLivePath(pathname: string): boolean {
  return SELF_SERVICE_LIVE_LINKS.some((link) => under(pathname, link));
}

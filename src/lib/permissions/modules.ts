export interface ModuleEntry {
  id: string;
  label: string;
  group: string;
  link: string;
}

export const MODULE_GROUPS = [
  "Workflows",
  "Organization",
  "Employment Management",
  "Talent",
  "Time & Payroll",
  "Operations",
  "Engagement",
  "Admin",
] as const;

export type ModuleGroup = (typeof MODULE_GROUPS)[number];

export const ALL_MODULES: ModuleEntry[] = [
  // Workflows
  { id: "workspace.workflows", label: "Workflows", group: "Workflows", link: "/hr-action-center/workflows" },
  { id: "workspace.projects",  label: "Projects", group: "Workflows", link: "/workspace/projects" },
  { id: "submissions.queue",     label: "Submissions & Approvals", group: "Workflows", link: "/hr-action-center/submissions" },
  { id: "submissions.workflows", label: "Approval Workflows", group: "Workflows", link: "/hr-action-center/workflows" },

  // Organization
  { id: "organization.company",            label: "Company Profile",          group: "Organization", link: "/organization/company" },
  { id: "organization.branches",           label: "Branches",                 group: "Organization", link: "/organization/branches" },
  { id: "organization.departments",        label: "Departments",              group: "Organization", link: "/organization/departments" },
  { id: "organization.structure",          label: "Structure & Hierarchy",    group: "Organization", link: "/organization/structure" },
  { id: "organization.roles",              label: "Roles & Positions",        group: "Organization", link: "/organization/roles" },
  { id: "organization.headcount",          label: "Headcount Planning",       group: "Organization", link: "/organization/headcount" },

  // Employment Management
  { id: "organization.employees",          label: "Employees",                group: "Employment Management", link: "/organization/employees" },
  { id: "organization.employment-types",   label: "Employment Types",         group: "Employment Management", link: "/organization/employment-types" },
  { id: "organization.eor",                 label: "Employer of Record",       group: "Employment Management", link: "/organization/eor" },
  { id: "organization.employee-checklist", label: "Employee Checklist",       group: "Employment Management", link: "/organization/employee-checklist" },

  // Employee Detail — sensitive sections (no own route; gated within the detail page)
  { id: "employee.medical",      label: "Employee · Medical Facts",  group: "Organization", link: "/organization/employees#medical" },
  { id: "employee.disciplinary", label: "Employee · Disciplinaries", group: "Organization", link: "/organization/employees#disciplinary" },
  { id: "employee.grievances",   label: "Employee · Grievances",     group: "Organization", link: "/organization/employees#grievances" },
  { id: "employee.notes",        label: "Employee · Notes",          group: "Organization", link: "/organization/employees#notes" },

  // Talent
  { id: "talent.workforce-requests", label: "Workforce Requests",  group: "Talent", link: "/talent/workforce-requests" },
  { id: "talent.recruitment",  label: "Recruitment",              group: "Talent", link: "/talent/recruitment" },
  { id: "talent.onboarding",   label: "Onboarding",               group: "Talent", link: "/talent/onboarding" },
  { id: "talent.offboarding",  label: "Offboarding",              group: "Talent", link: "/talent/offboarding" },
  { id: "talent.performance",  label: "Performance",              group: "Talent", link: "/talent/performance" },
  { id: "talent.training",     label: "Learning & Development",   group: "Talent", link: "/talent/training" },

  // Time & Payroll
  { id: "time-payroll.attendance",   label: "Attendance",     group: "Time & Payroll", link: "/time-payroll/attendance" },
  { id: "time-payroll.leave",        label: "Leave Management", group: "Time & Payroll", link: "/time-payroll/leave" },
  { id: "time-payroll.expenses",     label: "Expense Claims",   group: "Time & Payroll", link: "/time-payroll/expenses" },

  // Operations
  { id: "operations.assets",     label: "Asset Management",       group: "Operations", link: "/operations/assets" },
  { id: "operations.documents",  label: "Documents & Compliance", group: "Operations", link: "/operations/documents" },
  { id: "operations.contracts",  label: "Contracts",              group: "Operations", link: "/operations/contracts" },
  { id: "operations.reports",    label: "Reports & Analytics",    group: "Operations", link: "/operations/reports" },
  { id: "operations.workforce",  label: "Workforce Planning",     group: "Operations", link: "/operations/workforce" },

  // Engagement
  { id: "workspace.announcements", label: "Announcements",         group: "Engagement", link: "/workspace/announcements" },
  { id: "workspace.kudos",         label: "Kudos & Recognition",   group: "Engagement", link: "/workspace/kudos" },
  { id: "workspace.suggestions",   label: "Employee Suggestions",  group: "Engagement", link: "/workspace/suggestions" },
  { id: "workspace.surveys",       label: "Surveys & Engagement",  group: "Engagement", link: "/workspace/surveys" },
  { id: "workspace.helpdesk",      label: "HR Help Desk",          group: "Engagement", link: "/workspace/helpdesk" },
  { id: "workspace.knowledge",     label: "Knowledge Base",        group: "Engagement", link: "/workspace/knowledge" },
  { id: "workspace.community",     label: "Community",             group: "Engagement", link: "/workspace/community" },

  // Admin
  // NOTE: ids are persisted inside every saved access level (localStorage
  // `motee:accessLevels` and .data/runtime/access-levels.json). Labels can be
  // renamed freely; ids must not change or existing roles lose those grants.
  { id: "admin.access-levels", label: "Roles & Permissions",      group: "Admin", link: "/admin/access-levels" },
  { id: "admin.users",         label: "User Management",          group: "Admin", link: "/admin/users" },
  { id: "admin.audit-trail",   label: "Audit Trail",              group: "Admin", link: "/admin/audit-trail" },
  { id: "admin.grievance",     label: "Grievance & Disciplinary", group: "Admin", link: "/admin/grievance" },
  { id: "admin.settings",      label: "Settings & Permissions",   group: "Admin", link: "/admin/settings" },
];

export function getModuleByLink(link: string): ModuleEntry | undefined {
  return ALL_MODULES.find((m) => m.link === link);
}

export function getModuleById(id: string): ModuleEntry | undefined {
  return ALL_MODULES.find((m) => m.id === id);
}

export const MODULE_LABELS: Record<string, string> = Object.fromEntries(
  ALL_MODULES.map((m) => [m.id, m.label]),
);

export function modulesByGroup(): Record<ModuleGroup, ModuleEntry[]> {
  const out = {} as Record<ModuleGroup, ModuleEntry[]>;
  for (const g of MODULE_GROUPS) out[g] = [];
  for (const m of ALL_MODULES) out[m.group as ModuleGroup].push(m);
  return out;
}

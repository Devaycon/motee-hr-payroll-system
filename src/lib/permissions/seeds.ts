import type {
  AccessLevel,
  DataScope,
  ModulePermission,
  PermissionAction,
} from "@/src/lib/types/access-levels";
import { ALL_MODULES } from "./modules";

type RoleSlug =
  | "SUPER-ADMIN"
  | "HR-ADMIN"
  | "HR-MANAGER"
  | "FINANCE"
  | "LINE-MANAGER"
  | "EXECUTIVE"
  | "RECRUITER"
  | "IT-ADMIN"
  | "AUDITOR"
  | "READ-ONLY"
  // Function-specific roles requested in client feedback §1.14
  | "PAYROLL-ADMIN"
  | "LD-ADMIN"
  | "HS-OFFICER"
  | "COMPLIANCE-OFFICER"
  | "FACILITIES-MANAGER"
  | "SELF-SERVICE"
  | "CONTRACTOR"
  | "EXTERNAL-AUDITOR";

/**
 * Author stamp carried by a default level nobody has edited yet. Such a level
 * holds no human intent, so its permissions can always be re-derived from the
 * seed — see `mergeWithSeed` in the access-levels slice.
 */
export const SYSTEM_AUTHOR = "System";

// Module-id → roles that get sidebar access (mirrors the prior sidebar matrix)
const MODULE_ACCESS: Record<string, RoleSlug[]> = {
  // Submissions & Approvals — queue is broadly visible (hub auto-filters
  // by "is this approver you" and "is this your submission")
  "submissions.queue":     ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","FINANCE","LINE-MANAGER","EXECUTIVE","RECRUITER","IT-ADMIN","AUDITOR","READ-ONLY"],
  "submissions.workflows": ["SUPER-ADMIN","HR-ADMIN"],

  // Workflows — consolidated onboarding/offboarding workflow module
  "workspace.workflows": ["SUPER-ADMIN","HR-ADMIN"],
  // §10 — line managers need Projects to resource their own teams, which is a
  // wider audience than the workflow builder next to it.
  "workspace.projects":  ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","LINE-MANAGER","FINANCE","AUDITOR","READ-ONLY"],

  // Organization
  "organization.company":            ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  // Facilities owns the sites themselves, so it sees Branches where it does
  // not see Company Profile.
  "organization.branches":           ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","FACILITIES-MANAGER","AUDITOR","READ-ONLY"],
  "organization.departments":        ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  "organization.structure":          ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","LINE-MANAGER","AUDITOR","READ-ONLY"],
  "organization.employees":          ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","LINE-MANAGER","RECRUITER","AUDITOR","READ-ONLY"],
  "organization.employment-types":   ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  "organization.eor":                ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","FINANCE","AUDITOR","READ-ONLY"],
  "organization.employee-checklist": ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  "organization.roles":              ["SUPER-ADMIN","HR-ADMIN","RECRUITER","AUDITOR","READ-ONLY"],
  "organization.headcount":          ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","RECRUITER","EXECUTIVE","AUDITOR","READ-ONLY"],

  // Employee Detail — sensitive sections, HR admin only
  "employee.medical":      ["SUPER-ADMIN","HR-ADMIN"],
  "employee.disciplinary": ["SUPER-ADMIN","HR-ADMIN"],
  "employee.grievances":   ["SUPER-ADMIN","HR-ADMIN"],
  "employee.notes":        ["SUPER-ADMIN","HR-ADMIN"],
  // Talent
  "talent.workforce-requests":       ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","LINE-MANAGER","EXECUTIVE","FINANCE","AUDITOR","READ-ONLY"],
  "talent.recruitment":              ["SUPER-ADMIN","HR-ADMIN","RECRUITER","AUDITOR","READ-ONLY"],
  "talent.onboarding":               ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","RECRUITER","AUDITOR","READ-ONLY"],
  "talent.offboarding":              ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  "talent.performance":              ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","LINE-MANAGER","AUDITOR","READ-ONLY"],
  "talent.training":                 ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  // Time & Payroll
  "time-payroll.attendance":         ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","LINE-MANAGER","FINANCE","AUDITOR","READ-ONLY"],
  "time-payroll.leave":              ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","LINE-MANAGER","AUDITOR","READ-ONLY"],
  // Finance sits on the expense chain's final (reimbursement) step, and the
  // executive is the resolved line manager for much of the org.
  "time-payroll.expenses":           ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","LINE-MANAGER","FINANCE","EXECUTIVE","AUDITOR","READ-ONLY"],
  // Operations
  "operations.assets":               ["SUPER-ADMIN","HR-ADMIN","IT-ADMIN","AUDITOR","READ-ONLY"],
  "operations.documents":            ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  "operations.contracts":            ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  "operations.reports":              ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","FINANCE","EXECUTIVE","AUDITOR","READ-ONLY"],
  "operations.workforce":            ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","RECRUITER","EXECUTIVE","AUDITOR","READ-ONLY"],
  // Engagement
  "workspace.announcements":         ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","FINANCE","LINE-MANAGER","RECRUITER","IT-ADMIN","AUDITOR","READ-ONLY"],
  "workspace.kudos":                 ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","FINANCE","LINE-MANAGER","RECRUITER","IT-ADMIN","AUDITOR","READ-ONLY"],
  "workspace.suggestions":           ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  "workspace.surveys":               ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  "workspace.helpdesk":              ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","IT-ADMIN","AUDITOR","READ-ONLY"],
  "workspace.knowledge":             ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","FINANCE","LINE-MANAGER","RECRUITER","IT-ADMIN","AUDITOR","READ-ONLY"],
  "workspace.community":             ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","FINANCE","LINE-MANAGER","RECRUITER","IT-ADMIN","AUDITOR","READ-ONLY"],
  // Admin
  "admin.access-levels":             ["SUPER-ADMIN","HR-ADMIN","IT-ADMIN","AUDITOR","READ-ONLY"],
  // §4.14 — locking and revoking accounts is an IT/admin function, deliberately
  // narrower than who may read the role definitions.
  "admin.users":                     ["SUPER-ADMIN","HR-ADMIN","IT-ADMIN","AUDITOR"],
  "admin.audit-trail":               ["SUPER-ADMIN","HR-ADMIN","IT-ADMIN","AUDITOR"],
  "admin.grievance":                 ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  "admin.settings":                  ["SUPER-ADMIN","HR-ADMIN","IT-ADMIN"],
};

/**
 * The §1.14 roles are each scoped to a handful of modules, so they are listed
 * by role rather than threaded through every row of MODULE_ACCESS above —
 * eight more slugs across ~40 arrays would obscure the original matrix.
 * A role present here is resolved from this map only; MODULE_ACCESS is ignored.
 */
const ROLE_MODULES: Partial<Record<RoleSlug, string[]>> = {
  "PAYROLL-ADMIN": [
    "submissions.queue",
    "organization.employees",
    "organization.employment-types",
    "organization.eor",
    "time-payroll.attendance",
    "time-payroll.leave",
    "time-payroll.expenses",
    "operations.reports",
    "operations.documents",
    "workspace.announcements",
    "workspace.knowledge",
  ],
  "LD-ADMIN": [
    "submissions.queue",
    "organization.employees",
    "talent.training",
    "talent.performance",
    "workspace.knowledge",
    "workspace.surveys",
    "operations.reports",
    "workspace.announcements",
  ],
  "HS-OFFICER": [
    "submissions.queue",
    "organization.employees",
    "employee.medical",
    "operations.documents",
    "operations.reports",
    "workspace.announcements",
    "workspace.helpdesk",
    "workspace.knowledge",
  ],
  "COMPLIANCE-OFFICER": [
    "submissions.queue",
    "organization.employees",
    "employee.disciplinary",
    "employee.grievances",
    "admin.grievance",
    "admin.audit-trail",
    "operations.documents",
    "operations.contracts",
    "operations.reports",
    "workspace.knowledge",
  ],
  "FACILITIES-MANAGER": [
    "submissions.queue",
    "organization.employees",
    "organization.branches",
    "organization.departments",
    "operations.assets",
    "workspace.helpdesk",
    "workspace.announcements",
    "workspace.knowledge",
  ],
  "SELF-SERVICE": [
    "submissions.queue",
    "workspace.announcements",
    "workspace.kudos",
    "workspace.knowledge",
    "workspace.community",
    "workspace.helpdesk",
    "workspace.suggestions",
  ],
  // Deliberately narrower than Self-Service: no kudos, suggestions or helpdesk.
  "CONTRACTOR": [
    "submissions.queue",
    "workspace.announcements",
    "workspace.knowledge",
  ],
  // Like Auditor, but without the sensitive employee-detail sections.
  "EXTERNAL-AUDITOR": [
    "organization.company",
    "organization.branches",
    "organization.departments",
    "organization.employees",
    "organization.structure",
    "operations.documents",
    "operations.contracts",
    "operations.reports",
    "admin.audit-trail",
  ],
};

const FULL_ACTIONS: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
  "approve",
  "administer",
];

const MGMT_ACTIONS: PermissionAction[] = ["view", "create", "edit", "approve"];
const STAFF_ACTIONS: PermissionAction[] = ["view", "create", "edit"];
const VIEW_ONLY: PermissionAction[] = ["view"];
const VIEW_EXPORT: PermissionAction[] = ["view", "export"];

function actionsFor(slug: RoleSlug): PermissionAction[] {
  switch (slug) {
    case "SUPER-ADMIN":
    case "HR-ADMIN":
      return FULL_ACTIONS;
    case "HR-MANAGER":
      return MGMT_ACTIONS;
    case "FINANCE":
      return MGMT_ACTIONS;
    case "LINE-MANAGER":
      return ["view", "edit", "approve"];
    case "EXECUTIVE":
      return ["view", "approve", "export"];
    case "RECRUITER":
      return STAFF_ACTIONS;
    case "IT-ADMIN":
      return STAFF_ACTIONS;
    case "AUDITOR":
      return VIEW_EXPORT;
    case "READ-ONLY":
      return VIEW_ONLY;
    case "PAYROLL-ADMIN":
      return MGMT_ACTIONS;
    case "LD-ADMIN":
    case "HS-OFFICER":
    case "FACILITIES-MANAGER":
      return STAFF_ACTIONS;
    case "COMPLIANCE-OFFICER":
    case "EXTERNAL-AUDITOR":
      return VIEW_EXPORT;
    case "SELF-SERVICE":
      return ["view", "create"];
    case "CONTRACTOR":
      return VIEW_ONLY;
  }
}

function buildPermissionsFor(slug: RoleSlug): ModulePermission[] {
  const role = slug;
  const actions = actionsFor(role);
  const scoped = ROLE_MODULES[role];
  return ALL_MODULES.map((m) => {
    const access = scoped
      ? scoped.includes(m.id)
      : (MODULE_ACCESS[m.id] ?? []).includes(role);
    return {
      module: m.id,
      access,
      actions: access ? [...actions] : [],
    };
  });
}

/**
 * Default record-level scope per role (client feedback §1.4). A Line Manager
 * seeing every employee, or a contractor seeing anyone but themselves, is the
 * exact leak this closes.
 */
const DEFAULT_SCOPES: Partial<Record<RoleSlug, DataScope>> = {
  "LINE-MANAGER": { kind: "direct_reports" },
  "SELF-SERVICE": { kind: "self" },
  CONTRACTOR: { kind: "self" },
  // Branch-scoped with no explicit id list, which resolves to "whichever
  // branch the holder works at". That keeps the seed tenant-agnostic — branch
  // ids differ between the NG and UK bundles — and matches how these roles
  // actually work: an HR Manager runs their site, not the company.
  //
  // HR-ADMIN and SUPER-ADMIN are deliberately absent and fall through to
  // `{ kind: "all" }`: HR Admin is the system administrator and must keep
  // seeing and doing everything. It is also the default demo identity, so the
  // out-of-the-box demo is unaffected by any of this.
  "HR-MANAGER": { kind: "branch" },
  "FACILITIES-MANAGER": { kind: "branch" },
};

function makeLevel(
  slug: RoleSlug,
  name: string,
  description: string,
  employeeCount: number,
): AccessLevel {
  return {
    id: `AL-${slug}`,
    name,
    description,
    kind: "default",
    status: "active",
    employeeCount,
    dataScope: DEFAULT_SCOPES[slug] ?? { kind: "all" },
    createdBy: SYSTEM_AUTHOR,
    createdAt: "2026-01-01",
    lastModifiedBy: SYSTEM_AUTHOR,
    lastModifiedAt: "2026-01-01",
    permissions: buildPermissionsFor(slug),
  };
}

export const DEFAULT_ACCESS_LEVELS: AccessLevel[] = [
  makeLevel("SUPER-ADMIN", "Super Admin", "Full unrestricted access to every module and action", 1),
  makeLevel("HR-ADMIN", "HR Admin", "Manage all HR modules end-to-end", 3),
  makeLevel("HR-MANAGER", "HR Manager", "Run day-to-day people operations: employees, leave, performance, engagement", 5),
  makeLevel("FINANCE", "Finance", "Payroll, benefits, compensation and finance-side reporting", 4),
  makeLevel("LINE-MANAGER", "Line Manager", "Manage direct reports: team view, leave approvals, performance reviews", 18),
  makeLevel("EXECUTIVE", "Executive", "Executive oversight: approvals, headcount, workforce planning and reports", 3),
  makeLevel("RECRUITER", "Recruiter", "Own the hiring pipeline and headcount planning", 3),
  makeLevel("IT-ADMIN", "IT Admin", "Manage assets, helpdesk, access levels and platform settings", 2),
  makeLevel("AUDITOR", "Auditor", "Read-only access across HR plus full audit trail visibility", 1),
  makeLevel("READ-ONLY", "Read-only", "View-only access across the system, no Audit Trail or Settings", 2),
  // Client feedback §1.14 — function-specific roles.
  makeLevel("PAYROLL-ADMIN", "Payroll Administrator", "Run payroll: attendance, leave, employment types and payroll reporting", 0),
  makeLevel("LD-ADMIN", "Learning & Development Administrator", "Own training, performance development, knowledge base and surveys", 0),
  makeLevel("HS-OFFICER", "Health & Safety Officer", "Occupational health, medical records, safety documents and incident reporting", 0),
  makeLevel("COMPLIANCE-OFFICER", "Compliance Officer", "Audit trail, ER cases, contracts and document compliance oversight", 0),
  makeLevel("FACILITIES-MANAGER", "Facilities Manager", "Manage assets, equipment assignments and facilities helpdesk requests", 0),
  makeLevel("SELF-SERVICE", "Employee Self-Service", "Standard employee access: own submissions, announcements, knowledge and community", 0),
  makeLevel("CONTRACTOR", "Contractor", "Minimal access for non-employees: own submissions, announcements and knowledge base", 0),
  makeLevel("EXTERNAL-AUDITOR", "External Auditor", "Read and export access for external audit, excluding sensitive employee records", 0),
];

export const DEFAULT_ACCESS_LEVEL_IDS = new Set(
  DEFAULT_ACCESS_LEVELS.map((l) => l.id),
);

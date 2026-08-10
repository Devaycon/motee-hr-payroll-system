import type {
  AccessLevel,
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
  | "READ-ONLY";

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

  // Organization
  "organization.company":            ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
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
  "admin.audit-trail":               ["SUPER-ADMIN","HR-ADMIN","IT-ADMIN","AUDITOR"],
  "admin.grievance":                 ["SUPER-ADMIN","HR-ADMIN","HR-MANAGER","AUDITOR","READ-ONLY"],
  "admin.settings":                  ["SUPER-ADMIN","HR-ADMIN","IT-ADMIN"],
};

const FULL_ACTIONS: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
  "approve",
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
  }
}

function buildPermissionsFor(slug: RoleSlug): ModulePermission[] {
  const role = slug;
  const actions = actionsFor(role);
  return ALL_MODULES.map((m) => {
    const allowed = MODULE_ACCESS[m.id] ?? [];
    const access = allowed.includes(role);
    return {
      module: m.id,
      access,
      actions: access ? [...actions] : [],
    };
  });
}

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
    employeeCount,
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
];

export const DEFAULT_ACCESS_LEVEL_IDS = new Set(
  DEFAULT_ACCESS_LEVELS.map((l) => l.id),
);

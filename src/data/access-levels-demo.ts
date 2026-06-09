import type {
  AccessLevel,
  ModulePermission,
  PermissionAction,
} from "@/src/lib/types/access-levels";

export const ALL_MODULES: string[] = [
  "employees",
  "payroll",
  "leave",
  "attendance",
  "recruitment",
  "performance",
  "documents",
  "reports",
  "settings",
  "announcements",
];

export const ALL_ACTIONS: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
];

export const MODULE_LABELS: Record<string, string> = {
  employees: "Employees",
  payroll: "Payroll",
  leave: "Leave Management",
  attendance: "Attendance",
  recruitment: "Recruitment",
  performance: "Performance",
  documents: "Documents",
  reports: "Reports",
  settings: "Settings",
  announcements: "Announcements",
};

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  export: "Export",
  approve: "Approve",
};

export function buildEmptyPermissions(): ModulePermission[] {
  return ALL_MODULES.map((module) => ({ module, access: false, actions: [] }));
}

export interface AccessLevelStats {
  totalRoles: number;
  customRoles: number;
  totalUsers: number;
  modulesProtected: number;
}

export function computeAccessLevelStats(
  levels: AccessLevel[],
): AccessLevelStats {
  const totalRoles = levels.length;
  const customRoles = levels.filter((l) => l.kind === "custom").length;
  const totalUsers = levels.reduce((s, l) => s + l.employeeCount, 0);
  const allModules = new Set(
    levels.flatMap((l) =>
      l.permissions.filter((p) => p.actions.length > 0).map((p) => p.module),
    ),
  );
  const modulesProtected = allModules.size;
  return { totalRoles, customRoles, totalUsers, modulesProtected };
}

function makeLevel(
  id: string,
  name: string,
  description: string,
  kind: "default" | "custom",
  employeeCount: number,
  modPerms: Record<string, PermissionAction[]>,
): AccessLevel {
  const permissions: ModulePermission[] = ALL_MODULES.map((module) => ({
    module,
    access: (modPerms[module] ?? []).length > 0,
    actions: modPerms[module] ?? [],
  }));
  return {
    id,
    name,
    description,
    kind,
    employeeCount,
    lastModifiedBy: "System",
    lastModifiedAt: "2026-01-01",
    permissions,
  };
}

export const ACCESS_LEVELS: AccessLevel[] = [
  makeLevel(
    "al-001",
    "Super Admin",
    "Full access to all modules and system settings",
    "default",
    2,
    {
      employees: ["view", "create", "edit", "delete", "export"],
      payroll: ["view", "create", "edit", "delete", "export"],
      leave: ["view", "create", "edit", "delete", "export"],
      attendance: ["view", "create", "edit", "delete", "export"],
      recruitment: ["view", "create", "edit", "delete", "export"],
      performance: ["view", "create", "edit", "delete", "export"],
      documents: ["view", "create", "edit", "delete", "export"],
      reports: ["view", "create", "edit", "delete", "export"],
      settings: ["view", "create", "edit", "delete", "export"],
      announcements: ["view", "create", "edit", "delete", "export"],
    },
  ),
  makeLevel(
    "al-002",
    "HR Manager",
    "Full access to HR modules, limited settings access",
    "default",
    5,
    {
      employees: ["view", "create", "edit", "export"],
      payroll: ["view", "create", "edit", "export"],
      leave: ["view", "create", "edit", "delete"],
      attendance: ["view", "create", "edit"],
      recruitment: ["view", "create", "edit", "delete"],
      performance: ["view", "create", "edit"],
      documents: ["view", "create", "edit"],
      reports: ["view", "export"],
      settings: ["view"],
      announcements: ["view", "create", "edit", "delete"],
    },
  ),
  makeLevel(
    "al-003",
    "Finance Officer",
    "Payroll and financial reports access only",
    "default",
    3,
    {
      payroll: ["view", "create", "edit", "export"],
      reports: ["view", "export"],
      employees: ["view"],
    },
  ),
  makeLevel(
    "al-004",
    "Department Manager",
    "Manage their team's leave, attendance and performance",
    "custom",
    12,
    {
      employees: ["view"],
      leave: ["view", "create", "edit"],
      attendance: ["view", "edit"],
      performance: ["view", "create", "edit"],
      documents: ["view"],
    },
  ),
  makeLevel(
    "al-005",
    "Recruiter",
    "Full recruitment pipeline access, read-only elsewhere",
    "custom",
    4,
    {
      recruitment: ["view", "create", "edit", "delete"],
      employees: ["view"],
      documents: ["view", "create"],
    },
  ),
];


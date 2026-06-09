import type {
  AccessLevel,
  ModulePermission,
  PermissionAction,
} from "@/src/lib/types/access-levels";
import {
  ALL_MODULES as MODULE_ENTRIES,
  MODULE_GROUPS,
  MODULE_LABELS,
  modulesByGroup,
} from "@/src/lib/permissions/modules";

export const ALL_MODULES: string[] = MODULE_ENTRIES.map((m) => m.id);

export const ALL_ACTIONS: PermissionAction[] = [
  "view",
  "create",
  "edit",
  "delete",
  "export",
  "approve",
];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  export: "Export",
  approve: "Approve",
};

export { MODULE_GROUPS, MODULE_LABELS, modulesByGroup };

export function buildEmptyPermissions(): ModulePermission[] {
  return ALL_MODULES.map((module) => ({
    module,
    access: false,
    actions: [],
  }));
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
  const all = new Set(
    levels.flatMap((l) =>
      l.permissions.filter((p) => p.access).map((p) => p.module),
    ),
  );
  return {
    totalRoles,
    customRoles,
    totalUsers,
    modulesProtected: all.size,
  };
}

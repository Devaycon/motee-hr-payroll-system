import type { UserRole } from "../types/auth.types";

export type PermissionAction = "view" | "create" | "edit" | "delete";

export type PermissionResource =
  | "tenants"
  | "billing"
  | "platform"
  | "support"
  | "employees"
  | "payroll"
  | "leave"
  | "recruitment"
  | "reports"
  | "announcements"
  | "knowledge"
  | "community"
  | "profile"
  | "settings"
  | "audit_trail";

export type PermissionMap = Record<
  PermissionResource,
  PermissionAction[]
>;

export const PERMISSIONS: Record<UserRole, PermissionMap> = {
  super_admin: {
    tenants:      ["view", "create", "edit", "delete"],
    billing:      ["view", "create", "edit", "delete"],
    platform:     ["view", "create", "edit", "delete"],
    support:      ["view", "create", "edit", "delete"],
    employees:    ["view", "create", "edit", "delete"],
    payroll:      ["view", "create", "edit", "delete"],
    leave:        ["view", "create", "edit", "delete"],
    recruitment:  ["view", "create", "edit", "delete"],
    reports:      ["view", "create", "edit", "delete"],
    announcements:["view", "create", "edit", "delete"],
    knowledge:    ["view", "create", "edit", "delete"],
    community:    ["view", "create", "edit", "delete"],
    profile:      ["view", "create", "edit", "delete"],
    settings:     ["view", "create", "edit", "delete"],
    audit_trail:  ["view"],
  },

  hr_admin: {
    tenants:      [],
    billing:      [],
    platform:     [],
    support:      [],
    employees:    ["view", "create", "edit"],
    payroll:      ["view", "create", "edit"],
    leave:        ["view", "create", "edit", "delete"],
    recruitment:  ["view", "create", "edit", "delete"],
    reports:      ["view"],
    announcements:["view", "create", "edit", "delete"],
    knowledge:    ["view", "create", "edit"],
    community:    ["view"],
    profile:      ["view", "edit"],
    settings:     ["view", "edit"],
    audit_trail:  ["view"],
  },

  employee: {
    tenants:      [],
    billing:      [],
    platform:     [],
    support:      [],
    employees:    [],
    payroll:      [],
    leave:        ["view", "create"],
    recruitment:  [],
    reports:      [],
    announcements:["view"],
    knowledge:    ["view"],
    community:    ["view", "create"],
    profile:      ["view", "edit"],
    settings:     [],
    audit_trail:  [],
  },
};

export function can(
  role: UserRole,
  resource: PermissionResource,
  action: PermissionAction,
): boolean {
  return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
}

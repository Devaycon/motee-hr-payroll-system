import type { UserRole } from "../types/auth.types";

export const ROLES: Record<string, UserRole> = {
  SUPER_ADMIN: "super_admin",
  HR_ADMIN: "hr_admin",
  EMPLOYEE: "employee",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  hr_admin: "HR Administrator",
  employee: "Employee",
};

const ROLE_RESOURCES: Record<UserRole, string[]> = {
  super_admin: [
    "tenants",
    "billing",
    "platform",
    "support",
    "settings",
    "employees",
    "payroll",
    "leave",
    "recruitment",
    "reports",
    "announcements",
    "profile",
  ],
  hr_admin: [
    "employees",
    "payroll",
    "leave",
    "recruitment",
    "reports",
    "announcements",
    "settings",
    "profile",
  ],
  employee: [
    "profile",
    "leave",
    "payslips",
    "announcements",
    "community",
    "knowledge",
  ],
};

export function hasAccess(role: UserRole, resource: string): boolean {
  return ROLE_RESOURCES[role]?.includes(resource) ?? false;
}

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "export"
  | "approve";

export interface ModulePermission {
  module: string;
  access: boolean;
  actions: PermissionAction[];
}

export interface AccessLevel {
  id: string;
  name: string;
  description: string;
  kind: "default" | "custom";
  employeeCount: number;
  lastModifiedBy: string;
  lastModifiedAt: string;
  permissions: ModulePermission[];
}

export interface NewAccessLevel {
  name: string;
  description: string;
  permissions: ModulePermission[];
}

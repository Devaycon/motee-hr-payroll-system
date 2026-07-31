export type HierarchyNodeStatus = "active" | "vacant" | "on_leave";

export type ViewMode = "tree" | "table";

export interface HierarchyNode {
  id: string;
  /** HR-facing staff number ("Employee ID"); `id` is the System ID. */
  employeeNumber?: string;
  name: string;
  initials: string;
  gender?: string;
  jobTitle: string;
  department: string;
  managerId: string | null;
  managerName?: string;
  status: HierarchyNodeStatus;
  level: number;
  directReports: number;
}


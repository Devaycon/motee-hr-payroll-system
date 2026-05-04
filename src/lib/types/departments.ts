export type DepartmentStatus = "active" | "inactive" | "restructuring";

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string | null;
  headInitials?: string;
  description: string;
  employeeCount: number;
  openPositions: number;
  budgetMonthly?: number;
  status: DepartmentStatus;
  createdAt: string;
}


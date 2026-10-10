export type DepartmentStatus = "active" | "inactive" | "restructuring";

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string | null;
  headInitials?: string;
  /** The head's employee id; `head` is their display name. */
  headEmployeeId?: string | null;
  businessUnitId?: string | null;
  description: string;
  employeeCount: number;
  openPositions: number;
  budgetMonthly?: number;
  status: DepartmentStatus;
  createdAt: string;
}


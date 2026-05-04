export type PositionStatus = "active" | "vacant" | "inactive" | "filled";

export interface Position {
  id: string;
  title: string;
  department: string;
  grade: string;
  status: PositionStatus;
  description?: string;
  createdAt: string;
}

export interface NewPosition {
  title: string;
  department: string;
  grade: string;
  status?: PositionStatus;
  description?: string;
}


export type PerformanceRating = 1 | 2 | 3 | 4 | 5;

export type ReviewStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "overdue";

export type ReviewType = "annual" | "mid_year" | "probation" | "pip" | "360";

export type GoalStatus =
  | "on_track"
  | "at_risk"
  | "completed"
  | "cancelled"
  | "overdue";

export type GoalCategory =
  | "technical"
  | "leadership"
  | "communication"
  | "growth"
  | "operational";

export interface PerformanceReview {
  id: string;
  employeeName: string;
  employeeInitials?: string;
  jobTitle?: string;
  department: string;
  reviewType: ReviewType;
  period: string;
  status: ReviewStatus;
  reviewer: string;
  rating?: PerformanceRating;
  strengths?: string;
  improvements?: string;
  comments?: string;
  dueDate: string;
  completedDate?: string;
}

export interface NewReview {
  employeeName: string;
  employeeInitials?: string;
  jobTitle?: string;
  department: string;
  reviewType: ReviewType;
  period: string;
  reviewer: string;
  dueDate: string;
}

export interface PerformanceGoal {
  id: string;
  employeeName: string;
  employeeInitials?: string;
  department: string;
  goalTitle: string;
  description?: string;
  category: GoalCategory;
  status: GoalStatus;
  progress: number;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
}

export interface NewGoal {
  employeeName: string;
  employeeInitials?: string;
  department: string;
  goalTitle: string;
  description?: string;
  category: GoalCategory;
  dueDate: string;
}


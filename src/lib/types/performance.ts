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
  /** Links the review to the employee record it concerns. */
  employeeId?: string;
  employeeName: string;
  employeeInitials?: string;
  jobTitle?: string;
  department: string;
  reviewType: ReviewType;
  period: string;
  status: ReviewStatus;
  reviewerId?: string;
  reviewer: string;
  /** The final rating: the calibrated one when HR has set it, else the manager's. */
  rating?: PerformanceRating;
  cycleId?: string;
  selfRating?: PerformanceRating;
  managerRating?: PerformanceRating;
  calibratedRating?: PerformanceRating;
  strengths?: string;
  improvements?: string;
  comments?: string;
  /** The employee's written self-assessment, saved as a draft or submitted. */
  selfAssessment?: SelfAssessment;
  /** Set once the employee submits; a saved draft leaves it empty. */
  selfSubmittedAt?: string;
  dueDate: string;
  completedDate?: string;
}

export interface SelfAssessment {
  achievements: string;
  challenges: string;
  developmentAreas: string;
  managerFeedback: string;
}

export interface GoalUpdate {
  date: string;
  progress: number;
  note?: string;
}

export type FeedbackType = "peer" | "upward" | "downward" | "manager";

export interface PerformanceFeedback {
  id: string;
  toEmployeeId: string;
  fromEmployeeId?: string;
  /** Empty when the giver is outside the viewer's directory. */
  fromName?: string;
  type: FeedbackType;
  message: string;
  createdAt: string;
}

export interface FeedbackRequest {
  id: string;
  /** The person asking for feedback. */
  toEmployeeId: string;
  /** The colleague asked to give it. */
  fromEmployeeId: string;
  fromName: string;
  context?: string;
  createdAt: string;
}

export interface NewReview {
  employeeId?: string;
  employeeName: string;
  employeeInitials?: string;
  jobTitle?: string;
  department: string;
  reviewType: ReviewType;
  period: string;
  reviewerId?: string;
  reviewer: string;
  dueDate: string;
}

export interface PerformanceGoal {
  id: string;
  /** Links the goal to the employee record it concerns. */
  employeeId?: string;
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
  cycleId?: string;
  /** Goal framework, e.g. SMART or OKR. */
  goalType?: string;
  /** Progress check-ins, newest first. */
  updates?: GoalUpdate[];
}

export interface NewGoal {
  employeeId?: string;
  employeeName: string;
  employeeInitials?: string;
  department: string;
  goalTitle: string;
  description?: string;
  category: GoalCategory;
  dueDate: string;
}


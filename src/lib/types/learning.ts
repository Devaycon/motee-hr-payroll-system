export type CourseCategory =
  | "technical"
  | "leadership"
  | "compliance"
  | "soft_skills"
  | "onboarding"
  | "product";

export type CourseStatus = "active" | "draft" | "archived";

export type CourseDeliveryMode = "online" | "in_person" | "hybrid";

export type EnrollmentStatus =
  | "not_attempted"
  | "enrolled"
  | "in_progress"
  | "completed"
  | "dropped"
  | "failed";

/** A single auto-graded quiz question (multiple-choice or true/false). */
export type QuizQuestionType = "mcq" | "true_false";

export interface CourseQuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  /** Answer options. For true_false this is ["True", "False"]. */
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
  /** Weight of this question toward the total score. */
  points: number;
}

export interface CourseQuiz {
  /** Pass threshold as a percentage (0–100). */
  passingScore: number;
  /** Max attempts allowed; undefined = unlimited. */
  maxAttempts?: number;
  questions: CourseQuizQuestion[];
}

/** A recorded quiz attempt by an employee. */
export interface QuizAttempt {
  at: string;
  /** Weighted score percentage (0–100). */
  score: number;
  passed: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  status: CourseStatus;
  deliveryMode: CourseDeliveryMode;
  instructor: string;
  courseUrl?: string;
  /** Direct URL to a watchable training video (MP4/WebM). */
  videoUrl?: string;
  /** End-of-course quiz built by HR (optional). */
  quiz?: CourseQuiz;
  durationHours: number;
  capacity?: number;
  enrolled?: number;
  enrolledCount?: number;
  completionCount?: number;
  startDate?: string;
  endDate?: string;
  tags: string[];
  createdAt: string;
}

export interface NewCourse {
  title: string;
  description: string;
  category: CourseCategory;
  status: CourseStatus;
  deliveryMode: CourseDeliveryMode;
  instructor: string;
  courseUrl?: string;
  durationHours: number;
  capacity?: number;
  enrolledCount?: number;
  startDate?: string;
  endDate?: string;
  tags: string[];
  /** Optional end-of-course quiz built alongside the course. */
  quiz?: CourseQuiz;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseName?: string;
  courseTitle?: string;
  employeeName: string;
  employeeInitials: string;
  employeeDept: string;
  department?: string;
  status: EnrollmentStatus;
  progress: number;
  enrolledAt?: string;
  enrolledDate?: string;
  dueDate?: string;
  completedAt?: string;
  score?: number;
  /** Quiz attempts recorded for this enrollment. */
  quizAttempts?: QuizAttempt[];
  /** Whether the latest quiz attempt passed. */
  quizPassed?: boolean;
}

export interface NewEnrollment {
  courseId: string;
  employeeName: string;
  employeeInitials: string;
  employeeDept: string;
  department?: string;
}


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
  | "enrolled"
  | "in_progress"
  | "completed"
  | "dropped"
  | "failed";

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  status: CourseStatus;
  deliveryMode: CourseDeliveryMode;
  instructor: string;
  courseUrl?: string;
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
  completedAt?: string;
  score?: number;
}

export interface NewEnrollment {
  courseId: string;
  employeeName: string;
  employeeInitials: string;
  employeeDept: string;
  department?: string;
}


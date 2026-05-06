import { COURSES, ENROLLMENTS } from "@/src/data/learning-demo";
import type { Course, CourseCategory, Enrollment } from "@/src/lib/types/learning";

export type EnrollmentStatus =
  | "enrolled"
  | "in_progress"
  | "completed"
  | "dropped"
  | "failed";

export interface MyEnrollment {
  id: string;
  courseId: string;
  courseName: string;
  category: CourseCategory;
  status: EnrollmentStatus;
  progress: number;
  enrolledAt: string;
  dueDate?: string;
  completedAt?: string;
  score?: number;
  durationHours: number;
  instructor: string;
  deliveryMode: string;
}

export interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

export function toMyEnrollment(en: Enrollment): MyEnrollment {
  const course = COURSES.find((c) => c.id === en.courseId);
  return {
    id: en.id,
    courseId: en.courseId,
    courseName: en.courseName ?? en.courseTitle ?? course?.title ?? "",
    category: course?.category ?? "technical",
    status: en.status,
    progress: en.progress,
    enrolledAt: en.enrolledAt ?? en.enrolledDate ?? "",
    completedAt: en.completedAt,
    score: en.score,
    durationHours: course?.durationHours ?? 0,
    instructor: course?.instructor ?? "",
    deliveryMode: course?.deliveryMode ?? "online",
  };
}

export const MY_ENROLLMENTS: MyEnrollment[] = ENROLLMENTS.map(toMyEnrollment);

export const MOCK_ASSESSMENT: AssessmentQuestion[] = [
  {
    id: 1,
    question: "What does AML stand for?",
    options: [
      "Asset Management Ledger",
      "Anti-Money Laundering",
      "Annual Monetary Limit",
      "Authorised Monetary Liability",
    ],
    correct: 1,
  },
  {
    id: 2,
    question: "Which of the following is a red flag for money laundering?",
    options: [
      "Regular salary payments",
      "Large cash transactions with no clear business purpose",
      "Quarterly tax filings",
      "Standard bank transfers",
    ],
    correct: 1,
  },
  {
    id: 3,
    question: "What is a Suspicious Activity Report (SAR)?",
    options: [
      "A report filed when a client complains",
      "A quarterly performance summary",
      "A formal report filed when suspicious financial activity is detected",
      "An HR disciplinary record",
    ],
    correct: 2,
  },
];

export { COURSES };
export type { Course };

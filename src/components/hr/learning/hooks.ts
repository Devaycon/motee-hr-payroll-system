"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import type {
  Course,
  CourseCategory,
  CourseDeliveryMode,
  CourseStatus,
  Enrollment,
  EnrollmentStatus,
} from "@/src/lib/types/learning";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { CertificationRecord } from "@/src/lib/certifications/status";

interface RawCourse {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  deliveryMode?: string;
  mode?: string;
  instructor?: string;
  courseUrl?: string;
  durationHours?: number;
  duration?: number | string;
  capacity?: number;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  provider?: string;
  mandatory?: boolean;
  validityMonths?: number | null;
}

interface RawEnrollment {
  id?: string;
  courseId?: string;
  employeeId?: string;
  status?: string;
  progress?: number;
  enrolledAt?: string;
  enrolledDate?: string;
  dueDate?: string | null;
  completedAt?: string;
  score?: number;
}

function mapCategory(raw?: string): CourseCategory {
  // Fixtures spell categories as labels ("Soft Skills"); the form stores ids.
  const c = raw?.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (c === "people") return "leadership";
  if (c === "security") return "compliance";
  if (c === "customer") return "soft_skills";
  if (
    c === "technical" ||
    c === "leadership" ||
    c === "compliance" ||
    c === "soft_skills" ||
    c === "onboarding" ||
    c === "product"
  ) {
    return c;
  }
  return "technical";
}

function mapStatus(s?: string): CourseStatus {
  if (s === "draft" || s === "archived") return s;
  return "active";
}

function mapMode(m?: string): CourseDeliveryMode {
  if (m === "in_person" || m === "in-person") return "in_person";
  if (m === "hybrid") return "hybrid";
  return "online";
}

function mapEnrollmentStatus(s?: string): EnrollmentStatus {
  if (
    s === "in_progress" ||
    s === "completed" ||
    s === "dropped" ||
    s === "failed"
  ) {
    return s;
  }
  return "enrolled";
}

export interface LearningData {
  courses: Course[];
  enrollments: Enrollment[];
  /** Course certificates + professional credentials, for the Certification Register. */
  certifications: CertificationRecord[];
  /** The people in scope, for register names and mandatory-training compliance. */
  people: LearningPerson[];
}

export interface LearningPerson {
  id: string;
  fullName: string;
  initials: string;
  departmentName: string;
  status: string;
  gender?: string;
}

function buildLearning(bundle: LocaleBundle): LearningData {
  const employeesById = new Map(bundle.employees.map((e) => [e.id, e]));
  const learn = bundle.learning as {
    courses?: RawCourse[];
    enrollments?: RawEnrollment[];
    certifications?: CertificationRecord[];
  };

  const rawCourses = learn.courses ?? [];
  const counts = new Map<string, { enrolled: number; completed: number }>();
  for (const e of learn.enrollments ?? []) {
    const id = e.courseId ?? "";
    const cur = counts.get(id) ?? { enrolled: 0, completed: 0 };
    cur.enrolled += 1;
    if (e.status === "completed") cur.completed += 1;
    counts.set(id, cur);
  }

  const courses: Course[] = rawCourses.map((c, i) => {
    const id = c.id ?? `course-${i + 1}`;
    const stats = counts.get(id) ?? { enrolled: 0, completed: 0 };
    return {
      id,
      title: c.title ?? "Untitled course",
      description: c.description ?? "",
      category: mapCategory(c.category),
      status: mapStatus(c.status),
      deliveryMode: mapMode(c.deliveryMode ?? c.mode),
      instructor: c.instructor ?? c.provider ?? "—",
      provider: c.provider,
      mandatory: c.mandatory ?? false,
      validityMonths: c.validityMonths ?? null,
      courseUrl: c.courseUrl,
      // Fixtures carry "1.5h"; a bare number is already hours.
      durationHours: c.durationHours ?? (parseFloat(String(c.duration ?? "")) || 1),
      capacity: c.capacity,
      enrolledCount: stats.enrolled,
      completionCount: stats.completed,
      startDate: c.startDate,
      endDate: c.endDate,
      tags: c.tags ?? [],
      createdAt: bundle.tenant.createdAt.slice(0, 10),
    };
  });

  const coursesById = new Map(courses.map((c) => [c.id, c]));
  const enrollments: Enrollment[] = (learn.enrollments ?? []).map((e, i) => {
    const course = e.courseId ? coursesById.get(e.courseId) : null;
    const emp = e.employeeId ? employeesById.get(e.employeeId) : null;
    return {
      id: e.id ?? `enr-${i + 1}`,
      courseId: e.courseId ?? "",
      employeeId: e.employeeId,
      courseTitle: course?.title,
      employeeName: emp?.fullName ?? e.employeeId ?? "Unknown",
      employeeInitials: emp?.initials ?? "??",
      employeeDept: emp?.departmentName ?? "—",
      department: emp?.departmentName,
      status: mapEnrollmentStatus(e.status),
      progress: e.progress ?? 0,
      enrolledAt: e.enrolledAt ?? e.enrolledDate,
      enrolledDate: e.enrolledDate ?? e.enrolledAt,
      dueDate: e.dueDate ?? undefined,
      completedAt: e.completedAt,
      score: e.score,
    };
  });

  const people: LearningPerson[] = bundle.employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    initials: e.initials,
    departmentName: e.departmentName,
    status: e.status,
    gender: e.gender,
  }));

  return {
    courses,
    enrollments,
    certifications: learn.certifications ?? [],
    people,
  };
}

export function useLearning() {
  return useLocaleSection<LearningData>(buildLearning);
}

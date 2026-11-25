import type {
  CertificationDto,
  CertificationRequest,
} from "@/src/types/certifications";
import type {
  CourseCategory as ApiCategory,
  CourseRequest,
  CourseRowDto,
  DeliveryMode,
  EnrollmentDto,
  EnrollmentStatus as ApiEnrollmentStatus,
  QuizQuestionDto,
  QuizRequest,
} from "@/src/types/learning";
import type {
  Course,
  CourseCategory,
  CourseDeliveryMode,
  CourseQuiz,
  Enrollment,
  EnrollmentStatus,
  NewCourse,
} from "@/src/lib/types/learning";
import type { CertificationRecord } from "@/src/lib/certifications/status";
import { initials } from "@/src/lib/helpdesk/api-mapping";

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export const categoryFromApi = (c: ApiCategory) => snake(c) as CourseCategory;
export const categoryToApi = (c: CourseCategory) => camel(c) as ApiCategory;
export const deliveryFromApi = (d: DeliveryMode) => snake(d) as CourseDeliveryMode;
export const deliveryToApi = (d: CourseDeliveryMode) => camel(d) as DeliveryMode;
export const enrollmentStatusFromApi = (s: ApiEnrollmentStatus) => snake(s) as EnrollmentStatus;
export const enrollmentStatusToApi = (s: EnrollmentStatus) => camel(s) as ApiEnrollmentStatus;

const day = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : undefined);

export function quizFromApi(row: CourseRowDto, questions: QuizQuestionDto[]): CourseQuiz {
  return {
    passingScore: row.passingScore,
    maxAttempts: row.maxAttempts ?? undefined,
    questions: [...questions]
      .sort((a, b) => a.sequence - b.sequence)
      .map((q) => ({
        id: q.id,
        type: q.questionKind === "trueFalse" ? "true_false" : "mcq",
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        points: q.points,
      })),
  };
}

export function quizToRequest(quiz: CourseQuiz): QuizRequest {
  return {
    passingScore: quiz.passingScore,
    maxAttempts: quiz.maxAttempts ?? null,
    questions: quiz.questions.map((q) => ({
      questionKind: q.type === "true_false" ? "trueFalse" : "multipleChoice",
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      points: q.points,
    })),
  };
}

/**
 * A course row. Quiz questions are read separately (`GET …/quiz`) when HR
 * opens the quiz builder; until then a course with a quiz carries an empty
 * one with the server pass mark, so "has a quiz" still reads correctly.
 */
export function courseFromApi(row: CourseRowDto): Course {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: categoryFromApi(row.category),
    status: row.status,
    deliveryMode: deliveryFromApi(row.deliveryMode),
    instructor: row.instructor ?? "",
    provider: row.provider ?? undefined,
    mandatory: row.isMandatory,
    validityMonths: row.validityMonths ?? null,
    courseUrl: row.courseUrl ?? undefined,
    videoUrl: row.videoUrl ?? undefined,
    quiz: row.hasQuiz
      ? { passingScore: row.passingScore, maxAttempts: row.maxAttempts ?? undefined, questions: [] }
      : undefined,
    durationHours: row.durationHours,
    capacity: row.capacity ?? undefined,
    enrolled: row.enrolledCount,
    enrolledCount: row.enrolledCount,
    completionCount: row.completedCount,
    startDate: day(row.startsOn),
    endDate: day(row.endsOn),
    tags: row.tags,
    createdAt: day(row.createdAt) ?? "",
  };
}

export function courseToRequest(c: NewCourse): CourseRequest {
  return {
    title: c.title,
    description: c.description || null,
    category: categoryToApi(c.category),
    status: c.status,
    deliveryMode: deliveryToApi(c.deliveryMode),
    instructor: c.instructor || null,
    provider: c.provider || null,
    isMandatory: !!c.mandatory,
    validityMonths: c.validityMonths ?? null,
    courseUrl: c.courseUrl || null,
    durationHours: c.durationHours,
    capacity: c.capacity ?? null,
    startsOn: c.startDate || null,
    endsOn: c.endDate || null,
    tags: c.tags,
  };
}

export function enrollmentFromApi(dto: EnrollmentDto): Enrollment {
  const name = dto.employeeName ?? "Employee";
  return {
    id: dto.id,
    courseId: dto.courseId,
    employeeId: dto.employeeId,
    courseName: dto.courseTitle,
    courseTitle: dto.courseTitle,
    employeeName: name,
    employeeInitials: initials(name),
    employeeDept: dto.departmentName ?? "",
    department: dto.departmentName ?? "",
    status: enrollmentStatusFromApi(dto.status),
    progress: dto.progress,
    enrolledAt: day(dto.enrolledOn),
    enrolledDate: day(dto.enrolledOn),
    dueDate: day(dto.dueOn),
    completedAt: day(dto.completedOn),
    score: dto.bestScore ?? undefined,
    quizAttempts: dto.attempts.map((a) => ({ at: a.attemptedAt, score: a.score, passed: a.passed })),
    quizPassed: dto.quizPassed,
  };
}

export function certificationFromApi(dto: CertificationDto): CertificationRecord {
  return {
    id: dto.id,
    employeeId: dto.employeeId,
    courseId: dto.courseId ?? null,
    kind: dto.certificationKind,
    title: dto.title,
    issuingBody: dto.issuingBody ?? undefined,
    category: dto.category ?? undefined,
    credentialId: dto.credentialId ?? undefined,
    issuedAt: day(dto.issuedOn) ?? "",
    expiresAt: day(dto.expiresOn) ?? null,
  };
}

export function certificationToRequest(c: CertificationRecord): CertificationRequest {
  return {
    employeeId: c.employeeId,
    title: c.title,
    issuingBody: c.issuingBody || null,
    category: c.category || null,
    credentialId: c.credentialId || null,
    issuedOn: c.issuedAt,
    expiresOn: c.expiresAt || null,
  };
}

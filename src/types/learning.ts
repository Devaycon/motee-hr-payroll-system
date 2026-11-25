import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export interface AskedQuestion {
  id: string;
  sequence: number;
  questionKind: QuestionKind;
  prompt: string;
  options: string[];
  points: number;
}

export interface AskedQuizDto {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  passingScore: number;
  attemptsLeft?: number | null;
  questions: AskedQuestion[];
}

export interface AttemptDto {
  score: number;
  passed: boolean;
  correct: number;
  questions: number;
  attemptedAt: string;
}

export interface AttemptRequest {
  answers: Record<string, number>;
}

export interface AttemptResult {
  outcome: LearningOutcome;
  refusal?: LearningRefusal;
  scored?: ScoredAttempt;
  enrollment?: EnrollmentDto;
  certificate?: CertificationDto;
  attemptsLeft?: number | null;
  succeeded?: boolean;
}

export type CertStatus =
  "noExpiry" | "active" | "expiringInSixty" | "expiringInThirty" | "expired";

export interface CertificationDto {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  departmentName?: string | null;
  courseId?: string | null;
  courseTitle?: string | null;
  certificationKind: CertificationKind;
  title: string;
  issuingBody?: string | null;
  category?: string | null;
  credentialId?: string | null;
  issuedOn: string;
  expiresOn?: string | null;
  status: CertStatus;
  daysToExpiry?: number | null;
  storedFileId?: string | null;
  expiryIsDerived: boolean;
}

export type CertificationKind =
  "professional" | "course";

export type CourseCategory =
  "technical" | "leadership" | "compliance" | "softSkills" | "onboarding" | "product";

export interface CourseDto {
  course: CourseRowDto;
  questionCount: number;
}

export interface CourseRequest {
  title: string;
  description?: string | null;
  category?: CourseCategory;
  status?: CourseStatus;
  deliveryMode?: DeliveryMode;
  instructor?: string | null;
  provider?: string | null;
  isMandatory?: boolean;
  validityMonths?: number | null;
  courseUrl?: string | null;
  videoUrl?: string | null;
  durationHours?: number;
  capacity?: number | null;
  startsOn?: string | null;
  endsOn?: string | null;
  tags?: string[] | null;
}

export interface CourseRowDto {
  id: string;
  title: string;
  description?: string | null;
  category: CourseCategory;
  status: CourseStatus;
  deliveryMode: DeliveryMode;
  instructor?: string | null;
  provider?: string | null;
  isMandatory: boolean;
  validityMonths?: number | null;
  courseUrl?: string | null;
  videoUrl?: string | null;
  durationHours: number;
  capacity?: number | null;
  startsOn?: string | null;
  endsOn?: string | null;
  tags: string[];
  hasQuiz: boolean;
  passingScore: number;
  maxAttempts?: number | null;
  enrolledCount: number;
  completedCount: number;
  placesLeft?: number | null;
  completionPercent: number;
  createdAt: string;
}

export type CourseStatus =
  "draft" | "active" | "archived";

export type DeliveryMode =
  "online" | "inPerson" | "hybrid";

export interface DepartmentTally {
  departmentName: string;
  required: number;
  completed: number;
  completionPercent: number;
  overdue: number;
  atRisk: boolean;
}

export interface EnrollRequest {
  employeeIds: string[];
  dueOn?: string | null;
}

export interface EnrollResult {
  outcome: LearningOutcome;
  refusal?: LearningRefusal;
  enrolled: EnrollmentDto[];
  skipped: string[];
  succeeded?: boolean;
}

export interface EnrollmentDto {
  id: string;
  courseId: string;
  courseTitle: string;
  isMandatory: boolean;
  employeeId: string;
  employeeName?: string | null;
  departmentName?: string | null;
  status: EnrollmentStatus;
  progress: number;
  resumeSeconds?: number | null;
  enrolledOn: string;
  dueOn?: string | null;
  completedOn?: string | null;
  isOverdue: boolean;
  bestScore?: number | null;
  quizPassed: boolean;
  attemptsUsed: number;
  attemptsLeft?: number | null;
  attempts: AttemptDto[];
}

export type EnrollmentStatus =
  "notAttempted" | "enrolled" | "inProgress" | "completed" | "dropped" | "failed";

export interface EnrollmentStatusRequest {
  status: EnrollmentStatus;
}

export type LearningOutcome =
  "succeeded" | "notFound" | "refused" | "employeeNotFound" | "noEmployeeRecord" | "notYours";

export type LearningRefusal =
  "none" | "titleTooShort" | "durationNotPositive" | "capacityNotPositive" | "endsBeforeStart" | "validityNotPositive" | "questionPromptRequired" | "questionNeedsTwoOptions" | "answerNotAnOption" | "pointsNotPositive" | "passMarkOutOfRange" | "noQuestions" | "progressOutOfRange" | "completedMustBeWhole" | "wholeMustBeCompleted" | "alreadyEnrolled" | "courseFull" | "courseNotOpen" | "noQuiz" | "noAttemptsLeft" | "certificateTitleRequired" | "expiresBeforeIssued" | "unknownCourse" | "unknownEnrollment";

export interface LearningSummaryDto {
  courses: number;
  activeCourses: number;
  mandatoryCourses: number;
  enrollments: number;
  completed: number;
  inProgress: number;
  overdue: number;
  completionPercent: number;
  hoursDelivered: number;
}

export interface MandatoryTally {
  required: number;
  completed: number;
  completionPercent: number;
  overdue: Overdue[];
  peopleOverdue: number;
  departments: DepartmentTally[];
  departmentsAtRisk: number;
}

export interface MyLearningDto {
  employeeId?: string | null;
  enrolled: EnrollmentDto[];
  library: CourseRowDto[];
  completed: number;
  inProgress: number;
  overdue: number;
  hoursCompleted: number;
}

export interface Overdue {
  employeeId: string;
  employeeName: string;
  departmentName?: string | null;
  courseId: string;
  courseTitle: string;
  dueOn?: string | null;
}

export interface ProgressRequest {
  progress: number;
  resumeSeconds?: number | null;
}

export type QuestionKind =
  "multipleChoice" | "trueFalse";

export interface QuizQuestionDto {
  id: string;
  sequence: number;
  questionKind: QuestionKind;
  prompt: string;
  options: string[];
  correctIndex: number;
  points: number;
}

export interface QuizQuestionRequest {
  questionKind?: QuestionKind;
  prompt: string;
  options: string[];
  correctIndex?: number;
  points?: number;
}

export interface QuizRequest {
  passingScore?: number;
  maxAttempts?: number | null;
  questions: QuizQuestionRequest[];
}

export interface ScoredAttempt {
  score: number;
  passed: boolean;
  correct: number;
  questions: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/learning/courses
export type GetLearningCoursesResponse = ApiResponse<PagedResult<CourseRowDto>>;
export interface GetLearningCoursesParams {
  Category?: CourseCategory;
  Status?: CourseStatus;
  DeliveryMode?: DeliveryMode;
  MandatoryOnly?: boolean;
  WithQuizOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/learning/courses
export type CreateLearningCourseResponse = ApiResponse<CourseDto>;

// GET /api/v1/learning/courses/{id}
export type GetLearningCourseResponse = ApiResponse<CourseDto>;

// PUT /api/v1/learning/courses/{id}
export type UpdateLearningCourseResponse = ApiResponse<CourseDto>;

// DELETE /api/v1/learning/courses/{id}
export type DeleteLearningCourseResponse = ApiResponse<unknown | null>;

// GET /api/v1/learning/summary
export type GetLearningSummaryResponse = ApiResponse<LearningSummaryDto>;

// GET /api/v1/learning/compliance
export type GetLearningComplianceResponse = ApiResponse<MandatoryTally>;

// GET /api/v1/learning/courses/{id}/quiz
export type GetLearningCourseQuizResponse = ApiResponse<QuizQuestionDto[]>;

// PUT /api/v1/learning/courses/{id}/quiz
export type SaveLearningCourseQuizResponse = ApiResponse<CourseDto>;

// GET /api/v1/learning/enrollments
export type GetLearningEnrollmentsResponse = ApiResponse<PagedResult<EnrollmentDto>>;
export interface GetLearningEnrollmentsParams {
  CourseId?: string;
  EmployeeId?: string;
  DepartmentId?: string;
  Status?: EnrollmentStatus;
  OverdueOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/learning/courses/{id}/enrollments
export type EnrollInLearningCourseResponse = ApiResponse<EnrollResult>;

// PATCH /api/v1/learning/enrollments/{enrollmentId}/progress
export type UpdateLearningEnrollmentProgressResponse = ApiResponse<EnrollmentDto>;

// PATCH /api/v1/learning/enrollments/{enrollmentId}/status
export type UpdateLearningEnrollmentStatusResponse = ApiResponse<EnrollmentDto>;

// DELETE /api/v1/learning/enrollments/{enrollmentId}
export type DeleteLearningEnrollmentResponse = ApiResponse<unknown | null>;

// GET /api/v1/learning/mine
export type GetMyLearningResponse = ApiResponse<MyLearningDto>;

// GET /api/v1/learning/mine/{enrollmentId}/quiz
export type GetMyLearningQuizResponse = ApiResponse<AskedQuizDto>;

// POST /api/v1/learning/mine/{enrollmentId}/attempts
export type SubmitMyLearningQuizAttemptResponse = ApiResponse<AttemptResult>;


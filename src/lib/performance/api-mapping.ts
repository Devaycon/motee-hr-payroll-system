import type {
  GoalCategory as ApiGoalCategory,
  GoalRequest,
  GoalStatus as ApiGoalStatus,
  OpenReviewRequest,
  PerformanceGoalDto,
  PerformanceReviewDto,
  ReviewType as ApiReviewType,
} from "@/src/types/performance";
import type {
  GoalStatus,
  NewGoal,
  NewReview,
  PerformanceGoal,
  PerformanceReview,
  ReviewStatus,
  ReviewType,
} from "@/src/lib/types/performance";
import { toRating } from "./records";

/**
 * The API spells enums in camelCase where the screens use snake_case, and
 * reports "overdue" as a flag beside the status rather than as a status.
 */

const REVIEW_TYPE_FROM_API: Record<ApiReviewType, ReviewType> = {
  annual: "annual",
  midYear: "mid_year",
  probation: "probation",
  pip: "pip",
  threeSixty: "360",
};

const REVIEW_TYPE_TO_API: Record<ReviewType, ApiReviewType> = {
  annual: "annual",
  mid_year: "midYear",
  probation: "probation",
  pip: "pip",
  "360": "threeSixty",
};

const GOAL_STATUS_TO_API: Partial<Record<GoalStatus, ApiGoalStatus>> = {
  on_track: "onTrack",
  at_risk: "atRisk",
  completed: "completed",
  cancelled: "cancelled",
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const dateOnly = (iso?: string | null) => (iso ? iso.slice(0, 10) : undefined);

function reviewStatusOf(review: PerformanceReviewDto): ReviewStatus {
  if (review.status === "completed") return "completed";
  if (review.isOverdue) return "overdue";
  return review.status === "inProgress" ? "in_progress" : "not_started";
}

export function toPerformanceReview(
  review: PerformanceReviewDto,
): PerformanceReview {
  const assessment = review.selfAssessment;
  return {
    id: review.id,
    employeeId: review.employeeId,
    employeeName: review.employeeName,
    employeeInitials: initialsOf(review.employeeName),
    jobTitle: review.jobTitle ?? undefined,
    department: review.departmentName ?? "—",
    reviewType: REVIEW_TYPE_FROM_API[review.reviewType] ?? "annual",
    period: review.period,
    status: reviewStatusOf(review),
    reviewerId: review.reviewerId ?? undefined,
    reviewer: review.reviewerName ?? "—",
    rating: toRating(review.rating ?? review.calibratedRating ?? review.managerRating),
    selfRating: toRating(review.selfRating),
    managerRating: toRating(review.managerRating),
    calibratedRating: toRating(review.calibratedRating),
    strengths: review.strengths ?? undefined,
    improvements: review.improvements ?? undefined,
    comments: review.comments ?? undefined,
    selfAssessment: assessment
      ? {
          achievements: assessment.achievements ?? "",
          challenges: assessment.challenges ?? "",
          developmentAreas: assessment.developmentAreas ?? "",
          managerFeedback: assessment.managerFeedback ?? "",
        }
      : undefined,
    selfSubmittedAt: dateOnly(review.selfSubmittedAt),
    dueDate: review.dueDate,
    completedDate: dateOnly(review.completedAt),
  };
}

function goalStatusOf(goal: PerformanceGoalDto): GoalStatus {
  if (goal.status === "cancelled") return "cancelled";
  if (goal.status === "completed") return "completed";
  if (goal.isOverdue) return "overdue";
  return goal.status === "atRisk" ? "at_risk" : "on_track";
}

export function toPerformanceGoal(goal: PerformanceGoalDto): PerformanceGoal {
  return {
    id: goal.id,
    employeeId: goal.employeeId,
    employeeName: goal.employeeName,
    employeeInitials: initialsOf(goal.employeeName),
    department: goal.departmentName ?? "—",
    goalTitle: goal.title,
    description: goal.description ?? undefined,
    category: goal.category,
    status: goalStatusOf(goal),
    progress: Math.max(0, Math.min(100, goal.progress)),
    dueDate: goal.dueDate,
    createdAt: goal.createdAt.slice(0, 10),
    completedAt: dateOnly(goal.completedAt),
    goalType: goal.goalType ?? undefined,
    updates: goal.updates.map((update) => ({
      date: update.at.slice(0, 10),
      progress: update.progress,
      ...(update.note ? { note: update.note } : {}),
    })),
  };
}

export function reviewToOpenRequest(
  review: NewReview & { employeeId: string },
): OpenReviewRequest {
  return {
    employeeId: review.employeeId,
    reviewerId: review.reviewerId || null,
    reviewType: REVIEW_TYPE_TO_API[review.reviewType],
    period: review.period,
    dueDate: review.dueDate,
  };
}

export function goalToRequest(
  goal: NewGoal & { goalType?: string },
): GoalRequest {
  return {
    title: goal.goalTitle,
    description: goal.description || null,
    category: goal.category as ApiGoalCategory,
    dueDate: goal.dueDate,
    goalType: goal.goalType || null,
  };
}

/** Overdue is derived on the server, so it is never sent as a status. */
export function goalStatusToApi(status: GoalStatus): ApiGoalStatus | null {
  return GOAL_STATUS_TO_API[status] ?? null;
}

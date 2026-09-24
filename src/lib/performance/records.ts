import { applyCollection } from "@/src/lib/profile/collection-edits";
import type { CollectionEditsState } from "@/src/lib/stores/collection-edits-slice";
import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";
import type {
  FeedbackRequest,
  FeedbackType,
  GoalCategory,
  GoalStatus,
  GoalUpdate,
  PerformanceFeedback,
  PerformanceGoal,
  PerformanceRating,
  PerformanceReview,
  ReviewStatus,
  ReviewType,
  SelfAssessment,
} from "@/src/lib/types/performance";

/**
 * Performance records as they live in the locale bundle and the shared
 * collection-edits layer, and the one mapping from them to what the screens
 * show.
 *
 * The HR Performance page, employee self-service and the employee profile all
 * read and write the same `perf.*` collections, so a review completed in one
 * place shows up in the others.
 */

export const PERF_KEYS = {
  reviews: "perf.reviews",
  goals: "perf.goals",
  feedback: "perf.feedback",
  feedbackRequests: "perf.feedbackRequests",
} as const;

export interface RawCycle {
  id?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

/**
 * The bundle ships `selfRating`/`managerRating`/`calibratedRating`,
 * `summary` and `completedAt`. Reviews created in the app also carry the
 * reviewer, type, period and due date chosen when they were set up.
 */
export interface RawReview {
  id?: string;
  employeeId?: string;
  cycleId?: string;
  type?: string;
  period?: string;
  status?: string;
  reviewerId?: string;
  dueDate?: string;
  selfRating?: number;
  managerRating?: number;
  calibratedRating?: number;
  summary?: string;
  strengths?: string;
  improvements?: string;
  comments?: string;
  selfAssessment?: SelfAssessment;
  selfSubmittedAt?: string;
  completedAt?: string;
  /** Older app-created records used this name. */
  completedDate?: string;
}

export interface RawGoal {
  id?: string;
  employeeId?: string;
  cycleId?: string;
  title?: string;
  description?: string;
  category?: string;
  type?: string;
  progress?: number;
  status?: string;
  dueDate?: string;
  createdAt?: string;
  completedAt?: string;
  updates?: GoalUpdate[];
}

export interface RawFeedback {
  id?: string;
  toEmployeeId?: string;
  fromEmployeeId?: string;
  type?: string;
  message?: string;
  createdAt?: string;
}

export interface RawFeedbackRequest {
  id?: string;
  toEmployeeId?: string;
  fromEmployeeId?: string;
  context?: string;
  createdAt?: string;
}

export interface CycleInfo {
  id: string;
  name: string;
  /** Short label for tables, e.g. "H1 2025". */
  period: string;
  startDate?: string;
  endDate?: string;
  /** First half of the year is the mid-year review; second is the annual. */
  reviewType?: ReviewType;
}

export const todayIso = () => new Date().toISOString().slice(0, 10);

const CYCLE_ID = /^RC-(\d{4})-(H[12])$/;

/**
 * Looks a cycle up in the bundle, falling back to reading its id. Reviews
 * reference past cycles (RC-2024-H1…) that the cycle list no longer carries,
 * and those still need a period and a due date.
 */
export function resolveCycle(
  cycleId: string | undefined,
  cycles: RawCycle[],
): CycleInfo | null {
  if (!cycleId) return null;
  const listed = cycles.find((c) => c.id === cycleId);
  const parsed = CYCLE_ID.exec(cycleId);
  const half = parsed?.[2] as "H1" | "H2" | undefined;
  const year = parsed?.[1];
  const reviewType: ReviewType | undefined = half
    ? half === "H1"
      ? "mid_year"
      : "annual"
    : undefined;

  if (listed) {
    const name = listed.name ?? cycleId;
    return {
      id: cycleId,
      name,
      period: name.replace(/\s*review$/i, ""),
      startDate: listed.startDate,
      endDate: listed.endDate,
      reviewType,
    };
  }
  if (!half || !year) return null;
  // Same review windows the bundle's own cycles use.
  const window =
    half === "H1"
      ? { startDate: `${year}-06-01`, endDate: `${year}-06-30` }
      : { startDate: `${year}-11-01`, endDate: `${year}-11-30` };
  return {
    id: cycleId,
    name: `${half} ${year} Review`,
    period: `${half} ${year}`,
    reviewType,
    ...window,
  };
}

const CATEGORY_RULES: [RegExp, GoalCategory][] = [
  [/\b(lead|leadership|mentor|coach|hire|hiring|manage)/i, "leadership"],
  [/\b(communicat|present|stakeholder|nps|customer)/i, "communication"],
  [/\b(train|certif|learn|course|study|skill)/i, "growth"],
  [/\b(ship|feature|engineer|migrat|api|code|test|build|launch|automat)/i, "technical"],
  [/\b(reduce|resolution|process|complian|cost|efficien|adoption)/i, "operational"],
];

/**
 * Bundle goals carry a framework (SMART/OKR) but no category, so one is read
 * from the title. Goals created in the app store the category chosen.
 */
export function inferGoalCategory(title: string | undefined): GoalCategory {
  if (title) {
    for (const [re, category] of CATEGORY_RULES) {
      if (re.test(title)) return category;
    }
  }
  return "growth";
}

const REVIEW_TYPES: ReviewType[] = ["annual", "mid_year", "probation", "pip", "360"];
const GOAL_CATEGORIES: GoalCategory[] = [
  "technical",
  "leadership",
  "communication",
  "growth",
  "operational",
];
const FEEDBACK_TYPES: FeedbackType[] = ["peer", "upward", "downward", "manager"];

function asReviewType(t: string | undefined): ReviewType | undefined {
  if (t === "midyear") return "mid_year";
  return REVIEW_TYPES.find((x) => x === t);
}

export function toRating(r: unknown): PerformanceRating | undefined {
  if (typeof r !== "number" || Number.isNaN(r)) return undefined;
  return Math.max(1, Math.min(5, Math.round(r))) as PerformanceRating;
}

/** Status follows from the record's dates and ratings, not a stored flag. */
export function deriveReviewStatus(
  raw: RawReview,
  dueDate: string,
  today: string,
): ReviewStatus {
  if (raw.completedAt || raw.completedDate || raw.status === "completed")
    return "completed";
  if (dueDate && dueDate < today) return "overdue";
  if (
    raw.status === "in_progress" ||
    raw.selfRating != null ||
    raw.managerRating != null ||
    raw.selfSubmittedAt
  )
    return "in_progress";
  return "not_started";
}

export function deriveGoalStatus(
  raw: RawGoal,
  dueDate: string,
  today: string,
): GoalStatus {
  if (raw.status === "cancelled") return "cancelled";
  if (raw.status === "completed" || (raw.progress ?? 0) >= 100)
    return "completed";
  if (dueDate && dueDate < today) return "overdue";
  if (raw.status === "at_risk" || raw.status === "overdue") return raw.status;
  return "on_track";
}

export interface PerformanceContext {
  /** Whose records the viewer may see (role scope + branch view). */
  inScope: Set<string>;
  /** Everyone, for display names only — reviewers and feedback givers. */
  people: Map<string, LocaleEmployee>;
  cycles: RawCycle[];
  today: string;
  fallbackDate: string;
}

export function buildContext(
  scoped: LocaleBundle,
  directory: LocaleEmployee[] = scoped.employees,
  today = todayIso(),
): PerformanceContext {
  const perf = (scoped.performance ?? {}) as { cycles?: RawCycle[] };
  return {
    inScope: new Set(scoped.employees.map((e) => e.id)),
    people: new Map(
      [...directory, ...scoped.employees].map((e) => [e.id, e] as const),
    ),
    cycles: perf.cycles ?? [],
    today,
    fallbackDate: scoped.tenant.createdAt.slice(0, 10),
  };
}

export function toReview(
  raw: RawReview,
  ctx: PerformanceContext,
): PerformanceReview | null {
  if (!raw.id || !raw.employeeId || !ctx.inScope.has(raw.employeeId))
    return null;
  const emp = ctx.people.get(raw.employeeId);
  const cycle = resolveCycle(raw.cycleId, ctx.cycles);
  // Reviews go to the line manager unless someone else was named.
  const reviewerId = raw.reviewerId ?? emp?.managerId ?? undefined;
  const reviewer = reviewerId ? ctx.people.get(reviewerId) : undefined;
  const completedDate = raw.completedAt ?? raw.completedDate;
  const dueDate =
    raw.dueDate ?? cycle?.endDate ?? completedDate ?? ctx.fallbackDate;
  const selfRating = toRating(raw.selfRating);
  const managerRating = toRating(raw.managerRating);
  const calibratedRating = toRating(raw.calibratedRating);

  return {
    id: raw.id,
    employeeId: raw.employeeId,
    employeeName: emp?.fullName ?? raw.employeeId,
    employeeInitials: emp?.initials,
    jobTitle: emp?.jobTitle,
    department: emp?.departmentName ?? "—",
    reviewType: asReviewType(raw.type) ?? cycle?.reviewType ?? "annual",
    period: raw.period ?? cycle?.period ?? "—",
    status: deriveReviewStatus(raw, dueDate, ctx.today),
    reviewerId,
    reviewer: reviewer?.fullName ?? "—",
    rating: calibratedRating ?? managerRating,
    cycleId: raw.cycleId,
    selfRating,
    managerRating,
    calibratedRating,
    strengths: raw.strengths,
    improvements: raw.improvements,
    comments: raw.comments ?? raw.summary,
    selfAssessment: raw.selfAssessment,
    selfSubmittedAt: raw.selfSubmittedAt,
    dueDate,
    completedDate,
  };
}

export function toGoal(
  raw: RawGoal,
  ctx: PerformanceContext,
): PerformanceGoal | null {
  if (!raw.id || !raw.employeeId || !ctx.inScope.has(raw.employeeId))
    return null;
  const emp = ctx.people.get(raw.employeeId);
  const cycle = resolveCycle(raw.cycleId, ctx.cycles);
  const dueDate = raw.dueDate ?? cycle?.endDate ?? ctx.fallbackDate;
  const category =
    GOAL_CATEGORIES.find((c) => c === raw.category) ??
    inferGoalCategory(raw.title);
  return {
    id: raw.id,
    employeeId: raw.employeeId,
    employeeName: emp?.fullName ?? raw.employeeId,
    employeeInitials: emp?.initials,
    department: emp?.departmentName ?? "—",
    goalTitle: raw.title ?? "Goal",
    description: raw.description,
    category,
    status: deriveGoalStatus(raw, dueDate, ctx.today),
    progress: Math.max(0, Math.min(100, raw.progress ?? 0)),
    dueDate,
    createdAt: raw.createdAt ?? cycle?.startDate ?? ctx.fallbackDate,
    completedAt: raw.completedAt,
    cycleId: raw.cycleId,
    goalType: raw.type,
    updates: raw.updates,
  };
}

export function toFeedback(
  raw: RawFeedback,
  ctx: PerformanceContext,
): PerformanceFeedback | null {
  if (!raw.id || !raw.toEmployeeId || !ctx.inScope.has(raw.toEmployeeId))
    return null;
  return {
    id: raw.id,
    toEmployeeId: raw.toEmployeeId,
    fromEmployeeId: raw.fromEmployeeId,
    fromName: raw.fromEmployeeId
      ? ctx.people.get(raw.fromEmployeeId)?.fullName
      : undefined,
    type: FEEDBACK_TYPES.find((t) => t === raw.type) ?? "peer",
    message: raw.message ?? "",
    createdAt: raw.createdAt ?? ctx.fallbackDate,
  };
}

export function toFeedbackRequest(
  raw: RawFeedbackRequest,
  ctx: PerformanceContext,
): FeedbackRequest | null {
  if (
    !raw.id ||
    !raw.toEmployeeId ||
    !raw.fromEmployeeId ||
    !ctx.inScope.has(raw.toEmployeeId)
  )
    return null;
  return {
    id: raw.id,
    toEmployeeId: raw.toEmployeeId,
    fromEmployeeId: raw.fromEmployeeId,
    fromName: ctx.people.get(raw.fromEmployeeId)?.fullName ?? "A colleague",
    context: raw.context,
    createdAt: raw.createdAt ?? ctx.fallbackDate,
  };
}

export interface PerformanceData {
  reviews: PerformanceReview[];
  goals: PerformanceGoal[];
  feedback: PerformanceFeedback[];
  feedbackRequests: FeedbackRequest[];
  /** The company's department names, for filters and pickers. */
  departments: string[];
}

type Edits = Pick<CollectionEditsState, "added" | "edits"> &
  Partial<Pick<CollectionEditsState, "removed">>;

function mapAll<R, T>(
  base: R[],
  key: string,
  edits: Edits,
  map: (raw: R) => T | null,
): T[] {
  return applyCollection(base, key, edits)
    .map(map)
    .filter((x): x is T => x !== null);
}

/** Bundle records with session edits layered on, mapped for display. */
export function buildPerformance(
  scoped: LocaleBundle,
  edits: Edits,
  directory?: LocaleEmployee[],
  today?: string,
): PerformanceData {
  const ctx = buildContext(scoped, directory, today);
  const perf = (scoped.performance ?? {}) as {
    reviews?: RawReview[];
    goals?: RawGoal[];
    feedback?: RawFeedback[];
    feedbackRequests?: RawFeedbackRequest[];
  };
  return {
    reviews: mapAll(perf.reviews ?? [], PERF_KEYS.reviews, edits, (r) =>
      toReview(r, ctx),
    ),
    goals: mapAll(perf.goals ?? [], PERF_KEYS.goals, edits, (g) =>
      toGoal(g, ctx),
    ),
    feedback: mapAll(perf.feedback ?? [], PERF_KEYS.feedback, edits, (f) =>
      toFeedback(f, ctx),
    ),
    feedbackRequests: mapAll<RawFeedbackRequest, FeedbackRequest>(
      perf.feedbackRequests ?? [],
      PERF_KEYS.feedbackRequests,
      edits,
      (r) => toFeedbackRequest(r, ctx),
    ),
    departments: [...new Set((scoped.departments ?? []).map((d) => d.name))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
  };
}

/**
 * Cross-cutting derived views over a project — health, the critical-path
 * alert, and next actions — that combine schedule, budget and resourcing
 * data. Kept separate from `projects.ts` (the core scheduling/types file)
 * because these are UI-facing roll-ups rather than scheduling primitives.
 */
import {
  criticalPath,
  daysBetween,
  findOverAllocations,
  findScheduleConflicts,
  forecastFinalCost,
  isTaskBlocked,
  type Milestone,
  type Project,
  type ProjectTask,
  type TimesheetEntry,
} from "./projects";

// ── Project Health (§1) ──────────────────────────────────────────────────

export type HealthStatus = "green" | "amber" | "red" | "unknown";

export interface ProjectHealth {
  overall: HealthStatus;
  schedule: HealthStatus;
  budget: HealthStatus;
  resources: HealthStatus;
  criticalPath: HealthStatus;
  /**
   * Always "unknown" — nothing tracks scope creep yet. Change Requests (§12)
   * are out of scope pending a client conversation, so this is left honest
   * rather than faked green.
   */
  scope: HealthStatus;
}

export function computeProjectHealth(
  project: Project,
  timesheets: TimesheetEntry[],
  allProjects: Project[],
): ProjectHealth {
  const today = new Date().toISOString().slice(0, 10);

  const conflicts = findScheduleConflicts(project.tasks);
  const overdueMilestone = project.milestones.some(
    (m) => !m.reached && m.date < today,
  );
  const overdueTask = project.tasks.some(
    (t) =>
      t.status !== "completed" && t.status !== "cancelled" && t.endDate < today,
  );
  const schedule: HealthStatus =
    overdueMilestone || conflicts.length > 0
      ? "red"
      : overdueTask
        ? "amber"
        : "green";

  const budget = project.budget ?? 0;
  const forecast = forecastFinalCost(project, timesheets);
  const budgetHealth: HealthStatus = !budget
    ? "unknown"
    : forecast > budget
      ? "red"
      : forecast / budget > 0.85
        ? "amber"
        : "green";

  const overAllocated = new Map(
    findOverAllocations(allProjects).map((o) => [o.employeeId, o.totalPercent]),
  );
  const worstOver = Math.max(
    0,
    ...project.allocations.map((a) => overAllocated.get(a.employeeId) ?? 0),
  );
  const resources: HealthStatus =
    worstOver > 120 ? "red" : worstOver > 100 ? "amber" : "green";

  const criticalIds = new Set(criticalPath(project.tasks));
  const criticalTasks = project.tasks.filter((t) => criticalIds.has(t.id));
  const criticalBlocked = criticalTasks.some((t) =>
    isTaskBlocked(t, project.tasks),
  );
  const criticalOverdue = criticalTasks.some(
    (t) => t.status !== "completed" && t.endDate < today,
  );
  const criticalPathHealth: HealthStatus = criticalBlocked
    ? "red"
    : criticalOverdue
      ? "amber"
      : "green";

  const scope: HealthStatus = "unknown";

  const areas = [schedule, budgetHealth, resources, criticalPathHealth];
  const overall: HealthStatus = areas.includes("red")
    ? "red"
    : areas.includes("amber")
      ? "amber"
      : "green";

  return {
    overall,
    schedule,
    budget: budgetHealth,
    resources,
    criticalPath: criticalPathHealth,
    scope,
  };
}

// ── Critical Path Alert (§3) ─────────────────────────────────────────────

export interface CriticalPathAlert {
  taskCount: number;
  blockerTask: ProjectTask;
  impactMilestone: Milestone | null;
  owner: string | null;
  dueDate: string | null;
}

/** Null when nothing on the critical path is currently blocked. */
export function criticalPathAlert(project: Project): CriticalPathAlert | null {
  const ids = criticalPath(project.tasks);
  if (ids.length === 0) return null;

  const byId = new Map(project.tasks.map((t) => [t.id, t]));
  const blockerTask = ids
    .map((id) => byId.get(id))
    .find((t): t is ProjectTask => Boolean(t) && isTaskBlocked(t!, project.tasks));
  if (!blockerTask) return null;

  const impactMilestone =
    [...project.milestones]
      .filter((m) => !m.reached)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;

  return {
    taskCount: ids.length,
    blockerTask,
    impactMilestone,
    owner: blockerTask.assigneeName ?? null,
    dueDate: blockerTask.endDate ?? null,
  };
}

// ── Next Actions (§6) ─────────────────────────────────────────────────────

export type NextActionBucket = "overdue" | "today" | "this_week";

export interface NextAction {
  bucket: NextActionBucket;
  kind: "task" | "milestone";
  id: string;
  label: string;
  owner?: string;
  dueDate: string;
  priority?: ProjectTask["priority"];
  status: string;
}

/**
 * Purely derived from existing incomplete tasks and unmet milestones — no
 * new manually-authored entity, since owner/due date/priority/status already
 * live on those records.
 */
export function nextActions(project: Project): NextAction[] {
  const today = new Date().toISOString().slice(0, 10);
  const weekOut = new Date();
  weekOut.setDate(weekOut.getDate() + 7);
  const weekIso = weekOut.toISOString().slice(0, 10);

  function bucketOf(date: string): NextActionBucket | null {
    if (date < today) return "overdue";
    if (date === today) return "today";
    if (date <= weekIso) return "this_week";
    return null;
  }

  const fromTasks: NextAction[] = project.tasks
    .filter((t) => t.status !== "completed" && t.status !== "cancelled")
    .map((t) => ({ task: t, bucket: bucketOf(t.endDate) }))
    .filter(
      (x): x is { task: ProjectTask; bucket: NextActionBucket } =>
        x.bucket !== null,
    )
    .map(({ task, bucket }) => ({
      bucket,
      kind: "task" as const,
      id: task.id,
      label: task.name,
      owner: task.assigneeName,
      dueDate: task.endDate,
      priority: task.priority,
      status: task.status,
    }));

  const fromMilestones: NextAction[] = project.milestones
    .filter((m) => !m.reached)
    .map((m) => ({ milestone: m, bucket: bucketOf(m.date) }))
    .filter(
      (x): x is { milestone: Milestone; bucket: NextActionBucket } =>
        x.bucket !== null,
    )
    .map(({ milestone, bucket }) => ({
      bucket,
      kind: "milestone" as const,
      id: milestone.id,
      label: milestone.name,
      owner: milestone.responsibleName,
      dueDate: milestone.date,
      status: milestone.status ?? "not_started",
    }));

  return [...fromTasks, ...fromMilestones].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate),
  );
}

// `daysBetween` is re-exported for callers that want a "days away" label
// next to a Next Action without importing it separately from `projects.ts`.
export { daysBetween };

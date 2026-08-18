/**
 * §10 — the Project Module.
 *
 * Full project management: projects, tasks with dependencies, milestones,
 * resourcing and timesheets.
 *
 * Dependency scheduling deliberately reuses the shape proved out in the
 * workflow engine (§11.6/§11.8) — `dependsOn` by id, plus the same
 * "available vs blocked" question — rather than inventing a second model. The
 * two differ in what they schedule (calendar dates here, offsets there), so
 * the date maths lives in this file while the graph logic is shared.
 */
import type { CostCentre } from "./cost-centres";

export type ProjectStatus =
  | "planning"
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PROJECT_STATUS_STYLES: Record<ProjectStatus, string> = {
  planning: "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  active:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  on_hold:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "border-border bg-muted text-muted-foreground",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export type ProjectTaskStatus =
  | "not_started"
  | "in_progress"
  | "blocked"
  | "completed";

export const TASK_STATUS_LABELS: Record<ProjectTaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
};

export const TASK_STATUS_STYLES: Record<ProjectTaskStatus, string> = {
  not_started: "border-border bg-muted text-muted-foreground",
  in_progress:
    "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  blocked: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  completed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export type ProjectPriority = "low" | "medium" | "high" | "critical";

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export interface ProjectTask {
  id: string;
  name: string;
  description?: string;
  status: ProjectTaskStatus;
  priority?: ProjectPriority;
  /** ISO dates. */
  startDate: string;
  endDate: string;
  /** 0–100. */
  percentComplete: number;
  /** Employee id, or unassigned. */
  assigneeId?: string;
  assigneeName?: string;
  /** Ids of tasks that must finish before this one can start (§11.6 shape). */
  dependsOn?: string[];
  estimatedHours?: number;
  /** Grouping band shown on the Gantt, e.g. "Discovery". */
  phase?: string;
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  description?: string;
  reached: boolean;
  /** Tasks that must be complete for this milestone to be met. */
  taskIds?: string[];
}

/** How much of one person's time a project has claimed. */
export interface ProjectAllocation {
  employeeId: string;
  employeeName: string;
  /** Their role on this project, not their job title. */
  projectRole: string;
  /** Percentage of their working time, 0–100. */
  allocationPercent: number;
  startDate: string;
  endDate?: string;
  /** Internal charge rate per hour, for cost roll-up. */
  hourlyRate?: number;
}

export interface TimesheetEntry {
  id: string;
  projectId: string;
  taskId?: string;
  employeeId: string;
  employeeName: string;
  /** ISO date the work was done. */
  date: string;
  hours: number;
  notes?: string;
  /** Submitted entries are awaiting approval; approved ones count as cost. */
  status: "draft" | "submitted" | "approved" | "rejected";
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  /** External client or internal requesting department. */
  client?: string;
  ownerId?: string;
  ownerName?: string;
  departmentId?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  /** §7.3 — projects charge to a cost centre rather than owning their own. */
  costCentreId?: string;
  tasks: ProjectTask[];
  milestones: Milestone[];
  allocations: ProjectAllocation[];
  createdAt: string;
  createdBy: string;
}

// ── Scheduling ──────────────────────────────────────────────────────────────

/** Days between two ISO dates. Negative when `to` is before `from`. */
export function daysBetween(from: string, to: string): number {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A task is blocked while anything it depends on is unfinished. */
export function isTaskBlocked(task: ProjectTask, tasks: ProjectTask[]): boolean {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return (task.dependsOn ?? []).some(
    (id) => byId.get(id)?.status !== "completed",
  );
}

/**
 * The tasks that could be worked on right now: unfinished, and with every
 * dependency met. Mirrors `availableTasks` in the workflow engine.
 */
export function availableProjectTasks(tasks: ProjectTask[]): ProjectTask[] {
  return tasks.filter(
    (t) => t.status !== "completed" && !isTaskBlocked(t, tasks),
  );
}

/**
 * A task scheduled to start before something it depends on has finished. This
 * is the scheduling error a Gantt is meant to expose — the dependency arrow
 * says "after", the dates say "during".
 */
export interface ScheduleConflict {
  task: ProjectTask;
  blocker: ProjectTask;
  /** How many days the dependency overruns the dependent's start. */
  overlapDays: number;
}

export function findScheduleConflicts(tasks: ProjectTask[]): ScheduleConflict[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const conflicts: ScheduleConflict[] = [];
  for (const task of tasks) {
    for (const depId of task.dependsOn ?? []) {
      const blocker = byId.get(depId);
      if (!blocker) continue;
      const overlapDays = daysBetween(task.startDate, blocker.endDate);
      if (overlapDays > 0) {
        conflicts.push({ task, blocker, overlapDays });
      }
    }
  }
  return conflicts;
}

/**
 * The longest dependency chain through the project — the sequence where a
 * day's slip is a day's slip to the whole project.
 *
 * Cycles are guarded with a visiting set: a dependency loop would otherwise
 * recurse forever, and a corrupt import shouldn't hang the page.
 */
export function criticalPath(tasks: ProjectTask[]): string[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const memo = new Map<string, string[]>();
  const visiting = new Set<string>();

  function chainTo(taskId: string): string[] {
    if (memo.has(taskId)) return memo.get(taskId)!;
    if (visiting.has(taskId)) return [];
    const task = byId.get(taskId);
    if (!task) return [];

    visiting.add(taskId);
    let longest: string[] = [];
    for (const depId of task.dependsOn ?? []) {
      const chain = chainTo(depId);
      if (chain.length > longest.length) longest = chain;
    }
    visiting.delete(taskId);

    const result = [...longest, taskId];
    memo.set(taskId, result);
    return result;
  }

  let best: string[] = [];
  for (const task of tasks) {
    const chain = chainTo(task.id);
    if (chain.length > best.length) best = chain;
  }
  return best;
}

// ── Roll-ups ────────────────────────────────────────────────────────────────

/** Weighted by task count, not by duration — every task counts once. */
export function projectProgress(project: Project): number {
  if (project.tasks.length === 0) return 0;
  const total = project.tasks.reduce(
    (sum, t) => sum + (t.status === "completed" ? 100 : t.percentComplete),
    0,
  );
  return Math.round(total / project.tasks.length);
}

/** Total FTE claimed by a project, where 100% of one person is 1.0. */
export function totalAllocation(project: Project): number {
  return (
    project.allocations.reduce((sum, a) => sum + a.allocationPercent, 0) / 100
  );
}

/**
 * Someone committed to more than 100% across every active project. This is
 * the number that makes resourcing real rather than aspirational.
 */
export interface OverAllocation {
  employeeId: string;
  employeeName: string;
  totalPercent: number;
  projects: { projectId: string; projectName: string; percent: number }[];
}

export function findOverAllocations(projects: Project[]): OverAllocation[] {
  const byEmployee = new Map<string, OverAllocation>();

  for (const project of projects) {
    // A finished or abandoned project isn't consuming anyone's time.
    if (project.status === "completed" || project.status === "cancelled") {
      continue;
    }
    for (const allocation of project.allocations) {
      const existing = byEmployee.get(allocation.employeeId) ?? {
        employeeId: allocation.employeeId,
        employeeName: allocation.employeeName,
        totalPercent: 0,
        projects: [],
      };
      existing.totalPercent += allocation.allocationPercent;
      existing.projects.push({
        projectId: project.id,
        projectName: project.name,
        percent: allocation.allocationPercent,
      });
      byEmployee.set(allocation.employeeId, existing);
    }
  }

  return [...byEmployee.values()]
    .filter((a) => a.totalPercent > 100)
    .sort((a, b) => b.totalPercent - a.totalPercent);
}

/** Approved hours only — submitted-but-unapproved time isn't a cost yet. */
export function approvedHours(
  entries: TimesheetEntry[],
  projectId: string,
): number {
  return entries
    .filter((e) => e.projectId === projectId && e.status === "approved")
    .reduce((sum, e) => sum + e.hours, 0);
}

/** Cost of approved time, using each person's project charge rate. */
export function projectSpend(
  project: Project,
  entries: TimesheetEntry[],
): number {
  const rateByEmployee = new Map(
    project.allocations.map((a) => [a.employeeId, a.hourlyRate ?? 0]),
  );
  return entries
    .filter((e) => e.projectId === project.id && e.status === "approved")
    .reduce(
      (sum, e) => sum + e.hours * (rateByEmployee.get(e.employeeId) ?? 0),
      0,
    );
}

export interface NewProject {
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  client?: string;
  ownerId?: string;
  ownerName?: string;
  departmentId?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  costCentreId?: string;
}

/** Cost centre lookup, re-exported so callers need one import. */
export type { CostCentre };

/**
 * §11.12 — starting a workflow and working out who to tell.
 *
 * The workflows module stored templates that nobody was ever notified about,
 * which also left the dependency (§11.6), parallel (§11.8) and conditional
 * (§11.11) settings decorative — nothing ever evaluated them. This module is
 * the evaluation: pure functions that answer "if this workflow started now,
 * which tasks begin, which wait, and which don't apply?".
 */
import type { LocaleEmployee, LocaleRole } from "@/src/lib/types/locale";
import type {
  Workflow,
  WorkflowConditionKey,
  WorkflowTask,
} from "@/src/lib/types/workflows";
import { availableTasks } from "@/src/lib/types/workflows";
import { employeesForScope } from "./helpers";

/**
 * Facts about the person/run the workflow is being started for. Conditional
 * tasks (§11.11) are evaluated against this.
 */
export type RunContext = Partial<Record<WorkflowConditionKey, boolean>>;

export const RUN_CONTEXT_FIELDS: {
  key: WorkflowConditionKey;
  label: string;
}[] = [
  { key: "remote_worker", label: "Remote worker" },
  { key: "company_car", label: "Has a company car" },
  { key: "contractor", label: "Contractor" },
  { key: "visa_holder", label: "Visa holder" },
];

/** §11.11 — an unconditional task always applies. */
export function taskApplies(task: WorkflowTask, context: RunContext): boolean {
  if (!task.condition) return true;
  return context[task.condition] === true;
}

export interface WorkflowRunPlan {
  /** Tasks starting now — no unmet dependencies, and their condition holds. */
  activated: WorkflowTask[];
  /** Applicable tasks still waiting on something (§11.6). */
  blocked: WorkflowTask[];
  /** Tasks whose condition doesn't hold for this run (§11.11). */
  skipped: WorkflowTask[];
  /** §11.8 — parallel group name → the tasks starting together in it. */
  parallelGroups: Map<string, WorkflowTask[]>;
}

/**
 * What happens when this workflow starts.
 *
 * A skipped conditional task is treated as *satisfied* for dependency
 * purposes: if "Ship laptop to home address" doesn't apply to an office-based
 * hire, everything waiting on it would otherwise wait forever.
 */
export function planRun(workflow: Workflow, context: RunContext): WorkflowRunPlan {
  const applicable: WorkflowTask[] = [];
  const skipped: WorkflowTask[] = [];
  for (const task of workflow.tasks) {
    (taskApplies(task, context) ? applicable : skipped).push(task);
  }

  const satisfied = new Set(skipped.map((t) => t.id));
  const ready = new Set(availableTasks(applicable, satisfied).map((t) => t.id));

  const activated = applicable.filter((t) => ready.has(t.id));
  const blocked = applicable.filter((t) => !ready.has(t.id));

  const parallelGroups = new Map<string, WorkflowTask[]>();
  for (const task of activated) {
    if (!task.parallelGroup) continue;
    const group = parallelGroups.get(task.parallelGroup) ?? [];
    group.push(task);
    parallelGroups.set(task.parallelGroup, group);
  }

  return { activated, blocked, skipped, parallelGroups };
}

/**
 * Everyone who needs telling about a task. A role-based assignee fans out to
 * every employee holding that role *within the workflow's scope* — a
 * department-scoped workflow shouldn't page the whole company.
 */
export function resolveAssignees(
  workflow: Workflow,
  task: WorkflowTask,
  roles: LocaleRole[],
  employees: LocaleEmployee[],
): string[] {
  const inScope = employeesForScope(workflow.scope, employees);

  if (task.assignee.kind === "employee") {
    const { employeeId } = task.assignee;
    const match = employees.find((e) => e.id === employeeId);
    return match ? [match.fullName] : [];
  }

  const roleId = task.assignee.roleId;
  const role = roles.find((r) => r.id === roleId);
  const holders = inScope.filter((e) =>
    roles.some((r) => r.id === roleId && r.linkedEmployeeId === e.id),
  );
  if (holders.length > 0) return holders.map((e) => e.fullName);
  // No mapped holder in scope — name the role so the notification still says
  // something useful rather than silently going nowhere.
  return role ? [role.name] : [];
}

/** The reviewer role's name, or null when the task has no reviewer. */
export function resolveReviewer(
  task: WorkflowTask,
  roles: LocaleRole[],
): string | null {
  if (!task.reviewer) return null;
  return roles.find((r) => r.id === task.reviewer!.roleId)?.name ?? null;
}

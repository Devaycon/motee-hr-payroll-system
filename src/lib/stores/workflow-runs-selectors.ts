import type { RootState } from "./store";
import type { RunTask, WorkflowRun } from "@/src/lib/types/workflow-runs";
import { effectiveStatus, isRunTaskOpen } from "@/src/lib/types/workflow-runs";

export interface RunTaskRef {
  run: WorkflowRun;
  task: RunTask;
}

/**
 * These take the run list rather than the whole store on purpose: a selector
 * shaped `(state) => ...` invites `useAppSelector((s) => s)` at the call site,
 * which re-renders the subscriber on every action in the app.
 */
export function activeRuns(runs: WorkflowRun[]): WorkflowRun[] {
  return runs.filter((r) => r.status === "active");
}

/** Every open task belonging to one person, across every running workflow. */
export function selectMyRunTasks(
  runs: WorkflowRun[],
  employeeId: string | undefined,
): RunTaskRef[] {
  if (!employeeId) return [];
  const out: RunTaskRef[] = [];
  for (const run of activeRuns(runs)) {
    for (const task of run.tasks) {
      if (task.assigneeEmployeeId !== employeeId) continue;
      if (!isRunTaskOpen(task)) continue;
      out.push({ run, task });
    }
  }
  return out;
}

/** Tasks submitted for one person's approval. */
export function selectMyReviewTasks(
  runs: WorkflowRun[],
  employeeId: string | undefined,
): RunTaskRef[] {
  if (!employeeId) return [];
  const out: RunTaskRef[] = [];
  for (const run of activeRuns(runs)) {
    for (const task of run.tasks) {
      if (task.status !== "awaiting_approval") continue;
      if (task.reviewerEmployeeId !== employeeId) continue;
      out.push({ run, task });
    }
  }
  return out;
}

/**
 * Open tasks belonging to everybody else.
 *
 * "I have nothing to do" is not an answer to "who is doing what" - this is
 * what keeps an empty inbox informative.
 */
export function selectOthersRunTasks(
  runs: WorkflowRun[],
  employeeId: string | undefined,
): RunTaskRef[] {
  const out: RunTaskRef[] = [];
  for (const run of activeRuns(runs)) {
    for (const task of run.tasks) {
      if (!isRunTaskOpen(task)) continue;
      if (task.assigneeEmployeeId && task.assigneeEmployeeId === employeeId) {
        continue;
      }
      out.push({ run, task });
    }
  }
  return out;
}

/** The run started for a given record, if there is one. */
export function selectRunForSubject(
  runs: WorkflowRun[],
  kind: WorkflowRun["subject"]["kind"],
  id: string,
): WorkflowRun | undefined {
  return runs.find((r) => r.subject.kind === kind && r.subject.id === id);
}

export interface UserWorkCounts {
  todo: number;
  overdue: number;
  review: number;
}

/** What the signed-in user actually owes, for badges and KPI cards. */
export function selectCountsForUser(
  runs: WorkflowRun[],
  employeeId: string | undefined,
): UserWorkCounts {
  const mine = selectMyRunTasks(runs, employeeId);
  return {
    todo: mine.length,
    overdue: mine.filter((r) => effectiveStatus(r.task) === "overdue").length,
    review: selectMyReviewTasks(runs, employeeId).length,
  };
}

/** The current country's runs, for callers that do hold the store. */
export function runsForCountry(state: RootState): WorkflowRun[] {
  return state.workflowRuns.byCountry[state.locale.country] ?? [];
}

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RunTask, WorkflowRun } from "@/src/lib/types/workflow-runs";

interface WorkflowRunsState {
  byCountry: Record<string, WorkflowRun[]>;
  status: "idle" | "ready";
}

const initialState: WorkflowRunsState = { byCountry: {}, status: "idle" };

/**
 * Re-derive which tasks are blocked after any status change.
 *
 * A skipped task counts as satisfied: if "ship laptop to home address" does
 * not apply to an office-based hire, everything waiting on it would otherwise
 * wait forever. Parallel groups need no handling of their own - tasks in a
 * group share the same dependencies, so they unblock together by construction.
 */
function cascade(run: WorkflowRun): void {
  const settled = new Set(
    run.tasks
      .filter((t) => t.status === "completed" || t.status === "skipped")
      .map((t) => t.id),
  );
  for (const task of run.tasks) {
    if (task.status === "completed" || task.status === "skipped") continue;
    const ready = task.dependsOn.every((d) => settled.has(d));
    if (!ready && task.status === "not_started") task.status = "blocked";
    if (ready && task.status === "blocked") task.status = "not_started";
  }
  const done = run.tasks.every(
    (t) => t.status === "completed" || t.status === "skipped",
  );
  if (done && run.status === "active") {
    run.status = "completed";
    run.completedAt = new Date().toISOString();
  }
}

function findTask(
  state: WorkflowRunsState,
  country: string,
  runId: string,
  taskId: string,
): { run: WorkflowRun; task: RunTask } | null {
  const run = state.byCountry[country]?.find((r) => r.id === runId);
  const task = run?.tasks.find((t) => t.id === taskId);
  return run && task ? { run, task } : null;
}

interface TaskRef {
  country: string;
  runId: string;
  taskId: string;
}

const workflowRunsSlice = createSlice({
  name: "workflowRuns",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{ byCountry: Record<string, WorkflowRun[]> }>,
    ) {
      state.byCountry = action.payload.byCountry;
      state.status = "ready";
    },

    /**
     * Start a run. Run ids are derived from the workflow and the subject, so a
     * listener that fires twice for the same hire lands here with an id that
     * already exists and is ignored rather than duplicating the work.
     */
    startRun(
      state,
      action: PayloadAction<{ country: string; run: WorkflowRun }>,
    ) {
      const { country, run } = action.payload;
      const bucket = (state.byCountry[country] ??= []);
      if (bucket.some((r) => r.id === run.id)) return;
      cascade(run);
      bucket.unshift(run);
    },

    /** The assignee picks the task up. */
    startTask(state, action: PayloadAction<TaskRef>) {
      const found = findTask(
        state,
        action.payload.country,
        action.payload.runId,
        action.payload.taskId,
      );
      if (!found || found.task.status !== "not_started") return;
      found.task.status = "in_progress";
      found.task.startedAt = new Date().toISOString();
    },

    /**
     * The assignee is done. A task with no reviewer completes outright - making
     * someone approve their own work is how a checklist becomes theatre.
     */
    submitTask(
      state,
      action: PayloadAction<TaskRef & { by: string; note?: string }>,
    ) {
      const { country, runId, taskId, by, note } = action.payload;
      const found = findTask(state, country, runId, taskId);
      if (!found) return;
      const { run, task } = found;
      if (task.status !== "not_started" && task.status !== "in_progress") return;
      const at = new Date().toISOString();
      task.note = note;
      if (task.reviewer) {
        task.status = "awaiting_approval";
        task.submittedAt = at;
      } else {
        task.status = "completed";
        task.completedAt = at;
        task.completedBy = by;
      }
      cascade(run);
    },

    /** The reviewer signs the task off. */
    approveRunTask(
      state,
      action: PayloadAction<TaskRef & { by: string; note?: string }>,
    ) {
      const { country, runId, taskId, by, note } = action.payload;
      const found = findTask(state, country, runId, taskId);
      if (!found || found.task.status === "completed") return;
      found.task.status = "completed";
      found.task.completedAt = new Date().toISOString();
      found.task.completedBy = by;
      if (note) found.task.note = note;
      cascade(found.run);
    },

    /** The reviewer sends it back. */
    rejectRunTask(
      state,
      action: PayloadAction<TaskRef & { note?: string }>,
    ) {
      const found = findTask(
        state,
        action.payload.country,
        action.payload.runId,
        action.payload.taskId,
      );
      if (!found || found.task.status !== "awaiting_approval") return;
      found.task.status = "in_progress";
      found.task.submittedAt = undefined;
      found.task.note = action.payload.note;
    },

    /** Mark a task as not applying to this hire after all. */
    skipTask(state, action: PayloadAction<TaskRef & { note?: string }>) {
      const found = findTask(
        state,
        action.payload.country,
        action.payload.runId,
        action.payload.taskId,
      );
      if (!found || found.task.status === "completed") return;
      found.task.status = "skipped";
      found.task.note = action.payload.note;
      cascade(found.run);
    },

    /**
     * Move a task to a different person. The first control anyone reaches for
     * when a task lands on the wrong desk, and the reason the run stores a
     * resolved owner rather than re-deriving one from the role table on read.
     */
    reassignTask(
      state,
      action: PayloadAction<
        TaskRef & { employeeId: string; name: string }
      >,
    ) {
      const found = findTask(
        state,
        action.payload.country,
        action.payload.runId,
        action.payload.taskId,
      );
      if (!found) return;
      const { task } = found;
      task.reassignedFrom = task.assigneeName;
      task.assignee = { kind: "employee", employeeId: action.payload.employeeId };
      task.assigneeEmployeeId = action.payload.employeeId;
      task.assigneeName = action.payload.name;
    },

    cancelRun(state, action: PayloadAction<{ country: string; runId: string }>) {
      const run = state.byCountry[action.payload.country]?.find(
        (r) => r.id === action.payload.runId,
      );
      if (run) run.status = "cancelled";
    },
  },
});

export const {
  hydrate,
  startRun,
  startTask,
  submitTask,
  approveRunTask,
  rejectRunTask,
  skipTask,
  reassignTask,
  cancelRun,
} = workflowRunsSlice.actions;

export default workflowRunsSlice.reducer;

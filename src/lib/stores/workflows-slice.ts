import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Workflow, WorkflowTask } from "@/src/lib/types/workflows";
import { DEFAULT_WORKFLOWS } from "@/src/lib/permissions/workflow-seeds";

interface WorkflowsState {
  workflows: Workflow[];
  status: "idle" | "ready";
}

const initialState: WorkflowsState = {
  workflows: DEFAULT_WORKFLOWS,
  status: "ready",
};

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

/**
 * A task as the builder submits it. Dependencies (§11.6) are carried as
 * *positions* in the draft list rather than ids, because `buildTasks` mints
 * fresh ids on every save — an id-based `dependsOn` would dangle the moment
 * anyone edited the workflow.
 */
export type WorkflowTaskDraft = Omit<WorkflowTask, "id" | "order" | "dependsOn"> & {
  /** Indexes of earlier tasks in the same draft list. */
  dependsOnIndexes?: number[];
};

/** Re-id and re-order a draft task list into stored tasks. */
function buildTasks(
  workflowId: string,
  tasks: WorkflowTaskDraft[],
): WorkflowTask[] {
  // Ids first, so dependencies can be resolved against the final list.
  const ids = tasks.map((_, i) => uid(`${workflowId}-T${i + 1}`));
  return tasks.map((t, i) => {
    const { dependsOnIndexes, ...rest } = t;
    const dependsOn = (dependsOnIndexes ?? [])
      // A dependency on a later task (or on itself) would deadlock the run, so
      // it is dropped here as well as being blocked in the builder's validation.
      .filter((idx) => idx >= 0 && idx < i)
      .map((idx) => ids[idx]);
    return {
      ...rest,
      id: ids[i],
      order: i + 1,
      dependsOn: dependsOn.length > 0 ? dependsOn : undefined,
    };
  });
}

/** True when the task list changed in a way that warrants a version bump (§11.13). */
function tasksDifferMaterially(a: WorkflowTask[], b: WorkflowTask[]): boolean {
  if (a.length !== b.length) return true;
  const signature = (t: WorkflowTask) =>
    [
      t.title,
      t.description ?? "",
      JSON.stringify(t.assignee),
      JSON.stringify(t.reviewer),
      t.dueDayOffset ?? "",
      t.priority ?? "",
      t.condition ?? "",
      t.parallelGroup ?? "",
      (t.dependsOn ?? []).length,
    ].join("|");
  return a.some((t, i) => signature(t) !== signature(b[i]));
}

type WorkflowDraft = {
  title: string;
  description?: string;
  triggerMode: Workflow["triggerMode"];
  schedule: Workflow["schedule"];
  scope: Workflow["scope"];
  tasks: WorkflowTaskDraft[];
  actorName: string;
  // §11.13 — configuration that lets different groups have different workflows.
  status?: Workflow["status"];
  effectiveDate?: string;
  owner?: string;
  employmentType?: string;
};

const workflowsSlice = createSlice({
  name: "workflows",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<{ workflows?: Workflow[] }>) {
      const { workflows } = action.payload;
      if (Array.isArray(workflows) && workflows.length > 0) {
        const incomingIds = new Set(workflows.map((w) => w.id));
        // Always keep the system seeds present, then merge persisted ones.
        const seedExtras = DEFAULT_WORKFLOWS.filter(
          (d) => !incomingIds.has(d.id),
        );
        state.workflows = [...workflows, ...seedExtras];
      }
      state.status = "ready";
    },

    createWorkflow(state, action: PayloadAction<WorkflowDraft>) {
      const {
        title,
        description,
        triggerMode,
        schedule,
        scope,
        tasks,
        actorName,
        status,
        effectiveDate,
        owner,
        employmentType,
      } = action.payload;
      const id = uid("WF");
      state.workflows.push({
        id,
        title,
        description,
        triggerMode,
        schedule,
        scope,
        kind: "custom",
        tasks: buildTasks(id, tasks),
        lastModifiedBy: actorName,
        lastModifiedAt: nowIso().slice(0, 10),
        // A new workflow starts as a draft unless it was explicitly activated,
        // so nothing goes live the moment it is saved (§11.13).
        status: status ?? "draft",
        version: 1,
        effectiveDate,
        owner: owner || actorName,
        employmentType,
      });
    },

    updateWorkflow(
      state,
      action: PayloadAction<{ id: string } & WorkflowDraft>,
    ) {
      const {
        id,
        title,
        description,
        triggerMode,
        schedule,
        scope,
        tasks,
        actorName,
        status,
        effectiveDate,
        owner,
        employmentType,
      } = action.payload;
      const wf = state.workflows.find((w) => w.id === id);
      if (!wf || wf.kind === "system") return;
      const nextTasks = buildTasks(id, tasks);
      // §11.13 — the version tracks what the workflow *does*, so retitling it
      // or fixing a typo in the description shouldn't invalidate a live run.
      if (tasksDifferMaterially(wf.tasks, nextTasks)) {
        wf.version = (wf.version ?? 1) + 1;
      }
      wf.title = title;
      wf.description = description;
      wf.triggerMode = triggerMode;
      wf.schedule = schedule;
      wf.scope = scope;
      wf.tasks = nextTasks;
      wf.lastModifiedBy = actorName;
      wf.lastModifiedAt = nowIso().slice(0, 10);
      if (status) wf.status = status;
      wf.effectiveDate = effectiveDate;
      wf.owner = owner;
      wf.employmentType = employmentType;
    },

    /** §11.13 — activate/archive without going through the full builder. */
    setWorkflowStatus(
      state,
      action: PayloadAction<{ id: string; status: Workflow["status"] }>,
    ) {
      const wf = state.workflows.find((w) => w.id === action.payload.id);
      if (!wf) return;
      wf.status = action.payload.status;
      wf.lastModifiedAt = nowIso().slice(0, 10);
    },

    deleteWorkflow(state, action: PayloadAction<string>) {
      const wf = state.workflows.find((w) => w.id === action.payload);
      if (!wf || wf.kind === "system") return;
      state.workflows = state.workflows.filter((w) => w.id !== action.payload);
    },
  },
});

export const {
  hydrate,
  createWorkflow,
  updateWorkflow,
  setWorkflowStatus,
  deleteWorkflow,
} = workflowsSlice.actions;
export default workflowsSlice.reducer;

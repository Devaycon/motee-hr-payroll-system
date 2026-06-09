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

/** Re-id and re-order a draft task list into stored tasks. */
function buildTasks(
  workflowId: string,
  tasks: Omit<WorkflowTask, "id" | "order">[],
): WorkflowTask[] {
  return tasks.map((t, i) => ({
    ...t,
    id: uid(`${workflowId}-T${i + 1}`),
    order: i + 1,
  }));
}

type WorkflowDraft = {
  title: string;
  description?: string;
  triggerMode: Workflow["triggerMode"];
  schedule: Workflow["schedule"];
  scope: Workflow["scope"];
  tasks: Omit<WorkflowTask, "id" | "order">[];
  actorName: string;
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
      const { title, description, triggerMode, schedule, scope, tasks, actorName } =
        action.payload;
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
      });
    },

    updateWorkflow(
      state,
      action: PayloadAction<{ id: string } & WorkflowDraft>,
    ) {
      const { id, title, description, triggerMode, schedule, scope, tasks, actorName } =
        action.payload;
      const wf = state.workflows.find((w) => w.id === id);
      if (!wf || wf.kind === "system") return;
      wf.title = title;
      wf.description = description;
      wf.triggerMode = triggerMode;
      wf.schedule = schedule;
      wf.scope = scope;
      wf.tasks = buildTasks(id, tasks);
      wf.lastModifiedBy = actorName;
      wf.lastModifiedAt = nowIso().slice(0, 10);
    },

    deleteWorkflow(state, action: PayloadAction<string>) {
      const wf = state.workflows.find((w) => w.id === action.payload);
      if (!wf || wf.kind === "system") return;
      state.workflows = state.workflows.filter((w) => w.id !== action.payload);
    },
  },
});

export const { hydrate, createWorkflow, updateWorkflow, deleteWorkflow } =
  workflowsSlice.actions;
export default workflowsSlice.reducer;

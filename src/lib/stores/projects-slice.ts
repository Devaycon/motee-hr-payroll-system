import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  Milestone,
  NewProject,
  Project,
  ProjectAllocation,
  ProjectTask,
  TimesheetEntry,
} from "@/src/lib/types/projects";
import type { NewProjectRisk, ProjectRisk } from "@/src/lib/types/project-risks";
import type {
  NewProjectDocument,
  ProjectDocument,
} from "@/src/lib/types/project-documents";
import type {
  GoLiveChecklist,
  GoLiveChecklistItem,
} from "@/src/lib/types/go-live-readiness";
import {
  DEMO_GO_LIVE_CHECKLISTS,
  DEMO_PROJECT_DOCUMENTS,
  DEMO_PROJECT_RISKS,
  DEMO_PROJECTS,
  DEMO_TIMESHEETS,
} from "@/src/data/projects-demo";

interface ProjectsState {
  projects: Project[];
  /** Kept flat rather than nested per project — timesheets are queried by
      person as often as by project, and nesting would make that a scan. */
  timesheets: TimesheetEntry[];
  /** Same reasoning as `timesheets` — kept flat, filtered by `projectId`. */
  risks: ProjectRisk[];
  documents: ProjectDocument[];
  /** One checklist per project, so it's keyed by `projectId` rather than an id. */
  goLiveChecklists: GoLiveChecklist[];
}

const initialState: ProjectsState = {
  projects: DEMO_PROJECTS,
  timesheets: DEMO_TIMESHEETS,
  risks: DEMO_PROJECT_RISKS,
  documents: DEMO_PROJECT_DOCUMENTS,
  goLiveChecklists: DEMO_GO_LIVE_CHECKLISTS,
};

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    hydrate(
      state,
      action: PayloadAction<{
        projects?: Project[];
        timesheets?: TimesheetEntry[];
        risks?: ProjectRisk[];
        documents?: ProjectDocument[];
        goLiveChecklists?: GoLiveChecklist[];
      }>,
    ) {
      const { projects, timesheets, risks, documents, goLiveChecklists } =
        action.payload;
      if (Array.isArray(projects) && projects.length > 0) {
        state.projects = projects;
      }
      if (Array.isArray(timesheets)) state.timesheets = timesheets;
      if (Array.isArray(risks)) state.risks = risks;
      if (Array.isArray(documents)) state.documents = documents;
      if (Array.isArray(goLiveChecklists)) {
        state.goLiveChecklists = goLiveChecklists;
      }
    },

    // ── Projects ────────────────────────────────────────────────────────────
    createProject(
      state,
      action: PayloadAction<NewProject & { createdBy: string }>,
    ) {
      const { createdBy, ...data } = action.payload;
      state.projects.push({
        ...data,
        id: uid("PRJ"),
        tasks: [],
        milestones: [],
        allocations: [],
        createdAt: today(),
        createdBy,
      });
    },

    updateProject(
      state,
      action: PayloadAction<{ id: string } & Partial<NewProject>>,
    ) {
      const { id, ...patch } = action.payload;
      const project = state.projects.find((p) => p.id === id);
      if (!project) return;
      Object.assign(project, patch);
    },

    deleteProject(state, action: PayloadAction<string>) {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
      // Orphaned time entries would keep counting toward spend on a project
      // that no longer exists. Same reasoning extends to the newer
      // per-project collections below.
      state.timesheets = state.timesheets.filter(
        (t) => t.projectId !== action.payload,
      );
      state.risks = state.risks.filter((r) => r.projectId !== action.payload);
      state.documents = state.documents.filter(
        (d) => d.projectId !== action.payload,
      );
      state.goLiveChecklists = state.goLiveChecklists.filter(
        (c) => c.projectId !== action.payload,
      );
    },

    // ── Tasks ───────────────────────────────────────────────────────────────
    addTask(
      state,
      action: PayloadAction<{
        projectId: string;
        task: Omit<ProjectTask, "id">;
      }>,
    ) {
      const project = state.projects.find(
        (p) => p.id === action.payload.projectId,
      );
      if (!project) return;
      project.tasks.push({ ...action.payload.task, id: uid("TSK") });
    },

    updateTask(
      state,
      action: PayloadAction<{
        projectId: string;
        taskId: string;
        patch: Partial<ProjectTask>;
      }>,
    ) {
      const project = state.projects.find(
        (p) => p.id === action.payload.projectId,
      );
      const task = project?.tasks.find((t) => t.id === action.payload.taskId);
      if (!task) return;
      Object.assign(task, action.payload.patch);
      // Completion and progress are two views of one fact; letting them drift
      // produces a task that is "100% complete" but still In Progress.
      if (action.payload.patch.status === "completed") {
        task.percentComplete = 100;
      }
      if (action.payload.patch.percentComplete === 100) {
        task.status = "completed";
      }
    },

    deleteTask(
      state,
      action: PayloadAction<{ projectId: string; taskId: string }>,
    ) {
      const project = state.projects.find(
        (p) => p.id === action.payload.projectId,
      );
      if (!project) return;
      project.tasks = project.tasks.filter(
        (t) => t.id !== action.payload.taskId,
      );
      // A dependency on a deleted task would block its dependents forever.
      for (const task of project.tasks) {
        if (task.dependsOn?.includes(action.payload.taskId)) {
          task.dependsOn = task.dependsOn.filter(
            (id) => id !== action.payload.taskId,
          );
        }
      }
      for (const milestone of project.milestones) {
        milestone.taskIds = milestone.taskIds?.filter(
          (id) => id !== action.payload.taskId,
        );
      }
    },

    // ── Milestones ──────────────────────────────────────────────────────────
    addMilestone(
      state,
      action: PayloadAction<{
        projectId: string;
        milestone: Omit<Milestone, "id">;
      }>,
    ) {
      const project = state.projects.find(
        (p) => p.id === action.payload.projectId,
      );
      if (!project) return;
      project.milestones.push({
        ...action.payload.milestone,
        id: uid("MS"),
      });
    },

    toggleMilestone(
      state,
      action: PayloadAction<{ projectId: string; milestoneId: string }>,
    ) {
      const project = state.projects.find(
        (p) => p.id === action.payload.projectId,
      );
      const milestone = project?.milestones.find(
        (m) => m.id === action.payload.milestoneId,
      );
      if (!milestone) return;
      milestone.reached = !milestone.reached;
    },

    /** §13 — full detail-view edits (target/actual date, status, %, owner,
        related tasks/risks, approval), alongside the simpler `toggleMilestone`. */
    updateMilestone(
      state,
      action: PayloadAction<{
        projectId: string;
        milestoneId: string;
        patch: Partial<Milestone>;
      }>,
    ) {
      const project = state.projects.find(
        (p) => p.id === action.payload.projectId,
      );
      const milestone = project?.milestones.find(
        (m) => m.id === action.payload.milestoneId,
      );
      if (!milestone) return;
      Object.assign(milestone, action.payload.patch);
      // Same completion/status sync guard as updateTask — a milestone
      // shouldn't be "completed" but not reached, or reached but not
      // "completed".
      if (action.payload.patch.status === "completed") {
        milestone.reached = true;
      }
      if (action.payload.patch.reached === true) {
        milestone.status = "completed";
      }
    },

    deleteMilestone(
      state,
      action: PayloadAction<{ projectId: string; milestoneId: string }>,
    ) {
      const project = state.projects.find(
        (p) => p.id === action.payload.projectId,
      );
      if (!project) return;
      project.milestones = project.milestones.filter(
        (m) => m.id !== action.payload.milestoneId,
      );
    },

    // ── Resourcing ──────────────────────────────────────────────────────────
    setAllocation(
      state,
      action: PayloadAction<{
        projectId: string;
        allocation: ProjectAllocation;
      }>,
    ) {
      const project = state.projects.find(
        (p) => p.id === action.payload.projectId,
      );
      if (!project) return;
      const idx = project.allocations.findIndex(
        (a) => a.employeeId === action.payload.allocation.employeeId,
      );
      if (idx === -1) project.allocations.push(action.payload.allocation);
      else project.allocations[idx] = action.payload.allocation;
    },

    removeAllocation(
      state,
      action: PayloadAction<{ projectId: string; employeeId: string }>,
    ) {
      const project = state.projects.find(
        (p) => p.id === action.payload.projectId,
      );
      if (!project) return;
      project.allocations = project.allocations.filter(
        (a) => a.employeeId !== action.payload.employeeId,
      );
    },

    // ── Timesheets ──────────────────────────────────────────────────────────
    logTime(state, action: PayloadAction<Omit<TimesheetEntry, "id">>) {
      state.timesheets.unshift({ ...action.payload, id: uid("TS") });
    },

    setTimesheetStatus(
      state,
      action: PayloadAction<{
        entryId: string;
        status: TimesheetEntry["status"];
      }>,
    ) {
      const entry = state.timesheets.find(
        (t) => t.id === action.payload.entryId,
      );
      if (!entry) return;
      entry.status = action.payload.status;
    },

    deleteTimeEntry(state, action: PayloadAction<string>) {
      state.timesheets = state.timesheets.filter(
        (t) => t.id !== action.payload,
      );
    },

    // ── Risks & Issues (§5) ────────────────────────────────────────────────
    addRisk(
      state,
      action: PayloadAction<{ projectId: string; risk: NewProjectRisk }>,
    ) {
      state.risks.push({
        ...action.payload.risk,
        id: uid("RISK"),
        projectId: action.payload.projectId,
        createdAt: today(),
      });
    },

    updateRisk(
      state,
      action: PayloadAction<{ riskId: string; patch: Partial<ProjectRisk> }>,
    ) {
      const risk = state.risks.find((r) => r.id === action.payload.riskId);
      if (!risk) return;
      Object.assign(risk, action.payload.patch);
    },

    deleteRisk(state, action: PayloadAction<string>) {
      state.risks = state.risks.filter((r) => r.id !== action.payload);
    },

    // ── Project Documents (§11) ────────────────────────────────────────────
    addProjectDocument(
      state,
      action: PayloadAction<{
        projectId: string;
        document: NewProjectDocument;
      }>,
    ) {
      state.documents.push({
        ...action.payload.document,
        id: uid("PDOC"),
        projectId: action.payload.projectId,
        uploadedAt: today(),
      });
    },

    deleteProjectDocument(state, action: PayloadAction<string>) {
      state.documents = state.documents.filter((d) => d.id !== action.payload);
    },

    // ── Go-Live Readiness (§14) ────────────────────────────────────────────
    updateGoLiveItem(
      state,
      action: PayloadAction<{
        projectId: string;
        itemId: string;
        patch: Partial<Pick<GoLiveChecklistItem, "done" | "notes">>;
      }>,
    ) {
      const checklist = state.goLiveChecklists.find(
        (c) => c.projectId === action.payload.projectId,
      );
      const item = checklist?.items.find(
        (i) => i.id === action.payload.itemId,
      );
      if (!item) return;
      Object.assign(item, action.payload.patch);
    },
  },
});

export const {
  hydrate,
  createProject,
  updateProject,
  deleteProject,
  addTask,
  updateTask,
  deleteTask,
  addMilestone,
  toggleMilestone,
  updateMilestone,
  deleteMilestone,
  setAllocation,
  removeAllocation,
  logTime,
  setTimesheetStatus,
  deleteTimeEntry,
  addRisk,
  updateRisk,
  deleteRisk,
  addProjectDocument,
  deleteProjectDocument,
  updateGoLiveItem,
} = projectsSlice.actions;
export default projectsSlice.reducer;
export type { ProjectsState };

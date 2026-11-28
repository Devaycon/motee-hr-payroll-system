/**
 * Sends the project screens' store actions to the API (signed in only). The
 * screens change the projects store first; each change is sent and the
 * projects are re-read, replacing the local copy.
 *
 * Projects, tasks (incl. status/progress), milestones (incl. toggle and
 * approval), team allocations, time entries (incl. status), risks and the
 * go-live checklist all have endpoints. Adding a project document needs the
 * file itself, which the document form does not collect, so that one answers
 * "not integrated"; deleting a document does go to the API.
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/src/store/services/api";
import { projectsApi } from "@/src/store/services/projects";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  allocationToRequest,
  milestoneToRequest,
  projectToRequest,
  riskToRequest,
  taskStatusToApi,
  taskToRequest,
  timeToRequest,
} from "@/src/lib/projects/api-mapping";
import {
  addMilestone,
  addProjectDocument,
  addRisk,
  addTask,
  createProject,
  deleteMilestone,
  deleteProject,
  deleteProjectDocument,
  deleteRisk,
  deleteTask,
  deleteTimeEntry,
  logTime,
  removeAllocation,
  setAllocation,
  setTimesheetStatus,
  toggleMilestone,
  updateGoLiveItem,
  updateMilestone,
  updateProject,
  updateRisk,
  updateTask,
} from "./projects-slice";
import type { ProjectsState } from "./projects-slice";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isServerId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);

interface State {
  session: { is_loggedIn?: boolean; tenant_id?: string | null };
  projects: ProjectsState;
}

export const projectsApiListener = createListenerMiddleware();

projectsApiListener.startListening({
  matcher: isAnyOf(
    createProject, updateProject, deleteProject, addTask, updateTask, deleteTask, addMilestone,
    toggleMilestone, updateMilestone, deleteMilestone, setAllocation, removeAllocation, logTime,
    setTimesheetStatus, deleteTimeEntry, addRisk, updateRisk, deleteRisk, addProjectDocument,
    deleteProjectDocument, updateGoLiveItem,
  ),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as State;
    if (!state.session?.is_loggedIn || !state.session.tenant_id) return;
    const before = listenerApi.getOriginalState() as State;
    const dispatch = listenerApi.dispatch;
    const ep = projectsApi.endpoints;
    const project = (id: string) => state.projects.projects.find((p) => p.id === id);

    try {
      if (createProject.match(action)) {
        const data = action.payload;
        await dispatch(ep.createProject.initiate(projectToRequest(data))).unwrap();
      } else if (updateProject.match(action)) {
        const { id } = action.payload;
        const p = project(id);
        if (!isServerId(id) || !p) return;
        await dispatch(ep.updateProject.initiate({ id, body: projectToRequest(p) })).unwrap();
      } else if (deleteProject.match(action)) {
        if (!isServerId(action.payload)) return;
        await dispatch(ep.deleteProject.initiate(action.payload)).unwrap();
      } else if (addTask.match(action)) {
        const { projectId, task } = action.payload;
        if (!isServerId(projectId)) return;
        await dispatch(ep.addProjectTask.initiate({ id: projectId, body: taskToRequest(task) })).unwrap();
      } else if (updateTask.match(action)) {
        const { projectId, taskId, patch } = action.payload;
        if (!isServerId(projectId) || !isServerId(taskId)) return;
        const task = project(projectId)?.tasks.find((t) => t.id === taskId);
        if (!task) return;
        const keys = Object.keys(patch);
        // A status-only or progress-only change has its own endpoint.
        if (keys.length === 1 && keys[0] === "status") {
          await dispatch(
            ep.setProjectTaskStatus.initiate({ id: projectId, taskId, body: { status: taskStatusToApi(task.status) } }),
          ).unwrap();
        } else if (keys.length === 1 && keys[0] === "percentComplete") {
          await dispatch(
            ep.setProjectTaskProgress.initiate({ id: projectId, taskId, body: { percentComplete: task.percentComplete } }),
          ).unwrap();
        } else {
          await dispatch(ep.updateProjectTask.initiate({ id: projectId, taskId, body: taskToRequest(task) })).unwrap();
        }
      } else if (deleteTask.match(action)) {
        const { projectId, taskId } = action.payload;
        if (!isServerId(projectId) || !isServerId(taskId)) return;
        await dispatch(ep.deleteProjectTask.initiate({ id: projectId, taskId })).unwrap();
      } else if (addMilestone.match(action)) {
        const { projectId, milestone } = action.payload;
        if (!isServerId(projectId)) return;
        await dispatch(
          ep.addProjectMilestone.initiate({ id: projectId, body: milestoneToRequest(milestone) }),
        ).unwrap();
      } else if (toggleMilestone.match(action)) {
        const { projectId, milestoneId } = action.payload;
        if (!isServerId(projectId) || !isServerId(milestoneId)) return;
        await dispatch(ep.toggleProjectMilestone.initiate({ id: projectId, milestoneId })).unwrap();
      } else if (updateMilestone.match(action)) {
        const { projectId, milestoneId, patch } = action.payload;
        if (!isServerId(projectId) || !isServerId(milestoneId)) return;
        const m = project(projectId)?.milestones.find((x) => x.id === milestoneId);
        if (!m) return;
        const prevM = before.projects.projects
          .find((p) => p.id === projectId)
          ?.milestones.find((x) => x.id === milestoneId);
        const keys = Object.keys(patch);
        if (keys.every((k) => k === "approved" || k === "approvedBy" || k === "approvedAt")) {
          if (prevM?.approved !== m.approved) {
            await dispatch(
              ep.setProjectMilestoneApproval.initiate({ id: projectId, milestoneId, body: { approved: !!m.approved } }),
            ).unwrap();
          }
        } else {
          await dispatch(
            ep.updateProjectMilestone.initiate({ id: projectId, milestoneId, body: milestoneToRequest(m) }),
          ).unwrap();
        }
      } else if (deleteMilestone.match(action)) {
        const { projectId, milestoneId } = action.payload;
        if (!isServerId(projectId) || !isServerId(milestoneId)) return;
        await dispatch(ep.deleteProjectMilestone.initiate({ id: projectId, milestoneId })).unwrap();
      } else if (setAllocation.match(action)) {
        const { projectId, allocation } = action.payload;
        if (!isServerId(projectId)) return;
        await dispatch(
          ep.setProjectAllocation.initiate({ id: projectId, body: allocationToRequest(allocation) }),
        ).unwrap();
      } else if (removeAllocation.match(action)) {
        const { projectId, employeeId } = action.payload;
        if (!isServerId(projectId)) return;
        await dispatch(ep.removeProjectAllocation.initiate({ id: projectId, employeeId })).unwrap();
      } else if (logTime.match(action)) {
        const entry = action.payload;
        if (!isServerId(entry.projectId)) return;
        await dispatch(
          ep.logProjectTime.initiate({ projectId: entry.projectId, body: timeToRequest(entry) }),
        ).unwrap();
      } else if (setTimesheetStatus.match(action)) {
        const { entryId, status } = action.payload;
        const entry = state.projects.timesheets.find((t) => t.id === entryId);
        if (!entry || !isServerId(entryId)) return;
        await dispatch(
          ep.setProjectTimeEntryStatus.initiate({ projectId: entry.projectId, entryId, body: { status } }),
        ).unwrap();
      } else if (deleteTimeEntry.match(action)) {
        const entry = before.projects.timesheets.find((t) => t.id === action.payload);
        if (!entry || !isServerId(entry.id)) return;
        await dispatch(
          ep.deleteProjectTimeEntry.initiate({ projectId: entry.projectId, entryId: entry.id }),
        ).unwrap();
      } else if (addRisk.match(action)) {
        const { projectId, risk } = action.payload;
        if (!isServerId(projectId)) return;
        await dispatch(ep.addProjectRisk.initiate({ projectId, body: riskToRequest(risk) })).unwrap();
      } else if (updateRisk.match(action)) {
        const risk = state.projects.risks.find((r) => r.id === action.payload.riskId);
        if (!risk || !isServerId(risk.id)) return;
        await dispatch(
          ep.updateProjectRisk.initiate({ projectId: risk.projectId, riskId: risk.id, body: riskToRequest(risk) }),
        ).unwrap();
      } else if (deleteRisk.match(action)) {
        const risk = before.projects.risks.find((r) => r.id === action.payload);
        if (!risk || !isServerId(risk.id)) return;
        await dispatch(ep.deleteProjectRisk.initiate({ projectId: risk.projectId, riskId: risk.id })).unwrap();
      } else if (addProjectDocument.match(action)) {
        // Signed in, the Documents panel uploads the file itself
        // (POST /projects/{id}/documents); nothing to send here.
        return;
      } else if (deleteProjectDocument.match(action)) {
        const doc = before.projects.documents.find((d) => d.id === action.payload);
        if (!doc || !isServerId(doc.id)) return;
        await dispatch(
          ep.deleteProjectDocument.initiate({ projectId: doc.projectId, documentId: doc.id }),
        ).unwrap();
      } else if (updateGoLiveItem.match(action)) {
        const { projectId, itemId } = action.payload;
        if (!isServerId(projectId)) return;
        const item = state.projects.goLiveChecklists
          .find((c) => c.projectId === projectId)
          ?.items.find((i) => i.id === itemId);
        if (!item) return;
        await dispatch(
          ep.updateProjectGoLiveItem.initiate({
            projectId,
            itemKey: itemId,
            body: { isDone: item.done, notes: item.notes ?? null },
          }),
        ).unwrap();
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the project change."));
    }
    dispatch(api.util.invalidateTags(["Projects"]));
  },
});

/**
 * Sends the workflow builder's and the run views' store actions to the API
 * (signed in only); templates and runs are re-read afterwards.
 *
 * - createWorkflow / updateWorkflow → POST / PUT /workflows
 * - setWorkflowStatus → PATCH /workflows/{id}/status
 * - deleteWorkflow → DELETE /workflows/{id}
 * - startRun (a manual run) → POST /workflow-runs
 * - startTask / submitTask / approveRunTask / rejectRunTask / skipTask /
 *   reassignTask → POST /workflow-runs/{id}/tasks/{taskId}/…
 * - cancelRun → POST /workflow-runs/{id}/cancel
 */
import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { toast } from "sonner";
import api from "@/src/store/services/api";
import { workflowsApi } from "@/src/store/services/workflows";
import { workflowRunsApi } from "@/src/store/services/workflow-runs";
import { getApiErrorMessage } from "@/src/lib/utils";
import { conditionToApi, triggerToApi, workflowToRequest } from "@/src/lib/workflows/api-mapping";
import {
  createWorkflow,
  deleteWorkflow,
  setWorkflowStatus,
  updateWorkflow,
} from "./workflows-slice";
import {
  approveRunTask,
  cancelRun,
  reassignTask,
  rejectRunTask,
  skipTask,
  startRun,
  startTask,
  submitTask,
} from "./workflow-runs-slice";
import type { Workflow, WorkflowConditionKey } from "@/src/lib/types/workflows";
import type { RunSubjectKind as ApiSubjectKind } from "@/src/types/workflow-runs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isServerId = (id: unknown): id is string => typeof id === "string" && UUID.test(id);

interface State {
  session: { is_loggedIn?: boolean; tenant_id?: string | null };
  workflows: { workflows: Workflow[] };
}

const SUBJECT_TO_API: Record<string, ApiSubjectKind> = {
  requisition: "requisition",
  candidate: "candidate",
  onboarding_record: "onboardingRecord",
};

export const workflowsApiListener = createListenerMiddleware();

workflowsApiListener.startListening({
  matcher: isAnyOf(
    createWorkflow, updateWorkflow, setWorkflowStatus, deleteWorkflow, startRun, startTask,
    submitTask, approveRunTask, rejectRunTask, skipTask, reassignTask, cancelRun,
  ),
  effect: async (action, listenerApi) => {
    const state = listenerApi.getState() as State;
    if (!state.session?.is_loggedIn || !state.session.tenant_id) return;
    const before = listenerApi.getOriginalState() as State;
    const dispatch = listenerApi.dispatch;
    const wf = workflowsApi.endpoints;
    const run = workflowRunsApi.endpoints;

    try {
      if (createWorkflow.match(action)) {
        const known = new Set(before.workflows.workflows.map((w) => w.id));
        const created = state.workflows.workflows.find((w) => !known.has(w.id));
        if (!created) return;
        await dispatch(wf.createWorkflow.initiate(workflowToRequest(created))).unwrap();
      } else if (updateWorkflow.match(action)) {
        const w = state.workflows.workflows.find((x) => x.id === action.payload.id);
        if (!w || !isServerId(w.id)) return;
        await dispatch(wf.updateWorkflow.initiate({ id: w.id, body: workflowToRequest(w) })).unwrap();
      } else if (setWorkflowStatus.match(action)) {
        const { id, status } = action.payload;
        if (!isServerId(id) || !status) return;
        await dispatch(wf.setWorkflowStatus.initiate({ id, body: { status } })).unwrap();
      } else if (deleteWorkflow.match(action)) {
        if (!isServerId(action.payload)) return;
        await dispatch(wf.deleteWorkflow.initiate(action.payload)).unwrap();
      } else if (startRun.match(action)) {
        const r = action.payload.run;
        if (!isServerId(r.workflowId) || !isServerId(r.subject.id)) return;
        await dispatch(
          run.startWorkflowRun.initiate({
            workflowId: r.workflowId,
            subjectKind: SUBJECT_TO_API[r.subject.kind] ?? "employee",
            subjectId: r.subject.id,
            subjectName: r.subject.name,
            anchorOn: r.anchorDate || null,
            context: (Object.entries(r.context ?? {}) as [WorkflowConditionKey, boolean][])
              .filter(([, on]) => on)
              .map(([k]) => conditionToApi(k)),
            ...(r.trigger !== "manual" ? { trigger: triggerToApi(r.trigger) } : {}),
          }),
        ).unwrap();
      } else if (cancelRun.match(action)) {
        if (!isServerId(action.payload.runId)) return;
        await dispatch(run.cancelWorkflowRun.initiate(action.payload.runId)).unwrap();
      } else {
        const p = action.payload as { runId: string; taskId: string; note?: string; employeeId?: string };
        if (!isServerId(p.runId) || !isServerId(p.taskId)) return;
        const ref = { id: p.runId, taskId: p.taskId };
        const body = { note: p.note ?? null };
        if (startTask.match(action)) await dispatch(run.startWorkflowRunTask.initiate(ref)).unwrap();
        else if (submitTask.match(action)) await dispatch(run.submitWorkflowRunTask.initiate({ ...ref, body })).unwrap();
        else if (approveRunTask.match(action)) await dispatch(run.approveWorkflowRunTask.initiate({ ...ref, body })).unwrap();
        else if (rejectRunTask.match(action)) await dispatch(run.rejectWorkflowRunTask.initiate({ ...ref, body })).unwrap();
        else if (skipTask.match(action)) await dispatch(run.skipWorkflowRunTask.initiate({ ...ref, body })).unwrap();
        else if (reassignTask.match(action) && p.employeeId) {
          await dispatch(run.reassignWorkflowRunTask.initiate({ ...ref, body: { employeeId: p.employeeId } })).unwrap();
        }
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not save the workflow change."));
    }
    dispatch(api.util.invalidateTags(["Workflows", "WorkflowRuns"]));
  },
});

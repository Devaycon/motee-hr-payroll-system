import api, { API_PREFIX } from "./api";
import type {
  ApproveWorkflowRunTaskRequest,
  ApproveWorkflowRunTaskResponse,
  CancelWorkflowRunResponse,
  GetMyWorkflowWorkResponse,
  GetWorkflowRunResponse,
  GetWorkflowRunsParams,
  GetWorkflowRunsResponse,
  ReassignTaskRequest,
  ReassignWorkflowRunTaskResponse,
  RejectWorkflowRunTaskRequest,
  RejectWorkflowRunTaskResponse,
  SkipWorkflowRunTaskRequest,
  SkipWorkflowRunTaskResponse,
  StartRunRequest,
  StartWorkflowRunResponse,
  StartWorkflowRunTaskResponse,
  SubmitWorkflowRunTaskRequest,
  SubmitWorkflowRunTaskResponse,
} from "@/src/types/workflow-runs";

export const workflowRunsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/workflow-runs
    getWorkflowRuns: builder.query<GetWorkflowRunsResponse, GetWorkflowRunsParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/workflow-runs`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["WorkflowRuns"],
    }),
    // POST /api/v1/workflow-runs
    startWorkflowRun: builder.mutation<StartWorkflowRunResponse, StartRunRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/workflow-runs`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkflowRuns"],
    }),
    // GET /api/v1/workflow-runs/my-work
    getMyWorkflowWork: builder.query<GetMyWorkflowWorkResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/workflow-runs/my-work`,
        method: "GET",
      }),
      providesTags: ["WorkflowRuns"],
    }),
    // GET /api/v1/workflow-runs/{id}
    getWorkflowRun: builder.query<GetWorkflowRunResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/workflow-runs/${id}`,
        method: "GET",
      }),
      providesTags: ["WorkflowRuns"],
    }),
    // POST /api/v1/workflow-runs/{id}/tasks/{taskId}/start
    startWorkflowRunTask: builder.mutation<StartWorkflowRunTaskResponse, { id: string; taskId: string }>({
      query: ({ id, taskId }) => ({
        url: `${API_PREFIX}/workflow-runs/${id}/tasks/${taskId}/start`,
        method: "POST",
      }),
      invalidatesTags: ["WorkflowRuns"],
    }),
    // POST /api/v1/workflow-runs/{id}/tasks/{taskId}/submit
    submitWorkflowRunTask: builder.mutation<SubmitWorkflowRunTaskResponse, { id: string; taskId: string; body: SubmitWorkflowRunTaskRequest }>({
      query: ({ id, taskId, body }) => ({
        url: `${API_PREFIX}/workflow-runs/${id}/tasks/${taskId}/submit`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkflowRuns"],
    }),
    // POST /api/v1/workflow-runs/{id}/tasks/{taskId}/approve
    approveWorkflowRunTask: builder.mutation<ApproveWorkflowRunTaskResponse, { id: string; taskId: string; body: ApproveWorkflowRunTaskRequest }>({
      query: ({ id, taskId, body }) => ({
        url: `${API_PREFIX}/workflow-runs/${id}/tasks/${taskId}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkflowRuns"],
    }),
    // POST /api/v1/workflow-runs/{id}/tasks/{taskId}/reject
    rejectWorkflowRunTask: builder.mutation<RejectWorkflowRunTaskResponse, { id: string; taskId: string; body: RejectWorkflowRunTaskRequest }>({
      query: ({ id, taskId, body }) => ({
        url: `${API_PREFIX}/workflow-runs/${id}/tasks/${taskId}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkflowRuns"],
    }),
    // POST /api/v1/workflow-runs/{id}/tasks/{taskId}/skip
    skipWorkflowRunTask: builder.mutation<SkipWorkflowRunTaskResponse, { id: string; taskId: string; body: SkipWorkflowRunTaskRequest }>({
      query: ({ id, taskId, body }) => ({
        url: `${API_PREFIX}/workflow-runs/${id}/tasks/${taskId}/skip`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkflowRuns"],
    }),
    // POST /api/v1/workflow-runs/{id}/tasks/{taskId}/reassign
    reassignWorkflowRunTask: builder.mutation<ReassignWorkflowRunTaskResponse, { id: string; taskId: string; body: ReassignTaskRequest }>({
      query: ({ id, taskId, body }) => ({
        url: `${API_PREFIX}/workflow-runs/${id}/tasks/${taskId}/reassign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkflowRuns"],
    }),
    // POST /api/v1/workflow-runs/{id}/cancel
    cancelWorkflowRun: builder.mutation<CancelWorkflowRunResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/workflow-runs/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["WorkflowRuns"],
    }),
  }),
});

export const {
  useGetWorkflowRunsQuery,
  useLazyGetWorkflowRunsQuery,
  useStartWorkflowRunMutation,
  useGetMyWorkflowWorkQuery,
  useLazyGetMyWorkflowWorkQuery,
  useGetWorkflowRunQuery,
  useLazyGetWorkflowRunQuery,
  useStartWorkflowRunTaskMutation,
  useSubmitWorkflowRunTaskMutation,
  useApproveWorkflowRunTaskMutation,
  useRejectWorkflowRunTaskMutation,
  useSkipWorkflowRunTaskMutation,
  useReassignWorkflowRunTaskMutation,
  useCancelWorkflowRunMutation,
} = workflowRunsApi;

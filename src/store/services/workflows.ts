import api, { API_PREFIX } from "./api";
import type {
  CreateWorkflowResponse,
  DeleteWorkflowResponse,
  GetWorkflowResponse,
  GetWorkflowSummaryResponse,
  GetWorkflowsParams,
  GetWorkflowsResponse,
  SetWorkflowStatusResponse,
  UpdateWorkflowResponse,
  WorkflowRequest,
  WorkflowStatusRequest,
} from "@/src/types/workflows";

export const workflowsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/workflows
    getWorkflows: builder.query<GetWorkflowsResponse, GetWorkflowsParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/workflows`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Workflows"],
    }),
    // POST /api/v1/workflows
    createWorkflow: builder.mutation<CreateWorkflowResponse, WorkflowRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/workflows`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Workflows"],
    }),
    // GET /api/v1/workflows/summary
    getWorkflowSummary: builder.query<GetWorkflowSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/workflows/summary`,
        method: "GET",
      }),
      providesTags: ["Workflows"],
    }),
    // GET /api/v1/workflows/{id}
    getWorkflow: builder.query<GetWorkflowResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/workflows/${id}`,
        method: "GET",
      }),
      providesTags: ["Workflows"],
    }),
    // PUT /api/v1/workflows/{id}
    updateWorkflow: builder.mutation<UpdateWorkflowResponse, { id: string; body: WorkflowRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/workflows/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Workflows"],
    }),
    // DELETE /api/v1/workflows/{id}
    deleteWorkflow: builder.mutation<DeleteWorkflowResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/workflows/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Workflows"],
    }),
    // PATCH /api/v1/workflows/{id}/status
    setWorkflowStatus: builder.mutation<SetWorkflowStatusResponse, { id: string; body: WorkflowStatusRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/workflows/${id}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Workflows"],
    }),
  }),
});

export const {
  useGetWorkflowsQuery,
  useLazyGetWorkflowsQuery,
  useCreateWorkflowMutation,
  useGetWorkflowSummaryQuery,
  useLazyGetWorkflowSummaryQuery,
  useGetWorkflowQuery,
  useLazyGetWorkflowQuery,
  useUpdateWorkflowMutation,
  useDeleteWorkflowMutation,
  useSetWorkflowStatusMutation,
} = workflowsApi;

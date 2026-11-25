import api, { API_PREFIX } from "./api";
import { saveFileResponse, type DownloadedFile } from "./api/download";
import type {
  AddProjectDocumentRequest,
  AddProjectDocumentResponse,
  AddProjectMilestoneResponse,
  AddProjectRiskResponse,
  AddProjectTaskResponse,
  AllocationRequest,
  CreateProjectResponse,
  DeleteProjectDocumentResponse,
  DeleteProjectMilestoneResponse,
  DeleteProjectResponse,
  DeleteProjectRiskResponse,
  DeleteProjectTaskResponse,
  DeleteProjectTimeEntryResponse,
  GetProjectDocumentsParams,
  GetProjectDocumentsResponse,
  GetProjectGoLiveResponse,
  GetProjectResponse,
  GetProjectRiskTallyResponse,
  GetProjectRisksResponse,
  GetProjectSummaryResponse,
  GetProjectTimeEntriesParams,
  GetProjectTimeEntriesResponse,
  GetProjectTimeTallyResponse,
  GetProjectsParams,
  GetProjectsResponse,
  GoLiveTickRequest,
  LogProjectTimeResponse,
  MilestoneApprovalRequest,
  MilestoneRequest,
  ProjectRequest,
  ProjectTaskRequest,
  RemoveProjectAllocationResponse,
  RiskRequest,
  SetProjectAllocationResponse,
  SetProjectMilestoneApprovalResponse,
  SetProjectTaskProgressResponse,
  SetProjectTaskStatusResponse,
  SetProjectTimeEntryStatusResponse,
  TaskProgressRequest,
  TaskStatusRequest,
  TimeEntryRequest,
  TimeEntryStatusRequest,
  ToggleProjectMilestoneResponse,
  UpdateProjectGoLiveItemResponse,
  UpdateProjectMilestoneResponse,
  UpdateProjectResponse,
  UpdateProjectRiskResponse,
  UpdateProjectTaskResponse,
} from "@/src/types/projects";

function toFormData(values: Record<string, unknown>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    form.append(key, value instanceof Blob ? value : String(value));
  }
  return form;
}

export const projectsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/projects/{projectId}/documents
    getProjectDocuments: builder.query<GetProjectDocumentsResponse, { projectId: string; params?: GetProjectDocumentsParams }>({
      query: ({ projectId, params }) => ({
        url: `${API_PREFIX}/projects/${projectId}/documents`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Projects"],
    }),
    // POST /api/v1/projects/{projectId}/documents
    addProjectDocument: builder.mutation<AddProjectDocumentResponse, { projectId: string; body: AddProjectDocumentRequest }>({
      query: ({ projectId, body }) => ({
        url: `${API_PREFIX}/projects/${projectId}/documents`,
        method: "POST",
        body: toFormData(body as unknown as Record<string, unknown>),
      }),
      invalidatesTags: ["Projects"],
    }),
    // GET /api/v1/projects/{projectId}/documents/{documentId}/download
    downloadProjectDocument: builder.mutation<DownloadedFile, { projectId: string; documentId: string }>({
      query: ({ projectId, documentId }) => ({
        url: `${API_PREFIX}/projects/${projectId}/documents/${documentId}/download`,
        method: "GET",
        responseHandler: saveFileResponse("download"),
      }),
    }),
    // DELETE /api/v1/projects/{projectId}/documents/{documentId}
    deleteProjectDocument: builder.mutation<DeleteProjectDocumentResponse, { projectId: string; documentId: string }>({
      query: ({ projectId, documentId }) => ({
        url: `${API_PREFIX}/projects/${projectId}/documents/${documentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    // GET /api/v1/projects/{projectId}/go-live
    getProjectGoLive: builder.query<GetProjectGoLiveResponse, string>({
      query: (projectId) => ({
        url: `${API_PREFIX}/projects/${projectId}/go-live`,
        method: "GET",
      }),
      providesTags: ["Projects"],
    }),
    // PUT /api/v1/projects/{projectId}/go-live/{itemKey}
    updateProjectGoLiveItem: builder.mutation<UpdateProjectGoLiveItemResponse, { projectId: string; itemKey: string; body: GoLiveTickRequest }>({
      query: ({ projectId, itemKey, body }) => ({
        url: `${API_PREFIX}/projects/${projectId}/go-live/${itemKey}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // GET /api/v1/projects/{projectId}/risks
    getProjectRisks: builder.query<GetProjectRisksResponse, string>({
      query: (projectId) => ({
        url: `${API_PREFIX}/projects/${projectId}/risks`,
        method: "GET",
      }),
      providesTags: ["Projects"],
    }),
    // POST /api/v1/projects/{projectId}/risks
    addProjectRisk: builder.mutation<AddProjectRiskResponse, { projectId: string; body: RiskRequest }>({
      query: ({ projectId, body }) => ({
        url: `${API_PREFIX}/projects/${projectId}/risks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // GET /api/v1/projects/{projectId}/risks/tally
    getProjectRiskTally: builder.query<GetProjectRiskTallyResponse, string>({
      query: (projectId) => ({
        url: `${API_PREFIX}/projects/${projectId}/risks/tally`,
        method: "GET",
      }),
      providesTags: ["Projects"],
    }),
    // PUT /api/v1/projects/{projectId}/risks/{riskId}
    updateProjectRisk: builder.mutation<UpdateProjectRiskResponse, { projectId: string; riskId: string; body: RiskRequest }>({
      query: ({ projectId, riskId, body }) => ({
        url: `${API_PREFIX}/projects/${projectId}/risks/${riskId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // DELETE /api/v1/projects/{projectId}/risks/{riskId}
    deleteProjectRisk: builder.mutation<DeleteProjectRiskResponse, { projectId: string; riskId: string }>({
      query: ({ projectId, riskId }) => ({
        url: `${API_PREFIX}/projects/${projectId}/risks/${riskId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    // GET /api/v1/projects
    getProjects: builder.query<GetProjectsResponse, GetProjectsParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/projects`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Projects"],
    }),
    // POST /api/v1/projects
    createProject: builder.mutation<CreateProjectResponse, ProjectRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/projects`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // GET /api/v1/projects/summary
    getProjectSummary: builder.query<GetProjectSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/projects/summary`,
        method: "GET",
      }),
      providesTags: ["Projects"],
    }),
    // GET /api/v1/projects/{id}
    getProject: builder.query<GetProjectResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/projects/${id}`,
        method: "GET",
      }),
      providesTags: ["Projects"],
    }),
    // PUT /api/v1/projects/{id}
    updateProject: builder.mutation<UpdateProjectResponse, { id: string; body: ProjectRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/projects/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // DELETE /api/v1/projects/{id}
    deleteProject: builder.mutation<DeleteProjectResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/projects/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    // POST /api/v1/projects/{id}/tasks
    addProjectTask: builder.mutation<AddProjectTaskResponse, { id: string; body: ProjectTaskRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/projects/${id}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // PUT /api/v1/projects/{id}/tasks/{taskId}
    updateProjectTask: builder.mutation<UpdateProjectTaskResponse, { id: string; taskId: string; body: ProjectTaskRequest }>({
      query: ({ id, taskId, body }) => ({
        url: `${API_PREFIX}/projects/${id}/tasks/${taskId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // DELETE /api/v1/projects/{id}/tasks/{taskId}
    deleteProjectTask: builder.mutation<DeleteProjectTaskResponse, { id: string; taskId: string }>({
      query: ({ id, taskId }) => ({
        url: `${API_PREFIX}/projects/${id}/tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    // PATCH /api/v1/projects/{id}/tasks/{taskId}/status
    setProjectTaskStatus: builder.mutation<SetProjectTaskStatusResponse, { id: string; taskId: string; body: TaskStatusRequest }>({
      query: ({ id, taskId, body }) => ({
        url: `${API_PREFIX}/projects/${id}/tasks/${taskId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // PATCH /api/v1/projects/{id}/tasks/{taskId}/progress
    setProjectTaskProgress: builder.mutation<SetProjectTaskProgressResponse, { id: string; taskId: string; body: TaskProgressRequest }>({
      query: ({ id, taskId, body }) => ({
        url: `${API_PREFIX}/projects/${id}/tasks/${taskId}/progress`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // POST /api/v1/projects/{id}/milestones
    addProjectMilestone: builder.mutation<AddProjectMilestoneResponse, { id: string; body: MilestoneRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/projects/${id}/milestones`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // PUT /api/v1/projects/{id}/milestones/{milestoneId}
    updateProjectMilestone: builder.mutation<UpdateProjectMilestoneResponse, { id: string; milestoneId: string; body: MilestoneRequest }>({
      query: ({ id, milestoneId, body }) => ({
        url: `${API_PREFIX}/projects/${id}/milestones/${milestoneId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // DELETE /api/v1/projects/{id}/milestones/{milestoneId}
    deleteProjectMilestone: builder.mutation<DeleteProjectMilestoneResponse, { id: string; milestoneId: string }>({
      query: ({ id, milestoneId }) => ({
        url: `${API_PREFIX}/projects/${id}/milestones/${milestoneId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    // POST /api/v1/projects/{id}/milestones/{milestoneId}/toggle
    toggleProjectMilestone: builder.mutation<ToggleProjectMilestoneResponse, { id: string; milestoneId: string }>({
      query: ({ id, milestoneId }) => ({
        url: `${API_PREFIX}/projects/${id}/milestones/${milestoneId}/toggle`,
        method: "POST",
      }),
      invalidatesTags: ["Projects"],
    }),
    // PUT /api/v1/projects/{id}/milestones/{milestoneId}/approval
    setProjectMilestoneApproval: builder.mutation<SetProjectMilestoneApprovalResponse, { id: string; milestoneId: string; body: MilestoneApprovalRequest }>({
      query: ({ id, milestoneId, body }) => ({
        url: `${API_PREFIX}/projects/${id}/milestones/${milestoneId}/approval`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // PUT /api/v1/projects/{id}/allocations
    setProjectAllocation: builder.mutation<SetProjectAllocationResponse, { id: string; body: AllocationRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/projects/${id}/allocations`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // DELETE /api/v1/projects/{id}/allocations/{employeeId}
    removeProjectAllocation: builder.mutation<RemoveProjectAllocationResponse, { id: string; employeeId: string }>({
      query: ({ id, employeeId }) => ({
        url: `${API_PREFIX}/projects/${id}/allocations/${employeeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
    // GET /api/v1/projects/{projectId}/time
    getProjectTimeEntries: builder.query<GetProjectTimeEntriesResponse, { projectId: string; params?: GetProjectTimeEntriesParams }>({
      query: ({ projectId, params }) => ({
        url: `${API_PREFIX}/projects/${projectId}/time`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Projects"],
    }),
    // POST /api/v1/projects/{projectId}/time
    logProjectTime: builder.mutation<LogProjectTimeResponse, { projectId: string; body: TimeEntryRequest }>({
      query: ({ projectId, body }) => ({
        url: `${API_PREFIX}/projects/${projectId}/time`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // GET /api/v1/projects/{projectId}/time/tally
    getProjectTimeTally: builder.query<GetProjectTimeTallyResponse, string>({
      query: (projectId) => ({
        url: `${API_PREFIX}/projects/${projectId}/time/tally`,
        method: "GET",
      }),
      providesTags: ["Projects"],
    }),
    // PATCH /api/v1/projects/{projectId}/time/{entryId}/status
    setProjectTimeEntryStatus: builder.mutation<SetProjectTimeEntryStatusResponse, { projectId: string; entryId: string; body: TimeEntryStatusRequest }>({
      query: ({ projectId, entryId, body }) => ({
        url: `${API_PREFIX}/projects/${projectId}/time/${entryId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Projects"],
    }),
    // DELETE /api/v1/projects/{projectId}/time/{entryId}
    deleteProjectTimeEntry: builder.mutation<DeleteProjectTimeEntryResponse, { projectId: string; entryId: string }>({
      query: ({ projectId, entryId }) => ({
        url: `${API_PREFIX}/projects/${projectId}/time/${entryId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects"],
    }),
  }),
});

export const {
  useGetProjectDocumentsQuery,
  useLazyGetProjectDocumentsQuery,
  useAddProjectDocumentMutation,
  useDownloadProjectDocumentMutation,
  useDeleteProjectDocumentMutation,
  useGetProjectGoLiveQuery,
  useLazyGetProjectGoLiveQuery,
  useUpdateProjectGoLiveItemMutation,
  useGetProjectRisksQuery,
  useLazyGetProjectRisksQuery,
  useAddProjectRiskMutation,
  useGetProjectRiskTallyQuery,
  useLazyGetProjectRiskTallyQuery,
  useUpdateProjectRiskMutation,
  useDeleteProjectRiskMutation,
  useGetProjectsQuery,
  useLazyGetProjectsQuery,
  useCreateProjectMutation,
  useGetProjectSummaryQuery,
  useLazyGetProjectSummaryQuery,
  useGetProjectQuery,
  useLazyGetProjectQuery,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAddProjectTaskMutation,
  useUpdateProjectTaskMutation,
  useDeleteProjectTaskMutation,
  useSetProjectTaskStatusMutation,
  useSetProjectTaskProgressMutation,
  useAddProjectMilestoneMutation,
  useUpdateProjectMilestoneMutation,
  useDeleteProjectMilestoneMutation,
  useToggleProjectMilestoneMutation,
  useSetProjectMilestoneApprovalMutation,
  useSetProjectAllocationMutation,
  useRemoveProjectAllocationMutation,
  useGetProjectTimeEntriesQuery,
  useLazyGetProjectTimeEntriesQuery,
  useLogProjectTimeMutation,
  useGetProjectTimeTallyQuery,
  useLazyGetProjectTimeTallyQuery,
  useSetProjectTimeEntryStatusMutation,
  useDeleteProjectTimeEntryMutation,
} = projectsApi;

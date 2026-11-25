import api, { API_PREFIX } from "./api";
import { saveFileResponse, type DownloadedFile } from "./api/download";
import type {
  AddErCaseEvidenceRequest,
  AddErCaseEvidenceResponse,
  AddErCaseMeetingResponse,
  AddErCaseNoteResponse,
  CaseRequest,
  CaseStageRequest,
  CreateErCaseResponse,
  DeleteErCaseEvidenceResponse,
  DeleteErCaseMeetingResponse,
  DeleteErCaseNoteResponse,
  DeleteErCaseResponse,
  GetEmployeeDisciplinariesParams,
  GetEmployeeDisciplinariesResponse,
  GetEmployeeGrievancesParams,
  GetEmployeeGrievancesResponse,
  GetErCaseActivityResponse,
  GetErCaseResponse,
  GetErCaseSummaryResponse,
  GetErCasesParams,
  GetErCasesResponse,
  GetMyErCasesParams,
  GetMyErCasesResponse,
  MeetingRequest,
  MoveErCaseStageResponse,
  NoteRequest,
  UpdateErCaseResponse,
} from "@/src/types/er-cases";

function toFormData(values: Record<string, unknown>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    form.append(key, value instanceof Blob ? value : String(value));
  }
  return form;
}

export const erCasesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/er-cases
    getErCases: builder.query<GetErCasesResponse, GetErCasesParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/er-cases`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["ErCases"],
    }),
    // POST /api/v1/er-cases
    createErCase: builder.mutation<CreateErCaseResponse, CaseRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/er-cases`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ErCases"],
    }),
    // GET /api/v1/er-cases/summary
    getErCaseSummary: builder.query<GetErCaseSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/er-cases/summary`,
        method: "GET",
      }),
      providesTags: ["ErCases"],
    }),
    // GET /api/v1/er-cases/mine
    getMyErCases: builder.query<GetMyErCasesResponse, GetMyErCasesParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/er-cases/mine`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["ErCases"],
    }),
    // GET /api/v1/er-cases/{id}
    getErCase: builder.query<GetErCaseResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/er-cases/${id}`,
        method: "GET",
      }),
      providesTags: ["ErCases"],
    }),
    // PUT /api/v1/er-cases/{id}
    updateErCase: builder.mutation<UpdateErCaseResponse, { id: string; body: CaseRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/er-cases/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ErCases"],
    }),
    // DELETE /api/v1/er-cases/{id}
    deleteErCase: builder.mutation<DeleteErCaseResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/er-cases/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ErCases"],
    }),
    // GET /api/v1/er-cases/{id}/activity
    getErCaseActivity: builder.query<GetErCaseActivityResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/er-cases/${id}/activity`,
        method: "GET",
      }),
      providesTags: ["ErCases"],
    }),
    // PATCH /api/v1/er-cases/{id}/stage
    moveErCaseStage: builder.mutation<MoveErCaseStageResponse, { id: string; body: CaseStageRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/er-cases/${id}/stage`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["ErCases"],
    }),
    // POST /api/v1/er-cases/{id}/notes
    addErCaseNote: builder.mutation<AddErCaseNoteResponse, { id: string; body: NoteRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/er-cases/${id}/notes`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ErCases"],
    }),
    // DELETE /api/v1/er-cases/{id}/notes/{noteId}
    deleteErCaseNote: builder.mutation<DeleteErCaseNoteResponse, { id: string; noteId: string }>({
      query: ({ id, noteId }) => ({
        url: `${API_PREFIX}/er-cases/${id}/notes/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ErCases"],
    }),
    // POST /api/v1/er-cases/{id}/meetings
    addErCaseMeeting: builder.mutation<AddErCaseMeetingResponse, { id: string; body: MeetingRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/er-cases/${id}/meetings`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ErCases"],
    }),
    // DELETE /api/v1/er-cases/{id}/meetings/{meetingId}
    deleteErCaseMeeting: builder.mutation<DeleteErCaseMeetingResponse, { id: string; meetingId: string }>({
      query: ({ id, meetingId }) => ({
        url: `${API_PREFIX}/er-cases/${id}/meetings/${meetingId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ErCases"],
    }),
    // POST /api/v1/er-cases/{id}/evidence
    addErCaseEvidence: builder.mutation<AddErCaseEvidenceResponse, { id: string; body: AddErCaseEvidenceRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/er-cases/${id}/evidence`,
        method: "POST",
        body: toFormData(body as unknown as Record<string, unknown>),
      }),
      invalidatesTags: ["ErCases"],
    }),
    // GET /api/v1/er-cases/{id}/evidence/{evidenceId}/download
    downloadErCaseEvidence: builder.mutation<DownloadedFile, { id: string; evidenceId: string }>({
      query: ({ id, evidenceId }) => ({
        url: `${API_PREFIX}/er-cases/${id}/evidence/${evidenceId}/download`,
        method: "GET",
        responseHandler: saveFileResponse("download"),
      }),
    }),
    // DELETE /api/v1/er-cases/{id}/evidence/{evidenceId}
    deleteErCaseEvidence: builder.mutation<DeleteErCaseEvidenceResponse, { id: string; evidenceId: string }>({
      query: ({ id, evidenceId }) => ({
        url: `${API_PREFIX}/er-cases/${id}/evidence/${evidenceId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ErCases"],
    }),
    // GET /api/v1/employees/{employeeId}/grievances
    getEmployeeGrievances: builder.query<GetEmployeeGrievancesResponse, { employeeId: string; params?: GetEmployeeGrievancesParams }>({
      query: ({ employeeId, params }) => ({
        url: `${API_PREFIX}/employees/${employeeId}/grievances`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["ErCases"],
    }),
    // GET /api/v1/employees/{employeeId}/disciplinaries
    getEmployeeDisciplinaries: builder.query<GetEmployeeDisciplinariesResponse, { employeeId: string; params?: GetEmployeeDisciplinariesParams }>({
      query: ({ employeeId, params }) => ({
        url: `${API_PREFIX}/employees/${employeeId}/disciplinaries`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["ErCases"],
    }),
  }),
});

export const {
  useGetErCasesQuery,
  useLazyGetErCasesQuery,
  useCreateErCaseMutation,
  useGetErCaseSummaryQuery,
  useLazyGetErCaseSummaryQuery,
  useGetMyErCasesQuery,
  useLazyGetMyErCasesQuery,
  useGetErCaseQuery,
  useLazyGetErCaseQuery,
  useUpdateErCaseMutation,
  useDeleteErCaseMutation,
  useGetErCaseActivityQuery,
  useLazyGetErCaseActivityQuery,
  useMoveErCaseStageMutation,
  useAddErCaseNoteMutation,
  useDeleteErCaseNoteMutation,
  useAddErCaseMeetingMutation,
  useDeleteErCaseMeetingMutation,
  useAddErCaseEvidenceMutation,
  useDownloadErCaseEvidenceMutation,
  useDeleteErCaseEvidenceMutation,
  useGetEmployeeGrievancesQuery,
  useLazyGetEmployeeGrievancesQuery,
  useGetEmployeeDisciplinariesQuery,
  useLazyGetEmployeeDisciplinariesQuery,
} = erCasesApi;

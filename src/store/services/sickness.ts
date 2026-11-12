import api, { API_PREFIX } from "./api";
import type {
  ApproveSicknessRecordResponse,
  AttachSicknessDocumentResponse,
  CancelSicknessRecordResponse,
  ClearSicknessExclusionResponse,
  CreateSicknessRecordResponse,
  ExclusionRequest,
  GetBradfordScoresParams,
  GetBradfordScoresResponse,
  GetEmployeeBradfordResponse,
  GetSicknessAlertsResponse,
  GetSicknessRecordResponse,
  GetSicknessRecordsParams,
  GetSicknessRecordsResponse,
  GetSicknessSummaryParams,
  GetSicknessSummaryResponse,
  RecordReturnToWorkResponse,
  RecordSicknessReturnResponse,
  RejectSicknessRecordResponse,
  ReturnRequest,
  ReturnToWorkRequest,
  SetSicknessExclusionResponse,
  SicknessDocumentRequest,
  SicknessReasonRequest,
  SicknessRequest,
  UpdateSicknessRecordResponse,
} from "@/src/types/sickness";

export const sicknessApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSicknessRecords: builder.query<
      GetSicknessRecordsResponse,
      GetSicknessRecordsParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/sickness`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Sickness"],
    }),
    createSicknessRecord: builder.mutation<
      CreateSicknessRecordResponse,
      SicknessRequest
    >({
      query: (body) => ({
        url: `${API_PREFIX}/sickness`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sickness", "Approvals"],
    }),
    getSicknessRecord: builder.query<GetSicknessRecordResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/sickness/${arg}`,
        method: "GET",
      }),
      providesTags: ["Sickness"],
    }),
    updateSicknessRecord: builder.mutation<
      UpdateSicknessRecordResponse,
      { id: string; body: SicknessRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/sickness/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Sickness", "Approvals"],
    }),
    getSicknessSummary: builder.query<
      GetSicknessSummaryResponse,
      GetSicknessSummaryParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/sickness/summary`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Sickness"],
    }),
    getSicknessAlerts: builder.query<GetSicknessAlertsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/sickness/alerts`,
        method: "GET",
      }),
      providesTags: ["Sickness"],
    }),
    approveSicknessRecord: builder.mutation<
      ApproveSicknessRecordResponse,
      string
    >({
      query: (arg) => ({
        url: `${API_PREFIX}/sickness/${arg}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Sickness", "Approvals"],
    }),
    rejectSicknessRecord: builder.mutation<
      RejectSicknessRecordResponse,
      { id: string; body: SicknessReasonRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/sickness/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sickness", "Approvals"],
    }),
    cancelSicknessRecord: builder.mutation<
      CancelSicknessRecordResponse,
      { id: string; body: SicknessReasonRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/sickness/${id}/cancel`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sickness", "Approvals"],
    }),
    recordSicknessReturn: builder.mutation<
      RecordSicknessReturnResponse,
      { id: string; body: ReturnRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/sickness/${id}/return`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sickness", "Approvals"],
    }),
    recordReturnToWork: builder.mutation<
      RecordReturnToWorkResponse,
      { id: string; body: ReturnToWorkRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/sickness/${id}/return-to-work`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sickness", "Approvals"],
    }),
    attachSicknessDocument: builder.mutation<
      AttachSicknessDocumentResponse,
      { id: string; body: SicknessDocumentRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/sickness/${id}/documents`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sickness", "Approvals"],
    }),
    setSicknessExclusion: builder.mutation<
      SetSicknessExclusionResponse,
      { id: string; body: ExclusionRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/sickness/${id}/exclusion`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sickness", "Approvals"],
    }),
    clearSicknessExclusion: builder.mutation<
      ClearSicknessExclusionResponse,
      string
    >({
      query: (arg) => ({
        url: `${API_PREFIX}/sickness/${arg}/exclusion`,
        method: "DELETE",
      }),
      invalidatesTags: ["Sickness", "Approvals"],
    }),
    getEmployeeBradford: builder.query<GetEmployeeBradfordResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/sickness/bradford/${arg}`,
        method: "GET",
      }),
      providesTags: ["Sickness"],
    }),
    getBradfordScores: builder.query<
      GetBradfordScoresResponse,
      GetBradfordScoresParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/sickness/bradford`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Sickness"],
    }),
  }),
});

export const {
  useGetSicknessRecordsQuery,
  useLazyGetSicknessRecordsQuery,
  useCreateSicknessRecordMutation,
  useGetSicknessRecordQuery,
  useLazyGetSicknessRecordQuery,
  useUpdateSicknessRecordMutation,
  useGetSicknessSummaryQuery,
  useLazyGetSicknessSummaryQuery,
  useGetSicknessAlertsQuery,
  useLazyGetSicknessAlertsQuery,
  useApproveSicknessRecordMutation,
  useRejectSicknessRecordMutation,
  useCancelSicknessRecordMutation,
  useRecordSicknessReturnMutation,
  useRecordReturnToWorkMutation,
  useAttachSicknessDocumentMutation,
  useSetSicknessExclusionMutation,
  useClearSicknessExclusionMutation,
  useGetEmployeeBradfordQuery,
  useLazyGetEmployeeBradfordQuery,
  useGetBradfordScoresQuery,
  useLazyGetBradfordScoresQuery,
} = sicknessApi;

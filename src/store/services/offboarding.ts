import api, { API_PREFIX } from "./api";
import type {
  CompleteClearanceItemParams,
  CompleteClearanceItemResponse,
  CompleteExitInterviewParams,
  CompleteExitInterviewResponse,
  DeleteOffboardingResponse,
  GenerateExitDocumentsResponse,
  GetOffboardingResponse,
  GetOffboardingStatsResponse,
  GetOffboardingsParams,
  GetOffboardingsResponse,
  InitiateOffboardingRequest,
  InitiateOffboardingResponse,
  RevokeOffboardingAccessResponse,
  RunOffboardingActionParams,
  RunOffboardingActionResponse,
  ScheduleExitInterviewParams,
  ScheduleExitInterviewResponse,
  UpdateOffboardingParams,
  UpdateOffboardingResponse,
} from "@/src/types/offboarding";

const url = `${API_PREFIX}/offboarding`;

export const offboardingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOffboardings: builder.query<
      GetOffboardingsResponse,
      GetOffboardingsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Offboarding"],
    }),
    initiateOffboarding: builder.mutation<
      InitiateOffboardingResponse,
      InitiateOffboardingRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Offboarding", "Employees", "Approvals", "Assets"],
    }),
    getOffboardingStats: builder.query<
      GetOffboardingStatsResponse,
      void
    >({
      query: () => ({
        url: `${url}/stats`,
        method: "GET",
      }),
      providesTags: ["Offboarding"],
    }),
    getOffboarding: builder.query<
      GetOffboardingResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Offboarding"],
    }),
    updateOffboarding: builder.mutation<
      UpdateOffboardingResponse,
      UpdateOffboardingParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Offboarding", "Employees", "Approvals", "Assets"],
    }),
    deleteOffboarding: builder.mutation<
      DeleteOffboardingResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Offboarding", "Employees", "Approvals", "Assets"],
    }),
    runOffboardingAction: builder.mutation<
      RunOffboardingActionResponse,
      RunOffboardingActionParams
    >({
      query: ({ id, action, body }) => ({
        url: `${url}/${id}/actions/${action}`,
        method: "POST",
        body: body ?? undefined,
      }),
      invalidatesTags: ["Offboarding", "Employees", "Approvals", "Assets"],
    }),
    completeClearanceItem: builder.mutation<
      CompleteClearanceItemResponse,
      CompleteClearanceItemParams
    >({
      query: ({ id, itemId, body }) => ({
        url: `${url}/${id}/clearance/${itemId}`,
        method: "POST",
        body: body ?? undefined,
      }),
      invalidatesTags: ["Offboarding", "Employees", "Approvals", "Assets"],
    }),
    revokeOffboardingAccess: builder.mutation<
      RevokeOffboardingAccessResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/revoke-access`,
        method: "POST",
      }),
      invalidatesTags: ["Offboarding", "Employees", "Approvals", "Assets"],
    }),
    scheduleExitInterview: builder.mutation<
      ScheduleExitInterviewResponse,
      ScheduleExitInterviewParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/exit-interview/schedule`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Offboarding", "Employees", "Approvals", "Assets"],
    }),
    completeExitInterview: builder.mutation<
      CompleteExitInterviewResponse,
      CompleteExitInterviewParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/exit-interview/complete`,
        method: "POST",
        body: body ?? undefined,
      }),
      invalidatesTags: ["Offboarding", "Employees", "Approvals", "Assets"],
    }),
    generateExitDocuments: builder.mutation<
      GenerateExitDocumentsResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/exit-documents`,
        method: "POST",
      }),
      invalidatesTags: ["Offboarding", "Employees", "Approvals", "Assets"],
    }),
  }),
});

export const {
  useGetOffboardingsQuery,
  useInitiateOffboardingMutation,
  useGetOffboardingStatsQuery,
  useGetOffboardingQuery,
  useUpdateOffboardingMutation,
  useDeleteOffboardingMutation,
  useRunOffboardingActionMutation,
  useCompleteClearanceItemMutation,
  useRevokeOffboardingAccessMutation,
  useScheduleExitInterviewMutation,
  useCompleteExitInterviewMutation,
  useGenerateExitDocumentsMutation,
} = offboardingApi;

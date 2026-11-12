import api, { API_PREFIX } from "./api";
import type {
  CancelWorkforceRequestResponse,
  ConvertWorkforceRequestResponse,
  CreateWorkforceRequestResponse,
  DeleteWorkforceRequestResponse,
  GetWorkforceRequestResponse,
  GetWorkforceRequestsParams,
  GetWorkforceRequestsResponse,
  SubmitWorkforceRequestResponse,
  UpdateWorkforceRequestResponse,
  WorkforceCancelRequest,
  WorkforceRequestRequest,
} from "@/src/types/workforce-requests";

export const workforceRequestsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWorkforceRequests: builder.query<
      GetWorkforceRequestsResponse,
      GetWorkforceRequestsParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/workforce-requests`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["WorkforceRequests"],
    }),
    createWorkforceRequest: builder.mutation<
      CreateWorkforceRequestResponse,
      WorkforceRequestRequest
    >({
      query: (body) => ({
        url: `${API_PREFIX}/workforce-requests`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkforceRequests", "Approvals", "Requisitions"],
    }),
    getWorkforceRequest: builder.query<GetWorkforceRequestResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/workforce-requests/${arg}`,
        method: "GET",
      }),
      providesTags: ["WorkforceRequests"],
    }),
    updateWorkforceRequest: builder.mutation<
      UpdateWorkforceRequestResponse,
      { id: string; body: WorkforceRequestRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/workforce-requests/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["WorkforceRequests", "Approvals", "Requisitions"],
    }),
    deleteWorkforceRequest: builder.mutation<
      DeleteWorkforceRequestResponse,
      string
    >({
      query: (arg) => ({
        url: `${API_PREFIX}/workforce-requests/${arg}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WorkforceRequests", "Approvals", "Requisitions"],
    }),
    submitWorkforceRequest: builder.mutation<
      SubmitWorkforceRequestResponse,
      string
    >({
      query: (arg) => ({
        url: `${API_PREFIX}/workforce-requests/${arg}/submit`,
        method: "POST",
      }),
      invalidatesTags: ["WorkforceRequests", "Approvals", "Requisitions"],
    }),
    cancelWorkforceRequest: builder.mutation<
      CancelWorkforceRequestResponse,
      { id: string; body: WorkforceCancelRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/workforce-requests/${id}/cancel`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkforceRequests", "Approvals", "Requisitions"],
    }),
    convertWorkforceRequest: builder.mutation<
      ConvertWorkforceRequestResponse,
      string
    >({
      query: (arg) => ({
        url: `${API_PREFIX}/workforce-requests/${arg}/convert`,
        method: "POST",
      }),
      invalidatesTags: ["WorkforceRequests", "Approvals", "Requisitions"],
    }),
  }),
});

export const {
  useGetWorkforceRequestsQuery,
  useLazyGetWorkforceRequestsQuery,
  useCreateWorkforceRequestMutation,
  useGetWorkforceRequestQuery,
  useLazyGetWorkforceRequestQuery,
  useUpdateWorkforceRequestMutation,
  useDeleteWorkforceRequestMutation,
  useSubmitWorkforceRequestMutation,
  useCancelWorkforceRequestMutation,
  useConvertWorkforceRequestMutation,
} = workforceRequestsApi;

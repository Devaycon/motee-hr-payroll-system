import api, { API_PREFIX } from "./api";
import type {
  CancelLeaveRequestParams,
  CancelLeaveRequestResponse,
  CreateLeaveRequestResponse,
  GetLeaveRequestResponse,
  GetLeaveRequestsParams,
  GetLeaveRequestsResponse,
  GetMyLeaveRequestsParams,
  GetMyLeaveRequestsResponse,
  LeaveQuoteRequest,
  LeaveRequestSubmission,
  QuoteLeaveRequestResponse,
} from "@/src/types/leave";

const url = `${API_PREFIX}/leave/requests`;

export const leaveApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLeaveRequests: builder.query<
      GetLeaveRequestsResponse,
      GetLeaveRequestsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Leave"],
    }),
    createLeaveRequest: builder.mutation<
      CreateLeaveRequestResponse,
      LeaveRequestSubmission
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Leave", "LeaveBalances", "Approvals"],
    }),
    getMyLeaveRequests: builder.query<
      GetMyLeaveRequestsResponse,
      GetMyLeaveRequestsParams | void
    >({
      query: (params) => ({
        url: `${url}/mine`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Leave"],
    }),
    getLeaveRequest: builder.query<
      GetLeaveRequestResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Leave"],
    }),
    quoteLeaveRequest: builder.mutation<
      QuoteLeaveRequestResponse,
      LeaveQuoteRequest
    >({
      query: (body) => ({
        url: `${url}/quote`,
        method: "POST",
        body,
      }),
    }),
    cancelLeaveRequest: builder.mutation<
      CancelLeaveRequestResponse,
      CancelLeaveRequestParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/cancel`,
        method: "POST",
        body: body ?? undefined,
      }),
      invalidatesTags: ["Leave", "LeaveBalances", "Approvals"],
    }),
  }),
});

export const {
  useGetLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useGetMyLeaveRequestsQuery,
  useGetLeaveRequestQuery,
  useQuoteLeaveRequestMutation,
  useCancelLeaveRequestMutation,
} = leaveApi;

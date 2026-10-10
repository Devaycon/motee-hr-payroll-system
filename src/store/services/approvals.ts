import api, { API_PREFIX } from "./api";
import type {
  CancelApprovalParams,
  CancelApprovalResponse,
  DecideApprovalParams,
  DecideApprovalResponse,
  GetApprovalResponse,
  GetApprovalsForSubjectParams,
  GetApprovalsForSubjectResponse,
  GetMyApprovalQueueParams,
  GetMyApprovalQueueResponse,
  ReresolveApprovalResponse,
  ResubmitApprovalResponse,
} from "@/src/types/approvals";

const url = `${API_PREFIX}/approvals`;

export const approvalsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyApprovalQueue: builder.query<
      GetMyApprovalQueueResponse,
      GetMyApprovalQueueParams | void
    >({
      query: (params) => ({
        url: `${url}/my-queue`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Approvals"],
    }),
    getApproval: builder.query<
      GetApprovalResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Approvals"],
    }),
    getApprovalsForSubject: builder.query<
      GetApprovalsForSubjectResponse,
      GetApprovalsForSubjectParams
    >({
      query: ({ subjectType, subjectId }) => ({
        url: `${url}/for/${subjectType}/${subjectId}`,
        method: "GET",
      }),
      providesTags: ["Approvals"],
    }),
    decideApproval: builder.mutation<
      DecideApprovalResponse,
      DecideApprovalParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/decide`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Approvals", "Leave", "LeaveBalances", "Onboarding", "Offboarding"],
    }),
    resubmitApproval: builder.mutation<
      ResubmitApprovalResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/resubmit`,
        method: "POST",
      }),
      invalidatesTags: ["Approvals", "Leave", "LeaveBalances", "Onboarding", "Offboarding"],
    }),
    reresolveApproval: builder.mutation<
      ReresolveApprovalResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/reresolve`,
        method: "POST",
      }),
      invalidatesTags: ["Approvals", "Leave", "LeaveBalances", "Onboarding", "Offboarding"],
    }),
    cancelApproval: builder.mutation<
      CancelApprovalResponse,
      CancelApprovalParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/cancel`,
        method: "POST",
        body: body ?? undefined,
      }),
      invalidatesTags: ["Approvals", "Leave", "LeaveBalances", "Onboarding", "Offboarding"],
    }),
  }),
});

export const {
  useGetMyApprovalQueueQuery,
  useGetApprovalQuery,
  useGetApprovalsForSubjectQuery,
  useDecideApprovalMutation,
  useResubmitApprovalMutation,
  useReresolveApprovalMutation,
  useCancelApprovalMutation,
} = approvalsApi;

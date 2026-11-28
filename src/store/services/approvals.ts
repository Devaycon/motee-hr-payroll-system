import api, { API_PREFIX } from "./api";
import type {
  CancelApprovalParams,
  CancelApprovalResponse,
  DecideApprovalParams,
  DecideApprovalResponse,
  GetApprovalResponse,
  GetApprovalsParams,
  GetApprovalsResponse,
  GetMyApprovalsParams,
  GetApprovalsForSubjectParams,
  GetApprovalsForSubjectResponse,
  GetMyApprovalQueueParams,
  GetMyApprovalQueueResponse,
  ReresolveApprovalResponse,
  ResubmitApprovalResponse,
  ApprovalCommentRequest,
  CommentOnApprovalResponse,
  GetRaisableTypesResponse,
  RaiseApprovalRequest,
  RaiseApprovalResponse,
} from "@/src/types/approvals";

const url = `${API_PREFIX}/approvals`;

export const approvalsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/approvals — every approval in the tenant (the Submissions register)
    getApprovals: builder.query<GetApprovalsResponse, GetApprovalsParams | void>({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Approvals"],
    }),
    // GET /api/v1/approvals/mine — what the signed-in employee raised
    getMyApprovals: builder.query<GetApprovalsResponse, GetMyApprovalsParams | void>({
      query: (params) => ({
        url: `${url}/mine`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Approvals"],
    }),
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
    // GET /api/v1/approvals/document-types — what you may raise, with its form
    getRaisableTypes: builder.query<GetRaisableTypesResponse, void>({
      query: () => ({ url: `${url}/document-types`, method: "GET" }),
      providesTags: ["Approvals"],
    }),
    // POST /api/v1/approvals — raise a request of any raisable type
    raiseApproval: builder.mutation<RaiseApprovalResponse, RaiseApprovalRequest>({
      query: (body) => ({ url, method: "POST", body }),
      invalidatesTags: ["Approvals"],
    }),
    // POST /api/v1/approvals/{id}/comments
    commentOnApproval: builder.mutation<
      CommentOnApprovalResponse,
      { id: string; body: ApprovalCommentRequest }
    >({
      query: ({ id, body }) => ({ url: `${url}/${id}/comments`, method: "POST", body }),
      invalidatesTags: ["Approvals"],
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
      invalidatesTags: ["Approvals", "Leave", "LeaveBalances", "Onboarding", "Offboarding", "ExpenseClaims"],
    }),
    resubmitApproval: builder.mutation<
      ResubmitApprovalResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/resubmit`,
        method: "POST",
      }),
      invalidatesTags: ["Approvals", "Leave", "LeaveBalances", "Onboarding", "Offboarding", "ExpenseClaims"],
    }),
    reresolveApproval: builder.mutation<
      ReresolveApprovalResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/reresolve`,
        method: "POST",
      }),
      invalidatesTags: ["Approvals", "Leave", "LeaveBalances", "Onboarding", "Offboarding", "ExpenseClaims"],
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
      invalidatesTags: ["Approvals", "Leave", "LeaveBalances", "Onboarding", "Offboarding", "ExpenseClaims"],
    }),
  }),
});

export const {
  useGetApprovalsQuery,
  useGetMyApprovalsQuery,
  useGetMyApprovalQueueQuery,
  useGetApprovalQuery,
  useGetApprovalsForSubjectQuery,
  useDecideApprovalMutation,
  useResubmitApprovalMutation,
  useReresolveApprovalMutation,
  useCancelApprovalMutation,
  useGetRaisableTypesQuery,
  useRaiseApprovalMutation,
  useCommentOnApprovalMutation,
} = approvalsApi;

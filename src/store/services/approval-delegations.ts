import api, { API_PREFIX } from "./api";
import type {
  ApprovalDelegationRequest,
  CreateApprovalDelegationResponse,
  DeleteApprovalDelegationResponse,
  GetApprovalDelegationsResponse,
  GetMyApprovalDelegationsResponse,
} from "@/src/types/approval-delegations";

const url = `${API_PREFIX}/approval-delegations`;

export const approvalDelegationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyApprovalDelegations: builder.query<
      GetMyApprovalDelegationsResponse,
      void
    >({
      query: () => ({
        url: `${url}/mine`,
        method: "GET",
      }),
      providesTags: ["ApprovalDelegations"],
    }),
    createApprovalDelegation: builder.mutation<
      CreateApprovalDelegationResponse,
      ApprovalDelegationRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ApprovalDelegations", "Approvals"],
    }),
    getApprovalDelegations: builder.query<
      GetApprovalDelegationsResponse,
      void
    >({
      query: () => ({
        url,
        method: "GET",
      }),
      providesTags: ["ApprovalDelegations"],
    }),
    deleteApprovalDelegation: builder.mutation<
      DeleteApprovalDelegationResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ApprovalDelegations", "Approvals"],
    }),
  }),
});

export const {
  useGetMyApprovalDelegationsQuery,
  useCreateApprovalDelegationMutation,
  useGetApprovalDelegationsQuery,
  useDeleteApprovalDelegationMutation,
} = approvalDelegationsApi;

import api, { API_PREFIX } from "./api";
import type {
  CreateMyExpenseClaimResponse,
  DeleteMyExpenseClaimResponse,
  ExpenseClaimRequest,
  GetExpenseClaimResponse,
  GetExpenseClaimsParams,
  GetExpenseClaimsResponse,
  GetMyExpenseClaimsParams,
  GetMyExpenseClaimsResponse,
  ReimburseExpenseClaimResponse,
  ReturnClaimRequest,
  ReturnExpenseClaimResponse,
  SubmitMyExpenseClaimResponse,
  UpdateMyExpenseClaimResponse,
  WithdrawMyExpenseClaimResponse,
} from "@/src/types/expenses";

const url = `${API_PREFIX}/expenses/claims`;

export const expensesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Self-service ──
    getMyExpenseClaims: builder.query<
      GetMyExpenseClaimsResponse,
      GetMyExpenseClaimsParams | void
    >({
      query: (params) => ({
        url: `${url}/mine`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["ExpenseClaims"],
    }),
    createMyExpenseClaim: builder.mutation<
      CreateMyExpenseClaimResponse,
      ExpenseClaimRequest
    >({
      query: (body) => ({
        url: `${url}/mine`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ExpenseClaims"],
    }),
    updateMyExpenseClaim: builder.mutation<
      UpdateMyExpenseClaimResponse,
      { id: string; body: ExpenseClaimRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/mine/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ExpenseClaims"],
    }),
    deleteMyExpenseClaim: builder.mutation<
      DeleteMyExpenseClaimResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/mine/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ExpenseClaims"],
    }),
    submitMyExpenseClaim: builder.mutation<
      SubmitMyExpenseClaimResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/mine/${id}/submit`,
        method: "POST",
      }),
      invalidatesTags: ["ExpenseClaims", "Approvals"],
    }),
    withdrawMyExpenseClaim: builder.mutation<
      WithdrawMyExpenseClaimResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/mine/${id}/withdraw`,
        method: "POST",
      }),
      invalidatesTags: ["ExpenseClaims", "Approvals"],
    }),

    // ── Management ──
    getExpenseClaims: builder.query<
      GetExpenseClaimsResponse,
      GetExpenseClaimsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["ExpenseClaims"],
    }),
    getExpenseClaim: builder.query<GetExpenseClaimResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["ExpenseClaims"],
    }),
    returnExpenseClaim: builder.mutation<
      ReturnExpenseClaimResponse,
      { id: string; body: ReturnClaimRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/return`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ExpenseClaims", "Approvals"],
    }),
    reimburseExpenseClaim: builder.mutation<
      ReimburseExpenseClaimResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/reimburse`,
        method: "POST",
      }),
      invalidatesTags: ["ExpenseClaims"],
    }),
  }),
});

export const {
  useGetMyExpenseClaimsQuery,
  useCreateMyExpenseClaimMutation,
  useUpdateMyExpenseClaimMutation,
  useDeleteMyExpenseClaimMutation,
  useSubmitMyExpenseClaimMutation,
  useWithdrawMyExpenseClaimMutation,
  useGetExpenseClaimsQuery,
  useGetExpenseClaimQuery,
  useReturnExpenseClaimMutation,
  useReimburseExpenseClaimMutation,
} = expensesApi;

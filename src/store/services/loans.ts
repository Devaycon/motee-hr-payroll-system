import api, { API_PREFIX } from "./api";
import type {
  ApproveLoanRequest,
  ApproveLoanResponse,
  CreateLoanResponse,
  DefaultLoanResponse,
  DeleteLoanRepaymentResponse,
  GetEmployeeLoansResponse,
  GetLoanBookResponse,
  GetLoanResponse,
  GetLoansParams,
  GetLoansResponse,
  GetMyLoansResponse,
  LoanRepaymentRequest,
  LoanRequest,
  RecordLoanRepaymentResponse,
  ReinstateLoanResponse,
  RejectLoanResponse,
} from "@/src/types/loans";

export const loansApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLoans: builder.query<GetLoansResponse, GetLoansParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/loans`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Loans"],
    }),
    createLoan: builder.mutation<CreateLoanResponse, LoanRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/loans`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loans", "Approvals"],
    }),
    getLoanBook: builder.query<GetLoanBookResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/loans/summary`,
        method: "GET",
      }),
      providesTags: ["Loans"],
    }),
    getMyLoans: builder.query<GetMyLoansResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/loans/me`,
        method: "GET",
      }),
      providesTags: ["Loans"],
    }),
    getEmployeeLoans: builder.query<GetEmployeeLoansResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/loans/employees/${arg}`,
        method: "GET",
      }),
      providesTags: ["Loans"],
    }),
    getLoan: builder.query<GetLoanResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/loans/${arg}`,
        method: "GET",
      }),
      providesTags: ["Loans"],
    }),
    approveLoan: builder.mutation<
      ApproveLoanResponse,
      { id: string; body?: ApproveLoanRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/loans/${id}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loans", "Approvals"],
    }),
    rejectLoan: builder.mutation<RejectLoanResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/loans/${arg}/reject`,
        method: "POST",
      }),
      invalidatesTags: ["Loans", "Approvals"],
    }),
    recordLoanRepayment: builder.mutation<
      RecordLoanRepaymentResponse,
      { id: string; body: LoanRepaymentRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/loans/${id}/repayments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Loans", "Approvals"],
    }),
    deleteLoanRepayment: builder.mutation<
      DeleteLoanRepaymentResponse,
      { id: string; repaymentId: string }
    >({
      query: ({ id, repaymentId }) => ({
        url: `${API_PREFIX}/loans/${id}/repayments/${repaymentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Loans", "Approvals"],
    }),
    defaultLoan: builder.mutation<DefaultLoanResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/loans/${arg}/default`,
        method: "POST",
      }),
      invalidatesTags: ["Loans", "Approvals"],
    }),
    reinstateLoan: builder.mutation<ReinstateLoanResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/loans/${arg}/reinstate`,
        method: "POST",
      }),
      invalidatesTags: ["Loans", "Approvals"],
    }),
  }),
});

export const {
  useGetLoansQuery,
  useLazyGetLoansQuery,
  useCreateLoanMutation,
  useGetLoanBookQuery,
  useLazyGetLoanBookQuery,
  useGetMyLoansQuery,
  useLazyGetMyLoansQuery,
  useGetEmployeeLoansQuery,
  useLazyGetEmployeeLoansQuery,
  useGetLoanQuery,
  useLazyGetLoanQuery,
  useApproveLoanMutation,
  useRejectLoanMutation,
  useRecordLoanRepaymentMutation,
  useDeleteLoanRepaymentMutation,
  useDefaultLoanMutation,
  useReinstateLoanMutation,
} = loansApi;

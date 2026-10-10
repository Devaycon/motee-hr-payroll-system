import api, { API_PREFIX } from "./api";
import type {
  AdjustLeaveBalanceResponse,
  CloseLeaveYearParams,
  CloseLeaveYearResponse,
  GetEmployeeLeaveBalancesParams,
  GetEmployeeLeaveBalancesResponse,
  GetLeaveBalancesParams,
  GetLeaveBalancesResponse,
  GetMyLeaveBalancesParams,
  GetMyLeaveBalancesResponse,
  LeaveAdjustmentRequest,
  PreviewLeaveYearEndParams,
  PreviewLeaveYearEndResponse,
} from "@/src/types/leave-balances";

const url = `${API_PREFIX}/leave/balances`;

export const leaveBalancesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLeaveBalances: builder.query<
      GetLeaveBalancesResponse,
      GetLeaveBalancesParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["LeaveBalances"],
    }),
    getMyLeaveBalances: builder.query<
      GetMyLeaveBalancesResponse,
      GetMyLeaveBalancesParams | void
    >({
      query: (params) => ({
        url: `${url}/mine`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["LeaveBalances"],
    }),
    getEmployeeLeaveBalances: builder.query<
      GetEmployeeLeaveBalancesResponse,
      GetEmployeeLeaveBalancesParams
    >({
      query: ({ employeeId, ...params }) => ({
        url: `${url}/${employeeId}`,
        method: "GET",
        params,
      }),
      providesTags: ["LeaveBalances"],
    }),
    adjustLeaveBalance: builder.mutation<
      AdjustLeaveBalanceResponse,
      LeaveAdjustmentRequest
    >({
      query: (body) => ({
        url: `${url}/adjust`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["LeaveBalances"],
    }),
    previewLeaveYearEnd: builder.query<
      PreviewLeaveYearEndResponse,
      PreviewLeaveYearEndParams | void
    >({
      query: (params) => ({
        url: `${url}/year-end/preview`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["LeaveBalances"],
    }),
    closeLeaveYear: builder.mutation<
      CloseLeaveYearResponse,
      CloseLeaveYearParams | void
    >({
      query: (params) => ({
        url: `${url}/year-end/close`,
        method: "POST",
        params: params ?? undefined,
      }),
      invalidatesTags: ["LeaveBalances"],
    }),
  }),
});

export const {
  useGetLeaveBalancesQuery,
  useGetMyLeaveBalancesQuery,
  useGetEmployeeLeaveBalancesQuery,
  useAdjustLeaveBalanceMutation,
  usePreviewLeaveYearEndQuery,
  useCloseLeaveYearMutation,
} = leaveBalancesApi;

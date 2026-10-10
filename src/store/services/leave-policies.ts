import api, { API_PREFIX } from "./api";
import type {
  CreateLeaveBlackoutResponse,
  CreateLeaveTypeResponse,
  CreatePublicHolidayResponse,
  DeleteLeaveBlackoutResponse,
  DeleteLeaveTypeResponse,
  DeletePublicHolidayResponse,
  GeneratePublicHolidaysResponse,
  GetLeaveBlackoutsResponse,
  GetLeaveTypesResponse,
  GetPublicHolidaysParams,
  GetPublicHolidaysResponse,
  LeaveBlackoutRequest,
  LeaveTypeRequest,
  PublicHolidayRequest,
  UpdateLeaveBlackoutParams,
  UpdateLeaveBlackoutResponse,
  UpdateLeaveTypeParams,
  UpdateLeaveTypeResponse,
} from "@/src/types/leave-policies";

const url = `${API_PREFIX}/leave`;

export const leavePoliciesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLeaveTypes: builder.query<
      GetLeaveTypesResponse,
      void
    >({
      query: () => ({
        url: `${url}/types`,
        method: "GET",
      }),
      providesTags: ["LeavePolicies"],
    }),
    createLeaveType: builder.mutation<
      CreateLeaveTypeResponse,
      LeaveTypeRequest
    >({
      query: (body) => ({
        url: `${url}/types`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["LeavePolicies", "Leave", "LeaveBalances"],
    }),
    updateLeaveType: builder.mutation<
      UpdateLeaveTypeResponse,
      UpdateLeaveTypeParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/types/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["LeavePolicies", "Leave", "LeaveBalances"],
    }),
    deleteLeaveType: builder.mutation<
      DeleteLeaveTypeResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/types/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeavePolicies", "Leave", "LeaveBalances"],
    }),
    getPublicHolidays: builder.query<
      GetPublicHolidaysResponse,
      GetPublicHolidaysParams | void
    >({
      query: (params) => ({
        url: `${url}/holidays`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["LeavePolicies"],
    }),
    createPublicHoliday: builder.mutation<
      CreatePublicHolidayResponse,
      PublicHolidayRequest
    >({
      query: (body) => ({
        url: `${url}/holidays`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["LeavePolicies", "Leave", "LeaveBalances"],
    }),
    generatePublicHolidays: builder.mutation<
      GeneratePublicHolidaysResponse,
      number
    >({
      query: (year) => ({
        url: `${url}/holidays/generate/${year}`,
        method: "POST",
      }),
      invalidatesTags: ["LeavePolicies", "Leave", "LeaveBalances"],
    }),
    deletePublicHoliday: builder.mutation<
      DeletePublicHolidayResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/holidays/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeavePolicies", "Leave", "LeaveBalances"],
    }),
    getLeaveBlackouts: builder.query<
      GetLeaveBlackoutsResponse,
      void
    >({
      query: () => ({
        url: `${url}/blackouts`,
        method: "GET",
      }),
      providesTags: ["LeavePolicies"],
    }),
    createLeaveBlackout: builder.mutation<
      CreateLeaveBlackoutResponse,
      LeaveBlackoutRequest
    >({
      query: (body) => ({
        url: `${url}/blackouts`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["LeavePolicies", "Leave", "LeaveBalances"],
    }),
    updateLeaveBlackout: builder.mutation<
      UpdateLeaveBlackoutResponse,
      UpdateLeaveBlackoutParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/blackouts/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["LeavePolicies", "Leave", "LeaveBalances"],
    }),
    deleteLeaveBlackout: builder.mutation<
      DeleteLeaveBlackoutResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/blackouts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["LeavePolicies", "Leave", "LeaveBalances"],
    }),
  }),
});

export const {
  useGetLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  useGetPublicHolidaysQuery,
  useCreatePublicHolidayMutation,
  useGeneratePublicHolidaysMutation,
  useDeletePublicHolidayMutation,
  useGetLeaveBlackoutsQuery,
  useCreateLeaveBlackoutMutation,
  useUpdateLeaveBlackoutMutation,
  useDeleteLeaveBlackoutMutation,
} = leavePoliciesApi;

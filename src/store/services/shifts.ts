import api, { API_PREFIX } from "./api";
import type {
  CancelShiftAssignmentResponse,
  CreateShiftAssignmentResponse,
  DeleteShiftAssignmentResponse,
  GetMyShiftsParams,
  GetMyShiftsResponse,
  GetShiftRosterParams,
  GetShiftRosterResponse,
  ShiftAssignmentRequest,
} from "@/src/types/shifts";

export const shiftsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/shifts/roster
    getShiftRoster: builder.query<GetShiftRosterResponse, GetShiftRosterParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/shifts/roster`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Shifts"],
    }),
    // GET /api/v1/shifts/mine
    getMyShifts: builder.query<GetMyShiftsResponse, GetMyShiftsParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/shifts/mine`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Shifts"],
    }),
    // POST /api/v1/shifts/assignments
    createShiftAssignment: builder.mutation<CreateShiftAssignmentResponse, ShiftAssignmentRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/shifts/assignments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shifts"],
    }),
    // POST /api/v1/shifts/assignments/{id}/cancel
    cancelShiftAssignment: builder.mutation<CancelShiftAssignmentResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/shifts/assignments/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["Shifts"],
    }),
    // DELETE /api/v1/shifts/assignments/{id}
    deleteShiftAssignment: builder.mutation<DeleteShiftAssignmentResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/shifts/assignments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shifts"],
    }),
  }),
});

export const {
  useGetShiftRosterQuery,
  useLazyGetShiftRosterQuery,
  useGetMyShiftsQuery,
  useLazyGetMyShiftsQuery,
  useCreateShiftAssignmentMutation,
  useCancelShiftAssignmentMutation,
  useDeleteShiftAssignmentMutation,
} = shiftsApi;

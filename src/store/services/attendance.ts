import api, { API_PREFIX } from "./api";
import type {
  ApproveAttendanceCorrectionResponse,
  ApproveTimesheetResponse,
  AssignWorkScheduleRequest,
  AssignWorkScheduleResponse,
  ClockInRequest,
  ClockInResponse,
  ClockOutRequest,
  ClockOutResponse,
  CreateWorkScheduleResponse,
  DeleteWorkScheduleResponse,
  EndBreakResponse,
  GetAttendanceCorrectionsParams,
  GetAttendanceCorrectionsResponse,
  GetAttendanceParams,
  GetAttendanceResponse,
  GetAttendanceSummaryParams,
  GetAttendanceSummaryResponse,
  GetEmployeeWorkScheduleResponse,
  GetMyAttendanceCorrectionsResponse,
  GetMyAttendanceDayParams,
  GetMyAttendanceDayResponse,
  GetMyAttendanceDaysParams,
  GetMyAttendanceDaysResponse,
  GetMyAttendanceSummaryParams,
  GetMyAttendanceSummaryResponse,
  GetMyTimesheetParams,
  GetMyTimesheetResponse,
  GetMyWorkScheduleResponse,
  GetTimesheetResponse,
  GetTimesheetsParams,
  GetTimesheetsResponse,
  GetWorkScheduleResponse,
  GetWorkSchedulesResponse,
  LogAttendanceRequest,
  LogAttendanceResponse,
  RejectAttendanceCorrectionResponse,
  RejectTimesheetRequest,
  RejectTimesheetResponse,
  RequestAttendanceCorrectionResponse,
  RequestCorrectionRequest,
  ResolveCorrectionRequest,
  SetDefaultWorkScheduleResponse,
  SetWorkLocationRequest,
  SetWorkLocationResponse,
  StartBreakResponse,
  SubmitMyTimesheetResponse,
  SubmitTimesheetRequest,
  UpdateWorkScheduleResponse,
  WorkScheduleRequest,
} from "@/src/types/attendance";

const url = `${API_PREFIX}/attendance`;

export const attendanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Self-service clock ──
    getMyAttendanceDay: builder.query<
      GetMyAttendanceDayResponse,
      GetMyAttendanceDayParams | void
    >({
      query: (params) => ({
        url: `${url}/mine`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Attendance"],
    }),
    getMyAttendanceDays: builder.query<
      GetMyAttendanceDaysResponse,
      GetMyAttendanceDaysParams | void
    >({
      query: (params) => ({
        url: `${url}/mine/days`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Attendance"],
    }),
    getMyAttendanceSummary: builder.query<
      GetMyAttendanceSummaryResponse,
      GetMyAttendanceSummaryParams | void
    >({
      query: (params) => ({
        url: `${url}/mine/summary`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Attendance"],
    }),
    clockIn: builder.mutation<ClockInResponse, ClockInRequest | void>({
      query: (body) => ({
        url: `${url}/mine/clock-in`,
        method: "POST",
        body: body ?? {},
      }),
      invalidatesTags: ["Attendance", "Timesheets"],
    }),
    startBreak: builder.mutation<StartBreakResponse, void>({
      query: () => ({
        url: `${url}/mine/break/start`,
        method: "POST",
      }),
      invalidatesTags: ["Attendance"],
    }),
    endBreak: builder.mutation<EndBreakResponse, void>({
      query: () => ({
        url: `${url}/mine/break/end`,
        method: "POST",
      }),
      invalidatesTags: ["Attendance"],
    }),
    clockOut: builder.mutation<ClockOutResponse, ClockOutRequest | void>({
      query: (body) => ({
        url: `${url}/mine/clock-out`,
        method: "POST",
        body: body ?? {},
      }),
      invalidatesTags: ["Attendance", "Timesheets"],
    }),
    setWorkLocation: builder.mutation<
      SetWorkLocationResponse,
      SetWorkLocationRequest
    >({
      query: (body) => ({
        url: `${url}/mine/location`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Attendance"],
    }),

    // ── Admin attendance ──
    getAttendance: builder.query<
      GetAttendanceResponse,
      GetAttendanceParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Attendance"],
    }),
    getAttendanceSummary: builder.query<
      GetAttendanceSummaryResponse,
      GetAttendanceSummaryParams | void
    >({
      query: (params) => ({
        url: `${url}/summary`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Attendance"],
    }),
    logAttendance: builder.mutation<
      LogAttendanceResponse,
      LogAttendanceRequest
    >({
      query: (body) => ({
        url: `${url}/log`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Attendance", "Timesheets"],
    }),

    // ── Corrections ──
    getMyAttendanceCorrections: builder.query<
      GetMyAttendanceCorrectionsResponse,
      void
    >({
      query: () => ({
        url: `${url}/corrections/mine`,
        method: "GET",
      }),
      providesTags: ["AttendanceCorrections"],
    }),
    requestAttendanceCorrection: builder.mutation<
      RequestAttendanceCorrectionResponse,
      RequestCorrectionRequest
    >({
      query: (body) => ({
        url: `${url}/corrections/mine`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AttendanceCorrections"],
    }),
    getAttendanceCorrections: builder.query<
      GetAttendanceCorrectionsResponse,
      GetAttendanceCorrectionsParams | void
    >({
      query: (params) => ({
        url: `${url}/corrections`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AttendanceCorrections"],
    }),
    approveAttendanceCorrection: builder.mutation<
      ApproveAttendanceCorrectionResponse,
      { id: string; body?: ResolveCorrectionRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/corrections/${id}/approve`,
        method: "POST",
        body: body ?? {},
      }),
      invalidatesTags: ["AttendanceCorrections", "Attendance", "Timesheets"],
    }),
    rejectAttendanceCorrection: builder.mutation<
      RejectAttendanceCorrectionResponse,
      { id: string; body?: ResolveCorrectionRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/corrections/${id}/reject`,
        method: "POST",
        body: body ?? {},
      }),
      invalidatesTags: ["AttendanceCorrections"],
    }),

    // ── Timesheets ──
    getMyTimesheet: builder.query<
      GetMyTimesheetResponse,
      GetMyTimesheetParams | void
    >({
      query: (params) => ({
        url: `${url}/timesheets/mine`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Timesheets"],
    }),
    submitMyTimesheet: builder.mutation<
      SubmitMyTimesheetResponse,
      SubmitTimesheetRequest
    >({
      query: (body) => ({
        url: `${url}/timesheets/mine/submit`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Timesheets"],
    }),
    getTimesheets: builder.query<
      GetTimesheetsResponse,
      GetTimesheetsParams | void
    >({
      query: (params) => ({
        url: `${url}/timesheets`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Timesheets"],
    }),
    getTimesheet: builder.query<GetTimesheetResponse, string>({
      query: (id) => ({
        url: `${url}/timesheets/${id}`,
        method: "GET",
      }),
      providesTags: ["Timesheets"],
    }),
    approveTimesheet: builder.mutation<ApproveTimesheetResponse, string>({
      query: (id) => ({
        url: `${url}/timesheets/${id}/approve`,
        method: "POST",
      }),
      invalidatesTags: ["Timesheets"],
    }),
    rejectTimesheet: builder.mutation<
      RejectTimesheetResponse,
      { id: string; body: RejectTimesheetRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/timesheets/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Timesheets"],
    }),

    // ── Work schedules ──
    getWorkSchedules: builder.query<GetWorkSchedulesResponse, void>({
      query: () => ({
        url: `${url}/schedules`,
        method: "GET",
      }),
      providesTags: ["WorkSchedules"],
    }),
    createWorkSchedule: builder.mutation<
      CreateWorkScheduleResponse,
      WorkScheduleRequest
    >({
      query: (body) => ({
        url: `${url}/schedules`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["WorkSchedules"],
    }),
    getMyWorkSchedule: builder.query<GetMyWorkScheduleResponse, void>({
      query: () => ({
        url: `${url}/schedules/mine`,
        method: "GET",
      }),
      providesTags: ["WorkSchedules"],
    }),
    getWorkSchedule: builder.query<GetWorkScheduleResponse, string>({
      query: (id) => ({
        url: `${url}/schedules/${id}`,
        method: "GET",
      }),
      providesTags: ["WorkSchedules"],
    }),
    updateWorkSchedule: builder.mutation<
      UpdateWorkScheduleResponse,
      { id: string; body: WorkScheduleRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/schedules/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["WorkSchedules"],
    }),
    deleteWorkSchedule: builder.mutation<DeleteWorkScheduleResponse, string>({
      query: (id) => ({
        url: `${url}/schedules/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["WorkSchedules"],
    }),
    getEmployeeWorkSchedule: builder.query<
      GetEmployeeWorkScheduleResponse,
      string
    >({
      query: (employeeId) => ({
        url: `${url}/schedules/for/${employeeId}`,
        method: "GET",
      }),
      providesTags: ["WorkSchedules"],
    }),
    setDefaultWorkSchedule: builder.mutation<
      SetDefaultWorkScheduleResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/schedules/${id}/default`,
        method: "POST",
      }),
      invalidatesTags: ["WorkSchedules"],
    }),
    assignWorkSchedule: builder.mutation<
      AssignWorkScheduleResponse,
      { employeeId: string; body: AssignWorkScheduleRequest }
    >({
      query: ({ employeeId, body }) => ({
        url: `${url}/schedules/employees/${employeeId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["WorkSchedules"],
    }),
  }),
});

export const {
  useGetMyAttendanceDayQuery,
  useGetMyAttendanceDaysQuery,
  useGetMyAttendanceSummaryQuery,
  useClockInMutation,
  useStartBreakMutation,
  useEndBreakMutation,
  useClockOutMutation,
  useSetWorkLocationMutation,
  useGetAttendanceQuery,
  useGetAttendanceSummaryQuery,
  useLogAttendanceMutation,
  useGetMyAttendanceCorrectionsQuery,
  useRequestAttendanceCorrectionMutation,
  useGetAttendanceCorrectionsQuery,
  useApproveAttendanceCorrectionMutation,
  useRejectAttendanceCorrectionMutation,
  useGetMyTimesheetQuery,
  useSubmitMyTimesheetMutation,
  useGetTimesheetsQuery,
  useGetTimesheetQuery,
  useApproveTimesheetMutation,
  useRejectTimesheetMutation,
  useGetWorkSchedulesQuery,
  useCreateWorkScheduleMutation,
  useGetMyWorkScheduleQuery,
  useGetWorkScheduleQuery,
  useUpdateWorkScheduleMutation,
  useDeleteWorkScheduleMutation,
  useGetEmployeeWorkScheduleQuery,
  useSetDefaultWorkScheduleMutation,
  useAssignWorkScheduleMutation,
} = attendanceApi;

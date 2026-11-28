import api, { API_PREFIX } from "./api";
import type {
  GetHrActionsDashboardResponse,
  GetMyDashboardResponse,
  GetUntakenLeaveDashboardResponse,
  GetLifecycleDashboardResponse,
  GetAttendanceDashboardResponse,
  GetPeopleDashboardResponse,
} from "@/src/types/dashboard";

const url = `${API_PREFIX}/dashboard`;

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/dashboard/hr-actions — open HR action items by category and severity
    getHrActionsDashboard: builder.query<GetHrActionsDashboardResponse, void>({
      query: () => ({ url: `${url}/hr-actions`, method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    // GET /api/v1/dashboard/untaken-leave — people with leave at risk before year end
    getUntakenLeaveDashboard: builder.query<GetUntakenLeaveDashboardResponse, void>({
      query: () => ({ url: `${url}/untaken-leave`, method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    // GET /api/v1/dashboard/mine — the signed-in employee's day
    getMyDashboard: builder.query<GetMyDashboardResponse, void>({
      query: () => ({ url: `${url}/mine`, method: "GET" }),
      providesTags: ["Dashboard"],
    }),
    // GET /api/v1/dashboard/lifecycle — people at each lifecycle stage
    getLifecycleDashboard: builder.query<GetLifecycleDashboardResponse, void>({
      query: () => ({
        url: `${url}/lifecycle`,
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),
    getPeopleDashboard: builder.query<GetPeopleDashboardResponse, void>({
      query: () => ({
        url: `${url}/people`,
        method: "GET",
      }),
      providesTags: ["Dashboard", "Employees", "Leave"],
    }),
    getAttendanceDashboard: builder.query<
      GetAttendanceDashboardResponse,
      void
    >({
      query: () => ({
        url: `${url}/attendance`,
        method: "GET",
      }),
      providesTags: ["Dashboard", "Attendance"],
    }),
  }),
});

export const {
  useGetHrActionsDashboardQuery,
  useGetUntakenLeaveDashboardQuery,
  useGetMyDashboardQuery,
  useGetLifecycleDashboardQuery,
  useGetPeopleDashboardQuery,
  useGetAttendanceDashboardQuery,
} = dashboardApi;

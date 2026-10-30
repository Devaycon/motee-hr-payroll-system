import api, { API_PREFIX } from "./api";
import type {
  GetAttendanceDashboardResponse,
  GetPeopleDashboardResponse,
} from "@/src/types/dashboard";

const url = `${API_PREFIX}/dashboard`;

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
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
  useGetPeopleDashboardQuery,
  useGetAttendanceDashboardQuery,
} = dashboardApi;

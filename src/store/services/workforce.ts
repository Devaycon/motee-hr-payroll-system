import api, { API_PREFIX } from "./api";
import type {
  GetWorkforceHiringParams,
  GetWorkforceHiringResponse,
  GetWorkforceOverviewResponse,
  GetWorkforceTurnoverParams,
  GetWorkforceTurnoverResponse,
} from "@/src/types/workforce";

export const workforceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWorkforceOverview: builder.query<GetWorkforceOverviewResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/workforce/overview`,
        method: "GET",
      }),
      providesTags: ["Workforce"],
    }),
    getWorkforceTurnover: builder.query<
      GetWorkforceTurnoverResponse,
      GetWorkforceTurnoverParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/workforce/turnover`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Workforce"],
    }),
    getWorkforceHiring: builder.query<
      GetWorkforceHiringResponse,
      GetWorkforceHiringParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/workforce/hiring`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Workforce"],
    }),
  }),
});

export const {
  useGetWorkforceOverviewQuery,
  useLazyGetWorkforceOverviewQuery,
  useGetWorkforceTurnoverQuery,
  useLazyGetWorkforceTurnoverQuery,
  useGetWorkforceHiringQuery,
  useLazyGetWorkforceHiringQuery,
} = workforceApi;

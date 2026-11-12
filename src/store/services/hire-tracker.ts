import api, { API_PREFIX } from "./api";
import type {
  GetHireTrackerParams,
  GetHireTrackerResponse,
} from "@/src/types/hire-tracker";

export const hireTrackerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHireTracker: builder.query<
      GetHireTrackerResponse,
      GetHireTrackerParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/hire-tracker`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["HireTracker"],
    }),
  }),
});

export const { useGetHireTrackerQuery, useLazyGetHireTrackerQuery } =
  hireTrackerApi;

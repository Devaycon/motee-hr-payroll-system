import api, { API_PREFIX } from "./api";
import type {
  DiversityRequest,
  GetDiversityReportParams,
  GetDiversityReportResponse,
  GetMyDiversityResponse,
  UpdateMyDiversityResponse,
} from "@/src/types/diversity";

export const diversityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMyDiversity: builder.query<GetMyDiversityResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/diversity/me`,
        method: "GET",
      }),
      providesTags: ["Diversity"],
    }),
    updateMyDiversity: builder.mutation<
      UpdateMyDiversityResponse,
      DiversityRequest
    >({
      query: (body) => ({
        url: `${API_PREFIX}/diversity/me`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Diversity"],
    }),
    getDiversityReport: builder.query<
      GetDiversityReportResponse,
      GetDiversityReportParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/diversity/report`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Diversity"],
    }),
  }),
});

export const {
  useGetMyDiversityQuery,
  useLazyGetMyDiversityQuery,
  useUpdateMyDiversityMutation,
  useGetDiversityReportQuery,
  useLazyGetDiversityReportQuery,
} = diversityApi;

import api, { API_PREFIX } from "./api";
import type {
  DeleteHeadcountPlanResponse,
  GetHeadcountAttritionParams,
  GetHeadcountAttritionResponse,
  GetHeadcountDemographicsResponse,
  GetHeadcountPlansParams,
  GetHeadcountPlansResponse,
  GetHeadcountSeriesParams,
  GetHeadcountSeriesResponse,
  GetHeadcountTrendParams,
  GetHeadcountTrendResponse,
  HeadcountPlanRequest,
  SaveHeadcountPlanResponse,
} from "@/src/types/headcount";

export const headcountApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getHeadcountPlans: builder.query<
      GetHeadcountPlansResponse,
      GetHeadcountPlansParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/headcount/plans`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Headcount"],
    }),
    saveHeadcountPlan: builder.mutation<
      SaveHeadcountPlanResponse,
      HeadcountPlanRequest
    >({
      query: (body) => ({
        url: `${API_PREFIX}/headcount/plans`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Headcount"],
    }),
    getHeadcountTrend: builder.query<
      GetHeadcountTrendResponse,
      GetHeadcountTrendParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/headcount/trend`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Headcount"],
    }),
    getHeadcountSeries: builder.query<
      GetHeadcountSeriesResponse,
      GetHeadcountSeriesParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/headcount/series`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Headcount"],
    }),
    getHeadcountDemographics: builder.query<
      GetHeadcountDemographicsResponse,
      void
    >({
      query: () => ({
        url: `${API_PREFIX}/headcount/demographics`,
        method: "GET",
      }),
      providesTags: ["Headcount"],
    }),
    getHeadcountAttrition: builder.query<
      GetHeadcountAttritionResponse,
      GetHeadcountAttritionParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/headcount/attrition`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Headcount"],
    }),
    deleteHeadcountPlan: builder.mutation<DeleteHeadcountPlanResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/headcount/plans/${arg}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Headcount"],
    }),
  }),
});

export const {
  useGetHeadcountPlansQuery,
  useLazyGetHeadcountPlansQuery,
  useSaveHeadcountPlanMutation,
  useGetHeadcountTrendQuery,
  useLazyGetHeadcountTrendQuery,
  useGetHeadcountSeriesQuery,
  useLazyGetHeadcountSeriesQuery,
  useGetHeadcountDemographicsQuery,
  useLazyGetHeadcountDemographicsQuery,
  useGetHeadcountAttritionQuery,
  useLazyGetHeadcountAttritionQuery,
  useDeleteHeadcountPlanMutation,
} = headcountApi;

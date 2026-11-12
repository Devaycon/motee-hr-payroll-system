import api, { API_PREFIX } from "./api";
import type {
  BenefitPlanRequest,
  BenefitPlanStatusRequest,
  CoverageLevelRequest,
  CreateBenefitPlanResponse,
  CreateCoverageLevelResponse,
  DeleteBenefitPlanResponse,
  DeleteCoverageLevelResponse,
  DuplicateBenefitPlanResponse,
  GetBenefitPlanResponse,
  GetBenefitPlansParams,
  GetBenefitPlansResponse,
  GetBenefitPlansSummaryResponse,
  GetCoverageLevelsResponse,
  GetEmployeeBenefitsResponse,
  SetBenefitPlanStatusResponse,
  UpdateBenefitPlanResponse,
  UpdateCoverageLevelResponse,
} from "@/src/types/benefit-plans";

export const benefitPlansApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBenefitPlans: builder.query<
      GetBenefitPlansResponse,
      GetBenefitPlansParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/benefit-plans`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["BenefitPlans"],
    }),
    createBenefitPlan: builder.mutation<
      CreateBenefitPlanResponse,
      BenefitPlanRequest
    >({
      query: (body) => ({
        url: `${API_PREFIX}/benefit-plans`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["BenefitPlans"],
    }),
    getBenefitPlansSummary: builder.query<GetBenefitPlansSummaryResponse, void>(
      {
        query: () => ({
          url: `${API_PREFIX}/benefit-plans/summary`,
          method: "GET",
        }),
        providesTags: ["BenefitPlans"],
      },
    ),
    getCoverageLevels: builder.query<GetCoverageLevelsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/benefit-plans/coverage-levels`,
        method: "GET",
      }),
      providesTags: ["BenefitPlans"],
    }),
    createCoverageLevel: builder.mutation<
      CreateCoverageLevelResponse,
      CoverageLevelRequest
    >({
      query: (body) => ({
        url: `${API_PREFIX}/benefit-plans/coverage-levels`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["BenefitPlans"],
    }),
    updateCoverageLevel: builder.mutation<
      UpdateCoverageLevelResponse,
      { id: string; body: CoverageLevelRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/benefit-plans/coverage-levels/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["BenefitPlans"],
    }),
    deleteCoverageLevel: builder.mutation<DeleteCoverageLevelResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/benefit-plans/coverage-levels/${arg}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BenefitPlans"],
    }),
    getEmployeeBenefits: builder.query<GetEmployeeBenefitsResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/benefit-plans/employees/${arg}`,
        method: "GET",
      }),
      providesTags: ["BenefitPlans"],
    }),
    getBenefitPlan: builder.query<GetBenefitPlanResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/benefit-plans/${arg}`,
        method: "GET",
      }),
      providesTags: ["BenefitPlans"],
    }),
    updateBenefitPlan: builder.mutation<
      UpdateBenefitPlanResponse,
      { id: string; body: BenefitPlanRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/benefit-plans/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["BenefitPlans"],
    }),
    deleteBenefitPlan: builder.mutation<DeleteBenefitPlanResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/benefit-plans/${arg}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BenefitPlans"],
    }),
    duplicateBenefitPlan: builder.mutation<
      DuplicateBenefitPlanResponse,
      string
    >({
      query: (arg) => ({
        url: `${API_PREFIX}/benefit-plans/${arg}/duplicate`,
        method: "POST",
      }),
      invalidatesTags: ["BenefitPlans"],
    }),
    setBenefitPlanStatus: builder.mutation<
      SetBenefitPlanStatusResponse,
      { id: string; body: BenefitPlanStatusRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/benefit-plans/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["BenefitPlans"],
    }),
  }),
});

export const {
  useGetBenefitPlansQuery,
  useLazyGetBenefitPlansQuery,
  useCreateBenefitPlanMutation,
  useGetBenefitPlansSummaryQuery,
  useLazyGetBenefitPlansSummaryQuery,
  useGetCoverageLevelsQuery,
  useLazyGetCoverageLevelsQuery,
  useCreateCoverageLevelMutation,
  useUpdateCoverageLevelMutation,
  useDeleteCoverageLevelMutation,
  useGetEmployeeBenefitsQuery,
  useLazyGetEmployeeBenefitsQuery,
  useGetBenefitPlanQuery,
  useLazyGetBenefitPlanQuery,
  useUpdateBenefitPlanMutation,
  useDeleteBenefitPlanMutation,
  useDuplicateBenefitPlanMutation,
  useSetBenefitPlanStatusMutation,
} = benefitPlansApi;

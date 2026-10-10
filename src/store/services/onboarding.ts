import api, { API_PREFIX } from "./api";
import type {
  CompleteOnboardingResponse,
  GetMyOnboardingResponse,
  GetOnboardingCatalogueResponse,
  GetOnboardingResponse,
  GetOnboardingsParams,
  GetOnboardingsResponse,
  MoveOnboardingStageParams,
  MoveOnboardingStageResponse,
} from "@/src/types/onboarding";

const url = `${API_PREFIX}/onboarding`;

export const onboardingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOnboardings: builder.query<
      GetOnboardingsResponse,
      GetOnboardingsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Onboarding"],
    }),
    getOnboardingCatalogue: builder.query<
      GetOnboardingCatalogueResponse,
      void
    >({
      query: () => ({
        url: `${url}/catalogue`,
        method: "GET",
      }),
      providesTags: ["Onboarding"],
    }),
    getMyOnboarding: builder.query<
      GetMyOnboardingResponse,
      void
    >({
      query: () => ({
        url: `${url}/mine`,
        method: "GET",
      }),
      providesTags: ["Onboarding"],
    }),
    getOnboarding: builder.query<
      GetOnboardingResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Onboarding"],
    }),
    moveOnboardingStage: builder.mutation<
      MoveOnboardingStageResponse,
      MoveOnboardingStageParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/stage`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Onboarding", "Employees", "Approvals"],
    }),
    completeOnboarding: builder.mutation<
      CompleteOnboardingResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["Onboarding", "Employees", "Approvals"],
    }),
  }),
});

export const {
  useGetOnboardingsQuery,
  useGetOnboardingCatalogueQuery,
  useGetMyOnboardingQuery,
  useGetOnboardingQuery,
  useMoveOnboardingStageMutation,
  useCompleteOnboardingMutation,
} = onboardingApi;

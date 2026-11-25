import api, { API_PREFIX } from "./api";
import type {
  CreateSurveyResponse,
  DeleteSurveyResponse,
  GetEngagementTrendParams,
  GetEngagementTrendResponse,
  GetMySurveyResponseResponse,
  GetMySurveysResponse,
  GetSurveyResponse,
  GetSurveyResultsResponse,
  GetSurveySummaryResponse,
  GetSurveysParams,
  GetSurveysResponse,
  SetSurveyStatusResponse,
  SubmitSurveyResponseResponse,
  SurveyRequest,
  SurveyStatusRequest,
  SurveySubmissionRequest,
  UpdateSurveyResponse,
} from "@/src/types/surveys";

export const surveysApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/surveys
    getSurveys: builder.query<GetSurveysResponse, GetSurveysParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/surveys`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Surveys"],
    }),
    // POST /api/v1/surveys
    createSurvey: builder.mutation<CreateSurveyResponse, SurveyRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/surveys`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Surveys"],
    }),
    // GET /api/v1/surveys/summary
    getSurveySummary: builder.query<GetSurveySummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/surveys/summary`,
        method: "GET",
      }),
      providesTags: ["Surveys"],
    }),
    // GET /api/v1/surveys/engagement-trend
    getEngagementTrend: builder.query<GetEngagementTrendResponse, GetEngagementTrendParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/surveys/engagement-trend`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Surveys"],
    }),
    // GET /api/v1/surveys/mine
    getMySurveys: builder.query<GetMySurveysResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/surveys/mine`,
        method: "GET",
      }),
      providesTags: ["Surveys"],
    }),
    // GET /api/v1/surveys/{id}
    getSurvey: builder.query<GetSurveyResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/surveys/${id}`,
        method: "GET",
      }),
      providesTags: ["Surveys"],
    }),
    // PUT /api/v1/surveys/{id}
    updateSurvey: builder.mutation<UpdateSurveyResponse, { id: string; body: SurveyRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/surveys/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Surveys"],
    }),
    // DELETE /api/v1/surveys/{id}
    deleteSurvey: builder.mutation<DeleteSurveyResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/surveys/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Surveys"],
    }),
    // GET /api/v1/surveys/{id}/results
    getSurveyResults: builder.query<GetSurveyResultsResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/surveys/${id}/results`,
        method: "GET",
      }),
      providesTags: ["Surveys"],
    }),
    // GET /api/v1/surveys/{id}/my-response
    getMySurveyResponse: builder.query<GetMySurveyResponseResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/surveys/${id}/my-response`,
        method: "GET",
      }),
      providesTags: ["Surveys"],
    }),
    // POST /api/v1/surveys/{id}/status
    setSurveyStatus: builder.mutation<SetSurveyStatusResponse, { id: string; body: SurveyStatusRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/surveys/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Surveys"],
    }),
    // POST /api/v1/surveys/{id}/responses
    submitSurveyResponse: builder.mutation<SubmitSurveyResponseResponse, { id: string; body: SurveySubmissionRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/surveys/${id}/responses`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Surveys"],
    }),
  }),
});

export const {
  useGetSurveysQuery,
  useLazyGetSurveysQuery,
  useCreateSurveyMutation,
  useGetSurveySummaryQuery,
  useLazyGetSurveySummaryQuery,
  useGetEngagementTrendQuery,
  useLazyGetEngagementTrendQuery,
  useGetMySurveysQuery,
  useLazyGetMySurveysQuery,
  useGetSurveyQuery,
  useLazyGetSurveyQuery,
  useUpdateSurveyMutation,
  useDeleteSurveyMutation,
  useGetSurveyResultsQuery,
  useLazyGetSurveyResultsQuery,
  useGetMySurveyResponseQuery,
  useLazyGetMySurveyResponseQuery,
  useSetSurveyStatusMutation,
  useSubmitSurveyResponseMutation,
} = surveysApi;

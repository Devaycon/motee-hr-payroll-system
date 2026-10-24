import api, { API_PREFIX } from "./api";
import type {
  AskForFeedbackRequest,
  AskForFeedbackResponse,
  CalibrateReviewRequest,
  CalibrateReviewResponse,
  ChangeGoalStatusRequest,
  ChangeGoalStatusResponse,
  CompleteReviewResponse,
  CreateEmployeeGoalResponse,
  CreateMyGoalResponse,
  DeclineFeedbackRequestResponse,
  DeleteGoalResponse,
  DeleteReviewResponse,
  GetFeedbackParams,
  GetFeedbackRequestsAwaitingMeResponse,
  GetFeedbackResponse,
  GetGoalResponse,
  GetGoalsParams,
  GetGoalsResponse,
  GetMyFeedbackRequestsResponse,
  GetMyFeedbackResponse,
  GetMyGoalsParams,
  GetMyGoalsResponse,
  GetMyReviewsResponse,
  GetReviewResponse,
  GetReviewsParams,
  GetReviewsResponse,
  GiveFeedbackRequest,
  GiveFeedbackResponse,
  GoalRequest,
  ManagerReviewRequest,
  OpenReviewRequest,
  OpenReviewResponse,
  ProgressUpdateRequest,
  SaveManagerReviewResponse,
  SaveSelfAssessmentResponse,
  SelfAssessmentRequest,
  SubmitSelfAssessmentResponse,
  UpdateGoalProgressResponse,
  UpdateGoalResponse,
} from "@/src/types/performance";

const url = `${API_PREFIX}/performance`;

export const performanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Goals ──
    getGoals: builder.query<GetGoalsResponse, GetGoalsParams | void>({
      query: (params) => ({
        url: `${url}/goals`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["PerformanceGoals"],
    }),
    getMyGoals: builder.query<GetMyGoalsResponse, GetMyGoalsParams | void>({
      query: (params) => ({
        url: `${url}/goals/mine`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["PerformanceGoals"],
    }),
    createMyGoal: builder.mutation<CreateMyGoalResponse, GoalRequest>({
      query: (body) => ({
        url: `${url}/goals/mine`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PerformanceGoals"],
    }),
    createEmployeeGoal: builder.mutation<
      CreateEmployeeGoalResponse,
      { employeeId: string; body: GoalRequest }
    >({
      query: ({ employeeId, body }) => ({
        url: `${url}/goals/employees/${employeeId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PerformanceGoals"],
    }),
    getGoal: builder.query<GetGoalResponse, string>({
      query: (id) => ({
        url: `${url}/goals/${id}`,
        method: "GET",
      }),
      providesTags: ["PerformanceGoals"],
    }),
    updateGoal: builder.mutation<
      UpdateGoalResponse,
      { id: string; body: GoalRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/goals/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PerformanceGoals"],
    }),
    deleteGoal: builder.mutation<DeleteGoalResponse, string>({
      query: (id) => ({
        url: `${url}/goals/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PerformanceGoals"],
    }),
    updateGoalProgress: builder.mutation<
      UpdateGoalProgressResponse,
      { id: string; body: ProgressUpdateRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/goals/${id}/progress`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PerformanceGoals"],
    }),
    changeGoalStatus: builder.mutation<
      ChangeGoalStatusResponse,
      { id: string; body: ChangeGoalStatusRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/goals/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PerformanceGoals"],
    }),

    // ── Reviews ──
    getReviews: builder.query<GetReviewsResponse, GetReviewsParams | void>({
      query: (params) => ({
        url: `${url}/reviews`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["PerformanceReviews"],
    }),
    openReview: builder.mutation<OpenReviewResponse, OpenReviewRequest>({
      query: (body) => ({
        url: `${url}/reviews`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PerformanceReviews"],
    }),
    getMyReviews: builder.query<GetMyReviewsResponse, void>({
      query: () => ({
        url: `${url}/reviews/mine`,
        method: "GET",
      }),
      providesTags: ["PerformanceReviews"],
    }),
    getReview: builder.query<GetReviewResponse, string>({
      query: (id) => ({
        url: `${url}/reviews/${id}`,
        method: "GET",
      }),
      providesTags: ["PerformanceReviews"],
    }),
    deleteReview: builder.mutation<DeleteReviewResponse, string>({
      query: (id) => ({
        url: `${url}/reviews/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PerformanceReviews"],
    }),
    saveSelfAssessment: builder.mutation<
      SaveSelfAssessmentResponse,
      { id: string; body: SelfAssessmentRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/reviews/mine/${id}/self-assessment`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PerformanceReviews"],
    }),
    submitSelfAssessment: builder.mutation<
      SubmitSelfAssessmentResponse,
      { id: string; body: SelfAssessmentRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/reviews/mine/${id}/self-assessment`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PerformanceReviews"],
    }),
    saveManagerReview: builder.mutation<
      SaveManagerReviewResponse,
      { id: string; body: ManagerReviewRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/reviews/${id}/manager-review`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PerformanceReviews"],
    }),
    completeReview: builder.mutation<CompleteReviewResponse, string>({
      query: (id) => ({
        url: `${url}/reviews/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["PerformanceReviews"],
    }),
    calibrateReview: builder.mutation<
      CalibrateReviewResponse,
      { id: string; body: CalibrateReviewRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/reviews/${id}/calibrate`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PerformanceReviews"],
    }),

    // ── Feedback ──
    getFeedback: builder.query<GetFeedbackResponse, GetFeedbackParams | void>({
      query: (params) => ({
        url: `${url}/feedback`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["PerformanceFeedback"],
    }),
    giveFeedback: builder.mutation<GiveFeedbackResponse, GiveFeedbackRequest>({
      query: (body) => ({
        url: `${url}/feedback`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PerformanceFeedback"],
    }),
    getMyFeedback: builder.query<GetMyFeedbackResponse, void>({
      query: () => ({
        url: `${url}/feedback/mine`,
        method: "GET",
      }),
      providesTags: ["PerformanceFeedback"],
    }),
    getMyFeedbackRequests: builder.query<GetMyFeedbackRequestsResponse, void>({
      query: () => ({
        url: `${url}/feedback/requests/mine`,
        method: "GET",
      }),
      providesTags: ["PerformanceFeedback"],
    }),
    getFeedbackRequestsAwaitingMe: builder.query<
      GetFeedbackRequestsAwaitingMeResponse,
      void
    >({
      query: () => ({
        url: `${url}/feedback/requests/awaiting-me`,
        method: "GET",
      }),
      providesTags: ["PerformanceFeedback"],
    }),
    askForFeedback: builder.mutation<
      AskForFeedbackResponse,
      AskForFeedbackRequest
    >({
      query: (body) => ({
        url: `${url}/feedback/requests`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PerformanceFeedback"],
    }),
    declineFeedbackRequest: builder.mutation<
      DeclineFeedbackRequestResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/feedback/requests/${id}/decline`,
        method: "POST",
      }),
      invalidatesTags: ["PerformanceFeedback"],
    }),
  }),
});

export const {
  useGetGoalsQuery,
  useGetMyGoalsQuery,
  useCreateMyGoalMutation,
  useCreateEmployeeGoalMutation,
  useGetGoalQuery,
  useUpdateGoalMutation,
  useDeleteGoalMutation,
  useUpdateGoalProgressMutation,
  useChangeGoalStatusMutation,
  useGetReviewsQuery,
  useOpenReviewMutation,
  useGetMyReviewsQuery,
  useGetReviewQuery,
  useDeleteReviewMutation,
  useSaveSelfAssessmentMutation,
  useSubmitSelfAssessmentMutation,
  useSaveManagerReviewMutation,
  useCompleteReviewMutation,
  useCalibrateReviewMutation,
  useGetFeedbackQuery,
  useGiveFeedbackMutation,
  useGetMyFeedbackQuery,
  useGetMyFeedbackRequestsQuery,
  useGetFeedbackRequestsAwaitingMeQuery,
  useAskForFeedbackMutation,
  useDeclineFeedbackRequestMutation,
} = performanceApi;

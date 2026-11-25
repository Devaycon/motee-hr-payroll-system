import api, { API_PREFIX } from "./api";
import type {
  AttemptRequest,
  CourseRequest,
  CreateLearningCourseResponse,
  DeleteLearningCourseResponse,
  DeleteLearningEnrollmentResponse,
  EnrollInLearningCourseResponse,
  EnrollRequest,
  EnrollmentStatusRequest,
  GetLearningComplianceResponse,
  GetLearningCourseQuizResponse,
  GetLearningCourseResponse,
  GetLearningCoursesParams,
  GetLearningCoursesResponse,
  GetLearningEnrollmentsParams,
  GetLearningEnrollmentsResponse,
  GetLearningSummaryResponse,
  GetMyLearningQuizResponse,
  GetMyLearningResponse,
  ProgressRequest,
  QuizRequest,
  SaveLearningCourseQuizResponse,
  SubmitMyLearningQuizAttemptResponse,
  UpdateLearningCourseResponse,
  UpdateLearningEnrollmentProgressResponse,
  UpdateLearningEnrollmentStatusResponse,
} from "@/src/types/learning";

export const learningApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/learning/courses
    getLearningCourses: builder.query<GetLearningCoursesResponse, GetLearningCoursesParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/learning/courses`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Learning"],
    }),
    // POST /api/v1/learning/courses
    createLearningCourse: builder.mutation<CreateLearningCourseResponse, CourseRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/learning/courses`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Learning"],
    }),
    // GET /api/v1/learning/courses/{id}
    getLearningCourse: builder.query<GetLearningCourseResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/learning/courses/${id}`,
        method: "GET",
      }),
      providesTags: ["Learning"],
    }),
    // PUT /api/v1/learning/courses/{id}
    updateLearningCourse: builder.mutation<UpdateLearningCourseResponse, { id: string; body: CourseRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/learning/courses/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Learning"],
    }),
    // DELETE /api/v1/learning/courses/{id}
    deleteLearningCourse: builder.mutation<DeleteLearningCourseResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/learning/courses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Learning"],
    }),
    // GET /api/v1/learning/summary
    getLearningSummary: builder.query<GetLearningSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/learning/summary`,
        method: "GET",
      }),
      providesTags: ["Learning"],
    }),
    // GET /api/v1/learning/compliance
    getLearningCompliance: builder.query<GetLearningComplianceResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/learning/compliance`,
        method: "GET",
      }),
      providesTags: ["Learning"],
    }),
    // GET /api/v1/learning/courses/{id}/quiz
    getLearningCourseQuiz: builder.query<GetLearningCourseQuizResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/learning/courses/${id}/quiz`,
        method: "GET",
      }),
      providesTags: ["Learning"],
    }),
    // PUT /api/v1/learning/courses/{id}/quiz
    saveLearningCourseQuiz: builder.mutation<SaveLearningCourseQuizResponse, { id: string; body: QuizRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/learning/courses/${id}/quiz`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Learning"],
    }),
    // GET /api/v1/learning/enrollments
    getLearningEnrollments: builder.query<GetLearningEnrollmentsResponse, GetLearningEnrollmentsParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/learning/enrollments`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Learning"],
    }),
    // POST /api/v1/learning/courses/{id}/enrollments
    enrollInLearningCourse: builder.mutation<EnrollInLearningCourseResponse, { id: string; body: EnrollRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/learning/courses/${id}/enrollments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Learning"],
    }),
    // PATCH /api/v1/learning/enrollments/{enrollmentId}/progress
    updateLearningEnrollmentProgress: builder.mutation<UpdateLearningEnrollmentProgressResponse, { enrollmentId: string; body: ProgressRequest }>({
      query: ({ enrollmentId, body }) => ({
        url: `${API_PREFIX}/learning/enrollments/${enrollmentId}/progress`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Learning"],
    }),
    // PATCH /api/v1/learning/enrollments/{enrollmentId}/status
    updateLearningEnrollmentStatus: builder.mutation<UpdateLearningEnrollmentStatusResponse, { enrollmentId: string; body: EnrollmentStatusRequest }>({
      query: ({ enrollmentId, body }) => ({
        url: `${API_PREFIX}/learning/enrollments/${enrollmentId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Learning"],
    }),
    // DELETE /api/v1/learning/enrollments/{enrollmentId}
    deleteLearningEnrollment: builder.mutation<DeleteLearningEnrollmentResponse, string>({
      query: (enrollmentId) => ({
        url: `${API_PREFIX}/learning/enrollments/${enrollmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Learning"],
    }),
    // GET /api/v1/learning/mine
    getMyLearning: builder.query<GetMyLearningResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/learning/mine`,
        method: "GET",
      }),
      providesTags: ["Learning"],
    }),
    // GET /api/v1/learning/mine/{enrollmentId}/quiz
    getMyLearningQuiz: builder.query<GetMyLearningQuizResponse, string>({
      query: (enrollmentId) => ({
        url: `${API_PREFIX}/learning/mine/${enrollmentId}/quiz`,
        method: "GET",
      }),
      providesTags: ["Learning"],
    }),
    // POST /api/v1/learning/mine/{enrollmentId}/attempts
    submitMyLearningQuizAttempt: builder.mutation<SubmitMyLearningQuizAttemptResponse, { enrollmentId: string; body: AttemptRequest }>({
      query: ({ enrollmentId, body }) => ({
        url: `${API_PREFIX}/learning/mine/${enrollmentId}/attempts`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Learning"],
    }),
  }),
});

export const {
  useGetLearningCoursesQuery,
  useLazyGetLearningCoursesQuery,
  useCreateLearningCourseMutation,
  useGetLearningCourseQuery,
  useLazyGetLearningCourseQuery,
  useUpdateLearningCourseMutation,
  useDeleteLearningCourseMutation,
  useGetLearningSummaryQuery,
  useLazyGetLearningSummaryQuery,
  useGetLearningComplianceQuery,
  useLazyGetLearningComplianceQuery,
  useGetLearningCourseQuizQuery,
  useLazyGetLearningCourseQuizQuery,
  useSaveLearningCourseQuizMutation,
  useGetLearningEnrollmentsQuery,
  useLazyGetLearningEnrollmentsQuery,
  useEnrollInLearningCourseMutation,
  useUpdateLearningEnrollmentProgressMutation,
  useUpdateLearningEnrollmentStatusMutation,
  useDeleteLearningEnrollmentMutation,
  useGetMyLearningQuery,
  useLazyGetMyLearningQuery,
  useGetMyLearningQuizQuery,
  useLazyGetMyLearningQuizQuery,
  useSubmitMyLearningQuizAttemptMutation,
} = learningApi;

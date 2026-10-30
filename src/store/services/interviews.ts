import api, { API_PREFIX } from "./api";
import type {
  CancelInterviewResponse,
  CompleteInterviewResponse,
  GetCandidateInterviewsResponse,
  GetInterviewsParams,
  GetInterviewsResponse,
  InterviewRequest,
  ScheduleInterviewResponse,
  UpdateInterviewResponse,
} from "@/src/types/interviews";

const url = `${API_PREFIX}/interviews`;

export const interviewsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getInterviews: builder.query<
      GetInterviewsResponse,
      GetInterviewsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Interviews"],
    }),
    scheduleInterview: builder.mutation<
      ScheduleInterviewResponse,
      InterviewRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Interviews", "Candidates"],
    }),
    getCandidateInterviews: builder.query<
      GetCandidateInterviewsResponse,
      string
    >({
      query: (candidateId) => ({
        url: `${url}/candidate/${candidateId}`,
        method: "GET",
      }),
      providesTags: ["Interviews"],
    }),
    updateInterview: builder.mutation<
      UpdateInterviewResponse,
      { id: string; body: InterviewRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Interviews"],
    }),
    completeInterview: builder.mutation<CompleteInterviewResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["Interviews", "Candidates"],
    }),
    cancelInterview: builder.mutation<CancelInterviewResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["Interviews", "Candidates"],
    }),
  }),
});

export const {
  useGetInterviewsQuery,
  useScheduleInterviewMutation,
  useGetCandidateInterviewsQuery,
  useUpdateInterviewMutation,
  useCompleteInterviewMutation,
  useCancelInterviewMutation,
} = interviewsApi;

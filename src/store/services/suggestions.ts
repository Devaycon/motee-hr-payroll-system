import api, { API_PREFIX } from "./api";
import type {
  CommentOnSuggestionResponse,
  CreateSuggestionResponse,
  DeleteSuggestionCommentResponse,
  FeatureSuggestionResponse,
  GetMySuggestionsResponse,
  GetSuggestionResponse,
  GetSuggestionSummaryResponse,
  GetSuggestionsParams,
  GetSuggestionsResponse,
  SetSuggestionPriorityResponse,
  SetSuggestionResponseResponse,
  SetSuggestionStatusResponse,
  SuggestionCommentRequest,
  SuggestionPriorityRequest,
  SuggestionRequest,
  SuggestionResponseRequest,
  SuggestionStatusRequest,
  UnFeatureSuggestionResponse,
  UpvoteSuggestionResponse,
} from "@/src/types/suggestions";

export const suggestionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/suggestions
    getSuggestions: builder.query<GetSuggestionsResponse, GetSuggestionsParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/suggestions`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Suggestions"],
    }),
    // POST /api/v1/suggestions
    createSuggestion: builder.mutation<CreateSuggestionResponse, SuggestionRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/suggestions`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Suggestions"],
    }),
    // GET /api/v1/suggestions/summary
    getSuggestionSummary: builder.query<GetSuggestionSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/suggestions/summary`,
        method: "GET",
      }),
      providesTags: ["Suggestions"],
    }),
    // GET /api/v1/suggestions/mine
    getMySuggestions: builder.query<GetMySuggestionsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/suggestions/mine`,
        method: "GET",
      }),
      providesTags: ["Suggestions"],
    }),
    // GET /api/v1/suggestions/{id}
    getSuggestion: builder.query<GetSuggestionResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/suggestions/${id}`,
        method: "GET",
      }),
      providesTags: ["Suggestions"],
    }),
    // PUT /api/v1/suggestions/{id}/status
    setSuggestionStatus: builder.mutation<SetSuggestionStatusResponse, { id: string; body: SuggestionStatusRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/suggestions/${id}/status`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Suggestions"],
    }),
    // PUT /api/v1/suggestions/{id}/priority
    setSuggestionPriority: builder.mutation<SetSuggestionPriorityResponse, { id: string; body: SuggestionPriorityRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/suggestions/${id}/priority`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Suggestions"],
    }),
    // PUT /api/v1/suggestions/{id}/response
    setSuggestionResponse: builder.mutation<SetSuggestionResponseResponse, { id: string; body: SuggestionResponseRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/suggestions/${id}/response`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Suggestions"],
    }),
    // POST /api/v1/suggestions/{id}/feature
    featureSuggestion: builder.mutation<FeatureSuggestionResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/suggestions/${id}/feature`,
        method: "POST",
      }),
      invalidatesTags: ["Suggestions"],
    }),
    // DELETE /api/v1/suggestions/{id}/feature
    unFeatureSuggestion: builder.mutation<UnFeatureSuggestionResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/suggestions/${id}/feature`,
        method: "DELETE",
      }),
      invalidatesTags: ["Suggestions"],
    }),
    // POST /api/v1/suggestions/{id}/upvote
    upvoteSuggestion: builder.mutation<UpvoteSuggestionResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/suggestions/${id}/upvote`,
        method: "POST",
      }),
      invalidatesTags: ["Suggestions"],
    }),
    // POST /api/v1/suggestions/{id}/comments
    commentOnSuggestion: builder.mutation<CommentOnSuggestionResponse, { id: string; body: SuggestionCommentRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/suggestions/${id}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Suggestions"],
    }),
    // DELETE /api/v1/suggestions/{id}/comments/{commentId}
    deleteSuggestionComment: builder.mutation<DeleteSuggestionCommentResponse, { id: string; commentId: string }>({
      query: ({ id, commentId }) => ({
        url: `${API_PREFIX}/suggestions/${id}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Suggestions"],
    }),
  }),
});

export const {
  useGetSuggestionsQuery,
  useLazyGetSuggestionsQuery,
  useCreateSuggestionMutation,
  useGetSuggestionSummaryQuery,
  useLazyGetSuggestionSummaryQuery,
  useGetMySuggestionsQuery,
  useLazyGetMySuggestionsQuery,
  useGetSuggestionQuery,
  useLazyGetSuggestionQuery,
  useSetSuggestionStatusMutation,
  useSetSuggestionPriorityMutation,
  useSetSuggestionResponseMutation,
  useFeatureSuggestionMutation,
  useUnFeatureSuggestionMutation,
  useUpvoteSuggestionMutation,
  useCommentOnSuggestionMutation,
  useDeleteSuggestionCommentMutation,
} = suggestionsApi;

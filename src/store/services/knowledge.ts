import api, { API_PREFIX } from "./api";
import type {
  ArticleStatusRequest,
  ArticleVoteRequest,
  ClearKnowledgeArticleFeedbackResponse,
  CreateKnowledgeArticleResponse,
  DeleteKnowledgeArticleResponse,
  FeatureKnowledgeArticleResponse,
  GetKnowledgeArticleResponse,
  GetKnowledgeArticlesParams,
  GetKnowledgeArticlesResponse,
  GetKnowledgeSummaryResponse,
  GetPublishedKnowledgeArticlesParams,
  GetPublishedKnowledgeArticlesResponse,
  KnowledgeArticleRequest,
  MarkKnowledgeArticleReadResponse,
  SendKnowledgeArticleFeedbackResponse,
  SetKnowledgeArticleStatusResponse,
  UnfeatureKnowledgeArticleResponse,
  UpdateKnowledgeArticleResponse,
} from "@/src/types/knowledge";

export const knowledgeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/knowledge
    getKnowledgeArticles: builder.query<GetKnowledgeArticlesResponse, GetKnowledgeArticlesParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/knowledge`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Knowledge"],
    }),
    // POST /api/v1/knowledge
    createKnowledgeArticle: builder.mutation<CreateKnowledgeArticleResponse, KnowledgeArticleRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/knowledge`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Knowledge"],
    }),
    // GET /api/v1/knowledge/published
    getPublishedKnowledgeArticles: builder.query<GetPublishedKnowledgeArticlesResponse, GetPublishedKnowledgeArticlesParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/knowledge/published`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Knowledge"],
    }),
    // GET /api/v1/knowledge/summary
    getKnowledgeSummary: builder.query<GetKnowledgeSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/knowledge/summary`,
        method: "GET",
      }),
      providesTags: ["Knowledge"],
    }),
    // GET /api/v1/knowledge/{id}
    getKnowledgeArticle: builder.query<GetKnowledgeArticleResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/knowledge/${id}`,
        method: "GET",
      }),
      providesTags: ["Knowledge"],
    }),
    // PUT /api/v1/knowledge/{id}
    updateKnowledgeArticle: builder.mutation<UpdateKnowledgeArticleResponse, { id: string; body: KnowledgeArticleRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/knowledge/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Knowledge"],
    }),
    // DELETE /api/v1/knowledge/{id}
    deleteKnowledgeArticle: builder.mutation<DeleteKnowledgeArticleResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/knowledge/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Knowledge"],
    }),
    // POST /api/v1/knowledge/{id}/status
    setKnowledgeArticleStatus: builder.mutation<SetKnowledgeArticleStatusResponse, { id: string; body: ArticleStatusRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/knowledge/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Knowledge"],
    }),
    // POST /api/v1/knowledge/{id}/feature
    featureKnowledgeArticle: builder.mutation<FeatureKnowledgeArticleResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/knowledge/${id}/feature`,
        method: "POST",
      }),
      invalidatesTags: ["Knowledge"],
    }),
    // DELETE /api/v1/knowledge/{id}/feature
    unfeatureKnowledgeArticle: builder.mutation<UnfeatureKnowledgeArticleResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/knowledge/${id}/feature`,
        method: "DELETE",
      }),
      invalidatesTags: ["Knowledge"],
    }),
    // POST /api/v1/knowledge/{id}/read
    markKnowledgeArticleRead: builder.mutation<MarkKnowledgeArticleReadResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/knowledge/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Knowledge"],
    }),
    // POST /api/v1/knowledge/{id}/feedback
    sendKnowledgeArticleFeedback: builder.mutation<SendKnowledgeArticleFeedbackResponse, { id: string; body: ArticleVoteRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/knowledge/${id}/feedback`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Knowledge"],
    }),
    // DELETE /api/v1/knowledge/{id}/feedback
    clearKnowledgeArticleFeedback: builder.mutation<ClearKnowledgeArticleFeedbackResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/knowledge/${id}/feedback`,
        method: "DELETE",
      }),
      invalidatesTags: ["Knowledge"],
    }),
  }),
});

export const {
  useGetKnowledgeArticlesQuery,
  useLazyGetKnowledgeArticlesQuery,
  useCreateKnowledgeArticleMutation,
  useGetPublishedKnowledgeArticlesQuery,
  useLazyGetPublishedKnowledgeArticlesQuery,
  useGetKnowledgeSummaryQuery,
  useLazyGetKnowledgeSummaryQuery,
  useGetKnowledgeArticleQuery,
  useLazyGetKnowledgeArticleQuery,
  useUpdateKnowledgeArticleMutation,
  useDeleteKnowledgeArticleMutation,
  useSetKnowledgeArticleStatusMutation,
  useFeatureKnowledgeArticleMutation,
  useUnfeatureKnowledgeArticleMutation,
  useMarkKnowledgeArticleReadMutation,
  useSendKnowledgeArticleFeedbackMutation,
  useClearKnowledgeArticleFeedbackMutation,
} = knowledgeApi;

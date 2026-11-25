import api, { API_PREFIX } from "./api";
import type {
  CommentOnCommunityPostResponse,
  CreateCommunityPostResponse,
  DeleteCommunityCommentResponse,
  DeleteCommunityPostResponse,
  GetCommunityPostResponse,
  GetCommunityPostsParams,
  GetCommunityPostsResponse,
  GetCommunitySummaryResponse,
  LikeCommunityPostResponse,
  PinCommunityPostResponse,
  PollVoteRequest,
  PostCommentRequest,
  PostRequest,
  UnpinCommunityPostResponse,
  UpdateCommunityPostResponse,
  VoteOnCommunityPollResponse,
} from "@/src/types/community";

export const communityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/community
    getCommunityPosts: builder.query<GetCommunityPostsResponse, GetCommunityPostsParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/community`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Community"],
    }),
    // POST /api/v1/community
    createCommunityPost: builder.mutation<CreateCommunityPostResponse, PostRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/community`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Community"],
    }),
    // GET /api/v1/community/summary
    getCommunitySummary: builder.query<GetCommunitySummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/community/summary`,
        method: "GET",
      }),
      providesTags: ["Community"],
    }),
    // GET /api/v1/community/{id}
    getCommunityPost: builder.query<GetCommunityPostResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/community/${id}`,
        method: "GET",
      }),
      providesTags: ["Community"],
    }),
    // PUT /api/v1/community/{id}
    updateCommunityPost: builder.mutation<UpdateCommunityPostResponse, { id: string; body: PostRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/community/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Community"],
    }),
    // DELETE /api/v1/community/{id}
    deleteCommunityPost: builder.mutation<DeleteCommunityPostResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/community/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Community"],
    }),
    // POST /api/v1/community/{id}/pin
    pinCommunityPost: builder.mutation<PinCommunityPostResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/community/${id}/pin`,
        method: "POST",
      }),
      invalidatesTags: ["Community"],
    }),
    // DELETE /api/v1/community/{id}/pin
    unpinCommunityPost: builder.mutation<UnpinCommunityPostResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/community/${id}/pin`,
        method: "DELETE",
      }),
      invalidatesTags: ["Community"],
    }),
    // POST /api/v1/community/{id}/like
    likeCommunityPost: builder.mutation<LikeCommunityPostResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/community/${id}/like`,
        method: "POST",
      }),
      invalidatesTags: ["Community"],
    }),
    // POST /api/v1/community/{id}/comments
    commentOnCommunityPost: builder.mutation<CommentOnCommunityPostResponse, { id: string; body: PostCommentRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/community/${id}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Community"],
    }),
    // DELETE /api/v1/community/{id}/comments/{commentId}
    deleteCommunityComment: builder.mutation<DeleteCommunityCommentResponse, { id: string; commentId: string }>({
      query: ({ id, commentId }) => ({
        url: `${API_PREFIX}/community/${id}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Community"],
    }),
    // POST /api/v1/community/{id}/poll-votes
    voteOnCommunityPoll: builder.mutation<VoteOnCommunityPollResponse, { id: string; body: PollVoteRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/community/${id}/poll-votes`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Community"],
    }),
  }),
});

export const {
  useGetCommunityPostsQuery,
  useLazyGetCommunityPostsQuery,
  useCreateCommunityPostMutation,
  useGetCommunitySummaryQuery,
  useLazyGetCommunitySummaryQuery,
  useGetCommunityPostQuery,
  useLazyGetCommunityPostQuery,
  useUpdateCommunityPostMutation,
  useDeleteCommunityPostMutation,
  usePinCommunityPostMutation,
  useUnpinCommunityPostMutation,
  useLikeCommunityPostMutation,
  useCommentOnCommunityPostMutation,
  useDeleteCommunityCommentMutation,
  useVoteOnCommunityPollMutation,
} = communityApi;

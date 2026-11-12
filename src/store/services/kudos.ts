import api, { API_PREFIX } from "./api";
import type {
  CommentOnKudosResponse,
  CreateKudosResponse,
  DeleteKudosCommentResponse,
  DeleteKudosResponse,
  GetKudosLeaderboardParams,
  GetKudosLeaderboardResponse,
  GetKudosParams,
  GetKudosPostResponse,
  GetKudosResponse,
  GetKudosSummaryResponse,
  GetMyKudosResponse,
  KudosCommentRequest,
  KudosRequest,
  PinKudosResponse,
  ReactToKudosResponse,
  ReactionRequest,
  UnpinKudosResponse,
} from "@/src/types/kudos";

export const kudosApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getKudos: builder.query<GetKudosResponse, GetKudosParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/kudos`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Kudos"],
    }),
    createKudos: builder.mutation<CreateKudosResponse, KudosRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/kudos`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Kudos"],
    }),
    getKudosSummary: builder.query<GetKudosSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/kudos/summary`,
        method: "GET",
      }),
      providesTags: ["Kudos"],
    }),
    getKudosLeaderboard: builder.query<
      GetKudosLeaderboardResponse,
      GetKudosLeaderboardParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/kudos/leaderboard`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Kudos"],
    }),
    getMyKudos: builder.query<GetMyKudosResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/kudos/me`,
        method: "GET",
      }),
      providesTags: ["Kudos"],
    }),
    getKudosPost: builder.query<GetKudosPostResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/kudos/${arg}`,
        method: "GET",
      }),
      providesTags: ["Kudos"],
    }),
    deleteKudos: builder.mutation<DeleteKudosResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/kudos/${arg}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Kudos"],
    }),
    pinKudos: builder.mutation<PinKudosResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/kudos/${arg}/pin`,
        method: "POST",
      }),
      invalidatesTags: ["Kudos"],
    }),
    unpinKudos: builder.mutation<UnpinKudosResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/kudos/${arg}/pin`,
        method: "DELETE",
      }),
      invalidatesTags: ["Kudos"],
    }),
    reactToKudos: builder.mutation<
      ReactToKudosResponse,
      { id: string; body: ReactionRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/kudos/${id}/reactions`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Kudos"],
    }),
    commentOnKudos: builder.mutation<
      CommentOnKudosResponse,
      { id: string; body: KudosCommentRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/kudos/${id}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Kudos"],
    }),
    deleteKudosComment: builder.mutation<
      DeleteKudosCommentResponse,
      { id: string; commentId: string }
    >({
      query: ({ id, commentId }) => ({
        url: `${API_PREFIX}/kudos/${id}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Kudos"],
    }),
  }),
});

export const {
  useGetKudosQuery,
  useLazyGetKudosQuery,
  useCreateKudosMutation,
  useGetKudosSummaryQuery,
  useLazyGetKudosSummaryQuery,
  useGetKudosLeaderboardQuery,
  useLazyGetKudosLeaderboardQuery,
  useGetMyKudosQuery,
  useLazyGetMyKudosQuery,
  useGetKudosPostQuery,
  useLazyGetKudosPostQuery,
  useDeleteKudosMutation,
  usePinKudosMutation,
  useUnpinKudosMutation,
  useReactToKudosMutation,
  useCommentOnKudosMutation,
  useDeleteKudosCommentMutation,
} = kudosApi;

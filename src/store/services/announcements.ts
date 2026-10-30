import api, { API_PREFIX } from "./api";
import type {
  AcknowledgeAnnouncementResponse,
  AnnouncementRequest,
  ArchiveAnnouncementResponse,
  CreateAnnouncementResponse,
  DeleteAnnouncementResponse,
  GetAnnouncementAcknowledgementsResponse,
  GetAnnouncementFeedResponse,
  GetAnnouncementResponse,
  GetAnnouncementsParams,
  GetAnnouncementsResponse,
  MarkAnnouncementViewedResponse,
  PublishAnnouncementResponse,
  UpdateAnnouncementResponse,
} from "@/src/types/announcements";

const url = `${API_PREFIX}/announcements`;

export const announcementsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Feed (self-service) ──
    getAnnouncementFeed: builder.query<GetAnnouncementFeedResponse, void>({
      query: () => ({
        url: `${url}/feed`,
        method: "GET",
      }),
      providesTags: ["Announcements"],
    }),
    markAnnouncementViewed: builder.mutation<
      MarkAnnouncementViewedResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/feed/${id}/view`,
        method: "POST",
      }),
      invalidatesTags: ["Announcements"],
    }),
    acknowledgeAnnouncement: builder.mutation<
      AcknowledgeAnnouncementResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/feed/${id}/acknowledge`,
        method: "POST",
      }),
      invalidatesTags: ["Announcements"],
    }),

    // ── Management ──
    getAnnouncements: builder.query<
      GetAnnouncementsResponse,
      GetAnnouncementsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Announcements"],
    }),
    createAnnouncement: builder.mutation<
      CreateAnnouncementResponse,
      AnnouncementRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Announcements"],
    }),
    getAnnouncement: builder.query<GetAnnouncementResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Announcements"],
    }),
    updateAnnouncement: builder.mutation<
      UpdateAnnouncementResponse,
      { id: string; body: AnnouncementRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Announcements"],
    }),
    deleteAnnouncement: builder.mutation<DeleteAnnouncementResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Announcements"],
    }),
    getAnnouncementAcknowledgements: builder.query<
      GetAnnouncementAcknowledgementsResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/acknowledgements`,
        method: "GET",
      }),
      providesTags: ["Announcements"],
    }),
    publishAnnouncement: builder.mutation<PublishAnnouncementResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: ["Announcements"],
    }),
    archiveAnnouncement: builder.mutation<ArchiveAnnouncementResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/archive`,
        method: "POST",
      }),
      invalidatesTags: ["Announcements"],
    }),
  }),
});

export const {
  useGetAnnouncementFeedQuery,
  useMarkAnnouncementViewedMutation,
  useAcknowledgeAnnouncementMutation,
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useGetAnnouncementQuery,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  useGetAnnouncementAcknowledgementsQuery,
  usePublishAnnouncementMutation,
  useArchiveAnnouncementMutation,
} = announcementsApi;

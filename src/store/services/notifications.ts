import api, { API_PREFIX } from "./api";
import type {
  DismissNotificationResponse,
  GetNotificationsParams,
  GetNotificationsResponse,
  GetUnreadNotificationCountResponse,
  MarkAllNotificationsReadResponse,
  MarkNotificationReadResponse,
} from "@/src/types/notifications";

const url = `${API_PREFIX}/notifications`;

export const notificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      GetNotificationsResponse,
      GetNotificationsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Notifications"],
    }),
    getUnreadNotificationCount: builder.query<
      GetUnreadNotificationCountResponse,
      void
    >({
      query: () => ({
        url: `${url}/unread-count`,
        method: "GET",
      }),
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation<
      MarkNotificationReadResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation<
      MarkAllNotificationsReadResponse,
      void
    >({
      query: () => ({
        url: `${url}/read-all`,
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
    }),
    dismissNotification: builder.mutation<DismissNotificationResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/dismiss`,
        method: "POST",
      }),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDismissNotificationMutation,
} = notificationsApi;

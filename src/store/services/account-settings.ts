import api, { API_PREFIX } from "./api";
import type {
  GetMyAccountActivityParams,
  GetMyAccountActivityResponse,
  GetMyNotificationSettingsResponse,
  GetMySessionsResponse,
  NotificationPreferenceRequest,
  RevokeMySessionResponse,
  UpdateMyNotificationSettingsResponse,
} from "@/src/types/account-settings";

export const accountSettingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/settings/me/notifications
    getMyNotificationSettings: builder.query<GetMyNotificationSettingsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/settings/me/notifications`,
        method: "GET",
      }),
      providesTags: ["AccountSettings"],
    }),
    // PUT /api/v1/settings/me/notifications
    updateMyNotificationSettings: builder.mutation<UpdateMyNotificationSettingsResponse, NotificationPreferenceRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/settings/me/notifications`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AccountSettings"],
    }),
    // GET /api/v1/settings/me/sessions
    getMySessions: builder.query<GetMySessionsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/settings/me/sessions`,
        method: "GET",
      }),
      providesTags: ["AccountSettings"],
    }),
    // DELETE /api/v1/settings/me/sessions/{id}
    revokeMySession: builder.mutation<RevokeMySessionResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/settings/me/sessions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AccountSettings"],
    }),
    // GET /api/v1/settings/me/activity
    getMyAccountActivity: builder.query<GetMyAccountActivityResponse, GetMyAccountActivityParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/settings/me/activity`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["AccountSettings"],
    }),
  }),
});

export const {
  useGetMyNotificationSettingsQuery,
  useLazyGetMyNotificationSettingsQuery,
  useUpdateMyNotificationSettingsMutation,
  useGetMySessionsQuery,
  useLazyGetMySessionsQuery,
  useRevokeMySessionMutation,
  useGetMyAccountActivityQuery,
  useLazyGetMyAccountActivityQuery,
} = accountSettingsApi;

import api, { API_PREFIX } from "./api";
import type {
  GetHolidayYearsResponse,
  GetModuleSettingsResponse,
  GetPasswordPolicyResponse,
  GetSubscriptionResponse,
  HolidayYearRequest,
  ModuleSettingsRequest,
  PasswordPolicyRequest,
  UpdateHolidayYearResponse,
  UpdateModuleSettingsResponse,
  UpdatePasswordPolicyResponse,
} from "@/src/types/settings";

export const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/settings/modules
    getModuleSettings: builder.query<GetModuleSettingsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/settings/modules`,
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),
    // PUT /api/v1/settings/modules
    updateModuleSettings: builder.mutation<UpdateModuleSettingsResponse, ModuleSettingsRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/settings/modules`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),
    // GET /api/v1/settings/password-policy
    getPasswordPolicy: builder.query<GetPasswordPolicyResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/settings/password-policy`,
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),
    // PUT /api/v1/settings/password-policy
    updatePasswordPolicy: builder.mutation<UpdatePasswordPolicyResponse, PasswordPolicyRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/settings/password-policy`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),
    // GET /api/v1/settings/holiday-years
    getHolidayYears: builder.query<GetHolidayYearsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/settings/holiday-years`,
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),
    // PUT /api/v1/settings/holiday-year
    updateHolidayYear: builder.mutation<UpdateHolidayYearResponse, HolidayYearRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/settings/holiday-year`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),
    // GET /api/v1/settings/subscription
    getSubscription: builder.query<GetSubscriptionResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/settings/subscription`,
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetModuleSettingsQuery,
  useLazyGetModuleSettingsQuery,
  useUpdateModuleSettingsMutation,
  useGetPasswordPolicyQuery,
  useLazyGetPasswordPolicyQuery,
  useUpdatePasswordPolicyMutation,
  useGetHolidayYearsQuery,
  useLazyGetHolidayYearsQuery,
  useUpdateHolidayYearMutation,
  useGetSubscriptionQuery,
  useLazyGetSubscriptionQuery,
} = settingsApi;

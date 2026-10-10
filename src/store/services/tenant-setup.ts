import api, { API_PREFIX } from "./api";
import type {
  GetTenantSetupOptionsResponse,
  GetTenantSetupResponse,
  TenantSetupRequest,
  UpdateTenantSetupResponse,
} from "@/src/types/tenant-setup";

const url = `${API_PREFIX}/tenant/setup`;

export const tenantSetupApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTenantSetupOptions: builder.query<GetTenantSetupOptionsResponse, void>({
      query: () => ({
        url: `${url}/options`,
        method: "GET",
      }),
    }),
    getTenantSetup: builder.query<GetTenantSetupResponse, void>({
      query: () => ({
        url,
        method: "GET",
      }),
      providesTags: ["TenantSetup"],
    }),
    updateTenantSetup: builder.mutation<
      UpdateTenantSetupResponse,
      TenantSetupRequest
    >({
      query: (body) => ({
        url,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["TenantSetup", "TenantLocale"],
    }),
    completeTenantSetup: builder.mutation<UpdateTenantSetupResponse, void>({
      query: () => ({
        url: `${url}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["TenantSetup", "CurrentUser"],
    }),
  }),
});

export const {
  useGetTenantSetupOptionsQuery,
  useGetTenantSetupQuery,
  useUpdateTenantSetupMutation,
  useCompleteTenantSetupMutation,
} = tenantSetupApi;

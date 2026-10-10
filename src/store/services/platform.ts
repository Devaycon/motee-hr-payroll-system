import api, { API_PREFIX } from "./api";
import type {
  GetPlatformStaffResponse,
  GetPlatformTenantResponse,
  GetPlatformTenantsParams,
  GetPlatformTenantsResponse,
  GrantPlatformRoleRequest,
  GrantPlatformRoleResponse,
  RevokePlatformRoleResponse,
} from "@/src/types/platform";

const url = `${API_PREFIX}/platform`;

export const platformApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPlatformTenants: builder.query<
      GetPlatformTenantsResponse,
      GetPlatformTenantsParams | void
    >({
      query: (params) => ({
        url: `${url}/tenants`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Platform"],
    }),
    getPlatformTenant: builder.query<
      GetPlatformTenantResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/tenants/${id}`,
        method: "GET",
      }),
      providesTags: ["Platform"],
    }),
    getPlatformStaff: builder.query<
      GetPlatformStaffResponse,
      void
    >({
      query: () => ({
        url: `${url}/staff`,
        method: "GET",
      }),
      providesTags: ["Platform"],
    }),
    grantPlatformRole: builder.mutation<
      GrantPlatformRoleResponse,
      GrantPlatformRoleRequest
    >({
      query: (body) => ({
        url: `${url}/staff`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Platform"],
    }),
    revokePlatformRole: builder.mutation<
      RevokePlatformRoleResponse,
      string
    >({
      query: (userId) => ({
        url: `${url}/staff/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Platform"],
    }),
  }),
});

export const {
  useGetPlatformTenantsQuery,
  useGetPlatformTenantQuery,
  useGetPlatformStaffQuery,
  useGrantPlatformRoleMutation,
  useRevokePlatformRoleMutation,
} = platformApi;

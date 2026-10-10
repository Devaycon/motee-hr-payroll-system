import api, { API_PREFIX } from "./api";
import type {
  AccessLevelRequest,
  AssignAccessLevelParams,
  AssignAccessLevelResponse,
  ChangeAccessLevelStatusParams,
  ChangeAccessLevelStatusResponse,
  CreateAccessLevelResponse,
  DeleteAccessLevelResponse,
  GetAccessLevelCatalogueResponse,
  GetAccessLevelResponse,
  GetAccessLevelsResponse,
  UnassignAccessLevelParams,
  UnassignAccessLevelResponse,
  UpdateAccessLevelParams,
  UpdateAccessLevelResponse,
} from "@/src/types/access-levels";

const url = `${API_PREFIX}/access-levels`;

export const accessLevelsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAccessLevels: builder.query<
      GetAccessLevelsResponse,
      void
    >({
      query: () => ({
        url,
        method: "GET",
      }),
      providesTags: ["AccessLevels"],
    }),
    createAccessLevel: builder.mutation<
      CreateAccessLevelResponse,
      AccessLevelRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccessLevels", "Users", "CurrentUser"],
    }),
    getAccessLevelCatalogue: builder.query<
      GetAccessLevelCatalogueResponse,
      void
    >({
      query: () => ({
        url: `${url}/catalogue`,
        method: "GET",
      }),
      providesTags: ["AccessLevels"],
    }),
    getAccessLevel: builder.query<
      GetAccessLevelResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["AccessLevels"],
    }),
    updateAccessLevel: builder.mutation<
      UpdateAccessLevelResponse,
      UpdateAccessLevelParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["AccessLevels", "Users", "CurrentUser"],
    }),
    deleteAccessLevel: builder.mutation<
      DeleteAccessLevelResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AccessLevels", "Users", "CurrentUser"],
    }),
    changeAccessLevelStatus: builder.mutation<
      ChangeAccessLevelStatusResponse,
      ChangeAccessLevelStatusParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccessLevels", "Users", "CurrentUser"],
    }),
    assignAccessLevel: builder.mutation<
      AssignAccessLevelResponse,
      AssignAccessLevelParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/holders`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["AccessLevels", "Users", "CurrentUser"],
    }),
    unassignAccessLevel: builder.mutation<
      UnassignAccessLevelResponse,
      UnassignAccessLevelParams
    >({
      query: ({ id, userId }) => ({
        url: `${url}/${id}/holders/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AccessLevels", "Users", "CurrentUser"],
    }),
  }),
});

export const {
  useGetAccessLevelsQuery,
  useCreateAccessLevelMutation,
  useGetAccessLevelCatalogueQuery,
  useGetAccessLevelQuery,
  useUpdateAccessLevelMutation,
  useDeleteAccessLevelMutation,
  useChangeAccessLevelStatusMutation,
  useAssignAccessLevelMutation,
  useUnassignAccessLevelMutation,
} = accessLevelsApi;

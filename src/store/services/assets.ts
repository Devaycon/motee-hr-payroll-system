import api, { API_PREFIX } from "./api";
import type {
  AssignAssetParams,
  AssignAssetResponse,
  ChangeAssetStatusParams,
  ChangeAssetStatusResponse,
  CreateAssetResponse,
  GetAssetHistoryResponse,
  GetAssetResponse,
  GetAssetsParams,
  GetAssetsResponse,
  ReturnAssetParams,
  ReturnAssetResponse,
  UpdateAssetParams,
  UpdateAssetResponse,
} from "@/src/types/assets";
import type { AssetRequest } from "@/src/types/common";

const url = `${API_PREFIX}/assets`;

export const assetsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAssets: builder.query<
      GetAssetsResponse,
      GetAssetsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Assets"],
    }),
    createAsset: builder.mutation<
      CreateAssetResponse,
      AssetRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Assets", "Employees"],
    }),
    getAsset: builder.query<
      GetAssetResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Assets"],
    }),
    updateAsset: builder.mutation<
      UpdateAssetResponse,
      UpdateAssetParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Assets", "Employees"],
    }),
    assignAsset: builder.mutation<
      AssignAssetResponse,
      AssignAssetParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Assets", "Employees"],
    }),
    returnAsset: builder.mutation<
      ReturnAssetResponse,
      ReturnAssetParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/return`,
        method: "POST",
        body: body ?? undefined,
      }),
      invalidatesTags: ["Assets", "Employees"],
    }),
    getAssetHistory: builder.query<
      GetAssetHistoryResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/history`,
        method: "GET",
      }),
      providesTags: ["Assets"],
    }),
    changeAssetStatus: builder.mutation<
      ChangeAssetStatusResponse,
      ChangeAssetStatusParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Assets", "Employees"],
    }),
  }),
});

export const {
  useGetAssetsQuery,
  useCreateAssetMutation,
  useGetAssetQuery,
  useUpdateAssetMutation,
  useAssignAssetMutation,
  useReturnAssetMutation,
  useGetAssetHistoryQuery,
  useChangeAssetStatusMutation,
} = assetsApi;

import api, { API_PREFIX } from "./api";
import type {
  AddPickListOptionResponse,
  DeletePickListOptionResponse,
  GetPickListResponse,
  GetPickListsResponse,
  PickListValueRequest,
  SetDefaultPickListOptionResponse,
  UpdatePickListOptionResponse,
} from "@/src/types/pick-lists";

export const pickListsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/settings/pick-lists
    getPickLists: builder.query<GetPickListsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/settings/pick-lists`,
        method: "GET",
      }),
      providesTags: ["PickLists"],
    }),
    // GET /api/v1/settings/pick-lists/{key}
    getPickList: builder.query<GetPickListResponse, string>({
      query: (key) => ({
        url: `${API_PREFIX}/settings/pick-lists/${key}`,
        method: "GET",
      }),
      providesTags: ["PickLists"],
    }),
    // POST /api/v1/settings/pick-lists/{key}/options
    addPickListOption: builder.mutation<AddPickListOptionResponse, { key: string; body: PickListValueRequest }>({
      query: ({ key, body }) => ({
        url: `${API_PREFIX}/settings/pick-lists/${key}/options`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["PickLists"],
    }),
    // PUT /api/v1/settings/pick-lists/{key}/options/{id}
    updatePickListOption: builder.mutation<UpdatePickListOptionResponse, { key: string; id: string; body: PickListValueRequest }>({
      query: ({ key, id, body }) => ({
        url: `${API_PREFIX}/settings/pick-lists/${key}/options/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["PickLists"],
    }),
    // DELETE /api/v1/settings/pick-lists/{key}/options/{id}
    deletePickListOption: builder.mutation<DeletePickListOptionResponse, { key: string; id: string }>({
      query: ({ key, id }) => ({
        url: `${API_PREFIX}/settings/pick-lists/${key}/options/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PickLists"],
    }),
    // PUT /api/v1/settings/pick-lists/{key}/options/{id}/default
    setDefaultPickListOption: builder.mutation<SetDefaultPickListOptionResponse, { key: string; id: string }>({
      query: ({ key, id }) => ({
        url: `${API_PREFIX}/settings/pick-lists/${key}/options/${id}/default`,
        method: "PUT",
      }),
      invalidatesTags: ["PickLists"],
    }),
  }),
});

export const {
  useGetPickListsQuery,
  useLazyGetPickListsQuery,
  useGetPickListQuery,
  useLazyGetPickListQuery,
  useAddPickListOptionMutation,
  useUpdatePickListOptionMutation,
  useDeletePickListOptionMutation,
  useSetDefaultPickListOptionMutation,
} = pickListsApi;

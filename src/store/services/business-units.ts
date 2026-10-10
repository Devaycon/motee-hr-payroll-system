import api, { API_PREFIX } from "./api";
import type {
  BusinessUnitRequest,
  CreateBusinessUnitResponse,
  DeleteBusinessUnitResponse,
  GetBusinessUnitResponse,
  GetBusinessUnitsResponse,
  UpdateBusinessUnitParams,
  UpdateBusinessUnitResponse,
} from "@/src/types/business-units";

const url = `${API_PREFIX}/business-units`;

export const businessUnitsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBusinessUnits: builder.query<
      GetBusinessUnitsResponse,
      void
    >({
      query: () => ({
        url,
        method: "GET",
      }),
      providesTags: ["BusinessUnits"],
    }),
    createBusinessUnit: builder.mutation<
      CreateBusinessUnitResponse,
      BusinessUnitRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["BusinessUnits", "Departments"],
    }),
    getBusinessUnit: builder.query<
      GetBusinessUnitResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["BusinessUnits"],
    }),
    updateBusinessUnit: builder.mutation<
      UpdateBusinessUnitResponse,
      UpdateBusinessUnitParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["BusinessUnits", "Departments"],
    }),
    deleteBusinessUnit: builder.mutation<
      DeleteBusinessUnitResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["BusinessUnits", "Departments"],
    }),
  }),
});

export const {
  useGetBusinessUnitsQuery,
  useCreateBusinessUnitMutation,
  useGetBusinessUnitQuery,
  useUpdateBusinessUnitMutation,
  useDeleteBusinessUnitMutation,
} = businessUnitsApi;

import api, { API_PREFIX } from "./api";
import type {
  CreateEmploymentTypeResponse,
  DeactivateEmploymentTypeResponse,
  DeleteEmploymentTypeResponse,
  EmploymentTypeRequest,
  GetEmploymentTypeResponse,
  GetEmploymentTypesParams,
  GetEmploymentTypesResponse,
  ReactivateEmploymentTypeResponse,
  UpdateEmploymentTypeResponse,
} from "@/src/types/employment-types";

export const employmentTypesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmploymentTypes: builder.query<
      GetEmploymentTypesResponse,
      GetEmploymentTypesParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/employment-types`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["EmploymentTypes"],
    }),
    createEmploymentType: builder.mutation<
      CreateEmploymentTypeResponse,
      EmploymentTypeRequest
    >({
      query: (body) => ({
        url: `${API_PREFIX}/employment-types`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmploymentTypes", "Employees"],
    }),
    getEmploymentType: builder.query<GetEmploymentTypeResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/employment-types/${arg}`,
        method: "GET",
      }),
      providesTags: ["EmploymentTypes"],
    }),
    updateEmploymentType: builder.mutation<
      UpdateEmploymentTypeResponse,
      { id: string; body: EmploymentTypeRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/employment-types/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["EmploymentTypes", "Employees"],
    }),
    deleteEmploymentType: builder.mutation<
      DeleteEmploymentTypeResponse,
      string
    >({
      query: (arg) => ({
        url: `${API_PREFIX}/employment-types/${arg}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EmploymentTypes", "Employees"],
    }),
    deactivateEmploymentType: builder.mutation<
      DeactivateEmploymentTypeResponse,
      string
    >({
      query: (arg) => ({
        url: `${API_PREFIX}/employment-types/${arg}/deactivate`,
        method: "POST",
      }),
      invalidatesTags: ["EmploymentTypes", "Employees"],
    }),
    reactivateEmploymentType: builder.mutation<
      ReactivateEmploymentTypeResponse,
      string
    >({
      query: (arg) => ({
        url: `${API_PREFIX}/employment-types/${arg}/reactivate`,
        method: "POST",
      }),
      invalidatesTags: ["EmploymentTypes", "Employees"],
    }),
  }),
});

export const {
  useGetEmploymentTypesQuery,
  useLazyGetEmploymentTypesQuery,
  useCreateEmploymentTypeMutation,
  useGetEmploymentTypeQuery,
  useLazyGetEmploymentTypeQuery,
  useUpdateEmploymentTypeMutation,
  useDeleteEmploymentTypeMutation,
  useDeactivateEmploymentTypeMutation,
  useReactivateEmploymentTypeMutation,
} = employmentTypesApi;

import api, { API_PREFIX } from "./api";
import type {
  CreateDepartmentResponse,
  DeleteDepartmentResponse,
  DepartmentRequest,
  GetDepartmentResponse,
  GetDepartmentsResponse,
  UpdateDepartmentParams,
  UpdateDepartmentResponse,
} from "@/src/types/departments";

const url = `${API_PREFIX}/departments`;

export const departmentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<
      GetDepartmentsResponse,
      void
    >({
      query: () => ({
        url,
        method: "GET",
      }),
      providesTags: ["Departments"],
    }),
    createDepartment: builder.mutation<
      CreateDepartmentResponse,
      DepartmentRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Departments", "BusinessUnits", "Branches", "Employees"],
    }),
    getDepartment: builder.query<
      GetDepartmentResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Departments"],
    }),
    updateDepartment: builder.mutation<
      UpdateDepartmentResponse,
      UpdateDepartmentParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Departments", "BusinessUnits", "Branches", "Employees"],
    }),
    deleteDepartment: builder.mutation<
      DeleteDepartmentResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Departments", "BusinessUnits", "Branches", "Employees"],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetDepartmentQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentsApi;

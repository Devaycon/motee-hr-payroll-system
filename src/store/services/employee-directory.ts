import api, { API_PREFIX } from "./api";
import { fetchAllPages } from "./api/paging";
import type { EmployeeListItemDto } from "@/src/types/employees";

export const employeeDirectoryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Every employee the caller can see. Pickers, headcounts and the org views
     * all need the whole list rather than one page of it.
     */
    getEmployeeDirectory: builder.query<EmployeeListItemDto[], void>({
      queryFn: (_arg, _api, _extraOptions, baseQuery) =>
        fetchAllPages<EmployeeListItemDto>(
          baseQuery,
          `${API_PREFIX}/employees`,
          "camel",
        ),
      providesTags: ["Employees"],
    }),
  }),
});

export const { useGetEmployeeDirectoryQuery } = employeeDirectoryApi;

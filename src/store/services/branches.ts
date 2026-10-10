import api, { API_PREFIX } from "./api";
import type {
  BranchRequest,
  CreateBranchResponse,
  DeleteBranchResponse,
  GetBranchResponse,
  GetBranchesResponse,
  UpdateBranchParams,
  UpdateBranchResponse,
} from "@/src/types/branches";

const url = `${API_PREFIX}/branches`;

export const branchesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<
      GetBranchesResponse,
      void
    >({
      query: () => ({
        url,
        method: "GET",
      }),
      providesTags: ["Branches"],
    }),
    createBranch: builder.mutation<
      CreateBranchResponse,
      BranchRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Branches", "Departments", "Employees"],
    }),
    getBranch: builder.query<
      GetBranchResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Branches"],
    }),
    updateBranch: builder.mutation<
      UpdateBranchResponse,
      UpdateBranchParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Branches", "Departments", "Employees"],
    }),
    deleteBranch: builder.mutation<
      DeleteBranchResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Branches", "Departments", "Employees"],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useCreateBranchMutation,
  useGetBranchQuery,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchesApi;

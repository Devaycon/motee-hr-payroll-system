import api, { API_PREFIX } from "./api";
import type {
  CreateExportLinkResponse,
  GetExportJobResponse,
  GetMyExportJobsResponse,
} from "@/src/types/exports";

const url = `${API_PREFIX}/exports`;

export const exportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/exports/mine — the signed-in user’s export jobs
    getMyExportJobs: builder.query<GetMyExportJobsResponse, void>({
      query: () => ({
        url: `${url}/mine`,
        method: "GET",
      }),
      providesTags: ["Exports"],
    }),
    getExportJob: builder.query<
      GetExportJobResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Exports"],
    }),
    createExportLink: builder.mutation<
      CreateExportLinkResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/link`,
        method: "POST",
      }),
    }),
  }),
});

export const {
  useGetMyExportJobsQuery,
  useGetExportJobQuery,
  useCreateExportLinkMutation,
} = exportsApi;

import api, { API_PREFIX } from "./api";
import type {
  CreateExportLinkResponse,
  GetExportJobResponse,
} from "@/src/types/exports";

const url = `${API_PREFIX}/exports`;

export const exportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
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
  useGetExportJobQuery,
  useCreateExportLinkMutation,
} = exportsApi;

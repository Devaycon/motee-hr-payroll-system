import api, { API_PREFIX } from "./api";
import { saveFileResponse, type DownloadedFile } from "./api/download";
import type {
  DeleteFileResponse,
  DownloadFileParams,
  GetFileResponse,
  GetFilesParams,
  GetFilesResponse,
  UploadFileParams,
  UploadFileResponse,
} from "@/src/types/files";

const url = `${API_PREFIX}/files`;

export const filesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadFile: builder.mutation<UploadFileResponse, UploadFileParams>({
      query: ({ file, purpose, ownerId }) => {
        const body = new FormData();
        body.append("file", file);
        body.append("purpose", purpose);
        if (ownerId) body.append("ownerId", ownerId);
        return {
          url,
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["Files"],
    }),
    getFiles: builder.query<GetFilesResponse, GetFilesParams | void>({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Files"],
    }),
    getFile: builder.query<GetFileResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Files"],
    }),
    deleteFile: builder.mutation<DeleteFileResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Files"],
    }),
    downloadFile: builder.mutation<DownloadedFile, DownloadFileParams>({
      query: ({ id, fileName }) => ({
        url: `${url}/${id}/download`,
        method: "GET",
        responseHandler: saveFileResponse(fileName ?? "download"),
      }),
    }),
  }),
});

export const {
  useUploadFileMutation,
  useGetFilesQuery,
  useGetFileQuery,
  useDeleteFileMutation,
  useDownloadFileMutation,
} = filesApi;

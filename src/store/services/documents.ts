import api, { API_PREFIX } from "./api";
import type {
  AcknowledgeMyDocumentResponse,
  AddDocumentVersionResponse,
  AddVersionRequest,
  ArchiveDocumentResponse,
  CreateDocumentFolderResponse,
  CreateDocumentRequest,
  CreateDocumentResponse,
  DeleteDocumentFolderResponse,
  FolderRequest,
  GetDocumentAcknowledgementsResponse,
  GetDocumentFoldersResponse,
  GetDocumentResponse,
  GetDocumentsParams,
  GetDocumentsResponse,
  GetMyDocumentsResponse,
  RenameDocumentFolderResponse,
  RenameFolderRequest,
  RestoreDocumentResponse,
  ShareDocumentRequest,
  ShareDocumentResponse,
  TrashDocumentResponse,
  UnshareDocumentResponse,
  UpdateDocumentRequest,
  UpdateDocumentResponse,
} from "@/src/types/documents";

const url = `${API_PREFIX}/documents`;

export const documentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Self-service ──
    getMyDocuments: builder.query<GetMyDocumentsResponse, void>({
      query: () => ({
        url: `${url}/mine`,
        method: "GET",
      }),
      providesTags: ["Documents"],
    }),
    acknowledgeMyDocument: builder.mutation<
      AcknowledgeMyDocumentResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/mine/${id}/acknowledge`,
        method: "POST",
      }),
      invalidatesTags: ["Documents"],
    }),

    // ── Folders ──
    getDocumentFolders: builder.query<GetDocumentFoldersResponse, void>({
      query: () => ({
        url: `${url}/folders`,
        method: "GET",
      }),
      providesTags: ["DocumentFolders"],
    }),
    createDocumentFolder: builder.mutation<
      CreateDocumentFolderResponse,
      FolderRequest
    >({
      query: (body) => ({
        url: `${url}/folders`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["DocumentFolders"],
    }),
    renameDocumentFolder: builder.mutation<
      RenameDocumentFolderResponse,
      { id: string; body: RenameFolderRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/folders/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["DocumentFolders"],
    }),
    deleteDocumentFolder: builder.mutation<
      DeleteDocumentFolderResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/folders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["DocumentFolders", "Documents"],
    }),

    // ── Documents ──
    getDocuments: builder.query<
      GetDocumentsResponse,
      GetDocumentsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Documents"],
    }),
    createDocument: builder.mutation<
      CreateDocumentResponse,
      CreateDocumentRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Documents", "DocumentFolders"],
    }),
    getDocument: builder.query<GetDocumentResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Documents"],
    }),
    updateDocument: builder.mutation<
      UpdateDocumentResponse,
      { id: string; body: UpdateDocumentRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Documents"],
    }),
    addDocumentVersion: builder.mutation<
      AddDocumentVersionResponse,
      { id: string; body: AddVersionRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/versions`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Documents"],
    }),

    // ── Lifecycle ──
    archiveDocument: builder.mutation<ArchiveDocumentResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/archive`,
        method: "POST",
      }),
      invalidatesTags: ["Documents", "DocumentFolders"],
    }),
    trashDocument: builder.mutation<TrashDocumentResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/trash`,
        method: "POST",
      }),
      invalidatesTags: ["Documents", "DocumentFolders"],
    }),
    restoreDocument: builder.mutation<RestoreDocumentResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["Documents", "DocumentFolders"],
    }),

    // ── Sharing ──
    shareDocument: builder.mutation<
      ShareDocumentResponse,
      { id: string; body: ShareDocumentRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/shares`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Documents"],
    }),
    unshareDocument: builder.mutation<
      UnshareDocumentResponse,
      { id: string; employeeId: string }
    >({
      query: ({ id, employeeId }) => ({
        url: `${url}/${id}/shares/${employeeId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Documents"],
    }),
    getDocumentAcknowledgements: builder.query<
      GetDocumentAcknowledgementsResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/acknowledgements`,
        method: "GET",
      }),
      providesTags: ["Documents"],
    }),
  }),
});

export const {
  useGetMyDocumentsQuery,
  useAcknowledgeMyDocumentMutation,
  useGetDocumentFoldersQuery,
  useCreateDocumentFolderMutation,
  useRenameDocumentFolderMutation,
  useDeleteDocumentFolderMutation,
  useGetDocumentsQuery,
  useCreateDocumentMutation,
  useGetDocumentQuery,
  useUpdateDocumentMutation,
  useAddDocumentVersionMutation,
  useArchiveDocumentMutation,
  useTrashDocumentMutation,
  useRestoreDocumentMutation,
  useShareDocumentMutation,
  useUnshareDocumentMutation,
  useGetDocumentAcknowledgementsQuery,
} = documentsApi;

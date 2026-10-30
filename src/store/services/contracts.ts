import api, { API_PREFIX } from "./api";
import type {
  ActivateContractResponse,
  AddContractNoteResponse,
  ContractNoteRequest,
  ContractRequest,
  CreateContractResponse,
  DeleteContractResponse,
  FileContractRequest,
  FileContractToDocumentsResponse,
  GetContractResponse,
  GetContractsParams,
  GetContractsResponse,
  GetMyContractsResponse,
  SendContractResponse,
  SignContractRequest,
  SignContractResponse,
  SignMyContractResponse,
  TerminateContractRequest,
  TerminateContractResponse,
  UpdateContractResponse,
} from "@/src/types/contracts";

const url = `${API_PREFIX}/contracts`;

export const contractsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Self-service ──
    getMyContracts: builder.query<GetMyContractsResponse, void>({
      query: () => ({
        url: `${url}/mine`,
        method: "GET",
      }),
      providesTags: ["Contracts"],
    }),
    signMyContract: builder.mutation<
      SignMyContractResponse,
      { id: string; body: SignContractRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/mine/${id}/sign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Contracts"],
    }),

    // ── Contracts ──
    getContracts: builder.query<
      GetContractsResponse,
      GetContractsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Contracts"],
    }),
    createContract: builder.mutation<CreateContractResponse, ContractRequest>({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Contracts"],
    }),
    getContract: builder.query<GetContractResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Contracts"],
    }),
    updateContract: builder.mutation<
      UpdateContractResponse,
      { id: string; body: ContractRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Contracts"],
    }),
    deleteContract: builder.mutation<DeleteContractResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Contracts"],
    }),

    // ── Lifecycle ──
    sendContract: builder.mutation<SendContractResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/send`,
        method: "POST",
      }),
      invalidatesTags: ["Contracts"],
    }),
    activateContract: builder.mutation<ActivateContractResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/activate`,
        method: "POST",
      }),
      invalidatesTags: ["Contracts"],
    }),
    terminateContract: builder.mutation<
      TerminateContractResponse,
      { id: string; body: TerminateContractRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/terminate`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Contracts"],
    }),
    signContract: builder.mutation<
      SignContractResponse,
      { id: string; body: SignContractRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/sign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Contracts"],
    }),
    fileContractToDocuments: builder.mutation<
      FileContractToDocumentsResponse,
      { id: string; body: FileContractRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/file-to-documents`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Contracts", "Documents"],
    }),
    addContractNote: builder.mutation<
      AddContractNoteResponse,
      { id: string; body: ContractNoteRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/notes`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Contracts"],
    }),
  }),
});

export const {
  useGetMyContractsQuery,
  useSignMyContractMutation,
  useGetContractsQuery,
  useCreateContractMutation,
  useGetContractQuery,
  useUpdateContractMutation,
  useDeleteContractMutation,
  useSendContractMutation,
  useActivateContractMutation,
  useTerminateContractMutation,
  useSignContractMutation,
  useFileContractToDocumentsMutation,
  useAddContractNoteMutation,
} = contractsApi;

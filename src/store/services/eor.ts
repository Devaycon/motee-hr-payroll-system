import api, { API_PREFIX } from "./api";
import type {
  ComplianceRequest,
  CreateEorInvoiceResponse,
  CreateEorProviderResponse,
  CreateEorWorkerResponse,
  DeleteEorInvoiceResponse,
  DeleteEorProviderResponse,
  DeleteEorWorkerResponse,
  EndEngagementRequest,
  EndEorWorkerResponse,
  EorEngagementRequest,
  EorInvoiceRequest,
  EorProviderRequest,
  GetEorComplianceResponse,
  GetEorInvoicesParams,
  GetEorInvoicesResponse,
  GetEorProviderResponse,
  GetEorProvidersResponse,
  GetEorSummaryResponse,
  GetEorWorkerResponse,
  GetEorWorkersParams,
  GetEorWorkersResponse,
  SettleEorInvoiceResponse,
  SettleInvoiceRequest,
  UpdateEorInvoiceResponse,
  UpdateEorProviderResponse,
  UpdateEorWorkerComplianceResponse,
  UpdateEorWorkerResponse,
} from "@/src/types/eor";

export const eorApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/eor/providers
    getEorProviders: builder.query<GetEorProvidersResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/eor/providers`,
        method: "GET",
      }),
      providesTags: ["Eor"],
    }),
    // POST /api/v1/eor/providers
    createEorProvider: builder.mutation<CreateEorProviderResponse, EorProviderRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/eor/providers`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Eor"],
    }),
    // GET /api/v1/eor/providers/{id}
    getEorProvider: builder.query<GetEorProviderResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/eor/providers/${id}`,
        method: "GET",
      }),
      providesTags: ["Eor"],
    }),
    // PUT /api/v1/eor/providers/{id}
    updateEorProvider: builder.mutation<UpdateEorProviderResponse, { id: string; body: EorProviderRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/eor/providers/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Eor"],
    }),
    // DELETE /api/v1/eor/providers/{id}
    deleteEorProvider: builder.mutation<DeleteEorProviderResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/eor/providers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Eor"],
    }),
    // GET /api/v1/eor/workers
    getEorWorkers: builder.query<GetEorWorkersResponse, GetEorWorkersParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/eor/workers`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Eor"],
    }),
    // POST /api/v1/eor/workers
    createEorWorker: builder.mutation<CreateEorWorkerResponse, EorEngagementRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/eor/workers`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Eor"],
    }),
    // GET /api/v1/eor/workers/{id}
    getEorWorker: builder.query<GetEorWorkerResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/eor/workers/${id}`,
        method: "GET",
      }),
      providesTags: ["Eor"],
    }),
    // PUT /api/v1/eor/workers/{id}
    updateEorWorker: builder.mutation<UpdateEorWorkerResponse, { id: string; body: EorEngagementRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/eor/workers/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Eor"],
    }),
    // DELETE /api/v1/eor/workers/{id}
    deleteEorWorker: builder.mutation<DeleteEorWorkerResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/eor/workers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Eor"],
    }),
    // POST /api/v1/eor/workers/{id}/end
    endEorWorker: builder.mutation<EndEorWorkerResponse, { id: string; body: EndEngagementRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/eor/workers/${id}/end`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Eor"],
    }),
    // GET /api/v1/eor/summary
    getEorSummary: builder.query<GetEorSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/eor/summary`,
        method: "GET",
      }),
      providesTags: ["Eor"],
    }),
    // GET /api/v1/eor/compliance
    getEorCompliance: builder.query<GetEorComplianceResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/eor/compliance`,
        method: "GET",
      }),
      providesTags: ["Eor"],
    }),
    // PUT /api/v1/eor/workers/{id}/compliance/{key}
    updateEorWorkerCompliance: builder.mutation<UpdateEorWorkerComplianceResponse, { id: string; key: string; body: ComplianceRequest }>({
      query: ({ id, key, body }) => ({
        url: `${API_PREFIX}/eor/workers/${id}/compliance/${key}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Eor"],
    }),
    // GET /api/v1/eor/invoices
    getEorInvoices: builder.query<GetEorInvoicesResponse, GetEorInvoicesParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/eor/invoices`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Eor"],
    }),
    // POST /api/v1/eor/invoices
    createEorInvoice: builder.mutation<CreateEorInvoiceResponse, EorInvoiceRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/eor/invoices`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Eor"],
    }),
    // PUT /api/v1/eor/invoices/{id}
    updateEorInvoice: builder.mutation<UpdateEorInvoiceResponse, { id: string; body: EorInvoiceRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/eor/invoices/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Eor"],
    }),
    // DELETE /api/v1/eor/invoices/{id}
    deleteEorInvoice: builder.mutation<DeleteEorInvoiceResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/eor/invoices/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Eor"],
    }),
    // POST /api/v1/eor/invoices/{id}/settle
    settleEorInvoice: builder.mutation<SettleEorInvoiceResponse, { id: string; body: SettleInvoiceRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/eor/invoices/${id}/settle`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Eor"],
    }),
  }),
});

export const {
  useGetEorProvidersQuery,
  useLazyGetEorProvidersQuery,
  useCreateEorProviderMutation,
  useGetEorProviderQuery,
  useLazyGetEorProviderQuery,
  useUpdateEorProviderMutation,
  useDeleteEorProviderMutation,
  useGetEorWorkersQuery,
  useLazyGetEorWorkersQuery,
  useCreateEorWorkerMutation,
  useGetEorWorkerQuery,
  useLazyGetEorWorkerQuery,
  useUpdateEorWorkerMutation,
  useDeleteEorWorkerMutation,
  useEndEorWorkerMutation,
  useGetEorSummaryQuery,
  useLazyGetEorSummaryQuery,
  useGetEorComplianceQuery,
  useLazyGetEorComplianceQuery,
  useUpdateEorWorkerComplianceMutation,
  useGetEorInvoicesQuery,
  useLazyGetEorInvoicesQuery,
  useCreateEorInvoiceMutation,
  useUpdateEorInvoiceMutation,
  useDeleteEorInvoiceMutation,
  useSettleEorInvoiceMutation,
} = eorApi;

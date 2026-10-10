import api, { API_PREFIX } from "./api";
import type {
  ApprovalTemplateRequest,
  CreateApprovalTemplateResponse,
  DeleteApprovalTemplateResponse,
  GetApprovalTemplateCatalogueResponse,
  GetApprovalTemplateResponse,
  GetApprovalTemplatesParams,
  GetApprovalTemplatesResponse,
  UpdateApprovalTemplateParams,
  UpdateApprovalTemplateResponse,
} from "@/src/types/approval-templates";

const url = `${API_PREFIX}/approval-templates`;

export const approvalTemplatesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getApprovalTemplates: builder.query<
      GetApprovalTemplatesResponse,
      GetApprovalTemplatesParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["ApprovalTemplates"],
    }),
    createApprovalTemplate: builder.mutation<
      CreateApprovalTemplateResponse,
      ApprovalTemplateRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ApprovalTemplates", "Approvals"],
    }),
    getApprovalTemplateCatalogue: builder.query<
      GetApprovalTemplateCatalogueResponse,
      void
    >({
      query: () => ({
        url: `${url}/catalogue`,
        method: "GET",
      }),
      providesTags: ["ApprovalTemplates"],
    }),
    getApprovalTemplate: builder.query<
      GetApprovalTemplateResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["ApprovalTemplates"],
    }),
    updateApprovalTemplate: builder.mutation<
      UpdateApprovalTemplateResponse,
      UpdateApprovalTemplateParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ApprovalTemplates", "Approvals"],
    }),
    deleteApprovalTemplate: builder.mutation<
      DeleteApprovalTemplateResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ApprovalTemplates", "Approvals"],
    }),
  }),
});

export const {
  useGetApprovalTemplatesQuery,
  useCreateApprovalTemplateMutation,
  useGetApprovalTemplateCatalogueQuery,
  useGetApprovalTemplateQuery,
  useUpdateApprovalTemplateMutation,
  useDeleteApprovalTemplateMutation,
} = approvalTemplatesApi;

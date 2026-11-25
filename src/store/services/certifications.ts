import api, { API_PREFIX } from "./api";
import type {
  CertificationRequest,
  CreateCertificationResponse,
  DeleteCertificationResponse,
  GetCertificationSummaryParams,
  GetCertificationSummaryResponse,
  GetCertificationsParams,
  GetCertificationsResponse,
  GetMyCertificationsResponse,
  UpdateCertificationResponse,
} from "@/src/types/certifications";

export const certificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/certifications
    getCertifications: builder.query<GetCertificationsResponse, GetCertificationsParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/certifications`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Certifications"],
    }),
    // POST /api/v1/certifications
    createCertification: builder.mutation<CreateCertificationResponse, CertificationRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/certifications`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Certifications"],
    }),
    // GET /api/v1/certifications/summary
    getCertificationSummary: builder.query<GetCertificationSummaryResponse, GetCertificationSummaryParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/certifications/summary`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Certifications"],
    }),
    // GET /api/v1/certifications/mine
    getMyCertifications: builder.query<GetMyCertificationsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/certifications/mine`,
        method: "GET",
      }),
      providesTags: ["Certifications"],
    }),
    // PUT /api/v1/certifications/{id}
    updateCertification: builder.mutation<UpdateCertificationResponse, { id: string; body: CertificationRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/certifications/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Certifications"],
    }),
    // DELETE /api/v1/certifications/{id}
    deleteCertification: builder.mutation<DeleteCertificationResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/certifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Certifications"],
    }),
  }),
});

export const {
  useGetCertificationsQuery,
  useLazyGetCertificationsQuery,
  useCreateCertificationMutation,
  useGetCertificationSummaryQuery,
  useLazyGetCertificationSummaryQuery,
  useGetMyCertificationsQuery,
  useLazyGetMyCertificationsQuery,
  useUpdateCertificationMutation,
  useDeleteCertificationMutation,
} = certificationsApi;

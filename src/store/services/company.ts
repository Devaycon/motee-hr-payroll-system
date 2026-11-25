import api, { API_PREFIX } from "./api";
import type {
  CompanyProfileRequest,
  GetCompanyNoticeResponse,
  GetCompanyOrgChartParams,
  GetCompanyOrgChartResponse,
  GetCompanyResponse,
  GetCompanyVerificationResponse,
  SaveCompanyVerificationResponse,
  SubmitCompanyVerificationResponse,
  UpdateCompanyResponse,
  VerificationDetailsRequest,
  WithdrawCompanyVerificationResponse,
} from "@/src/types/company";

export const companyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/company
    getCompany: builder.query<GetCompanyResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/company`,
        method: "GET",
      }),
      providesTags: ["Company"],
    }),
    // PUT /api/v1/company
    updateCompany: builder.mutation<UpdateCompanyResponse, CompanyProfileRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/company`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    // GET /api/v1/company/org-chart
    getCompanyOrgChart: builder.query<GetCompanyOrgChartResponse, GetCompanyOrgChartParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/company/org-chart`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Company"],
    }),
    // GET /api/v1/company/notice
    getCompanyNotice: builder.query<GetCompanyNoticeResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/company/notice`,
        method: "GET",
      }),
      providesTags: ["Company"],
    }),
    // GET /api/v1/company/verification
    getCompanyVerification: builder.query<GetCompanyVerificationResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/company/verification`,
        method: "GET",
      }),
      providesTags: ["Company"],
    }),
    // PUT /api/v1/company/verification/{kind}
    saveCompanyVerification: builder.mutation<SaveCompanyVerificationResponse, { kind: string; body: VerificationDetailsRequest }>({
      query: ({ kind, body }) => ({
        url: `${API_PREFIX}/company/verification/${kind}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Company"],
    }),
    // POST /api/v1/company/verification/{kind}/submit
    submitCompanyVerification: builder.mutation<SubmitCompanyVerificationResponse, string>({
      query: (kind) => ({
        url: `${API_PREFIX}/company/verification/${kind}/submit`,
        method: "POST",
      }),
      invalidatesTags: ["Company"],
    }),
    // POST /api/v1/company/verification/{kind}/withdraw
    withdrawCompanyVerification: builder.mutation<WithdrawCompanyVerificationResponse, string>({
      query: (kind) => ({
        url: `${API_PREFIX}/company/verification/${kind}/withdraw`,
        method: "POST",
      }),
      invalidatesTags: ["Company"],
    }),
  }),
});

export const {
  useGetCompanyQuery,
  useLazyGetCompanyQuery,
  useUpdateCompanyMutation,
  useGetCompanyOrgChartQuery,
  useLazyGetCompanyOrgChartQuery,
  useGetCompanyNoticeQuery,
  useLazyGetCompanyNoticeQuery,
  useGetCompanyVerificationQuery,
  useLazyGetCompanyVerificationQuery,
  useSaveCompanyVerificationMutation,
  useSubmitCompanyVerificationMutation,
  useWithdrawCompanyVerificationMutation,
} = companyApi;

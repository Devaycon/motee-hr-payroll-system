import api, { API_PREFIX } from "./api";
import type {
  GetPlatformVerificationsResponse,
  ReviewTenantVerificationResponse,
  VerificationReviewRequest,
} from "@/src/types/platform-verifications";

export const platformVerificationsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/platform/verifications
    getPlatformVerifications: builder.query<GetPlatformVerificationsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/platform/verifications`,
        method: "GET",
      }),
      providesTags: ["Platform"],
    }),
    // POST /api/v1/platform/tenants/{tenantId}/verification/{kind}/review
    reviewTenantVerification: builder.mutation<ReviewTenantVerificationResponse, { tenantId: string; kind: string; body: VerificationReviewRequest }>({
      query: ({ tenantId, kind, body }) => ({
        url: `${API_PREFIX}/platform/tenants/${tenantId}/verification/${kind}/review`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Platform"],
    }),
  }),
});

export const {
  useGetPlatformVerificationsQuery,
  useLazyGetPlatformVerificationsQuery,
  useReviewTenantVerificationMutation,
} = platformVerificationsApi;

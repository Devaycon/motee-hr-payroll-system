import api, { API_PREFIX } from "./api";
import type {
  AddOhAdjustmentResponse,
  AdjustmentRequest,
  AdjustmentStageRequest,
  CreateOhReferralResponse,
  DeleteOhAdjustmentResponse,
  DeleteOhReferralResponse,
  GetOhCandidatesResponse,
  GetOhReferralHistoryResponse,
  GetOhReferralResponse,
  GetOhReferralsParams,
  GetOhReferralsResponse,
  GetOhSummaryResponse,
  MoveOhAdjustmentStageResponse,
  MoveOhReferralStageResponse,
  OhReferralRequest,
  OhStageRequest,
  UpdateOhAdjustmentResponse,
  UpdateOhReferralResponse,
} from "@/src/types/occupational-health";

export const occupationalHealthApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/occupational-health
    getOhReferrals: builder.query<GetOhReferralsResponse, GetOhReferralsParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/occupational-health`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["OccupationalHealth"],
    }),
    // POST /api/v1/occupational-health
    createOhReferral: builder.mutation<CreateOhReferralResponse, OhReferralRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/occupational-health`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["OccupationalHealth"],
    }),
    // GET /api/v1/occupational-health/{id}
    getOhReferral: builder.query<GetOhReferralResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/occupational-health/${id}`,
        method: "GET",
      }),
      providesTags: ["OccupationalHealth"],
    }),
    // PUT /api/v1/occupational-health/{id}
    updateOhReferral: builder.mutation<UpdateOhReferralResponse, { id: string; body: OhReferralRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/occupational-health/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["OccupationalHealth"],
    }),
    // DELETE /api/v1/occupational-health/{id}
    deleteOhReferral: builder.mutation<DeleteOhReferralResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/occupational-health/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OccupationalHealth"],
    }),
    // GET /api/v1/occupational-health/summary
    getOhSummary: builder.query<GetOhSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/occupational-health/summary`,
        method: "GET",
      }),
      providesTags: ["OccupationalHealth"],
    }),
    // GET /api/v1/occupational-health/candidates
    getOhCandidates: builder.query<GetOhCandidatesResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/occupational-health/candidates`,
        method: "GET",
      }),
      providesTags: ["OccupationalHealth"],
    }),
    // GET /api/v1/occupational-health/{id}/history
    getOhReferralHistory: builder.query<GetOhReferralHistoryResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/occupational-health/${id}/history`,
        method: "GET",
      }),
      providesTags: ["OccupationalHealth"],
    }),
    // POST /api/v1/occupational-health/{id}/stage
    moveOhReferralStage: builder.mutation<MoveOhReferralStageResponse, { id: string; body: OhStageRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/occupational-health/${id}/stage`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["OccupationalHealth"],
    }),
    // POST /api/v1/occupational-health/{id}/adjustments
    addOhAdjustment: builder.mutation<AddOhAdjustmentResponse, { id: string; body: AdjustmentRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/occupational-health/${id}/adjustments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["OccupationalHealth"],
    }),
    // PUT /api/v1/occupational-health/{id}/adjustments/{adjustmentId}
    updateOhAdjustment: builder.mutation<UpdateOhAdjustmentResponse, { id: string; adjustmentId: string; body: AdjustmentRequest }>({
      query: ({ id, adjustmentId, body }) => ({
        url: `${API_PREFIX}/occupational-health/${id}/adjustments/${adjustmentId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["OccupationalHealth"],
    }),
    // DELETE /api/v1/occupational-health/{id}/adjustments/{adjustmentId}
    deleteOhAdjustment: builder.mutation<DeleteOhAdjustmentResponse, { id: string; adjustmentId: string }>({
      query: ({ id, adjustmentId }) => ({
        url: `${API_PREFIX}/occupational-health/${id}/adjustments/${adjustmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["OccupationalHealth"],
    }),
    // POST /api/v1/occupational-health/{id}/adjustments/{adjustmentId}/stage
    moveOhAdjustmentStage: builder.mutation<MoveOhAdjustmentStageResponse, { id: string; adjustmentId: string; body: AdjustmentStageRequest }>({
      query: ({ id, adjustmentId, body }) => ({
        url: `${API_PREFIX}/occupational-health/${id}/adjustments/${adjustmentId}/stage`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["OccupationalHealth"],
    }),
  }),
});

export const {
  useGetOhReferralsQuery,
  useLazyGetOhReferralsQuery,
  useCreateOhReferralMutation,
  useGetOhReferralQuery,
  useLazyGetOhReferralQuery,
  useUpdateOhReferralMutation,
  useDeleteOhReferralMutation,
  useGetOhSummaryQuery,
  useLazyGetOhSummaryQuery,
  useGetOhCandidatesQuery,
  useLazyGetOhCandidatesQuery,
  useGetOhReferralHistoryQuery,
  useLazyGetOhReferralHistoryQuery,
  useMoveOhReferralStageMutation,
  useAddOhAdjustmentMutation,
  useUpdateOhAdjustmentMutation,
  useDeleteOhAdjustmentMutation,
  useMoveOhAdjustmentStageMutation,
} = occupationalHealthApi;

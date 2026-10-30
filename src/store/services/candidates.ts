import api, { API_PREFIX } from "./api";
import type {
  AddCandidateScorecardResponse,
  AssignCandidateOwnerResponse,
  AssignOwnerRequest,
  CanMoveCandidateParams,
  CanMoveCandidateResponse,
  CandidateRequest,
  CreateCandidateResponse,
  GetCandidateResponse,
  GetCandidatesParams,
  GetCandidatesResponse,
  MakeCandidateOfferResponse,
  MoveCandidateRequest,
  MoveCandidateResponse,
  OfferRequest,
  OfferResponseRequest,
  RejectCandidateRequest,
  RejectCandidateResponse,
  RespondToCandidateOfferResponse,
  RestoreCandidateResponse,
  ScorecardRequest,
  SendCandidateToOnboardingResponse,
  UpdateCandidateResponse,
} from "@/src/types/candidates";

const url = `${API_PREFIX}/candidates`;

export const candidatesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Candidates ──
    getCandidates: builder.query<
      GetCandidatesResponse,
      GetCandidatesParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Candidates"],
    }),
    createCandidate: builder.mutation<
      CreateCandidateResponse,
      CandidateRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Candidates", "Requisitions"],
    }),
    getCandidate: builder.query<GetCandidateResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Candidates"],
    }),
    updateCandidate: builder.mutation<
      UpdateCandidateResponse,
      { id: string; body: CandidateRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Candidates"],
    }),

    // ── Pipeline ──
    canMoveCandidate: builder.query<
      CanMoveCandidateResponse,
      CanMoveCandidateParams
    >({
      query: ({ id, ...params }) => ({
        url: `${url}/${id}/can-move`,
        method: "GET",
        params,
      }),
      providesTags: ["Candidates"],
    }),
    moveCandidate: builder.mutation<
      MoveCandidateResponse,
      { id: string; body: MoveCandidateRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/move`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Candidates", "Requisitions"],
    }),
    rejectCandidate: builder.mutation<
      RejectCandidateResponse,
      { id: string; body: RejectCandidateRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Candidates", "Requisitions"],
    }),
    restoreCandidate: builder.mutation<RestoreCandidateResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["Candidates", "Requisitions"],
    }),
    assignCandidateOwner: builder.mutation<
      AssignCandidateOwnerResponse,
      { id: string; body: AssignOwnerRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/owner`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Candidates"],
    }),

    // ── Scorecards & offers ──
    addCandidateScorecard: builder.mutation<
      AddCandidateScorecardResponse,
      { id: string; body: ScorecardRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/scorecards`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Candidates"],
    }),
    makeCandidateOffer: builder.mutation<
      MakeCandidateOfferResponse,
      { id: string; body: OfferRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/offers`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Candidates"],
    }),
    respondToCandidateOffer: builder.mutation<
      RespondToCandidateOfferResponse,
      { id: string; offerId: string; body: OfferResponseRequest }
    >({
      query: ({ id, offerId, body }) => ({
        url: `${url}/${id}/offers/${offerId}/respond`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Candidates"],
    }),
    sendCandidateToOnboarding: builder.mutation<
      SendCandidateToOnboardingResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/send-to-onboarding`,
        method: "POST",
      }),
      invalidatesTags: ["Candidates", "Onboarding", "Requisitions"],
    }),
  }),
});

export const {
  useGetCandidatesQuery,
  useCreateCandidateMutation,
  useGetCandidateQuery,
  useUpdateCandidateMutation,
  useCanMoveCandidateQuery,
  useMoveCandidateMutation,
  useRejectCandidateMutation,
  useRestoreCandidateMutation,
  useAssignCandidateOwnerMutation,
  useAddCandidateScorecardMutation,
  useMakeCandidateOfferMutation,
  useRespondToCandidateOfferMutation,
  useSendCandidateToOnboardingMutation,
} = candidatesApi;

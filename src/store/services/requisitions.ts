import api, { API_PREFIX } from "./api";
import type {
  CancelRequisitionResponse,
  CloseRequisitionRequest,
  CloseRequisitionResponse,
  CreateRequisitionResponse,
  DeleteRequisitionResponse,
  GetRequisitionResponse,
  GetRequisitionWarningsResponse,
  GetRequisitionsParams,
  GetRequisitionsResponse,
  HoldRequisitionResponse,
  PublishRequisitionResponse,
  RequisitionRequest,
  ResumeRequisitionResponse,
  UpdateRequisitionResponse,
} from "@/src/types/requisitions";

const url = `${API_PREFIX}/requisitions`;

export const requisitionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Requisitions ──
    getRequisitions: builder.query<
      GetRequisitionsResponse,
      GetRequisitionsParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Requisitions"],
    }),
    createRequisition: builder.mutation<
      CreateRequisitionResponse,
      RequisitionRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Requisitions"],
    }),
    getRequisition: builder.query<GetRequisitionResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Requisitions"],
    }),
    updateRequisition: builder.mutation<
      UpdateRequisitionResponse,
      { id: string; body: RequisitionRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Requisitions"],
    }),
    deleteRequisition: builder.mutation<DeleteRequisitionResponse, string>({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Requisitions"],
    }),

    // ── Lifecycle ──
    getRequisitionWarnings: builder.query<
      GetRequisitionWarningsResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/warnings`,
        method: "GET",
      }),
      providesTags: ["Requisitions"],
    }),
    publishRequisition: builder.mutation<PublishRequisitionResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: ["Requisitions"],
    }),
    holdRequisition: builder.mutation<HoldRequisitionResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/hold`,
        method: "POST",
      }),
      invalidatesTags: ["Requisitions"],
    }),
    resumeRequisition: builder.mutation<ResumeRequisitionResponse, string>({
      query: (id) => ({
        url: `${url}/${id}/resume`,
        method: "POST",
      }),
      invalidatesTags: ["Requisitions"],
    }),
    closeRequisition: builder.mutation<
      CloseRequisitionResponse,
      { id: string; body?: CloseRequisitionRequest | null }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/close`,
        method: "POST",
        body: body ?? null,
      }),
      invalidatesTags: ["Requisitions"],
    }),
    cancelRequisition: builder.mutation<
      CancelRequisitionResponse,
      { id: string; body?: CloseRequisitionRequest | null }
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/cancel`,
        method: "POST",
        body: body ?? null,
      }),
      invalidatesTags: ["Requisitions"],
    }),
  }),
});

export const {
  useGetRequisitionsQuery,
  useCreateRequisitionMutation,
  useGetRequisitionQuery,
  useUpdateRequisitionMutation,
  useDeleteRequisitionMutation,
  useGetRequisitionWarningsQuery,
  usePublishRequisitionMutation,
  useHoldRequisitionMutation,
  useResumeRequisitionMutation,
  useCloseRequisitionMutation,
  useCancelRequisitionMutation,
} = requisitionsApi;

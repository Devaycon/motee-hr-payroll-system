import api, { API_PREFIX } from "./api";
import type {
  AssignPositionRequest,
  AssignPositionResponse,
  CreatePositionResponse,
  DeletePositionResponse,
  GetPositionResponse,
  GetPositionsParams,
  GetPositionsResponse,
  GetPositionsSummaryResponse,
  PositionRequest,
  RestorePositionResponse,
  RetirePositionResponse,
  UnassignPositionResponse,
  UpdatePositionResponse,
} from "@/src/types/positions";

export const positionsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPositions: builder.query<
      GetPositionsResponse,
      GetPositionsParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/positions`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Positions"],
    }),
    createPosition: builder.mutation<CreatePositionResponse, PositionRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/positions`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Positions", "Employees"],
    }),
    getPositionsSummary: builder.query<GetPositionsSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/positions/summary`,
        method: "GET",
      }),
      providesTags: ["Positions"],
    }),
    getPosition: builder.query<GetPositionResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/positions/${arg}`,
        method: "GET",
      }),
      providesTags: ["Positions"],
    }),
    updatePosition: builder.mutation<
      UpdatePositionResponse,
      { id: string; body: PositionRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/positions/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Positions", "Employees"],
    }),
    deletePosition: builder.mutation<DeletePositionResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/positions/${arg}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Positions", "Employees"],
    }),
    assignPosition: builder.mutation<
      AssignPositionResponse,
      { id: string; body: AssignPositionRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/positions/${id}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Positions", "Employees"],
    }),
    unassignPosition: builder.mutation<
      UnassignPositionResponse,
      AssignPositionRequest
    >({
      query: (body) => ({
        url: `${API_PREFIX}/positions/unassign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Positions", "Employees"],
    }),
    retirePosition: builder.mutation<RetirePositionResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/positions/${arg}/retire`,
        method: "POST",
      }),
      invalidatesTags: ["Positions", "Employees"],
    }),
    restorePosition: builder.mutation<RestorePositionResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/positions/${arg}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["Positions", "Employees"],
    }),
  }),
});

export const {
  useGetPositionsQuery,
  useLazyGetPositionsQuery,
  useCreatePositionMutation,
  useGetPositionsSummaryQuery,
  useLazyGetPositionsSummaryQuery,
  useGetPositionQuery,
  useLazyGetPositionQuery,
  useUpdatePositionMutation,
  useDeletePositionMutation,
  useAssignPositionMutation,
  useUnassignPositionMutation,
  useRetirePositionMutation,
  useRestorePositionMutation,
} = positionsApi;

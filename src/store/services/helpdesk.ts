import api, { API_PREFIX } from "./api";
import type {
  AssignHelpdeskTicketRequest,
  AssignHelpdeskTicketResponse,
  CreateHelpdeskTicketResponse,
  DeleteHelpdeskTicketResponse,
  GetHelpdeskSummaryResponse,
  GetHelpdeskTicketResponse,
  GetHelpdeskTicketsParams,
  GetHelpdeskTicketsResponse,
  GetMyHelpdeskTicketsResponse,
  ReplyToHelpdeskTicketResponse,
  SetHelpdeskTicketPriorityResponse,
  SetHelpdeskTicketStatusResponse,
  TicketPriorityRequest,
  TicketReplyRequest,
  TicketRequest,
  TicketStatusRequest,
} from "@/src/types/helpdesk";

export const helpdeskApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/helpdesk
    getHelpdeskTickets: builder.query<GetHelpdeskTicketsResponse, GetHelpdeskTicketsParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/helpdesk`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Helpdesk"],
    }),
    // POST /api/v1/helpdesk
    createHelpdeskTicket: builder.mutation<CreateHelpdeskTicketResponse, TicketRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/helpdesk`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Helpdesk"],
    }),
    // GET /api/v1/helpdesk/summary
    getHelpdeskSummary: builder.query<GetHelpdeskSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/helpdesk/summary`,
        method: "GET",
      }),
      providesTags: ["Helpdesk"],
    }),
    // GET /api/v1/helpdesk/mine
    getMyHelpdeskTickets: builder.query<GetMyHelpdeskTicketsResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/helpdesk/mine`,
        method: "GET",
      }),
      providesTags: ["Helpdesk"],
    }),
    // GET /api/v1/helpdesk/{id}
    getHelpdeskTicket: builder.query<GetHelpdeskTicketResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/helpdesk/${id}`,
        method: "GET",
      }),
      providesTags: ["Helpdesk"],
    }),
    // DELETE /api/v1/helpdesk/{id}
    deleteHelpdeskTicket: builder.mutation<DeleteHelpdeskTicketResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/helpdesk/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Helpdesk"],
    }),
    // POST /api/v1/helpdesk/{id}/messages
    replyToHelpdeskTicket: builder.mutation<ReplyToHelpdeskTicketResponse, { id: string; body: TicketReplyRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/helpdesk/${id}/messages`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Helpdesk"],
    }),
    // POST /api/v1/helpdesk/{id}/status
    setHelpdeskTicketStatus: builder.mutation<SetHelpdeskTicketStatusResponse, { id: string; body: TicketStatusRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/helpdesk/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Helpdesk"],
    }),
    // POST /api/v1/helpdesk/{id}/priority
    setHelpdeskTicketPriority: builder.mutation<SetHelpdeskTicketPriorityResponse, { id: string; body: TicketPriorityRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/helpdesk/${id}/priority`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Helpdesk"],
    }),
    // POST /api/v1/helpdesk/{id}/assign
    assignHelpdeskTicket: builder.mutation<AssignHelpdeskTicketResponse, { id: string; body: AssignHelpdeskTicketRequest }>({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/helpdesk/${id}/assign`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Helpdesk"],
    }),
  }),
});

export const {
  useGetHelpdeskTicketsQuery,
  useLazyGetHelpdeskTicketsQuery,
  useCreateHelpdeskTicketMutation,
  useGetHelpdeskSummaryQuery,
  useLazyGetHelpdeskSummaryQuery,
  useGetMyHelpdeskTicketsQuery,
  useLazyGetMyHelpdeskTicketsQuery,
  useGetHelpdeskTicketQuery,
  useLazyGetHelpdeskTicketQuery,
  useDeleteHelpdeskTicketMutation,
  useReplyToHelpdeskTicketMutation,
  useSetHelpdeskTicketStatusMutation,
  useSetHelpdeskTicketPriorityMutation,
  useAssignHelpdeskTicketMutation,
} = helpdeskApi;

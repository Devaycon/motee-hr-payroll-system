import api, { API_PREFIX } from "./api";
import type {
  ApproveChangeRequest,
  ChangeRequestResponse,
  GetChangeRequestsParams,
  GetChangeRequestsResponse,
  GetEmployeeChangeRequestsResponse,
  GetRequestableFieldsResponse,
  RaiseChangeRequest,
  RejectChangeRequest,
} from "@/src/types/change-requests";

const mine = `${API_PREFIX}/employees/me/change-requests`;
const queue = `${API_PREFIX}/change-requests`;

/** Profile change requests: employees raise them, HR approves or rejects. */
export const changeRequestsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── HR ────────────────────────────────────────────────────────────────
    getChangeRequests: builder.query<
      GetChangeRequestsResponse,
      GetChangeRequestsParams | void
    >({
      query: (params) => ({ url: queue, method: "GET", params: params ?? undefined }),
      providesTags: ["ChangeRequests"],
    }),
    getEmployeeChangeRequests: builder.query<GetEmployeeChangeRequestsResponse, string>({
      query: (id) => ({
        url: `${API_PREFIX}/employees/${id}/change-requests`,
        method: "GET",
      }),
      providesTags: ["ChangeRequests"],
    }),
    approveChangeRequest: builder.mutation<
      ChangeRequestResponse,
      { id: string; body?: ApproveChangeRequest }
    >({
      query: ({ id, body }) => ({
        url: `${queue}/${id}/approve`,
        method: "POST",
        body: body ?? {},
      }),
      // Approving writes the change onto the employee record.
      invalidatesTags: ["ChangeRequests", "Employees", "TenantLocale"],
    }),
    rejectChangeRequest: builder.mutation<
      ChangeRequestResponse,
      { id: string; body: RejectChangeRequest }
    >({
      query: ({ id, body }) => ({
        url: `${queue}/${id}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["ChangeRequests"],
    }),

    // ── Self-service ──────────────────────────────────────────────────────
    getMyChangeRequests: builder.query<GetEmployeeChangeRequestsResponse, void>({
      query: () => ({ url: mine, method: "GET" }),
      providesTags: ["ChangeRequests"],
    }),
    getRequestableFields: builder.query<GetRequestableFieldsResponse, void>({
      query: () => ({ url: `${mine}/fields`, method: "GET" }),
      providesTags: ["ChangeRequests"],
    }),
    raiseChangeRequest: builder.mutation<ChangeRequestResponse, RaiseChangeRequest>({
      query: (body) => ({ url: mine, method: "POST", body }),
      invalidatesTags: ["ChangeRequests"],
    }),
    withdrawChangeRequest: builder.mutation<ChangeRequestResponse, string>({
      query: (id) => ({ url: `${mine}/${id}/withdraw`, method: "POST" }),
      invalidatesTags: ["ChangeRequests"],
    }),
  }),
});

export const {
  useGetChangeRequestsQuery,
  useGetEmployeeChangeRequestsQuery,
  useApproveChangeRequestMutation,
  useRejectChangeRequestMutation,
  useGetMyChangeRequestsQuery,
  useGetRequestableFieldsQuery,
  useRaiseChangeRequestMutation,
  useWithdrawChangeRequestMutation,
} = changeRequestsApi;

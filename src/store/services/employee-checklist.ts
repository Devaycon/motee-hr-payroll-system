import api, { API_PREFIX } from "./api";
import type {
  ChecklistCompletionRequest,
  ChecklistItemRequest,
  CompleteChecklistTaskResponse,
  CreateChecklistItemResponse,
  DeleteChecklistItemResponse,
  GetChecklistHiresParams,
  GetChecklistHiresResponse,
  GetChecklistItemsParams,
  GetChecklistItemsResponse,
  GetEmployeeChecklistResponse,
  GetMyChecklistResponse,
  MoveChecklistItemRequest,
  MoveChecklistItemResponse,
  RestoreChecklistItemResponse,
  RetireChecklistItemResponse,
  UncompleteChecklistTaskResponse,
  UpdateChecklistItemResponse,
} from "@/src/types/employee-checklist";

export const employeeChecklistApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getChecklistItems: builder.query<
      GetChecklistItemsResponse,
      GetChecklistItemsParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/employee-checklist/items`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["EmployeeChecklist"],
    }),
    createChecklistItem: builder.mutation<
      CreateChecklistItemResponse,
      ChecklistItemRequest
    >({
      query: (body) => ({
        url: `${API_PREFIX}/employee-checklist/items`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmployeeChecklist"],
    }),
    updateChecklistItem: builder.mutation<
      UpdateChecklistItemResponse,
      { id: string; body: ChecklistItemRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/employee-checklist/items/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["EmployeeChecklist"],
    }),
    deleteChecklistItem: builder.mutation<DeleteChecklistItemResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/employee-checklist/items/${arg}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EmployeeChecklist"],
    }),
    moveChecklistItem: builder.mutation<
      MoveChecklistItemResponse,
      { id: string; body: MoveChecklistItemRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/employee-checklist/items/${id}/move`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmployeeChecklist"],
    }),
    retireChecklistItem: builder.mutation<RetireChecklistItemResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/employee-checklist/items/${arg}/retire`,
        method: "POST",
      }),
      invalidatesTags: ["EmployeeChecklist"],
    }),
    restoreChecklistItem: builder.mutation<
      RestoreChecklistItemResponse,
      string
    >({
      query: (arg) => ({
        url: `${API_PREFIX}/employee-checklist/items/${arg}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["EmployeeChecklist"],
    }),
    getChecklistHires: builder.query<
      GetChecklistHiresResponse,
      GetChecklistHiresParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/employee-checklist/hires`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["EmployeeChecklist"],
    }),
    getMyChecklist: builder.query<GetMyChecklistResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/employee-checklist/me`,
        method: "GET",
      }),
      providesTags: ["EmployeeChecklist"],
    }),
    getEmployeeChecklist: builder.query<GetEmployeeChecklistResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/employee-checklist/employees/${arg}`,
        method: "GET",
      }),
      providesTags: ["EmployeeChecklist"],
    }),
    completeChecklistTask: builder.mutation<
      CompleteChecklistTaskResponse,
      { employeeId: string; itemId: string; body: ChecklistCompletionRequest }
    >({
      query: ({ employeeId, itemId, body }) => ({
        url: `${API_PREFIX}/employee-checklist/employees/${employeeId}/tasks/${itemId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmployeeChecklist"],
    }),
    uncompleteChecklistTask: builder.mutation<
      UncompleteChecklistTaskResponse,
      { employeeId: string; itemId: string }
    >({
      query: ({ employeeId, itemId }) => ({
        url: `${API_PREFIX}/employee-checklist/employees/${employeeId}/tasks/${itemId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EmployeeChecklist"],
    }),
  }),
});

export const {
  useGetChecklistItemsQuery,
  useLazyGetChecklistItemsQuery,
  useCreateChecklistItemMutation,
  useUpdateChecklistItemMutation,
  useDeleteChecklistItemMutation,
  useMoveChecklistItemMutation,
  useRetireChecklistItemMutation,
  useRestoreChecklistItemMutation,
  useGetChecklistHiresQuery,
  useLazyGetChecklistHiresQuery,
  useGetMyChecklistQuery,
  useLazyGetMyChecklistQuery,
  useGetEmployeeChecklistQuery,
  useLazyGetEmployeeChecklistQuery,
  useCompleteChecklistTaskMutation,
  useUncompleteChecklistTaskMutation,
} = employeeChecklistApi;

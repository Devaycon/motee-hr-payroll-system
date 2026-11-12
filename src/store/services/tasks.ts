import api, { API_PREFIX } from "./api";
import type {
  CompleteTaskRequest,
  CompleteTaskResponse,
  CreateTaskResponse,
  DeleteTaskResponse,
  GetTaskResponse,
  GetTasksAssignedByMeParams,
  GetTasksAssignedByMeResponse,
  GetTasksParams,
  GetTasksResponse,
  GetTasksSummaryResponse,
  ReopenTaskResponse,
  ReorderTasksRequest,
  ReorderTasksResponse,
  TaskItemRequest,
  UpdateTaskResponse,
} from "@/src/types/tasks";

export const tasksApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query<GetTasksResponse, GetTasksParams | void>({
      query: (params) => ({
        url: `${API_PREFIX}/tasks`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Tasks"],
    }),
    createTask: builder.mutation<CreateTaskResponse, TaskItemRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/tasks`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tasks"],
    }),
    getTasksAssignedByMe: builder.query<
      GetTasksAssignedByMeResponse,
      GetTasksAssignedByMeParams | void
    >({
      query: (params) => ({
        url: `${API_PREFIX}/tasks/assigned-by-me`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Tasks"],
    }),
    getTasksSummary: builder.query<GetTasksSummaryResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/tasks/summary`,
        method: "GET",
      }),
      providesTags: ["Tasks"],
    }),
    getTask: builder.query<GetTaskResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/tasks/${arg}`,
        method: "GET",
      }),
      providesTags: ["Tasks"],
    }),
    updateTask: builder.mutation<
      UpdateTaskResponse,
      { id: string; body: TaskItemRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/tasks/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Tasks"],
    }),
    deleteTask: builder.mutation<DeleteTaskResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/tasks/${arg}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks"],
    }),
    completeTask: builder.mutation<
      CompleteTaskResponse,
      { id: string; body?: CompleteTaskRequest }
    >({
      query: ({ id, body }) => ({
        url: `${API_PREFIX}/tasks/${id}/complete`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tasks"],
    }),
    reopenTask: builder.mutation<ReopenTaskResponse, string>({
      query: (arg) => ({
        url: `${API_PREFIX}/tasks/${arg}/complete`,
        method: "DELETE",
      }),
      invalidatesTags: ["Tasks"],
    }),
    reorderTasks: builder.mutation<ReorderTasksResponse, ReorderTasksRequest>({
      query: (body) => ({
        url: `${API_PREFIX}/tasks/reorder`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tasks"],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useLazyGetTasksQuery,
  useCreateTaskMutation,
  useGetTasksAssignedByMeQuery,
  useLazyGetTasksAssignedByMeQuery,
  useGetTasksSummaryQuery,
  useLazyGetTasksSummaryQuery,
  useGetTaskQuery,
  useLazyGetTaskQuery,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCompleteTaskMutation,
  useReopenTaskMutation,
  useReorderTasksMutation,
} = tasksApi;

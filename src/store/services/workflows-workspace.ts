import api, { API_PREFIX } from "./api";
import { fetchAllPages } from "./api/paging";
import type { WorkflowDto, WorkflowRowDto } from "@/src/types/workflows";
import type { RunDto, RunRowDto } from "@/src/types/workflow-runs";
import type { ApiResponse } from "@/src/types/api";

/**
 * The workflow builder and My Work show each workflow's tasks and each run's
 * task list, which the list endpoints do not carry: these read the list, then
 * each item's detail.
 */
export const workflowsWorkspaceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getWorkflowsWithTasks: builder.query<WorkflowDto[], void>({
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const rows = await fetchAllPages<WorkflowRowDto>(baseQuery, `${API_PREFIX}/workflows`, "pascal");
        if ("error" in rows) return { error: rows.error };
        const details = await Promise.all(
          rows.data.map(async (row) => {
            const res = await baseQuery({ url: `${API_PREFIX}/workflows/${row.id}`, method: "GET" });
            return res.error ? null : (res.data as ApiResponse<WorkflowDto>).data;
          }),
        );
        return { data: details.filter((d): d is WorkflowDto => !!d) };
      },
      providesTags: ["Workflows"],
    }),
    getRunsWithTasks: builder.query<RunDto[], void>({
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const rows = await fetchAllPages<RunRowDto>(baseQuery, `${API_PREFIX}/workflow-runs`, "pascal");
        if ("error" in rows) return { error: rows.error };
        const details = await Promise.all(
          rows.data.map(async (row) => {
            const res = await baseQuery({ url: `${API_PREFIX}/workflow-runs/${row.id}`, method: "GET" });
            return res.error ? null : (res.data as ApiResponse<RunDto>).data;
          }),
        );
        return { data: details.filter((d): d is RunDto => !!d) };
      },
      providesTags: ["WorkflowRuns"],
    }),
  }),
});

export const { useGetWorkflowsWithTasksQuery, useGetRunsWithTasksQuery } = workflowsWorkspaceApi;

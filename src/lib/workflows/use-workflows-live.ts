"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { replaceFromApi as replaceWorkflows } from "@/src/lib/stores/workflows-slice";
import { replaceFromApi as replaceRuns } from "@/src/lib/stores/workflow-runs-slice";
import {
  useGetRunsWithTasksQuery,
  useGetWorkflowsWithTasksQuery,
} from "@/src/store/services/workflows-workspace";
import { runFromApi, workflowFromApi } from "./api-mapping";

/**
 * Signed in: mirrors workflow templates (`/workflows`) and runs
 * (`/workflow-runs`) into the stores the builder, the run views and My Work
 * read. Writes go out through `workflows-api-listener`; the demo run engine
 * (which starts runs from local events) stands down, as the server starts
 * runs itself.
 */
export function useWorkflowsLive(): boolean {
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);
  const workflows = useGetWorkflowsWithTasksQuery(undefined, { skip: !live });
  const runs = useGetRunsWithTasksQuery(undefined, { skip: !live });
  useEffect(() => {
    if (live && workflows.data) dispatch(replaceWorkflows(workflows.data.map(workflowFromApi)));
  }, [live, workflows.data, dispatch]);
  useEffect(() => {
    if (live && runs.data) dispatch(replaceRuns({ country, runs: runs.data.map(runFromApi) }));
  }, [live, runs.data, country, dispatch]);
  return live;
}

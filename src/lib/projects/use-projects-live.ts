"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { useIsLive } from "@/src/lib/live/use-is-live";
import { replaceFromApi } from "@/src/lib/stores/projects-slice";
import { useGetProjectWorkspaceQuery } from "@/src/store/services/projects-workspace";
import {
  documentFromApi,
  goLiveFromApi,
  projectFromApi,
  riskFromApi,
  timeFromApi,
} from "./api-mapping";

/**
 * Signed in: mirrors every project (with tasks, milestones, team, risks,
 * hours, documents and go-live checklist) into the projects store the
 * screens read. Writes go out through `projects-api-listener`.
 */
export function useProjectsLive(): boolean {
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const q = useGetProjectWorkspaceQuery(undefined, { skip: !live });
  useEffect(() => {
    if (!live || !q.data) return;
    dispatch(
      replaceFromApi({
        projects: q.data.projects.map(projectFromApi),
        timesheets: q.data.time.map(timeFromApi),
        risks: q.data.risks.map(riskFromApi),
        documents: q.data.documents.map(documentFromApi),
        goLiveChecklists: q.data.goLive.map(goLiveFromApi),
      }),
    );
  }, [live, q.data, dispatch]);
  return live;
}

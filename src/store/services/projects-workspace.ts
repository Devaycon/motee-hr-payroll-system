import api, { API_PREFIX } from "./api";
import { fetchAllPages } from "./api/paging";
import type {
  GoLiveChecklistDto,
  ProjectDocumentDto,
  ProjectDto,
  ProjectRiskDto,
  ProjectRowDto,
  TimeEntryDto,
} from "@/src/types/projects";
import type { ApiResponse, PagedResult } from "@/src/types/api";

/** Everything the projects screens show, for every project, in one read. */
export interface ProjectWorkspaceDto {
  projects: ProjectDto[];
  risks: ProjectRiskDto[];
  time: TimeEntryDto[];
  documents: ProjectDocumentDto[];
  goLive: GoLiveChecklistDto[];
}

/**
 * The projects list shows each project's tasks, team, risks and hours, so the
 * register alone is not enough: this reads the register, then each project's
 * detail, risks, time entries, documents and go-live checklist.
 */
export const projectsWorkspaceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjectWorkspace: builder.query<ProjectWorkspaceDto, void>({
      queryFn: async (_arg, _api, _extra, baseQuery) => {
        const rows = await fetchAllPages<ProjectRowDto>(baseQuery, `${API_PREFIX}/projects`, "pascal");
        if ("error" in rows) return { error: rows.error };
        const out: ProjectWorkspaceDto = { projects: [], risks: [], time: [], documents: [], goLive: [] };
        const get = async <T,>(url: string): Promise<T | undefined> => {
          const res = await baseQuery({ url, method: "GET" });
          return res.error ? undefined : (res.data as ApiResponse<T>).data;
        };
        for (const row of rows.data ?? []) {
          const base = `${API_PREFIX}/projects/${row.id}`;
          const [detail, risks, time, docs, goLive] = await Promise.all([
            get<ProjectDto>(base),
            get<ProjectRiskDto[]>(`${base}/risks`),
            get<PagedResult<TimeEntryDto>>(`${base}/time?PageSize=500`),
            get<ProjectDocumentDto[]>(`${base}/documents`),
            get<GoLiveChecklistDto>(`${base}/go-live`),
          ]);
          if (detail) out.projects.push(detail);
          out.risks.push(...(risks ?? []));
          out.time.push(...(time?.items ?? []));
          out.documents.push(...(docs ?? []));
          if (goLive) out.goLive.push(goLive);
        }
        return { data: out };
      },
      providesTags: ["Projects"],
    }),
  }),
});

export const { useGetProjectWorkspaceQuery } = projectsWorkspaceApi;

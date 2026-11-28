import api, { API_PREFIX } from "./api";
import type {
  ExportReportResponse,
  GetReportDatasetsResponse,
  ReportExportRequest,
  ReportRunRequest,
  ReportTableDto,
  RunReportResponse,
} from "@/src/types/reports";

const url = `${API_PREFIX}/reports`;

/** The most rows the Reports screens hold in the browser for one dataset. */
const MAX_ROWS = 5000;
/** The server clamps `pageSize` to 200 (backend answer, 28 Nov). */
const PAGE_SIZE = 200;

export const reportsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/reports/datasets — what you can report on, with its columns
    getReportDatasets: builder.query<GetReportDatasetsResponse, void>({
      query: () => ({ url: `${url}/datasets`, method: "GET" }),
      providesTags: ["ReportDatasets"],
    }),
    // POST /api/v1/reports/run — one page of a dataset
    runReport: builder.query<RunReportResponse, ReportRunRequest>({
      query: (body) => ({ url: `${url}/run`, method: "POST", body }),
      providesTags: ["ReportDatasets"],
    }),
    /**
     * Every row of a dataset (up to MAX_ROWS), read page by page from
     * POST /reports/run, so the report screens can search, filter and export
     * in the browser the way they always have.
     */
    runFullReport: builder.query<ReportTableDto, Omit<ReportRunRequest, "page" | "pageSize" | "skip">>({
      async queryFn(arg, _api, _extra, baseQuery) {
        let table: ReportTableDto | null = null;
        const items: Record<string, string | null>[] = [];
        for (let page = 1; items.length < MAX_ROWS; page++) {
          const res = await baseQuery({
            url: `${url}/run`,
            method: "POST",
            body: { ...arg, page, pageSize: PAGE_SIZE },
          });
          if (res.error) return { error: res.error };
          const data = (res.data as RunReportResponse).data;
          table ??= data;
          items.push(...data.rows.items);
          // Stop on the server's total, not the page size asked for.
          if (items.length >= data.rows.totalItems || data.rows.items.length === 0) break;
        }
        return {
          data: {
            ...table!,
            rows: { ...table!.rows, items, page: 1, pageSize: items.length },
          },
        };
      },
      providesTags: ["ReportDatasets"],
    }),
    // POST /api/v1/reports/export — starts an export job (see exportsApi)
    exportReport: builder.mutation<ExportReportResponse, ReportExportRequest>({
      query: (body) => ({ url: `${url}/export`, method: "POST", body }),
      invalidatesTags: ["Exports"],
    }),
  }),
});

export const {
  useGetReportDatasetsQuery,
  useRunReportQuery,
  useRunFullReportQuery,
  useExportReportMutation,
} = reportsApi;

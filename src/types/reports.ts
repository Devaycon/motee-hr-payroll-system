import type { ApiResponse, PagedResult } from "./api";
import type { ExportJobDto } from "./common";

export type ReportColumnKind = "text" | "number" | "date" | "boolean";

export interface ReportColumnDto {
  key: string;
  header: string;
  kind: ReportColumnKind;
  filterable: boolean;
  /** The module the column needs; the server leaves out what you can't see. */
  requiresModule?: string | null;
}

export interface ReportDatasetDto {
  key: string;
  label: string;
  group: string;
  columns: ReportColumnDto[];
  recordCount: number;
}

export interface ReportRunRequest {
  dataset: string;
  columns?: string[] | null;
  filters?: Record<string, string> | null;
  page?: number;
  pageSize?: number;
  skip?: number;
}

export interface ReportExportRequest {
  dataset: string;
  columns?: string[] | null;
  filters?: Record<string, string> | null;
}

export interface ReportTableDto {
  dataset: string;
  label: string;
  columns: ReportColumnDto[];
  /**
   * Every cell is a string or null (empty): dates ISO, numbers as strings,
   * booleans "true"/"false", enums PascalCase (`FullTime`).
   */
  rows: PagedResult<Record<string, string | null>>;
  asOf: string;
}

// GET /api/v1/reports/datasets
export type GetReportDatasetsResponse = ApiResponse<ReportDatasetDto[]>;
// POST /api/v1/reports/run
export type RunReportResponse = ApiResponse<ReportTableDto>;
// POST /api/v1/reports/export
export type ExportReportResponse = ApiResponse<ExportJobDto>;

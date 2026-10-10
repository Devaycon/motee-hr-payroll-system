import type { ApiResponse } from "./api";
import type { ExportJobDto } from "./common";

export interface ExportLink {
  url: string;
  fileName: string;
  linkExpiresAt: string;
}

export type GetExportJobResponse = ApiResponse<ExportJobDto>;

export type CreateExportLinkResponse = ApiResponse<ExportLink>;

/**
 * Stable business code, decoupled from the HTTP status. The generic ones mirror
 * HTTP; the 1000 range carries outcomes HTTP has no code for.
 */
export type ApiResponseCode =
  | "00"
  | "01"
  | "400"
  | "401"
  | "403"
  | "404"
  | "409"
  | "410"
  | "413"
  | "429"
  | "500"
  | "1001"
  | "1002"
  | "1003"
  | "1004"
  | "1005";

/** The wrapper every Motee API response comes back in. */
export interface ApiResponse<T = null> {
  responseCode: ApiResponseCode;
  success: boolean;
  /** Safe to show a user. Present on every failure. */
  message: string | null;
  data: T;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages?: number;
  hasNextPage?: boolean;
}

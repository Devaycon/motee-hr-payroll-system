import type {
  BaseQueryApi,
  FetchArgs,
  FetchBaseQueryError,
  QueryReturnValue,
} from "@reduxjs/toolkit/query";
import type { ApiResponse, PagedResult } from "@/src/types/api";

type BaseQuery = (
  arg: string | FetchArgs,
) =>
  | QueryReturnValue<unknown, FetchBaseQueryError, unknown>
  | PromiseLike<QueryReturnValue<unknown, FetchBaseQueryError, unknown>>;

/** The API spells its paging parameters two ways depending on the endpoint. */
export type PagingStyle = "camel" | "pascal";

const PAGE_SIZE = 100;
// A safety stop, not a business limit: 200 pages is 20,000 records.
const MAX_PAGES = 200;

/**
 * Walks every page of a paged list and returns the rows as one array. The
 * screens were built around whole collections (client-side search, counts,
 * grouping), so list endpoints are read in full rather than a page at a time.
 */
export async function fetchAllPages<T>(
  baseQuery: BaseQuery,
  url: string,
  style: PagingStyle,
  params: Record<string, unknown> = {},
): Promise<{ data: T[] } | { error: FetchBaseQueryError }> {
  const [pageKey, sizeKey] =
    style === "camel" ? ["page", "pageSize"] : ["Page", "PageSize"];
  const all: T[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const result = await baseQuery({
      url,
      method: "GET",
      params: { ...params, [pageKey]: page, [sizeKey]: PAGE_SIZE },
    });
    if (result.error) return { error: result.error };

    const body = (result.data as ApiResponse<PagedResult<T>> | undefined)?.data;
    all.push(...(body?.items ?? []));
    if (!body?.hasNextPage || !body.items.length) break;
  }

  return { data: all };
}

export type { BaseQueryApi };

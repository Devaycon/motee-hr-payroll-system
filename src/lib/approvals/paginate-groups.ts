export interface PagedSections<G extends { chains: unknown[] }> {
  totalItems: number;
  totalPages: number;
  /** The requested page, clamped into range. */
  currentPage: number;
  /** 0-based index of the first item on this page, in the flattened list. */
  start: number;
  /** 0-based, exclusive. */
  end: number;
  /** This page's items, regrouped under the group they belong to. */
  sections: { group: G; chains: G["chains"][number][] }[];
}

/**
 * Pages across a list of groups as if it were one flat list, so a group with
 * many items carries on to the next page instead of forcing a page break. Each
 * page's slice comes back regrouped, so the caller can still render a heading
 * per group. Empty groups are dropped from a page.
 */
export function paginateGroups<G extends { chains: unknown[] }>(
  groups: G[],
  page: number,
  pageSize: number,
): PagedSections<G> {
  const totalItems = groups.reduce((n, g) => n + g.chains.length, 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, totalItems);

  const sections: PagedSections<G>["sections"] = [];
  let seen = 0;
  for (const group of groups) {
    const before = seen;
    seen += group.chains.length;
    const from = Math.max(0, start - before);
    const to = Math.min(group.chains.length, end - before);
    if (to > from) sections.push({ group, chains: group.chains.slice(from, to) });
  }
  return { totalItems, totalPages, currentPage, start, end, sections };
}

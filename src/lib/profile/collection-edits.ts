import type { CollectionEditsState, CollectionRecord } from "@/src/lib/stores/collection-edits-slice";

/**
 * Layer session edits over a base collection: per-id patches applied, then
 * added records appended. No removals (create + edit only).
 */
export function applyCollection<T>(
  base: T[],
  key: string,
  state: Pick<CollectionEditsState, "added" | "edits">,
  idField = "id",
): T[] {
  const edits = state.edits[key];
  const patched = edits
    ? base.map((r) => {
        const id = (r as Record<string, unknown>)[idField] as string | undefined;
        return id && edits[id] ? ({ ...r, ...edits[id] } as T) : r;
      })
    : base;
  const added = (state.added[key] ?? []) as unknown as T[];
  return added.length ? [...added, ...patched] : patched;
}

export type { CollectionRecord };

import type { CollectionEditsState, CollectionRecord } from "@/src/lib/stores/collection-edits-slice";

/**
 * Layer session edits over a base collection: removed records tombstoned,
 * per-id patches applied, then added records appended.
 */
export function applyCollection<T>(
  base: T[],
  key: string,
  state: Pick<CollectionEditsState, "added" | "edits"> &
    Partial<Pick<CollectionEditsState, "removed">>,
  idField = "id",
): T[] {
  const removed = new Set(state.removed?.[key] ?? []);
  const getId = (r: T) =>
    (r as Record<string, unknown>)[idField] as string | undefined;
  const edits = state.edits[key];
  const patched = base
    .filter((r) => {
      const id = getId(r);
      return !(id && removed.has(id));
    })
    .map((r) => {
      if (!edits) return r;
      const id = getId(r);
      return id && edits[id] ? ({ ...r, ...edits[id] } as T) : r;
    });
  const added = ((state.added[key] ?? []) as unknown as T[]).filter((r) => {
    const id = getId(r);
    return !(id && removed.has(id));
  });
  return added.length ? [...added, ...patched] : patched;
}

export type { CollectionRecord };

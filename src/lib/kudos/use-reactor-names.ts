"use client";

import { useCallback, useState } from "react";
import { isServerId, useIsLive, useMyEmployeeId } from "@/src/lib/live/use-is-live";
import { useLazyGetKudosReactorsQuery } from "@/src/store/services/kudos";
import type { ReactionType, ReactorDto } from "@/src/types/kudos";

/**
 * Who reacted to a kudos post (GET /kudos/{id}/reactions), for the hover
 * tooltip on a reaction chip. A post's reactors are fetched the first time one
 * of its chips is hovered, so the feed makes no extra calls up front.
 * Signed out (or for a demo post) `titleFor` returns undefined.
 */
export function useReactorNames() {
  const live = useIsLive();
  const me = useMyEmployeeId();
  const [fetchReactors] = useLazyGetKudosReactorsQuery();
  const [byPost, setByPost] = useState<Record<string, ReactorDto[]>>({});

  const load = useCallback(
    (postId: string) => {
      if (!live || !isServerId(postId) || byPost[postId]) return;
      void fetchReactors(postId)
        .unwrap()
        .then((res) => setByPost((prev) => ({ ...prev, [postId]: res.data ?? [] })))
        .catch(() => undefined);
    },
    [live, fetchReactors, byPost],
  );

  /** Drop a post’s names (after the viewer reacts) so the next hover re-reads them. */
  const forget = useCallback((postId: string) => {
    setByPost((prev) => {
      if (!(postId in prev)) return prev;
      const next = { ...prev };
      delete next[postId];
      return next;
    });
  }, []);

  const titleFor = useCallback(
    (postId: string, type: ReactionType): string | undefined => {
      const reactors = byPost[postId];
      if (!reactors) return undefined;
      const names = reactors
        .filter((r) => r.type === type)
        .map((r) => (me && r.employeeId === me ? "You" : r.name));
      return names.length > 0 ? names.join(", ") : undefined;
    },
    [byPost, me],
  );

  return { load, forget, titleFor };
}

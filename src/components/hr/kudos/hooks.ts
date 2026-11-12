"use client";

import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  kudosPostFromApi,
  kudosToApi,
  leaderboardFromApi,
  myReactionsFrom,
} from "@/src/lib/kudos/api-mapping";
import { useLiveDepartments } from "@/src/lib/hooks/use-live-departments";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  KudosLeaderboardEntry,
  KudosPost,
  NewKudos,
  ReactionType,
} from "@/src/lib/types/kudos";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useGetAllKudosQuery } from "@/src/store/services/collections";
import {
  useCommentOnKudosMutation,
  useCreateKudosMutation,
  useDeleteKudosCommentMutation,
  useDeleteKudosMutation,
  useGetKudosLeaderboardQuery,
  useGetKudosSummaryQuery,
  useGetMyKudosQuery,
  usePinKudosMutation,
  useReactToKudosMutation,
  useUnpinKudosMutation,
} from "@/src/store/services/kudos";
import type { KudosTally } from "@/src/types/kudos";

interface KudosData {
  posts: KudosPost[];
  leaderboard: KudosLeaderboardEntry[];
  myReactions: Record<string, ReactionType | null>;
  /** Moderation rights per post, as the server decides them. */
  canRemove: Record<string, boolean>;
}

export function useKudos() {
  const feed = useGetAllKudosQuery();
  const board = useGetKudosLeaderboardQuery({ take: 10 });
  const data = useMemo<KudosData | null>(() => {
    if (!feed.data) return null;
    return {
      posts: feed.data.map(kudosPostFromApi),
      leaderboard: leaderboardFromApi(board.data?.data ?? []),
      myReactions: myReactionsFrom(feed.data),
      canRemove: Object.fromEntries(feed.data.map((d) => [d.id, d.canRemove])),
    };
  }, [feed.data, board.data]);
  return {
    data,
    loading: feed.isLoading,
    error: feed.error ? getApiErrorMessage(feed.error) : null,
  };
}

/** Company-wide tallies for the KPI cards. */
export function useKudosSummary(): KudosTally | null {
  return useGetKudosSummaryQuery().data?.data ?? null;
}

/** The signed-in employee's own kudos: received, sent, and their streak. */
export function useMyKudos() {
  const { data } = useGetMyKudosQuery();
  return useMemo(() => {
    const me = data?.data;
    if (!me) return null;
    return {
      received: me.received.map(kudosPostFromApi),
      sent: me.sent.map(kudosPostFromApi),
      receivedCount: me.receivedCount,
      sentCount: me.sentCount,
      streak: me.streak,
    };
  }, [data]);
}

export function useKudosActions(posts: KudosPost[]) {
  const employees = useAppSelector((s) => s.locale.data?.employees);
  const { idByName } = useLiveDepartments();
  const [createKudos] = useCreateKudosMutation();
  const [deleteKudos] = useDeleteKudosMutation();
  const [react] = useReactToKudosMutation();
  const [comment] = useCommentOnKudosMutation();
  const [deleteComment] = useDeleteKudosCommentMutation();
  const [pin] = usePinKudosMutation();
  const [unpin] = useUnpinKudosMutation();

  /** Resolves true once the server has accepted the kudos. */
  const send = useCallback(
    async (form: NewKudos): Promise<boolean> => {
      const individual =
        !form.recipientType || form.recipientType === "individual";
      const employeeId = individual
        ? employees?.find((e) => e.fullName === form.recipientName)?.id
        : undefined;
      const departmentId = individual
        ? undefined
        : idByName.get(form.recipientName);
      if (individual ? !employeeId : !departmentId) {
        toast.error(`"${form.recipientName}" is not on the company directory`);
        return false;
      }
      try {
        await createKudos(kudosToApi(form, { employeeId, departmentId })).unwrap();
        toast.success(`Kudos sent to ${form.recipientName}! 🌟`);
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not send the kudos."));
        return false;
      }
    },
    [employees, idByName, createKudos],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteKudos(id).unwrap();
        toast.success("Kudos deleted");
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not delete the kudos."));
      }
    },
    [deleteKudos],
  );

  /** The server toggles: the same reaction again takes it back. */
  const toggleReaction = useCallback(
    async (id: string, type: ReactionType) => {
      try {
        await react({ id, body: { type } }).unwrap();
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not save your reaction."));
      }
    },
    [react],
  );

  const addComment = useCallback(
    async (id: string, message: string) => {
      try {
        await comment({ id, body: { message } }).unwrap();
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not post the comment."));
      }
    },
    [comment],
  );

  /** Not on the approved feed yet; kept for when they are. */
  const removeComment = useCallback(
    (id: string, commentId: string) => deleteComment({ id, commentId }).unwrap(),
    [deleteComment],
  );
  const togglePin = useCallback(
    (id: string) => {
      const post = posts.find((p) => p.id === id);
      return (post?.isPinned ? unpin(id) : pin(id)).unwrap();
    },
    [posts, pin, unpin],
  );

  return { send, remove, toggleReaction, addComment, removeComment, togglePin };
}

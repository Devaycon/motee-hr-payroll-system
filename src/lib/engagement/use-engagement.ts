"use client";

/** Live reads and writes for the community feed and suggestions. */
import { useMemo } from "react";
import { isServerId, useIsLive, useLiveSender } from "@/src/lib/live/use-is-live";
import {
  postFromApi,
  postToRequest,
  suggestionFromApi,
  suggestionStatusToApi,
  suggestionToRequest,
} from "./api-mapping";
import {
  useGetAllCommunityPostsQuery,
  useGetAllSuggestionsQuery,
} from "@/src/store/services/collections";
import {
  useCommentOnCommunityPostMutation,
  useCreateCommunityPostMutation,
  useDeleteCommunityPostMutation,
  useLikeCommunityPostMutation,
  usePinCommunityPostMutation,
  useUnpinCommunityPostMutation,
  useVoteOnCommunityPollMutation,
} from "@/src/store/services/community";
import {
  useCommentOnSuggestionMutation,
  useCreateSuggestionMutation,
  useFeatureSuggestionMutation,
  useSetSuggestionPriorityMutation,
  useSetSuggestionResponseMutation,
  useSetSuggestionStatusMutation,
  useUnFeatureSuggestionMutation,
  useUpvoteSuggestionMutation,
} from "@/src/store/services/suggestions";
import type { CommunityPost, NewPost } from "@/src/lib/types/community";
import type {
  NewSuggestion,
  Suggestion,
  SuggestionPriority,
  SuggestionStatus,
} from "@/src/lib/types/suggestions";

const DONE = Promise.resolve(true);

/** The feed from the API; `posts` is null signed out or until it answers. */
export function useLiveCommunityPosts(me: string): { live: boolean; posts: CommunityPost[] | null } {
  const live = useIsLive();
  const q = useGetAllCommunityPostsQuery(undefined, { skip: !live });
  const posts = useMemo(() => (q.data ? q.data.map((p) => postFromApi(p, me)) : null), [q.data, me]);
  return { live, posts };
}

export function useCommunityActions() {
  const live = useIsLive();
  const send = useLiveSender(["Community"]);
  const [create] = useCreateCommunityPostMutation();
  const [remove] = useDeleteCommunityPostMutation();
  const [pin] = usePinCommunityPostMutation();
  const [unpin] = useUnpinCommunityPostMutation();
  const [like] = useLikeCommunityPostMutation();
  const [comment] = useCommentOnCommunityPostMutation();
  const [vote] = useVoteOnCommunityPollMutation();

  return useMemo(() => {
    const on = (id: string) => live && isServerId(id);
    return {
      live,
      create: (p: NewPost) =>
        live ? send(() => create(postToRequest(p)).unwrap(), "Could not publish the post.") : DONE,
      remove: (id: string) =>
        on(id) ? send(() => remove(id).unwrap(), "Could not delete the post.") : DONE,
      /** `pinned` is the state after the toggle. */
      pin: (id: string, pinned: boolean) =>
        on(id)
          ? send(() => (pinned ? pin(id) : unpin(id)).unwrap(), "Could not change the pin.")
          : DONE,
      /** The server toggles the viewer's like. */
      like: (id: string) => (on(id) ? send(() => like(id).unwrap(), "Could not like the post.") : DONE),
      comment: (id: string, message: string) =>
        on(id)
          ? send(() => comment({ id, body: { message } }).unwrap(), "Could not add the comment.")
          : DONE,
      vote: (id: string, optionId: string) =>
        on(id) && isServerId(optionId)
          ? send(() => vote({ id, body: { optionId } }).unwrap(), "Could not record your vote.")
          : DONE,
    };
  }, [live, send, create, remove, pin, unpin, like, comment, vote]);
}

/** Every suggestion from the API; null signed out or until it answers. */
export function useLiveSuggestions(me: string): { live: boolean; data: Suggestion[] | null } {
  const live = useIsLive();
  const q = useGetAllSuggestionsQuery(undefined, { skip: !live });
  const data = useMemo(
    () => (q.data ? q.data.map((s) => suggestionFromApi(s, me)) : null),
    [q.data, me],
  );
  return { live, data };
}

export function useSuggestionActions() {
  const live = useIsLive();
  const send = useLiveSender(["Suggestions"]);
  const [create] = useCreateSuggestionMutation();
  const [upvote] = useUpvoteSuggestionMutation();
  const [setStatus] = useSetSuggestionStatusMutation();
  const [setPriority] = useSetSuggestionPriorityMutation();
  const [setResponse] = useSetSuggestionResponseMutation();
  const [feature] = useFeatureSuggestionMutation();
  const [unfeature] = useUnFeatureSuggestionMutation();
  const [comment] = useCommentOnSuggestionMutation();

  return useMemo(() => {
    const on = (id: string) => live && isServerId(id);
    return {
      live,
      create: (s: Pick<NewSuggestion, "title" | "description" | "category" | "isAnonymous">) =>
        live
          ? send(() => create(suggestionToRequest(s)).unwrap(), "Could not submit the suggestion.")
          : DONE,
      /** The server toggles the viewer's upvote. */
      upvote: (id: string) =>
        on(id) ? send(() => upvote(id).unwrap(), "Could not record your upvote.") : DONE,
      status: (id: string, status: SuggestionStatus) =>
        on(id)
          ? send(
              () => setStatus({ id, body: { status: suggestionStatusToApi(status) } }).unwrap(),
              "Could not change the status.",
            )
          : DONE,
      priority: (id: string, priority: SuggestionPriority) =>
        on(id)
          ? send(() => setPriority({ id, body: { priority } }).unwrap(), "Could not change the priority.")
          : DONE,
      response: (id: string, body: { adminResponse?: string; implementationNotes?: string }) =>
        on(id)
          ? send(() => setResponse({ id, body }).unwrap(), "Could not save the response.")
          : DONE,
      featured: (id: string, isFeatured: boolean) =>
        on(id)
          ? send(
              () => (isFeatured ? feature(id) : unfeature(id)).unwrap(),
              "Could not change the featured flag.",
            )
          : DONE,
      comment: (id: string, message: string) =>
        on(id)
          ? send(() => comment({ id, body: { message } }).unwrap(), "Could not add the comment.")
          : DONE,
    };
  }, [live, send, create, upvote, setStatus, setPriority, setResponse, feature, unfeature, comment]);
}

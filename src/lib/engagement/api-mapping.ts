/**
 * Community feed and suggestions: API ↔ screen types.
 *
 * The screens count likes and votes as lists of names and check "did I"
 * by looking for their own marker in the list. The API sends counts plus a
 * "mine" flag, so the lists are rebuilt as anonymous placeholders with the
 * viewer's marker in place of their own entry.
 */
import type {
  CelebrationKind as ApiCelebration,
  PostDto,
  PostRequest,
} from "@/src/types/community";
import type {
  SuggestionDto,
  SuggestionRequest,
  SuggestionStatus as ApiSuggestionStatus,
} from "@/src/types/suggestions";
import type {
  CelebrationKind,
  CommunityPost,
  NewPost,
} from "@/src/lib/types/community";
import type {
  NewSuggestion,
  Suggestion,
  SuggestionStatus,
} from "@/src/lib/types/suggestions";
import { initials } from "@/src/lib/helpdesk/api-mapping";

/** `count` entries, the viewer's marker included when `mine`. */
export function markerList(count: number, mine: boolean, me: string): string[] {
  const others = Math.max(0, count - (mine ? 1 : 0));
  const list = Array.from({ length: others }, (_, i) => `·${i}`);
  return mine ? [...list, me] : list;
}

const CELEBRATION_FROM_API: Record<ApiCelebration, CelebrationKind> = {
  birthday: "birthday",
  anniversary: "anniversary",
  newHire: "new_hire",
  promotion: "promotion",
};

export function postFromApi(dto: PostDto, me: string): CommunityPost {
  const author = dto.authorName ?? "Someone";
  return {
    id: dto.id,
    type: dto.postType,
    authorName: author,
    authorInitials: initials(author),
    authorDept: dto.authorDepartmentName ?? "",
    content: dto.content,
    isPinned: dto.isPinned,
    likes: markerList(dto.likes, dto.hasMyLike, me),
    comments: dto.comments.map((c) => ({
      id: c.id,
      authorName: c.authorName ?? "Someone",
      authorInitials: initials(c.authorName),
      authorDept: c.authorDepartmentName ?? "",
      message: c.message,
      createdAt: c.createdAt,
    })),
    createdAt: dto.createdAt,
    eventDate: dto.eventOn ?? undefined,
    eventLocation: dto.eventLocation ?? undefined,
    pollQuestion: dto.pollQuestion ?? undefined,
    pollOptions: dto.pollOptions.length
      ? [...dto.pollOptions]
          .sort((a, b) => a.sequence - b.sequence)
          .map((o) => ({
            id: o.id,
            label: o.label,
            votes: markerList(o.votes, dto.myVoteOptionId === o.id, me),
          }))
      : undefined,
    celebrationKind: dto.celebrationKind ? CELEBRATION_FROM_API[dto.celebrationKind] : undefined,
    celebrationPersonId: dto.celebrationPersonId ?? undefined,
    celebrationPerson: dto.celebrationPersonName ?? undefined,
    celebrationDetail: dto.celebrationDetail ?? undefined,
  };
}

export function postToRequest(p: NewPost): PostRequest {
  const kind = p.celebrationKind as CelebrationKind | undefined;
  const apiKind = kind
    ? ((Object.entries(CELEBRATION_FROM_API).find(([, v]) => v === kind)?.[0] ??
        undefined) as ApiCelebration | undefined)
    : undefined;
  return {
    postType: p.type,
    content: p.content,
    eventOn: p.eventDate || null,
    eventLocation: p.eventLocation || null,
    pollQuestion: p.pollQuestion || null,
    pollOptions: p.pollOptions?.filter((o) => o.trim()) ?? null,
    ...(apiKind ? { celebrationKind: apiKind } : {}),
    celebrationPersonId: p.celebrationPersonId || null,
    celebrationDetail: p.celebrationDetail || null,
  };
}

// ── Suggestions ──

const SUGGESTION_STATUS_FROM_API: Record<ApiSuggestionStatus, SuggestionStatus> = {
  submitted: "submitted",
  underReview: "under_review",
  accepted: "accepted",
  inProgress: "in_progress",
  implemented: "implemented",
  declined: "declined",
};

export const suggestionStatusFromApi = (s: ApiSuggestionStatus): SuggestionStatus =>
  SUGGESTION_STATUS_FROM_API[s] ?? "submitted";
export const suggestionStatusToApi = (s: SuggestionStatus): ApiSuggestionStatus =>
  (Object.entries(SUGGESTION_STATUS_FROM_API).find(([, v]) => v === s)?.[0] ??
    "submitted") as ApiSuggestionStatus;

export function suggestionFromApi(dto: SuggestionDto, me: string): Suggestion {
  const name = dto.isAnonymous ? undefined : (dto.submitterName ?? undefined);
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    status: suggestionStatusFromApi(dto.status),
    priority: dto.priority,
    isAnonymous: dto.isAnonymous,
    submitterName: name,
    // The employee page finds "mine" by the viewer's own initials.
    submitterInitials: dto.isMine ? me : name ? initials(name) : undefined,
    submitterDept: dto.isAnonymous ? undefined : (dto.submitterDepartmentName ?? undefined),
    upvotes: dto.upvotes,
    upvotedBy: dto.hasMyVote ? [me] : [],
    comments: dto.comments.map((c) => ({
      id: c.id,
      authorName: c.authorName ?? "Someone",
      authorInitials: initials(c.authorName),
      authorDept: c.authorDepartmentName ?? "",
      message: c.message,
      createdAt: c.createdAt,
      isAdmin: c.isOfficial,
    })),
    adminResponse: dto.adminResponse ?? undefined,
    implementationNotes: dto.implementationNotes ?? undefined,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    resolvedAt: dto.resolvedOn ?? undefined,
    isFeatured: dto.isFeatured,
    isTrending: dto.isTrending,
  };
}

export function suggestionToRequest(s: Pick<NewSuggestion, "title" | "description" | "category" | "isAnonymous">): SuggestionRequest {
  return {
    title: s.title,
    description: s.description,
    category: s.category,
    isAnonymous: s.isAnonymous,
  };
}

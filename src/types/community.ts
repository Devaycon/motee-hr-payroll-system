import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type CelebrationKind =
  "birthday" | "anniversary" | "newHire" | "promotion";

export interface FeedTally {
  posts: number;
  reactions: number;
  comments: number;
  pollVotes: number;
  members: number;
}

export interface PollOptionDto {
  id: string;
  label: string;
  votes: number;
  share?: number | null;
  sequence: number;
}

export interface PollVoteRequest {
  optionId: string;
}

export interface PostCommentDto {
  id: string;
  authorEmployeeId: string;
  authorName?: string | null;
  authorDepartmentName?: string | null;
  message: string;
  canRemove: boolean;
  createdAt: string;
}

export interface PostCommentRequest {
  message: string;
}

export interface PostDto {
  id: string;
  postType: PostType;
  authorEmployeeId: string;
  authorName?: string | null;
  authorDepartmentName?: string | null;
  content: string;
  isPinned: boolean;
  eventOn?: string | null;
  eventLocation?: string | null;
  pollQuestion?: string | null;
  pollOptions: PollOptionDto[];
  pollVotes: number;
  myVoteOptionId?: string | null;
  celebrationKind?: CelebrationKind;
  celebrationPersonId?: string | null;
  celebrationPersonName?: string | null;
  celebrationDetail?: string | null;
  likes: number;
  hasMyLike: boolean;
  comments: PostCommentDto[];
  canManage: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostRequest {
  postType?: PostType;
  content: string;
  eventOn?: string | null;
  eventLocation?: string | null;
  pollQuestion?: string | null;
  pollOptions?: string[] | null;
  celebrationKind?: CelebrationKind;
  celebrationPersonId?: string | null;
  celebrationDetail?: string | null;
}

export type PostType =
  "update" | "shoutout" | "event" | "poll" | "milestone";

// ── Per-endpoint request/response shapes ──

// GET /api/v1/community
export type GetCommunityPostsResponse = ApiResponse<PagedResult<PostDto>>;
export interface GetCommunityPostsParams {
  PostType?: PostType;
  AuthorEmployeeId?: string;
  PinnedOnly?: boolean;
  UpcomingEventsOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/community
export type CreateCommunityPostResponse = ApiResponse<PostDto>;

// GET /api/v1/community/summary
export type GetCommunitySummaryResponse = ApiResponse<FeedTally>;

// GET /api/v1/community/{id}
export type GetCommunityPostResponse = ApiResponse<PostDto>;

// PUT /api/v1/community/{id}
export type UpdateCommunityPostResponse = ApiResponse<PostDto>;

// DELETE /api/v1/community/{id}
export type DeleteCommunityPostResponse = ApiResponse<unknown | null>;

// POST /api/v1/community/{id}/pin
export type PinCommunityPostResponse = ApiResponse<PostDto>;

// DELETE /api/v1/community/{id}/pin
export type UnpinCommunityPostResponse = ApiResponse<PostDto>;

// POST /api/v1/community/{id}/like
export type LikeCommunityPostResponse = ApiResponse<PostDto>;

// POST /api/v1/community/{id}/comments
export type CommentOnCommunityPostResponse = ApiResponse<PostDto>;

// DELETE /api/v1/community/{id}/comments/{commentId}
export type DeleteCommunityCommentResponse = ApiResponse<PostDto>;

// POST /api/v1/community/{id}/poll-votes
export type VoteOnCommunityPollResponse = ApiResponse<PostDto>;


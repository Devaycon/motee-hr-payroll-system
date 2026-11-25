import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type SuggestionCategory =
  "culture" | "process" | "benefits" | "tools" | "wellbeing" | "management" | "other";

export interface SuggestionCommentDto {
  id: string;
  authorEmployeeId: string;
  authorName?: string | null;
  authorDepartmentName?: string | null;
  message: string;
  isOfficial: boolean;
  canRemove: boolean;
  createdAt: string;
}

export interface SuggestionCommentRequest {
  message: string;
}

export interface SuggestionDto {
  id: string;
  title: string;
  description: string;
  category: SuggestionCategory;
  status: SuggestionStatus;
  priority: SuggestionPriority;
  isAnonymous: boolean;
  submitterEmployeeId?: string | null;
  submitterName?: string | null;
  submitterDepartmentName?: string | null;
  isMine: boolean;
  adminResponse?: string | null;
  implementationNotes?: string | null;
  isFeatured: boolean;
  isTrending: boolean;
  upvotes: number;
  hasMyVote: boolean;
  isResolved: boolean;
  resolvedOn?: string | null;
  comments: SuggestionCommentDto[];
  createdAt: string;
  updatedAt: string;
}

export type SuggestionPriority =
  "low" | "medium" | "high";

export interface SuggestionPriorityRequest {
  priority: SuggestionPriority;
}

export interface SuggestionRequest {
  title: string;
  description: string;
  category?: SuggestionCategory;
  isAnonymous?: boolean;
}

export interface SuggestionResponseRequest {
  adminResponse?: string | null;
  implementationNotes?: string | null;
}

export type SuggestionSort =
  "mostUpvoted" | "mostRecent" | "oldest";

export type SuggestionStatus =
  "submitted" | "underReview" | "accepted" | "inProgress" | "implemented" | "declined";

export interface SuggestionStatusRequest {
  status: SuggestionStatus;
}

export interface SuggestionTally {
  total: number;
  implemented: number;
  underReview: number;
  declined: number;
  averageUpvotes: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/suggestions
export type GetSuggestionsResponse = ApiResponse<PagedResult<SuggestionDto>>;
export interface GetSuggestionsParams {
  Status?: SuggestionStatus;
  Category?: SuggestionCategory;
  Priority?: SuggestionPriority;
  FeaturedOnly?: boolean;
  TrendingOnly?: boolean;
  UnderReviewOnly?: boolean;
  Sort?: SuggestionSort;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/suggestions
export type CreateSuggestionResponse = ApiResponse<SuggestionDto>;

// GET /api/v1/suggestions/summary
export type GetSuggestionSummaryResponse = ApiResponse<SuggestionTally>;

// GET /api/v1/suggestions/mine
export type GetMySuggestionsResponse = ApiResponse<SuggestionDto[]>;

// GET /api/v1/suggestions/{id}
export type GetSuggestionResponse = ApiResponse<SuggestionDto>;

// PUT /api/v1/suggestions/{id}/status
export type SetSuggestionStatusResponse = ApiResponse<SuggestionDto>;

// PUT /api/v1/suggestions/{id}/priority
export type SetSuggestionPriorityResponse = ApiResponse<SuggestionDto>;

// PUT /api/v1/suggestions/{id}/response
export type SetSuggestionResponseResponse = ApiResponse<SuggestionDto>;

// POST /api/v1/suggestions/{id}/feature
export type FeatureSuggestionResponse = ApiResponse<SuggestionDto>;

// DELETE /api/v1/suggestions/{id}/feature
export type UnFeatureSuggestionResponse = ApiResponse<SuggestionDto>;

// POST /api/v1/suggestions/{id}/upvote
export type UpvoteSuggestionResponse = ApiResponse<SuggestionDto>;

// POST /api/v1/suggestions/{id}/comments
export type CommentOnSuggestionResponse = ApiResponse<SuggestionDto>;

// DELETE /api/v1/suggestions/{id}/comments/{commentId}
export type DeleteSuggestionCommentResponse = ApiResponse<SuggestionDto>;


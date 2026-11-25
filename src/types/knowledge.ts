import type { ApiResponse, PagedResult } from "./api";

// Generated from the Motee OpenAPI spec; adjust by hand if the spec changes.

export type ArticleCategory =
  "onboarding" | "hrPolicies" | "payroll" | "benefits" | "compliance" | "tools" | "general";

export interface ArticleCategoryCount {
  category: ArticleCategory;
  count: number;
}

export type ArticleStatus =
  "draft" | "published" | "archived";

export interface ArticleStatusRequest {
  status: ArticleStatus;
}

export type ArticleVote =
  "helpful" | "notHelpful";

export interface ArticleVoteRequest {
  vote: ArticleVote;
}

export interface KnowledgeArticleDto {
  id: string;
  title: string;
  summary?: string | null;
  body: string;
  category: ArticleCategory;
  status: ArticleStatus;
  authorEmployeeId: string;
  authorName?: string | null;
  tags: string[];
  isFeatured: boolean;
  publishedOn?: string | null;
  views: number;
  readers: number;
  haveIRead: boolean;
  helpfulVotes: number;
  notHelpfulVotes: number;
  helpfulPercent?: number | null;
  myVote?: ArticleVote;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeArticleRequest {
  title: string;
  summary?: string | null;
  body: string;
  category?: ArticleCategory;
  status?: ArticleStatus;
  tags?: string[] | null;
  isFeatured?: boolean;
}

export interface KnowledgeListDto {
  articles: PagedResult<KnowledgeArticleDto>;
  categoryCounts: ArticleCategoryCount[];
}

export interface KnowledgeTally {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  totalViews: number;
  totalReaders: number;
}

// ── Per-endpoint request/response shapes ──

// GET /api/v1/knowledge
export type GetKnowledgeArticlesResponse = ApiResponse<KnowledgeListDto>;
export interface GetKnowledgeArticlesParams {
  Status?: ArticleStatus;
  Category?: ArticleCategory;
  Tag?: string;
  FeaturedOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// POST /api/v1/knowledge
export type CreateKnowledgeArticleResponse = ApiResponse<KnowledgeArticleDto>;

// GET /api/v1/knowledge/published
export type GetPublishedKnowledgeArticlesResponse = ApiResponse<KnowledgeListDto>;
export interface GetPublishedKnowledgeArticlesParams {
  Status?: ArticleStatus;
  Category?: ArticleCategory;
  Tag?: string;
  FeaturedOnly?: boolean;
  Search?: string;
  Page?: number;
  PageSize?: number;
  Skip?: number;
}

// GET /api/v1/knowledge/summary
export type GetKnowledgeSummaryResponse = ApiResponse<KnowledgeTally>;

// GET /api/v1/knowledge/{id}
export type GetKnowledgeArticleResponse = ApiResponse<KnowledgeArticleDto>;

// PUT /api/v1/knowledge/{id}
export type UpdateKnowledgeArticleResponse = ApiResponse<KnowledgeArticleDto>;

// DELETE /api/v1/knowledge/{id}
export type DeleteKnowledgeArticleResponse = ApiResponse<unknown | null>;

// POST /api/v1/knowledge/{id}/status
export type SetKnowledgeArticleStatusResponse = ApiResponse<KnowledgeArticleDto>;

// POST /api/v1/knowledge/{id}/feature
export type FeatureKnowledgeArticleResponse = ApiResponse<KnowledgeArticleDto>;

// DELETE /api/v1/knowledge/{id}/feature
export type UnfeatureKnowledgeArticleResponse = ApiResponse<KnowledgeArticleDto>;

// POST /api/v1/knowledge/{id}/read
export type MarkKnowledgeArticleReadResponse = ApiResponse<KnowledgeArticleDto>;

// POST /api/v1/knowledge/{id}/feedback
export type SendKnowledgeArticleFeedbackResponse = ApiResponse<KnowledgeArticleDto>;

// DELETE /api/v1/knowledge/{id}/feedback
export type ClearKnowledgeArticleFeedbackResponse = ApiResponse<KnowledgeArticleDto>;


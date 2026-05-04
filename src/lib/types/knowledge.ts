export type ArticleCategory =
  | "onboarding"
  | "hr_policies"
  | "payroll"
  | "benefits"
  | "compliance"
  | "tools"
  | "general";

export type ArticleStatus = "published" | "draft" | "archived";

export interface KnowledgeArticle {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  body?: string;
  category: ArticleCategory;
  status: ArticleStatus;
  authorName: string;
  authorInitials: string;
  tags: string[];
  views: number;
  helpful?: number;
  helpfulVotes?: number;
  notHelpfulVotes?: number;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface NewArticle {
  title: string;
  summary?: string;
  content?: string;
  body?: string;
  category: ArticleCategory;
  status: ArticleStatus;
  tags: string[];
  isFeatured?: boolean;
}


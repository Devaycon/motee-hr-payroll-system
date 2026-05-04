export type SuggestionStatus =
  | "submitted"
  | "under_review"
  | "accepted"
  | "in_progress"
  | "implemented"
  | "declined";

export type SuggestionCategory =
  | "culture"
  | "process"
  | "benefits"
  | "tools"
  | "wellbeing"
  | "management"
  | "other";

export type SuggestionPriority = "low" | "medium" | "high";

export type SuggestionSortOrder = "most_upvoted" | "most_recent" | "oldest";

export interface SuggestionComment {
  id: string;
  authorName: string;
  authorInitials: string;
  authorDept: string;
  message: string;
  createdAt: string;
  isAdmin: boolean;
}

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: SuggestionCategory;
  status: SuggestionStatus;
  priority: SuggestionPriority;
  isAnonymous: boolean;
  submitterName?: string;
  submitterInitials?: string;
  submitterDept?: string;
  upvotes: number;
  upvotedBy: string[];
  comments: SuggestionComment[];
  adminResponse?: string;
  implementationNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  isFeatured: boolean;
  isTrending: boolean;
}

export interface NewSuggestion {
  title: string;
  description: string;
  category: SuggestionCategory;
  isAnonymous: boolean;
  submitterName?: string;
  submitterInitials?: string;
  submitterDept?: string;
}

export interface SuggestionStats {
  total: number;
  implemented: number;
  underReview: number;
  avgUpvotes: number;
}


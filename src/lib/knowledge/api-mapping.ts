import type {
  ArticleCategory as ApiCategory,
  KnowledgeArticleDto,
  KnowledgeArticleRequest,
} from "@/src/types/knowledge";
import type {
  ArticleCategory,
  KnowledgeArticle,
  NewArticle,
} from "@/src/lib/types/knowledge";
import { initials } from "@/src/lib/helpdesk/api-mapping";

export const categoryFromApi = (c: ApiCategory): ArticleCategory =>
  c === "hrPolicies" ? "hr_policies" : c;
export const categoryToApi = (c: ArticleCategory): ApiCategory =>
  c === "hr_policies" ? "hrPolicies" : c;

export function articleFromApi(dto: KnowledgeArticleDto): KnowledgeArticle {
  const author = dto.authorName ?? "HR";
  return {
    id: dto.id,
    title: dto.title,
    summary: dto.summary ?? undefined,
    content: dto.body,
    body: dto.body,
    category: categoryFromApi(dto.category),
    status: dto.status,
    authorName: author,
    authorInitials: initials(author),
    tags: dto.tags,
    views: dto.views,
    helpful: dto.helpfulPercent ?? undefined,
    helpfulVotes: dto.helpfulVotes,
    notHelpfulVotes: dto.notHelpfulVotes,
    isFeatured: dto.isFeatured,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    publishedAt: dto.publishedOn ?? undefined,
  };
}

export function articleToRequest(a: NewArticle): KnowledgeArticleRequest {
  return {
    title: a.title,
    summary: a.summary ?? null,
    body: a.body ?? a.content ?? "",
    category: categoryToApi(a.category),
    status: a.status,
    tags: a.tags,
    isFeatured: a.isFeatured ?? false,
  };
}

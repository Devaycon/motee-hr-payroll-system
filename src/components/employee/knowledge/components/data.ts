export {
  ARTICLES,
  ARTICLE_CATEGORY_CONFIG,
  ARTICLE_CATEGORY_OPTIONS,
} from "@/src/data/knowledge-demo";

export type {
  KnowledgeArticle,
  ArticleCategory,
} from "@/src/lib/types/knowledge";

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

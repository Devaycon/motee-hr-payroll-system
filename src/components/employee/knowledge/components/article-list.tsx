import { Card, CardContent } from "@/src/components/ui/card";
import { ArticleRow } from "./article-row";
import type { KnowledgeArticle } from "./data";

interface ArticleListProps {
  articles: KnowledgeArticle[];
  bookmarks: Set<string>;
  emptyMessage?: string;
  onOpen: (a: KnowledgeArticle) => void;
  onBookmark: (id: string) => void;
}

export function ArticleList({
  articles,
  bookmarks,
  emptyMessage = "No articles found.",
  onOpen,
  onBookmark,
}: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {articles.map((a) => (
        <ArticleRow
          key={a.id}
          article={a}
          bookmarked={bookmarks.has(a.id)}
          onOpen={() => onOpen(a)}
          onBookmark={() => onBookmark(a.id)}
        />
      ))}
    </div>
  );
}

import { Card, CardContent } from "@/src/components/ui/card";
import {
  ARTICLES,
  ARTICLE_CATEGORY_CONFIG,
  ARTICLE_CATEGORY_OPTIONS,
} from "./data";
import type { ArticleCategory } from "./data";

interface CategoryStatCardsProps {
  publishedArticles: ReturnType<typeof ARTICLES.filter>;
  onSelect: (cat: ArticleCategory) => void;
}

export function CategoryStatCards({
  publishedArticles,
  onSelect,
}: CategoryStatCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
      {ARTICLE_CATEGORY_OPTIONS.map(({ value, label }) => {
        const cfg = ARTICLE_CATEGORY_CONFIG[value];
        const count = publishedArticles.filter(
          (a) => a.category === value,
        ).length;
        if (count === 0) return null;
        return (
          <Card
            key={value}
            className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${cfg.border}`}
            onClick={() => onSelect(value)}
          >
            <CardContent className="p-4">
              <p className={`text-lg font-semibold ${cfg.color}`}>{label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                article{count !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

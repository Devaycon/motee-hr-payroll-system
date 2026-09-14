import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

export interface BreakdownNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

/** Pill row linking to a report's other deep-dive breakdowns. */
export function BreakdownNav({
  reportId,
  items,
  activeId,
  title = "Deep-dive breakdowns",
}: {
  reportId: string;
  items: BreakdownNavItem[];
  activeId?: string;
  title?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          return (
            <Link
              key={item.id}
              href={`/operations/analytics/${reportId}/${item.id}`}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

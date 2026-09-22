"use client";

import { cn } from "@/src/lib/utils";
import type {
  LensDimension,
  LensDimensionMeta,
} from "@/src/lib/workforce-lens/group";

/**
 * "Group by" chips. Every option stays visible and wraps on narrow screens,
 * so nothing hides behind a "More" menu.
 */
export function DimensionPicker({
  dimensions,
  value,
  onChange,
}: {
  dimensions: LensDimensionMeta[];
  value: LensDimension;
  onChange: (next: LensDimension) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Group by
      </span>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Group by">
        {dimensions.map((d) => {
          const active = d.key === value;
          return (
            <button
              key={d.key}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(d.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-[#FE8F44] bg-[#FE8F44] text-white shadow-xs"
                  : "border-border bg-card text-foreground/70 hover:border-[#FE8F44]/60 hover:text-foreground",
              )}
            >
              {d.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

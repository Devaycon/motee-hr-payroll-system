import { Star } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

export function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "w-3.5 h-3.5",
            s <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export function ProgressBar({
  value,
  color = "#4361ee",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-semibold tabular-nums text-foreground w-7 text-right">
        {value}%
      </span>
    </div>
  );
}


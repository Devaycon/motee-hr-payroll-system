import { Check, TriangleAlert, Circle } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { LifecycleExample } from "../guide-data";
import { STAGE_COLOR_CLASSES, type LifecycleStageColor } from "../data";

const CHECKLIST_ICON = {
  done: <Check className="size-3.5 text-emerald-500" />,
  warning: <TriangleAlert className="size-3.5 text-amber-500" />,
  pending: <Circle className="size-2.5 text-muted-foreground/50" />,
};

/** A worked example from the client's own document — a concrete illustration, not another abstraction. */
export function ExampleBlock({
  example,
  color,
}: {
  example: LifecycleExample;
  color: LifecycleStageColor;
}) {
  const colors = STAGE_COLOR_CLASSES[color];

  if (example.kind === "checklist") {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{example.title}</p>
          {example.subtitle && (
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", colors.bg, colors.text)}>
              {example.subtitle}
            </span>
          )}
        </div>
        <ul className="mt-3 space-y-1.5">
          {example.items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-xs">
              {CHECKLIST_ICON[item.state]}
              <span
                className={cn(
                  item.state === "done" && "text-muted-foreground line-through",
                  item.state === "warning" && "font-medium text-amber-600 dark:text-amber-400",
                  item.state === "pending" && "text-foreground",
                )}
              >
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (example.kind === "scorecard") {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{example.title}</p>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", colors.bg, colors.text)}>
            Overall {example.overall}
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {example.rows.map((row) => (
            <div
              key={row.criteria}
              className="flex items-center justify-between border-b border-border/50 pb-1.5 text-xs last:border-0 last:pb-0"
            >
              <span className="text-muted-foreground">{row.criteria}</span>
              <span className="font-medium text-foreground">{row.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-muted/30">
      <p className="px-4 pt-4 text-sm font-semibold text-foreground">{example.title}</p>
      <table className="mt-2 w-full text-xs">
        <thead>
          <tr className="border-y border-border bg-muted/40 text-left">
            {example.columns.map((c) => (
              <th key={c} className="px-4 py-2 font-medium text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {example.rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 text-foreground">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="h-4" />
    </div>
  );
}

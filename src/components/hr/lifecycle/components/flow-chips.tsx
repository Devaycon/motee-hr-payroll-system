import { ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { STAGE_COLOR_CLASSES, type LifecycleStageColor } from "../data";

/** A stage's flow rendered as connected steps — how the work actually moves. */
export function FlowChips({
  steps,
  color,
}: {
  steps: string[];
  color: LifecycleStageColor;
}) {
  const colors = STAGE_COLOR_CLASSES[color];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium",
              colors.bg,
              colors.text,
            )}
          >
            {step}
          </span>
          {i < steps.length - 1 && (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50" />
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import { HIRING_STAGES } from "@/src/lib/hiring/resolve-stage";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";

interface StageDotsProps {
  /** The stage this effort has reached, 1–6. */
  step: number;
}

/**
 * Six dots, one per hiring stage: filled behind, ringed at, hollow ahead.
 *
 * The whole point of the tracker is that "what stage is this on?" should be
 * answerable without reading — so the dots carry the answer and the label
 * beside them only confirms it.
 */
export function StageDots({ step }: StageDotsProps) {
  return (
    <div className="flex items-center gap-1">
      {HIRING_STAGES.map((stage) => {
        const done = stage.step < step;
        const current = stage.step === step;
        return (
          <Tooltip key={stage.id}>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full border transition-colors",
                  done && "border-[#FE8F44] bg-[#FE8F44]",
                  current && "border-[#FE8F44] bg-[#FE8F44]/30 ring-2 ring-[#FE8F44]/30",
                  !done && !current && "border-border bg-muted",
                )}
              />
            </TooltipTrigger>
            <TooltipContent side="top">
              {stage.step}. {stage.label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

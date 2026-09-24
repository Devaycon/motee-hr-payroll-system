"use client";

import { Sparkles, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface ComingSoonPanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** What the feature will do once it ships — previewed, not interactive. */
  planned?: string[];
  className?: string;
}

/**
 * Placeholder for a feature that is agreed but scheduled for a later phase.
 * Shows what is coming so the tab reads as a roadmap item, not a broken page.
 */
export function ComingSoonPanel({
  icon: Icon,
  title,
  description,
  planned = [],
  className,
}: ComingSoonPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-dashed border-[#FE8F44]/40 bg-linear-to-br from-[#FE8F44]/6 via-background to-[#7F77DD]/6 px-6 py-10",
        className,
      )}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#FE8F44]/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#E0701F] dark:text-[#FE8F44]">
          <Sparkles className="h-3 w-3" />
          Coming soon
        </span>
        <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm ring-1 ring-border">
          <Icon className="h-6 w-6 text-[#FE8F44]" />
        </div>
        <h2 className="mt-3 text-lg font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        {planned.length > 0 && (
          <ul className="mt-5 grid w-full gap-2 text-left sm:grid-cols-2">
            {planned.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-lg border border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FE8F44]/70" />
                {item}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 text-[11px] text-muted-foreground">
          Planned for a later phase — nothing to set up yet.
        </p>
      </div>
    </div>
  );
}

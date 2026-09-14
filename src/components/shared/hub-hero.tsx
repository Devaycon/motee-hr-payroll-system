"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

export interface HubHeroStat {
  label: string;
  value: string | number;
}

/**
 * Shared banner for the Analytics / Reports hub pages: a live-pulse eyebrow,
 * a headline, a strip of at-a-glance numbers, and the search that filters the
 * card grid below. One component so both hubs read as the same system.
 */
export function HubHero({
  eyebrow,
  title,
  description,
  stats,
  search,
  onSearchChange,
  searchPlaceholder,
  action,
  graphicSrc,
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats: HubHeroStat[];
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  action?: ReactNode;
  /**
   * Decorative image anchored to the card's own empty right-hand side — the
   * text column is capped at `max-w-xl`/`max-w-md`, so wide screens leave
   * that space bare. Hidden below `lg` rather than shrunk, since there isn't
   * room to sit it beside the text without crowding at narrower widths.
   */
  graphicSrc?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[#FE8F44]/10 blur-3xl"
      />
      {graphicSrc && (
        // eslint-disable-next-line @next/next/no-img-element -- purely decorative, no need for next/image's optimization pipeline here
        <img
          src={graphicSrc}
          alt=""
          aria-hidden
          className="pointer-events-none absolute right-6 top-1/2 hidden h-40 w-auto -translate-y-1/2 select-none opacity-90 lg:block xl:h-56"
        />
      )}

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              {eyebrow}
            </span>
            <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          {action}
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold leading-none text-foreground tabular-nums">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder ?? "Search…"}
            className="h-10 bg-background pl-9 pr-9"
          />
          {search && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onSearchChange("")}
              className={cn(
                "absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground",
              )}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

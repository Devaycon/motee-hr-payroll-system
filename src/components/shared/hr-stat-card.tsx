"use client";

import Link from "next/link";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

/** Icon-chip accent. Defaults to the house violet. */
export type HrStatCardTone =
  | "violet"
  | "blue"
  | "amber"
  | "emerald"
  | "red";

const TONE_STYLES: Record<HrStatCardTone, { chip: string; icon: string }> = {
  violet: { chip: "bg-[#7F77DD]/10", icon: "text-[#7F77DD]" },
  blue: { chip: "bg-blue-500/10", icon: "text-blue-500" },
  amber: { chip: "bg-amber-500/10", icon: "text-amber-500" },
  emerald: { chip: "bg-emerald-500/10", icon: "text-emerald-500" },
  red: { chip: "bg-red-500/10", icon: "text-red-500" },
};

export interface HrStatCardItem {
  label: string;
  value: string | number;
  sub: string;
  /** Optional "View" link. When omitted, no action button is shown. */
  link?: string;
  icon: LucideIcon;
  trend?: string;
  up?: boolean;
  /**
   * Makes the whole card a drill-down control (client feedback §2.20, §6.1,
   * §6.17, §7.1). Pair with `active` so the card reflects the filter it set.
   */
  onClick?: () => void;
  /** This card's filter is the one currently applied. */
  active?: boolean;
  tone?: HrStatCardTone;
}

interface HrStatCardProps {
  stat: HrStatCardItem;
}

export function HrStatCard({ stat }: HrStatCardProps) {
  const tone = TONE_STYLES[stat.tone ?? "violet"];
  const clickable = Boolean(stat.onClick);

  // A card can carry both a drill-down and a "View" link, so the clickable
  // surface stays a div with button semantics — a real <button> here would
  // nest the link inside it, which is invalid.
  return (
    <Card
      className={cn(
        "transition-shadow gap-0 py-0",
        clickable &&
          "cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        stat.active && "ring-2 ring-primary border-primary",
      )}
      {...(clickable
        ? {
            role: "button",
            tabIndex: 0,
            "aria-pressed": Boolean(stat.active),
            onClick: stat.onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                stat.onClick?.();
              }
            },
          }
        : {})}
    >
      <CardHeader className="flex flex-row items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "flex items-center justify-center w-5 h-5 rounded-md",
              tone.chip,
            )}
          >
            <stat.icon className={cn("w-3 h-3", tone.icon)} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {stat.label}
          </span>
        </div>
        {stat.link && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-5 text-[11px] px-1.5 text-muted-foreground hover:text-foreground gap-0.5"
          >
            <Link href={stat.link} onClick={(e) => e.stopPropagation()}>
              View
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-1.5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xl font-bold text-foreground leading-none">
              {stat.value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">{stat.sub}</p>
          </div>
          {stat.trend !== undefined && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 font-medium gap-0.5",
                stat.up
                  ? "border-[#4ED251]/40 bg-[#4ED251]/10 text-[#4ED251]"
                  : "border-orange-600/50 bg-orange-600/5 text-red-600",
              )}
            >
              {stat.trend}
              {stat.up ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3 " />
              )}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface HrStatCardsGridProps {
  stats: HrStatCardItem[];
  columns?: 2 | 3 | 4 | 5 | 8;
}

export function HrStatCardsGrid({ stats, columns = 4 }: HrStatCardsGridProps) {
  return (
    <div
      className={cn("grid gap-3", {
        "grid-cols-2": columns === 2,
        "grid-cols-3": columns === 3,
        "grid-cols-4": columns === 4,
        "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5": columns === 5,
        "grid-cols-4 xl:grid-cols-8": columns === 8,
      })}
    >
      {stats.map((stat) => (
        <HrStatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}

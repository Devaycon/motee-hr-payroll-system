"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { cn } from "@/src/lib/utils";

/** Concrete hex palette used for chart-adjacent legends/details. */
export const CHART_COLORS = [
  "#50D34C", // green
  "#6366f1", // indigo (primary)
  "#FE8F44", // orange
  "#5192FA", // blue
  "#a855f7", // purple
  "#14b8a6", // teal
  "#f43f5e", // rose
  "#eab308", // yellow
  "#0ea5e9", // sky
  "#64748b", // slate
];

export function chartColor(i: number): string {
  return CHART_COLORS[i % CHART_COLORS.length];
}

export interface ChartDetailItem {
  label: string;
  value: number;
  color?: string;
  /** Show the value as a percent of the total. */
  pct?: boolean;
  /** Format the value through the locale currency formatter. */
  money?: boolean;
}

/** Chrome props shared by every chart card. */
export interface ChartCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  footer?: React.ReactNode;
  details?: ChartDetailItem[];
  /** Custom legend block rendered in place of the default DetailsLegend. */
  legend?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  /** Optional control rendered on the right of the header (e.g. a selector). */
  action?: React.ReactNode;
  /** When set, renders a "View more →" link in the footer to this route. */
  viewMoreHref?: string;
  /** Tighter padding/type scale for dashboard grids where every card competes for room. */
  compact?: boolean;
}

/** Placeholder shown where a chart used to render. */
export function ChartPlaceholder({ height = 240 }: { height?: number }) {
  return (
    <div
      style={{ minHeight: height }}
      className="flex w-full items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground"
    >
      Chart placeholder
    </div>
  );
}

function DetailsLegend({ details }: { details: ChartDetailItem[] }) {
  const total = details.reduce((s, d) => s + d.value, 0) || 1;
  return (
    <div
      className={cn(
        "mt-3 flex flex-col gap-1.5 border-t border-border/50 pt-3",
        details.length > 6 && "max-h-44 overflow-y-auto pr-1",
      )}
    >
      {details.map((d, i) => (
        <div
          key={`${d.label}-${i}`}
          className="flex items-center justify-between gap-2"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: d.color ?? chartColor(i) }}
            />
            <span className="truncate text-xs text-muted-foreground">
              {d.label}
            </span>
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
            {d.money ? formatMoneyLocale(d.value) : d.value.toLocaleString()}
            {d.pct && (
              <span className="ml-1 font-normal text-muted-foreground">
                ({((d.value / total) * 100).toFixed(1)}%)
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Card chrome shared by every chart: title, description, body, legend, footer. */
export function ChartCard({
  title,
  description,
  icon: Icon,
  footer,
  details,
  legend,
  fullWidth,
  className,
  action,
  viewMoreHref,
  compact,
  children,
}: ChartCardProps & { children: React.ReactNode }) {
  return (
    <Card className={cn(fullWidth && "lg:col-span-2", className)}>
      <CardHeader
        className={cn(
          "space-y-0.5",
          compact ? "px-3 pt-3 pb-1" : "space-y-1 px-4 pt-4 pb-2",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && (
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-md bg-muted",
                  compact ? "h-6 w-6" : "h-7 w-7",
                )}
              >
                <Icon
                  className={cn(
                    "text-muted-foreground",
                    compact ? "h-3 w-3" : "h-3.5 w-3.5",
                  )}
                />
              </div>
            )}
            <CardTitle
              className={cn(
                "truncate font-medium",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {title}
            </CardTitle>
          </div>
          {action && <div className="flex shrink-0 items-center gap-1">{action}</div>}
        </div>
        {description && (
          <CardDescription
            className={cn(
              "leading-snug",
              compact ? "truncate text-[11px]" : "text-xs",
            )}
          >
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent
        className={cn(
          // `flex-1` only matters when the card itself is stretched taller
          // than its content (e.g. `className="h-full"` beside a taller
          // sibling) — otherwise there's no extra height to claim.
          "flex-1",
          compact ? "px-3 pb-2" : "px-4 pb-3",
        )}
      >
        {children}
        {legend ?? (details?.length ? <DetailsLegend details={details} /> : null)}
      </CardContent>
      {(footer || viewMoreHref) && (
        <CardFooter
          className={cn(
            "flex items-center justify-between gap-2 pt-0",
            compact ? "px-3 pb-2.5" : "px-4 pb-4",
          )}
        >
          <p
            className={cn(
              "leading-relaxed text-muted-foreground",
              compact ? "truncate text-[11px]" : "text-xs",
            )}
          >
            {footer}
          </p>
          {viewMoreHref && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={cn(
                "-mr-2 shrink-0 gap-1 text-primary hover:text-primary",
                compact ? "h-6 px-1.5 text-[11px]" : "h-7 px-2 text-xs",
              )}
            >
              <Link href={viewMoreHref}>
                View more
                <ArrowRight className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

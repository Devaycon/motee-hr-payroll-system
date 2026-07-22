"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "next-themes";
import type { ApexOptions } from "apexcharts";
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

/** react-apexcharts touches `window`, so load it client-only. */
type ApexComponentProps = {
  type?:
    | "line"
    | "area"
    | "bar"
    | "pie"
    | "donut"
    | "radialBar"
    | "radar"
    | "scatter";
  series?: ApexOptions["series"];
  options?: ApexOptions;
  width?: string | number;
  height?: string | number;
};

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
}) as React.ComponentType<ApexComponentProps>;

/** Concrete hex palette — ApexCharts cannot resolve CSS vars like var(--primary). */
export const CHART_COLORS = [
  "#4ED251", // green
  "#6366f1", // indigo (primary)
  "#ff8b2d", // orange
  "#3b82f6", // blue
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

/** One axis-chart series (bar/line/area/radar). */
export interface ApexSeries {
  name: string;
  data: number[];
  color?: string;
}

function compact(v: number): string {
  return Math.abs(v) >= 1000
    ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
    : `${v}`;
}

/** Axis tick formatter (compact numbers or money). */
export function axisFormatter(money?: boolean) {
  return (v: number) => (money ? formatMoneyLocale(v) : compact(v));
}

/** Tooltip value formatter (full numbers or money). */
export function tipFormatter(money?: boolean) {
  return (v: number) => (money ? formatMoneyLocale(v) : v?.toLocaleString?.() ?? `${v}`);
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
}

/** Deep-merge plain objects (used to layer chart options over the base theme). */
type AnyObj = Record<string, unknown>;
function isPlainObject(v: unknown): v is AnyObj {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
export function mergeApex(base: ApexOptions, override: ApexOptions): ApexOptions {
  const merge = (a: AnyObj, b: AnyObj): AnyObj => {
    const out: AnyObj = { ...a };
    for (const key of Object.keys(b)) {
      const av = out[key];
      const bv = b[key];
      out[key] =
        isPlainObject(av) && isPlainObject(bv) ? merge(av, bv) : bv;
    }
    return out;
  };
  return merge(base as AnyObj, override as AnyObj) as ApexOptions;
}

/** Theme-aware base ApexOptions merged into every chart. */
export function useApexTheme(): ApexOptions {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const foreColor = dark ? "#a1a1aa" : "#64748b";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";

  return {
    chart: {
      fontFamily: "inherit",
      foreColor,
      background: "transparent",
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 400 },
      parentHeightOffset: 0,
    },
    theme: { mode: dark ? "dark" : "light" },
    grid: {
      borderColor: border,
      strokeDashArray: 4,
      padding: { left: 8, right: 8 },
    },
    dataLabels: { enabled: false },
    tooltip: { theme: dark ? "dark" : "light" },
    legend: {
      labels: { colors: foreColor },
      fontSize: "12px",
      markers: { strokeWidth: 0 },
    },
    stroke: { lineCap: "round" },
    states: { active: { filter: { type: "none" } } },
  };
}

export function ApexChart({
  type,
  options,
  series,
  height = 280,
}: {
  type: ApexComponentProps["type"];
  options: ApexOptions;
  series: ApexOptions["series"];
  height?: number;
}) {
  return (
    <ReactApexChart
      type={type}
      options={options}
      series={series}
      height={height}
      width="100%"
    />
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
  children,
}: ChartCardProps & { children: React.ReactNode }) {
  return (
    <Card className={cn(fullWidth && "lg:col-span-2", className)}>
      <CardHeader className="space-y-1 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          {action}
        </div>
        {description && (
          <CardDescription className="text-xs leading-snug">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {children}
        {legend ?? (details?.length ? <DetailsLegend details={details} /> : null)}
      </CardContent>
      {(footer || viewMoreHref) && (
        <CardFooter className="flex items-center justify-between gap-2 px-4 pt-0 pb-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {footer}
          </p>
          {viewMoreHref && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="-mr-2 h-7 shrink-0 gap-1 px-2 text-xs text-primary hover:text-primary"
            >
              <Link href={viewMoreHref}>
                View more
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

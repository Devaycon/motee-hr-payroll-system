"use client";

import Link from "next/link";
import {
  ChevronRight,
  Info,
  OctagonAlert,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useHrAlertTotals } from "@/src/components/hr/hr-alerts";
import {
  HR_ALERT_SEVERITIES,
  HR_ALERT_SEVERITY_LABELS,
  type HrAlertSeverity,
} from "@/src/data/hr-alerts-demo";
import { cn } from "@/src/lib/utils";
import { Tile, TileLabel, TileSub, TileNum, HBars, TileLink } from "./tiles";
import { useHrAlertCategories } from "@/src/components/hr/hr-alerts";

/**
 * The Priorities tab's headline: how much is open, and how much of it is
 * urgent. Counted from the same categories the action list below renders, so
 * the two can never disagree.
 *
 * Severity keeps its reserved status colours and is never carried by colour
 * alone — each tile names its severity in text and carries a distinct icon
 * shape, so the three stay apart in greyscale and for colour-blind readers.
 */
const SEVERITY_STYLE: Record<
  HrAlertSeverity,
  { icon: LucideIcon; number: string; chip: string }
> = {
  critical: {
    icon: OctagonAlert,
    number: "text-rose-500",
    chip: "bg-rose-500/10 text-rose-500",
  },
  warning: {
    icon: TriangleAlert,
    number: "text-amber-500",
    chip: "bg-amber-500/10 text-amber-500",
  },
  info: {
    icon: Info,
    number: "text-blue-500",
    chip: "bg-blue-500/10 text-blue-500",
  },
};

/** The full-width banner: total open items. */
export function ActionCentreTotal() {
  const { total } = useHrAlertTotals();

  return (
    <Link
      href="/hr-action-center"
      className="block rounded-xl bg-primary p-4 text-primary-foreground transition-opacity hover:opacity-95"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium">HR priorities</p>
          <p className="text-xs opacity-80">Open items</p>
          <p className="mt-2 text-3xl font-semibold leading-none tabular-nums">
            {total}
          </p>
        </div>
        <span className="inline-flex items-center gap-0.5 text-xs font-medium">
          Open
          <ChevronRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

function SeverityTile({ severity }: { severity: HrAlertSeverity }) {
  const { counts } = useHrAlertTotals();
  const style = SEVERITY_STYLE[severity];
  const Icon = style.icon;

  return (
    <Tile>
      {/* The icon chip replaces the old colour dot: it carries the same
          severity tint but in a shape that tells the three apart without
          relying on colour. Decorative — the label beside it is the label. */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <TileLabel>{HR_ALERT_SEVERITY_LABELS[severity]}</TileLabel>
          <TileSub>Open</TileSub>
        </div>
        <span
          aria-hidden
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-lg",
            style.chip,
          )}
        >
          <Icon className="size-10" />
        </span>
      </div>

      <TileNum className={style.number}>{counts[severity]}</TileNum>
      <TileLink href="/hr-action-center">View action centre</TileLink>
    </Tile>
  );
}

export const CriticalAlertsTile = () => <SeverityTile severity="critical" />;
export const WarningAlertsTile = () => <SeverityTile severity="warning" />;
export const InfoAlertsTile = () => <SeverityTile severity="info" />;

/** Kept for the registry's severity row, in the order HR reads them. */
export const ALERT_SEVERITY_ORDER = HR_ALERT_SEVERITIES;

/** How many categories the tile lists before folding the rest into "More". */
const CATEGORY_LIMIT = 5;

/**
 * Where the open work actually sits. One measure across one dimension, so
 * single-hue ranked bars with the count at the end of every row — the bar
 * length never has to be estimated.
 */
export function AlertsByCategoryTile() {
  const categories = useHrAlertCategories();

  const rows = categories
    .map((c) => ({ label: c.label, value: c.alerts.length }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) return null;

  // A long tail of one-item categories would crowd out the ones that matter,
  // so everything past the top few is summed into a single "More" row.
  const top = rows.slice(0, CATEGORY_LIMIT);
  const rest = rows.slice(CATEGORY_LIMIT);
  const items =
    rest.length > 0
      ? [
          ...top,
          {
            label: `More (${rest.length})`,
            value: rest.reduce((sum, r) => sum + r.value, 0),
          },
        ]
      : top;

  return (
    <Tile>
      <TileLabel>By category</TileLabel>
      <TileSub>Open items</TileSub>
      <HBars items={items} />
      <Link
        href="/hr-action-center"
        className="mt-auto inline-flex w-fit items-center gap-0.5 pt-3 text-xs font-medium text-primary hover:underline"
      >
        View action centre
        <ChevronRight className="size-3.5" />
      </Link>
    </Tile>
  );
}

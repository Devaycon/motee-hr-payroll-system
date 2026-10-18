"use client";

import { ArrowDownRight, ArrowUpRight, Check, ChevronsUpDown, Minus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import {
  BAND_LABELS,
  BAND_STYLES,
  KPI_BY_ID,
  KPI_DEFS,
  PERIOD_LABELS,
  bandFor,
  type KpiId,
  type PeriodPreset,
} from "@/src/lib/branches/performance";

/** A compact checkbox list in a popover — branches, regions, indicators. */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  allLabel,
  min = 0,
  className,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  allLabel: string;
  min?: number;
  className?: string;
}) {
  const all = value.length === 0 || value.length === options.length;
  const summary = all
    ? allLabel
    : value.length === 1
      ? options.find((o) => o.value === value[0])?.label ?? "1 selected"
      : `${value.length} ${label.toLowerCase()}`;
  function toggle(v: string) {
    const base = value.length === 0 ? options.map((o) => o.value) : value;
    const next = base.includes(v) ? base.filter((x) => x !== v) : [...base, v];
    if (next.length < min) return;
    onChange(next.length === options.length ? [] : next);
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-8 justify-between gap-2 text-xs font-normal", className)}>
          <span className="truncate">
            <span className="text-muted-foreground">{label}: </span>
            {summary}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        <button
          type="button"
          onClick={() => onChange([])}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs hover:bg-muted"
        >
          <span className={cn("flex h-3.5 w-3.5 items-center justify-center rounded border", all && "border-primary bg-primary text-primary-foreground")}>
            {all && <Check className="h-2.5 w-2.5" />}
          </span>
          {allLabel}
        </button>
        <div className="my-1 border-t border-border" />
        <div className="max-h-64 overflow-y-auto">
          {options.map((o) => {
            const on = all || value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
              >
                <span className={cn("flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border", on && "border-primary bg-primary text-primary-foreground")}>
                  {on && <Check className="h-2.5 w-2.5" />}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function PeriodSelect({ value, onChange }: { value: PeriodPreset; onChange: (v: PeriodPreset) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PeriodPreset)}>
      <SelectTrigger size="sm" className="h-8 w-[150px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(PERIOD_LABELS) as PeriodPreset[]).map((p) => (
          <SelectItem key={p} value={p} className="text-xs">
            {PERIOD_LABELS[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export const KPI_OPTIONS = KPI_DEFS.map((k) => ({ value: k.id, label: k.label }));

/** Period-on-period change, coloured by whether it's an improvement. */
export function DeltaBadge({
  kpi,
  current,
  previous,
}: {
  kpi: KpiId | "score";
  current: number | null;
  previous: number | null;
}) {
  if (current == null || previous == null) return <span className="text-[11px] text-muted-foreground">—</span>;
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
        <Minus className="h-3 w-3" /> 0
      </span>
    );
  }
  const higherBetter = kpi === "score" ? true : KPI_BY_ID[kpi].higherIsBetter;
  const good = diff > 0 === higherBetter;
  const unit = kpi === "score" || KPI_BY_ID[kpi].unit === "pct" ? " pts" : "";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-medium tabular-nums",
        good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      )}
    >
      {diff > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {diff > 0 ? "+" : ""}
      {diff}
      {unit}
    </span>
  );
}

export function BandBadge({ score }: { score: number | null }) {
  const band = bandFor(score);
  if (!band) return <span className="text-xs text-muted-foreground">No data</span>;
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium", BAND_STYLES[band])}>
      {BAND_LABELS[band]}
    </span>
  );
}

export function DataFootnote({ asOf }: { asOf: string }) {
  return (
    <p className="text-[11px] text-muted-foreground">
      Calculated from Motee records (tasks, attendance, learning, documents, sickness, helpdesk,
      grievances and reviews) as at {asOf}.
    </p>
  );
}

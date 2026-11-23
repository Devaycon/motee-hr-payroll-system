"use client";

import { AlertTriangle, CheckCircle2, Info, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { varianceNarrative, intelligenceSummary, type Insight } from "@/src/lib/payroll/intelligence";
import type { RunComparison } from "@/src/lib/payroll/comparison";
import type { VarianceInvestigation } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { compactNaira } from "./components/charts";
import { pctArrow } from "./components/shared";

const ICON: Record<Insight["tone"], { icon: typeof Info; cls: string }> = {
  down: { icon: TrendingDown, cls: "text-rose-600" },
  up: { icon: TrendingUp, cls: "text-emerald-700 dark:text-emerald-400" },
  info: { icon: Info, cls: "text-sky-700 dark:text-sky-400" },
  ok: { icon: CheckCircle2, cls: "text-emerald-700 dark:text-emerald-400" },
  warn: { icon: AlertTriangle, cls: "text-amber-700 dark:text-amber-400" },
};

/**
 * Payroll Intelligence summary: the narrative, four headline figures and the
 * findings. Rule-based — every sentence traces to the reconciled bridge.
 */
export function VarianceSummary({
  cmp,
  investigations = [],
  onInvestigateUnclassified,
  compact = false,
}: {
  cmp: RunComparison;
  investigations?: VarianceInvestigation[];
  onInvestigateUnclassified?: () => void;
  compact?: boolean;
}) {
  const s = intelligenceSummary(cmp, investigations);
  const narrative = varianceNarrative(cmp);
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Payroll Intelligence</p>
      <p className="text-[11px] text-muted-foreground">{cmp.current.period.label} against {cmp.previous.period.label}</p>
      <p className="mt-3 text-sm leading-relaxed">{narrative}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Gross payroll movement" value={pctArrow(s.grossPct, 2)} sub={`${s.grossChange < 0 ? "Down" : s.grossChange > 0 ? "Up" : "No change"} ${compactNaira(Math.abs(s.grossChange))}`} tone={s.grossChange < 0 ? "down" : s.grossChange > 0 ? "up" : undefined} />
        <Tile label="Employees affected" value={String(s.employeesAffected)} sub="Gross pay changed" />
        <Tile label="Variance categories" value={String(s.categories)} sub="Identified drivers" />
        <Tile label="Reconciliation" value={s.balanced ? (Math.abs(s.unexplained) >= 0.005 ? "Balanced*" : "Balanced") : "Unreconciled"} sub={Math.abs(s.unexplained) >= 0.005 ? `*${compactNaira(s.unexplained)} unclassified` : "Every naira attributed"} tone={s.balanced && Math.abs(s.unexplained) < 0.005 ? "ok" : "warn"} />
      </div>
      {!compact && (
        <>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Intelligence generated</p>
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            {s.insights.map((i) => {
              const { icon: Icon, cls } = ICON[i.tone];
              return (
                <li key={i.title} className="flex gap-2 text-xs">
                  <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", cls)} />
                  <span><span className="font-medium">{i.title}</span><span className="block text-muted-foreground">{i.text}</span></span>
                </li>
              );
            })}
          </ul>
          {Math.abs(s.unexplained) >= 0.005 && onInvestigateUnclassified && (
            <Button size="sm" variant="outline" className="mt-3 h-7 text-[11px]" onClick={onInvestigateUnclassified}>Investigate unclassified movements</Button>
          )}
        </>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground">Explanations come only from payroll records (payslip lines, salary changes, inputs, imports, leave and attendance). Anything without a confirmed source is marked &ldquo;Reason requires investigation&rdquo;.</p>
    </div>
  );
}

function Tile({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "up" | "down" | "ok" | "warn" }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold tabular-nums", tone === "down" && "text-rose-600", tone === "up" && "text-emerald-700 dark:text-emerald-400", tone === "ok" && "text-emerald-700 dark:text-emerald-400", tone === "warn" && "text-amber-700 dark:text-amber-400")}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

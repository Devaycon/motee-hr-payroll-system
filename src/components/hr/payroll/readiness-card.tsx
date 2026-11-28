"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, ShieldCheck } from "lucide-react";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { INVESTIGATIONS_HREF } from "@/src/lib/payroll/use-payroll";
import type { CheckState, Readiness, ReadinessCheck } from "@/src/lib/payroll/readiness";
import type { PayrollRun } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";

const PILL: Record<CheckState, { label: string; cls: string }> = {
  passed: { label: "Passed", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  review: { label: "Review", cls: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  failed: { label: "Failed", cls: "border-rose-500/30 bg-rose-500/10 text-rose-600" },
};

export function CheckPill({ state }: { state: CheckState }) {
  return <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium", PILL[state].cls)}>{PILL[state].label}</span>;
}

function fixHref(c: ReadinessCheck, run: Pick<PayrollRun, "id">): string {
  switch (c.fix) {
    case "exceptions":
      return `${PAYROLL_HREF}/${run.id}?tab=exceptions`;
    case "compare":
      return `${PAYROLL_HREF}/compare?current=${run.id}&confidence=unexplained`;
    case "investigations":
      return `${INVESTIGATIONS_HREF}?status=open`;
    case "remittances":
      return `${PAYROLL_HREF}?tab=remittances`;
    case "settings":
      return `${PAYROLL_HREF}/settings?tab=history`;
    case "earlier":
      return PAYROLL_HREF;
    default:
      return `${PAYROLL_HREF}/${run.id}`;
  }
}

const scoreTone = (r: Readiness) => (r.blocked ? "bg-rose-500" : r.score >= 90 ? "bg-emerald-600" : "bg-amber-500");

/**
 * "November payroll readiness 92/100" — the pre-payment control score with
 * every control's status. `compact` shows the header and blockers only.
 */
export function ReadinessCard({ readiness: r, run, compact, className }: { readiness: Readiness; run: Pick<PayrollRun, "id" | "title" | "period">; compact?: boolean; className?: string }) {
  const [showAll, setShowAll] = useState(!compact);
  const month = run.period.label.split(" ")[0];
  const list = showAll ? r.checks : r.checks.filter((c) => c.state !== "passed");
  return (
    <div className={cn("rounded-xl border bg-card p-4", r.blocked && "border-rose-500/40", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{month} payroll readiness</p>
          <p className="mt-0.5 text-3xl font-semibold tabular-nums">
            {r.score}
            <span className="text-base font-normal text-muted-foreground">/100</span>
          </p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Critical checks passed</dt>
          <dd className={cn("text-right font-semibold tabular-nums", r.blocked && "text-rose-600")}>
            {r.criticalPassed}/{r.criticalTotal}
          </dd>
          <dt className="text-muted-foreground">Unresolved exceptions</dt>
          <dd className="text-right font-semibold tabular-nums">{r.unresolvedExceptions}</dd>
        </dl>
      </div>
      <div className="mt-3 h-2 rounded-full bg-muted">
        <div className={cn("h-2 rounded-full transition-all", scoreTone(r))} style={{ width: `${r.score}%` }} />
      </div>

      {r.blocked ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <b>Approval blocked.</b> The system won&apos;t let this payroll be submitted, approved or finalized while a critical compliance or payment check has failed:{" "}
            {r.blockers.map((b) => b.label).join(", ")}.
          </span>
        </p>
      ) : (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Every critical check has passed{r.checks.some((c) => c.state === "review") ? " — items marked Review lower the score but don't block approval." : "."}</span>
        </p>
      )}

      {list.length > 0 && (
        <ul className="mt-3 divide-y rounded-lg border">
          {list.map((c) => (
            <li key={c.key} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  {c.label}
                  {c.critical && <span className="rounded bg-muted px-1 py-px text-[9px] font-medium uppercase tracking-wide text-muted-foreground">Critical</span>}
                </span>
                <span className="block text-[11px] text-muted-foreground">{c.detail}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {c.state !== "passed" && (
                  <Link href={fixHref(c, run)} className="text-[11px] text-primary hover:underline">
                    Fix
                  </Link>
                )}
                <CheckPill state={c.state} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {compact && (
        <button type="button" onClick={() => setShowAll((x) => !x)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground">
          {showAll ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showAll ? "Show only what needs attention" : `Show all ${r.checks.length} controls`}
        </button>
      )}
    </div>
  );
}

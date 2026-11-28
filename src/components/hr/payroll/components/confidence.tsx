"use client";

import { CONFIDENCE_HELP, CONFIDENCE_LABELS, ORIGIN_LABELS, type MovementSource, type VarianceConfidence } from "@/src/lib/payroll/comparison";
import { cn } from "@/src/lib/utils";

/** Green / amber / red — the client's three confidence levels (feedback B4). */
export const CONFIDENCE_DOT: Record<VarianceConfidence, string> = {
  confirmed: "bg-emerald-500",
  verification_required: "bg-amber-500",
  unexplained: "bg-rose-500",
};

const TEXT: Record<VarianceConfidence, string> = {
  confirmed: "text-emerald-700 dark:text-emerald-400",
  verification_required: "text-amber-700 dark:text-amber-400",
  unexplained: "text-rose-600",
};

export function confidenceOf(src: Pick<MovementSource, "confidence" | "confirmed">): VarianceConfidence {
  return src.confidence ?? (src.confirmed ? "confirmed" : "unexplained");
}

export function ConfidenceBadge({ confidence, className, compact }: { confidence: VarianceConfidence; className?: string; compact?: boolean }) {
  return (
    <span title={CONFIDENCE_HELP[confidence]} className={cn("inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-medium", TEXT[confidence], className)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", CONFIDENCE_DOT[confidence])} />
      {!compact && CONFIDENCE_LABELS[confidence]}
    </span>
  );
}

/** "Payroll administrator's manual input · ● Verification required" */
export function SourceLine({ source, className }: { source: MovementSource; className?: string }) {
  const c = confidenceOf(source);
  return (
    <span className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5", className)}>
      <span className={cn("font-medium", c === "unexplained" && "text-rose-600")}>{ORIGIN_LABELS[source.origin ?? "unknown"]}</span>
      <ConfidenceBadge confidence={c} />
    </span>
  );
}

/** Three counters: how many employees' movements are confirmed, need verifying, or are unexplained. */
export function ConfidenceStrip({ counts, amounts, onSelect, selected }: { counts: Record<VarianceConfidence, number>; amounts?: Record<VarianceConfidence, number>; onSelect?: (c: VarianceConfidence) => void; selected?: VarianceConfidence | null }) {
  const keys: VarianceConfidence[] = ["confirmed", "verification_required", "unexplained"];
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {keys.map((k) => (
        <button
          key={k}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(k)}
          title={CONFIDENCE_HELP[k]}
          className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-left transition", onSelect && "hover:bg-muted/50", selected === k && "ring-2 ring-primary/40")}
        >
          <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", CONFIDENCE_DOT[k])} />
          <span className="min-w-0">
            <span className="block text-xs font-medium">{CONFIDENCE_LABELS[k]}</span>
            <span className="block text-[11px] text-muted-foreground">
              {counts[k]} employee{counts[k] === 1 ? "" : "s"}
              {amounts && Math.abs(amounts[k]) >= 0.005 && ` · ${amounts[k] < 0 ? "−" : "+"}₦${Math.round(Math.abs(amounts[k])).toLocaleString("en-NG")}`}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

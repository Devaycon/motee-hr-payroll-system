"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Progress } from "@/src/components/ui/progress";
import { COMPLETION_TARGET } from "@/src/lib/profile/completion";
import { useProfileCompletion } from "@/src/lib/profile/use-completion";

const MAX_CHIPS = 4;

/**
 * Profile Completion — how complete this record is against what HR requires,
 * with each missing item a shortcut to the module that fills it.
 */
export function ProfileCompletionCard({
  employeeId,
  onOpenModule,
}: {
  employeeId: string;
  onOpenModule: (module: string) => void;
}) {
  const completion = useProfileCompletion(employeeId);
  if (!completion) return null;

  const { score, missing, checks } = completion;
  const tone =
    score >= 90 ? "text-emerald-600" : score >= COMPLETION_TARGET ? "text-amber-600" : "text-rose-600";
  const shown = missing.slice(0, MAX_CHIPS);

  return (
    <div className="flex min-w-72 flex-col gap-2 rounded-xl bg-card px-4 py-3 shadow-xs ring-1 ring-foreground/10 lg:max-w-sm">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <p className={cn("text-xl font-bold leading-none tabular-nums", tone)}>{score}%</p>
          <p className="text-[11px] text-muted-foreground">Profile completion</p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {checks.length - missing.length} of {checks.length} items
        </p>
      </div>
      <Progress value={score} className="h-1.5" />
      {missing.length === 0 ? (
        <p className="flex items-center gap-1.5 text-[11px] text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5" /> Record complete and audit-ready
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Missing items
          </p>
          <div className="flex flex-wrap gap-1">
            {shown.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => onOpenModule(m.module)}
                className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/5 px-2 py-0.5 text-[10px] font-medium text-rose-600 hover:bg-rose-500/10"
                title={`Open ${m.label}`}
              >
                <CircleAlert className="h-2.5 w-2.5" />
                {m.label}
              </button>
            ))}
            {missing.length > MAX_CHIPS && (
              <span
                className="px-1 py-0.5 text-[10px] text-muted-foreground"
                title={missing.slice(MAX_CHIPS).map((m) => m.label).join(", ")}
              >
                +{missing.length - MAX_CHIPS} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

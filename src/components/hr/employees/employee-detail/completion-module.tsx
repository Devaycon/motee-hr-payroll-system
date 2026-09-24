"use client";

import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, CircleAlert, FileText } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import {
  COMPLETION_GROUPS,
  COMPLETION_TARGET,
  type CompletionCheck,
} from "@/src/lib/profile/completion";
import { useProfileCompletion } from "@/src/lib/profile/use-completion";
import type { ModuleProps } from "./modules";
import { LoadingPanel, Section } from "./ui";

/** Where each item is fixed. Kept here rather than read from the registry, which imports this file. */
const MODULE_LABELS: Record<string, string> = {
  profile: "Profile",
  emergency: "Emergency Contact",
  guarantors: "Guarantors",
  documents: "Employee Documents",
  qualifications: "Qualifications & Education",
  skills: "Skills & Competencies",
};

export const scoreTone = (score: number) =>
  score >= 90
    ? "text-emerald-600"
    : score >= COMPLETION_TARGET
      ? "text-amber-600"
      : "text-rose-600";

/**
 * Profile Completion — every item HR requires on the record, split into what's
 * done and what remains, each with what was found or what's still needed and a
 * shortcut to the module that fills it.
 */
export function CompletionModule({ employeeId, onOpenModule }: ModuleProps) {
  const completion = useProfileCompletion(employeeId);
  if (!completion) return <LoadingPanel />;

  const { score, checks, missing } = completion;
  const completed = checks.filter((c) => c.done);

  return (
    <Section
      title="Profile Completion"
      description="Everything HR needs on this record — what's in place and what's still outstanding."
    >
      <div className="flex flex-col gap-3 rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <p className={cn("text-3xl font-bold leading-none tabular-nums", scoreTone(score))}>
              {score}%
            </p>
            <p className="text-sm text-muted-foreground">complete</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {completed.length} of {checks.length} items · target {COMPLETION_TARGET}%
          </p>
        </div>
        <Progress value={score} className="h-2" />
        <div className="grid gap-2 sm:grid-cols-3">
          {COMPLETION_GROUPS.map((group) => {
            const items = checks.filter((c) => c.group === group);
            if (!items.length) return null;
            const done = items.filter((c) => c.done).length;
            return (
              <div key={group} className="rounded-lg border border-border px-3 py-2">
                <p className="text-[11px] text-muted-foreground">{group}</p>
                <p
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    done === items.length ? "text-emerald-600" : "text-foreground",
                  )}
                >
                  {done} / {items.length}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <ChecklistBlock
        title="Remaining"
        count={missing.length}
        items={missing}
        onOpenModule={onOpenModule}
        empty={
          <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" /> Nothing outstanding — the record
            is complete and audit-ready.
          </p>
        }
      />

      <ChecklistBlock
        title="Completed"
        count={completed.length}
        items={completed}
        onOpenModule={onOpenModule}
        empty={
          <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Nothing completed yet.
          </p>
        }
      />
    </Section>
  );
}

function ChecklistBlock({
  title,
  count,
  items,
  empty,
  onOpenModule,
}: {
  title: string;
  count: number;
  items: CompletionCheck[];
  empty: ReactNode;
  onOpenModule?: (module: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title} ({count})
      </p>
      {items.length === 0 ? (
        empty
      ) : (
        <div className="flex flex-col gap-3">
          {COMPLETION_GROUPS.map((group) => {
            const rows = items.filter((c) => c.group === group);
            if (!rows.length) return null;
            return (
              <div
                key={group}
                className="overflow-hidden rounded-xl ring-1 ring-foreground/10"
              >
                <p className="bg-muted/40 px-4 py-2 text-[11px] font-medium text-muted-foreground">
                  {group}
                </p>
                <ul className="divide-y divide-border">
                  {rows.map((c) => (
                    <ChecklistRow key={c.key} check={c} onOpenModule={onOpenModule} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChecklistRow({
  check,
  onOpenModule,
}: {
  check: CompletionCheck;
  onOpenModule?: (module: string) => void;
}) {
  const where = MODULE_LABELS[check.module] ?? check.module;
  return (
    <li className="flex flex-wrap items-center gap-3 bg-card px-4 py-3">
      {check.done ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <CircleAlert className="h-4 w-4 shrink-0 text-rose-600" />
      )}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {check.label}
          {check.isDocument && (
            <FileText
              className="h-3 w-3 text-muted-foreground"
              aria-label="Document evidence"
            />
          )}
        </p>
        <p
          className={cn(
            "text-xs",
            check.done ? "text-muted-foreground" : "text-rose-600",
          )}
        >
          {check.detail}
        </p>
      </div>
      {onOpenModule && (
        <Button
          variant={check.done ? "ghost" : "outline"}
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => onOpenModule(check.module)}
          title={`Open ${where}`}
        >
          {check.done ? "View" : "Complete"} in {where}
          <ArrowRight className="h-3 w-3" />
        </Button>
      )}
    </li>
  );
}

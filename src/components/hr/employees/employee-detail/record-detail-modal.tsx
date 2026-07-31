"use client";

import * as React from "react";
import { Info, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { StatusBadge } from "./ui";

export interface DetailField {
  label: string;
  value?: React.ReactNode;
  /** Spans the full width — use for free text like a reason or summary. */
  wide?: boolean;
}

export interface DetailOutcome {
  /** Drives the tone: why a record was rejected vs simply waiting. */
  tone: "positive" | "pending" | "negative";
  heading: string;
  body: string;
  /** Who decided, and when. */
  by?: string;
  at?: string;
}

const TONES: Record<
  DetailOutcome["tone"],
  { wrap: string; icon: React.ComponentType<{ className?: string }> }
> = {
  positive: {
    wrap: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  pending: {
    wrap: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  negative: {
    wrap: "border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-400",
    icon: AlertTriangle,
  },
};

/**
 * The "what am I actually looking at?" view for a row in any module table.
 *
 * A table cell can only afford a status pill, which tells an employee that
 * something was rejected but never why, or what the record was for. This is the
 * long form: the record's own fields, an explanation of what the thing is, and
 * — when a decision has been made — who made it and on what grounds.
 */
export function RecordDetailModal({
  open,
  onClose,
  title,
  subtitle,
  status,
  about,
  fields,
  outcome,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  status?: string;
  /** What this kind of record is for, in plain language. */
  about?: { what: string; why: string; consequence?: string };
  fields: DetailField[];
  /** The decision on this record, when one has been made. */
  outcome?: DetailOutcome | null;
  /** Extra detail for this record type — a progress trail, a timeline. */
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const tone = outcome ? TONES[outcome.tone] : null;
  const OutcomeIcon = tone?.icon;
  const shown = fields.filter(
    (f) => f.value !== undefined && f.value !== null && f.value !== "",
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-sm font-semibold wrap-break-word">
                {title}
              </DialogTitle>
              {subtitle && (
                <DialogDescription className="text-xs">{subtitle}</DialogDescription>
              )}
            </div>
            {status && (
              <span className="shrink-0">
                <StatusBadge status={status} />
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* The decision first — it's the thing the employee opened this for. */}
          {outcome && tone && OutcomeIcon && (
            <div className={cn("rounded-lg border px-3 py-2.5", tone.wrap)}>
              <p className="flex items-center gap-1.5 text-xs font-semibold">
                <OutcomeIcon className="size-3.5 shrink-0" />
                {outcome.heading}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">
                {outcome.body}
              </p>
              {(outcome.by || outcome.at) && (
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {[outcome.by && `Reviewed by ${outcome.by}`, outcome.at]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          )}

          {children}

          {shown.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {shown.map((f) => (
                <div
                  key={f.label}
                  className={cn(
                    "flex flex-col gap-0.5 border-b border-border/50 py-1.5",
                    f.wide && "sm:col-span-2",
                  )}
                >
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </span>
                  <span className="text-xs text-foreground wrap-break-word">
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {about && (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Info className="size-3.5 shrink-0 text-muted-foreground" />
                What this is for
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {about.what}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                {about.why}
              </p>
              {about.consequence && (
                <p className="mt-1.5 border-t border-border/60 pt-1.5 text-[11px] leading-relaxed text-foreground/80">
                  {about.consequence}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {footer}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

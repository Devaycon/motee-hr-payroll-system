"use client";

import { useState } from "react";
import { ShieldCheck, ChevronDown, ChevronUp, Check, Scale } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import {
  OH_STAGES,
  OH_FITNESS_LABELS,
  OH_FITNESS_STYLES,
  ohStageIndex,
  type OHReferral,
} from "@/src/lib/types/occupational-health";
import {
  OH_REFERRALS,
  OH_REFERRAL_THRESHOLD_DAYS,
} from "@/src/data/occupational-health-demo";

const REF_TODAY = new Date(2026, 6, 22);

function daysSince(iso: string): number {
  return Math.floor((REF_TODAY.getTime() - new Date(iso).getTime()) / 86_400_000);
}
function fmt(iso?: string): string {
  return iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 min-w-fit rounded-xl bg-card px-4 py-3 shadow-xs ring-1 ring-foreground/10">
      <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ReferralCard({ r }: { r: OHReferral }) {
  const [open, setOpen] = useState(false);
  const stageIdx = ohStageIndex(r.status);
  const progress = ((stageIdx + 1) / OH_STAGES.length) * 100;
  const currentLabel = OH_STAGES[stageIdx]?.label ?? "—";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
            {r.employeeInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{r.employeeName}</p>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  OH_FITNESS_STYLES[r.fitnessStatus],
                )}
              >
                {OH_FITNESS_LABELS[r.fitnessStatus]}
              </span>
              {r.equalityActConsidered && (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                  <Scale className="size-3" /> Equality Act 2010
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {r.department} · Absent {daysSince(r.absenceStartDate)} days (since{" "}
              {fmt(r.absenceStartDate)})
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span className="font-medium text-foreground">{currentLabel}</span>
            <span className="text-muted-foreground">
              Stage {stageIdx + 1} of {OH_STAGES.length}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {open && (
          <div className="mt-4 grid gap-4 border-t border-border/60 pt-4 md:grid-cols-2">
            {/* State machine */}
            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">Case workflow</p>
              <ol className="flex flex-col gap-1.5">
                {OH_STAGES.map((s, i) => {
                  const done = i < stageIdx;
                  const active = i === stageIdx;
                  return (
                    <li key={s.key} className="flex items-center gap-2 text-[11px]">
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full text-[9px]",
                          done && "bg-emerald-500 text-white",
                          active && "bg-primary text-primary-foreground",
                          !done && !active && "bg-muted text-muted-foreground",
                        )}
                      >
                        {done ? <Check className="size-2.5" /> : i + 1}
                      </span>
                      <span
                        className={cn(
                          active ? "font-semibold text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {s.label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Recommendations (fitness + adjustments only — never diagnosis) */}
            <div>
              <p className="mb-2 text-xs font-semibold text-foreground">
                Fitness & recommended adjustments
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-md bg-muted/40 px-2.5 py-1.5">
                  <p className="text-muted-foreground">Referral date</p>
                  <p className="font-medium text-foreground">{fmt(r.referralDate)}</p>
                </div>
                <div className="rounded-md bg-muted/40 px-2.5 py-1.5">
                  <p className="text-muted-foreground">Assessment date</p>
                  <p className="font-medium text-foreground">{fmt(r.assessmentDate)}</p>
                </div>
                <div className="rounded-md bg-muted/40 px-2.5 py-1.5">
                  <p className="text-muted-foreground">Expected return</p>
                  <p className="font-medium text-foreground">{fmt(r.expectedReturnDate)}</p>
                </div>
                <div className="rounded-md bg-muted/40 px-2.5 py-1.5">
                  <p className="text-muted-foreground">Fitness status</p>
                  <p className="font-medium text-foreground">
                    {OH_FITNESS_LABELS[r.fitnessStatus]}
                  </p>
                </div>
              </div>
              {r.recommendedAdjustments.length > 0 ? (
                <ul className="mt-2 flex flex-col gap-1">
                  {r.recommendedAdjustments.map((a) => (
                    <li
                      key={a}
                      className="flex items-start gap-1.5 text-[11px] text-foreground"
                    >
                      <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  No recommendations yet — awaiting assessment.
                </p>
              )}
              {r.caseNotes && (
                <p className="mt-2 text-[11px] text-muted-foreground">{r.caseNotes}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OccupationalHealthPage() {
  const referrals = OH_REFERRALS;
  const open = referrals.filter((r) => r.status !== "closed").length;
  const awaitingReferral = referrals.filter(
    (r) => r.status === "threshold_reached" || r.status === "hr_alerted",
  ).length;
  const inAssessment = referrals.filter(
    (r) => r.status === "referred" || r.status === "assessment_completed",
  ).length;
  const withAdjustments = referrals.filter(
    (r) => r.recommendedAdjustments.length > 0 && r.status !== "closed",
  ).length;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6">
        <h1 className="text-4xl font-semibold text-foreground">Occupational Health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage formal Occupational Health referrals — fitness for work and workplace
          adjustments. Referrals are triggered automatically after{" "}
          {OH_REFERRAL_THRESHOLD_DAYS} days of continuous absence.
        </p>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/25 bg-blue-500/5 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" />
        <p className="text-xs text-foreground">
          <span className="font-semibold">Confidential by design.</span> Occupational Health
          records store fitness-for-work status and recommended workplace adjustments only.
          Clinical diagnoses are never requested, stored, or shown — managers see adjustments,
          not medical detail.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Stat label="Open cases" value={open} />
        <Stat label="Awaiting referral" value={awaitingReferral} />
        <Stat label="In assessment" value={inAssessment} />
        <Stat label="Adjustments in place" value={withAdjustments} />
        <Stat label="Total cases" value={referrals.length} />
      </div>

      <div className="flex flex-col gap-3">
        {referrals.map((r) => (
          <ReferralCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}

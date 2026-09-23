"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock, Scale, ShieldAlert, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";
import {
  ADJUSTMENT_STATUS_LABELS,
  ADJUSTMENT_STATUS_STYLES,
  OH_FITNESS_LABELS,
  OH_FITNESS_STYLES,
  OH_STAGES,
  ohStageIndex,
} from "@/src/lib/types/occupational-health";
import { OH_REFERRALS } from "@/src/data/occupational-health-demo";
import { fmt, useCanViewConfidentialOH } from "./lib";

export function OccupationalHealthCaseDetail({ caseId }: { caseId: string }) {
  const referral = OH_REFERRALS.find((r) => r.id === caseId);
  const confidential = useCanViewConfidentialOH();

  if (!referral) notFound();

  const stageIdx = ohStageIndex(referral.status);

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6">
        <Link
          href="/time-payroll/occupational-health"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to Occupational Health
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold text-foreground">{referral.employeeName}</h1>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium",
              OH_FITNESS_STYLES[referral.fitnessStatus],
            )}
          >
            {OH_FITNESS_LABELS[referral.fitnessStatus]}
          </span>
          {referral.equalityActConsidered && (
            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-600">
              <Scale className="size-3" /> Reasonable adjustments consideration
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {referral.department}
          {" · "}
          {referral.status === "closed"
            ? `Returned to work: ${fmt(referral.expectedReturnDate)}`
            : `Absence since ${fmt(referral.absenceStartDate)}`}
        </p>
      </div>

      {!confidential && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <p className="text-xs text-foreground">
            <span className="font-semibold">Manager view.</span> You're seeing fitness status,
            recommended adjustments and the review date only. Case notes, referral/assessment
            dates and history are restricted to HR/OH admins.
          </p>
        </div>
      )}

      {referral.nextAction && referral.status !== "closed" && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Next action: {referral.nextAction.label}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <User className="size-3.5" /> Owner: {referral.nextAction.owner}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" /> Due {fmt(referral.nextAction.due)}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* State machine — always shown, it's stage/status not confidential detail. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Case workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2">
              {OH_STAGES.map((s, i) => {
                const done = i < stageIdx;
                const active = i === stageIdx;
                return (
                  <li key={s.key} className="flex items-center gap-2 text-xs">
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
                    <span className={active ? "font-semibold text-foreground" : "text-muted-foreground"}>
                      {s.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>

        {/* §10.5 — Adjustments get their own management area, not just a count. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Workplace adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            {referral.adjustments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No adjustments recommended yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {referral.adjustments.map((a) => (
                  <div key={a.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">{a.description}</p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                          ADJUSTMENT_STATUS_STYLES[a.status],
                        )}
                      >
                        {ADJUSTMENT_STATUS_LABELS[a.status]}
                      </span>
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                      <div>
                        <dt className="text-muted-foreground">Date recommended</dt>
                        <dd className="text-foreground">{fmt(a.dateRecommended)}</dd>
                      </div>
                      {confidential && (
                        <>
                          <div>
                            <dt className="text-muted-foreground">Agreed by</dt>
                            <dd className="text-foreground">{a.agreedBy ?? "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Implementation owner</dt>
                            <dd className="text-foreground">{a.implementationOwner ?? "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground">Effective date</dt>
                            <dd className="text-foreground">{fmt(a.effectiveDate)}</dd>
                          </div>
                        </>
                      )}
                      <div>
                        <dt className="text-muted-foreground">Review date</dt>
                        <dd className="text-foreground">{fmt(a.reviewDate)}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confidential-only: dates, case notes and full timeline. */}
      {confidential ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-md bg-muted/40 px-3 py-2 text-xs">
              <p className="text-muted-foreground">Referral date</p>
              <p className="font-medium text-foreground">{fmt(referral.referralDate)}</p>
            </div>
            <div className="rounded-md bg-muted/40 px-3 py-2 text-xs">
              <p className="text-muted-foreground">Assessment date</p>
              <p className="font-medium text-foreground">{fmt(referral.assessmentDate)}</p>
            </div>
            <div className="rounded-md bg-muted/40 px-3 py-2 text-xs">
              <p className="text-muted-foreground">Expected/actual return</p>
              <p className="font-medium text-foreground">{fmt(referral.expectedReturnDate)}</p>
            </div>
            <div className="rounded-md bg-muted/40 px-3 py-2 text-xs">
              <p className="text-muted-foreground">Review date</p>
              <p className="font-medium text-foreground">{fmt(referral.reviewDate)}</p>
            </div>
          </div>

          {referral.caseNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Case notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{referral.caseNotes}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timeline & audit history</CardTitle>
            </CardHeader>
            <CardContent>
              {!referral.history || referral.history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No history recorded yet.</p>
              ) : (
                <ol className="flex flex-col gap-3 border-l border-border pl-4">
                  {referral.history.map((h) => (
                    <li key={h.id} className="relative text-xs">
                      <span className="absolute -left-5.25 top-0.5 size-2 rounded-full bg-primary" />
                      <p className="font-medium text-foreground">{h.note}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {fmt(h.at)} · {h.actorName}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Referral/assessment dates, case notes and full timeline are only shown to HR/OH admins.
        </p>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Users } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { RaciStrip, type RaciPerson } from "@/src/components/shared/raci-strip";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { STAGE_TYPE_LABELS } from "@/src/data/recruitment-demo";
import { isSyntheticVacancyId } from "@/src/lib/demo/hiring-chain";
import {
  buildStageFacts,
  HIRING_STAGES,
  STALL_DAYS,
} from "@/src/lib/hiring/resolve-stage";
import { cn } from "@/src/lib/utils";
import { useHiringChainSeed, useHiringDetail } from "../hooks";
import { StageTimeline } from "../components/stage-timeline";

const STAGE_LABELS = new Map(HIRING_STAGES.map((s) => [s.id, s.label]));

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm text-foreground">{value || "—"}</div>
    </div>
  );
}

/**
 * One hiring effort, end to end.
 *
 * The tracker list answers "what stage is this on"; this answers the two
 * questions that immediately follow — how it got here, and what the role
 * actually is — without making anyone open four modules to assemble it.
 */
export function HireTrackerDetailPage({ id }: { id: string }) {
  const router = useRouter();
  // Ancestors must exist before the chain can be walked.
  useHiringChainSeed();
  const detail = useHiringDetail(id);

  const facts = useMemo(
    () => (detail ? buildStageFacts(detail) : []),
    [detail],
  );

  if (!detail) {
    return (
      <div className="flex flex-col gap-5">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 w-fit gap-1.5 text-muted-foreground"
          onClick={() => router.push("/talent/hire-tracker")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Hire Tracker
        </Button>
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm font-medium">That hiring effort no longer exists</p>
          <p className="mt-1 text-xs text-muted-foreground">
            It may have been completed and cleared into Employees.
          </p>
        </div>
      </div>
    );
  }

  const { row, workforceRequest, requisition, vacancy, candidates, onboarding } =
    detail;
  // A hire entered by hand has no requisition behind it, so the record itself
  // is the only source for what the role is.
  const record = onboarding[0];
  /**
   * A back-filled vacancy exists only in the tracker, so it has no page in
   * Recruitment to link to. Treating it as "no real vacancy" keeps every
   * control on this page pointing at something that actually opens.
   */
  const realVacancy = isSyntheticVacancyId(vacancy?.id) ? undefined : vacancy;

  const byStage = {
    applicants: candidates.filter((c) => c.stage === "applicants").length,
    interview: candidates.filter((c) => c.stage === "interview").length,
    interviewed: candidates.filter((c) => c.stage === "interviewed").length,
    offer: candidates.filter((c) => c.stage === "offer").length,
    hired: candidates.filter((c) => c.stage === "hired").length,
  };
  const active = candidates.filter((c) => c.status === "active").length;

  const budget =
    requisition?.budgetAllocation ?? workforceRequest?.budgetEstimate ?? 0;
  const openings =
    vacancy?.openings ??
    requisition?.numberOfPositions ??
    workforceRequest?.numberOfHires ??
    (record ? 1 : undefined);
  const startDate =
    vacancy?.targetStartDate ?? requisition?.startDate ?? record?.startDate;
  const salaryBand =
    vacancy || requisition
      ? `${formatMoneyLocale(
          vacancy?.salaryMin ?? requisition?.salaryMin ?? 0,
        )} - ${formatMoneyLocale(
          vacancy?.salaryMax ?? requisition?.salaryMax ?? 0,
        )}`
      : undefined;

  const people: RaciPerson[] = [
    ...(workforceRequest
      ? [{ slot: "Requester" as const, name: workforceRequest.createdByName }]
      : []),
    ...(vacancy?.hiringManager || requisition?.hiringManager
      ? [
          {
            slot: "Hiring Manager" as const,
            name: (vacancy?.hiringManager || requisition?.hiringManager)!,
            employeeId: vacancy?.hiringManagerId,
          },
        ]
      : []),
    ...(vacancy?.recruiter || requisition?.recruiter
      ? [
          {
            slot: "Recruiter" as const,
            name: (vacancy?.recruiter || requisition?.recruiter)!,
            employeeId: vacancy?.recruiterId,
          },
        ]
      : []),
    { slot: "Owner", name: row.owner, note: row.detail },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit gap-1.5 text-muted-foreground"
        onClick={() => router.push("/talent/hire-tracker")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Hire Tracker
      </Button>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-semibold text-foreground">{row.title}</h1>
          <Badge variant="outline" className="text-[11px] font-medium">
            {row.step}. {STAGE_LABELS.get(row.stageId)}
          </Badge>
          {row.stalled && (
            <Badge
              variant="outline"
              className="gap-1 border-rose-500/30 bg-rose-500/10 text-[11px] text-rose-600 dark:text-rose-400"
            >
              <Clock className="h-3 w-3" />
              Stalled {row.days}d
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {row.department}
          {row.person ? ` · ${row.person}` : ""}
        </p>
      </div>

      <RaciStrip
        people={people}
        waitingOn={
          row.days >= STALL_DAYS ? { name: row.owner, days: row.days } : null
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        {/* Left: what the role actually is. */}
        <div className="flex flex-col gap-4 lg:h-full">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="text-sm font-semibold">Recruitment details</h2>
                <p className="text-xs text-muted-foreground">
                  {requisition
                    ? "Carried through from the approved requisition."
                    : record
                      ? "From the onboarding record - this hire skipped recruitment."
                      : "From the workforce request."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Fact label="Openings" value={openings} />
                <Fact
                  label="Budget"
                  value={budget > 0 ? formatMoneyLocale(budget) : "—"}
                />
                <Fact label="Salary band" value={salaryBand} />
                <Fact
                  label="Location"
                  value={vacancy?.location ?? requisition?.location}
                />
                <Fact label="Start date" value={startDate} />
                <Fact
                  label="Department"
                  value={
                    vacancy?.department ??
                    requisition?.department ??
                    record?.department
                  }
                />
                {workforceRequest?.costCentreCode && (
                  <Fact label="Cost centre" value={workforceRequest.costCentreCode} />
                )}
                <Fact label="Idle" value={`${row.days} days`} />
              </div>

              {(vacancy?.qualifications || requisition?.qualifications) && (
                <div className="space-y-0.5 border-t pt-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Requirements
                  </p>
                  <p className="text-sm text-foreground">
                    {vacancy?.qualifications ?? requisition?.qualifications}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* The pipeline, and the way into it. The card grows so the two
              columns finish level rather than leaving a ragged gap. */}
          <Card className="flex-1">
            <CardContent className="flex h-full flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {realVacancy ? "Applicants" : "This hire"}
                </h2>
                {realVacancy && (
                  <Badge variant="outline" className="text-[11px]">
                    {active} active
                  </Badge>
                )}
              </div>

              {!realVacancy && record ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{record.employeeName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Entered as</span>
                    <span className="font-medium capitalize">
                      {record.mode ?? "manual"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tasks done</span>
                    <span className="font-medium tabular-nums">
                      {record.completedTasks}/{record.totalTasks}
                    </span>
                  </div>
                </div>
              ) : candidates.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No applicants yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {(
                    Object.keys(byStage) as (keyof typeof byStage)[]
                  ).map((stage) => (
                    <li
                      key={stage}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-muted-foreground">
                        {STAGE_TYPE_LABELS[stage]}
                      </span>
                      <span
                        className={cn(
                          "tabular-nums",
                          byStage[stage] > 0
                            ? "font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {byStage[stage]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                className="mt-auto w-full"
                disabled={!realVacancy && !record}
                asChild={Boolean(realVacancy || record)}
              >
                {realVacancy ? (
                  <Link href={`/talent/recruitment/${realVacancy.id}`}>
                    <Users className="h-4 w-4" />
                    View applicants
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : record ? (
                  <Link href={`/talent/onboarding/${record.id}`}>
                    <Users className="h-4 w-4" />
                    Open onboarding record
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span>
                    <Users className="h-4 w-4" />
                    No vacancy published yet
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: how it got here. */}
        <div>
          <h2 className="mb-3 text-sm font-semibold">Recruitment timeline</h2>
          <StageTimeline facts={facts} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { Skeleton } from "@/src/components/ui/skeleton";
import { cn } from "@/src/lib/utils";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { applyCollection } from "@/src/lib/profile/collection-edits";
import { COMPLETION_TARGET } from "@/src/lib/profile/completion";
import { useWorkforceDataQuality } from "@/src/lib/profile/use-completion";
import { summariseCertifications } from "@/src/lib/certifications/status";
import { mandatoryCompliance } from "@/src/lib/learning/mandatory-compliance";
import { employeeProfileHref } from "@/src/components/shared/employee-link";
import { useLearning } from "@/src/components/hr/learning/hooks";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { LOANS_HREF, summariseLoans } from "@/src/lib/loans/loans";
import { useLoans } from "@/src/lib/loans/use-loans";
import { Tile, TileLabel, TileSub, TileNum, TileLink } from "./tiles";

const TRAINING_HREF = "/talent/training";

/** A label/value line under a tile's headline figure. */
function Fact({
  label,
  value,
  tone,
}: {
  label: string;
  value: ReactNode;
  tone?: "bad" | "warn" | "good";
}) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-medium tabular-nums",
          tone === "bad" && "text-red-600",
          tone === "warn" && "text-amber-600",
          tone === "good" && "text-emerald-600",
        )}
      >
        {value}
      </span>
    </div>
  );
}

const pctTone = (n: number) => (n >= 90 ? "text-emerald-600" : n >= COMPLETION_TARGET ? "text-amber-600" : "text-red-600");

/**
 * Employee Data Quality — how complete and audit-ready employee records are.
 * The lowest profiles link straight to the record that needs fixing.
 */
export function DataQualityTile() {
  const quality = useWorkforceDataQuality();
  if (!quality) return <Skeleton className="h-56 w-full rounded-xl" />;
  const { summary, rows } = quality;
  const lowest = rows.filter((r) => r.completion.score < 100).slice(0, 3);

  return (
    <Tile>
      <TileLabel>Employee data quality</TileLabel>
      <TileSub>Average profile completion · {summary.profiles} current employees</TileSub>
      <TileNum className={pctTone(summary.averageCompletion)}>{summary.averageCompletion}%</TileNum>
      <div className="mt-2">
        <Fact
          label={`Profiles below ${COMPLETION_TARGET}%`}
          value={summary.belowTarget}
          tone={summary.belowTarget ? "bad" : "good"}
        />
        <Fact
          label="Profiles missing documents"
          value={summary.missingDocuments}
          tone={summary.missingDocuments ? "warn" : "good"}
        />
      </div>
      {lowest.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Least complete
          </p>
          {lowest.map(({ employee, completion }) => (
            <Link
              key={employee.id}
              href={employeeProfileHref(employee.id)}
              className="flex items-center justify-between gap-2 text-xs hover:text-primary"
              title={`Missing: ${completion.missing.map((m) => m.label).join(", ")}`}
            >
              <span className="truncate">{employee.fullName}</span>
              <span className={cn("tabular-nums font-medium", pctTone(completion.score))}>
                {completion.score}%
              </span>
            </Link>
          ))}
        </div>
      )}
      <TileLink href="/organization/employees">View employees</TileLink>
    </Tile>
  );
}

function useLearningCompliance() {
  const { data, loading } = useLearning();
  const edits = useAppSelector((s) => s.collectionEdits);
  const result = useMemo(() => {
    if (!data) return null;
    const inScope = new Set(data.people.map((p) => p.id));
    const certs = applyCollection(data.certifications, "learning.certifications", edits).filter(
      (c) => inScope.has(c.employeeId),
    );
    const mandatoryCourses = data.courses.filter((c) => c.mandatory && c.status !== "archived");
    return {
      certs: summariseCertifications(certs),
      mandatory: mandatoryCompliance(data.people, mandatoryCourses, data.enrollments),
    };
  }, [data, edits]);
  return { data: result, loading };
}

/** Certification renewals: what has lapsed and what is about to. */
export function CertificationComplianceTile() {
  const { data } = useLearningCompliance();
  if (!data) return <Skeleton className="h-56 w-full rounded-xl" />;
  const c = data.certs;
  return (
    <Tile>
      <TileLabel>Certification compliance</TileLabel>
      <TileSub>Share of certifications still valid</TileSub>
      <TileNum className={pctTone(c.complianceRate)}>{c.complianceRate}%</TileNum>
      <div className="mt-2">
        <Fact label="Active certifications" value={c.active} tone="good" />
        <Fact label="Expiring in 30 days" value={c.expiringIn30} tone={c.expiringIn30 ? "bad" : undefined} />
        <Fact label="Expiring in 90 days" value={c.expiringIn90} tone={c.expiringIn90 ? "warn" : undefined} />
        <Fact label="Expired" value={c.expired} tone={c.expired ? "bad" : "good"} />
      </div>
      <TileLink href={TRAINING_HREF}>Open certification register</TileLink>
    </Tile>
  );
}

/** Mandatory training — completion, who is overdue, which departments lag. */
export function MandatoryTrainingTile() {
  const { data } = useLearningCompliance();
  if (!data) return <Skeleton className="h-56 w-full rounded-xl" />;
  const m = data.mandatory;
  return (
    <Tile>
      <TileLabel>Mandatory training</TileLabel>
      <TileSub>Completion across mandatory courses</TileSub>
      <TileNum className={pctTone(m.completionRate)}>{m.completionRate}%</TileNum>
      <div className="mt-2">
        <Fact label="Employees overdue" value={m.employeesOverdue} tone={m.employeesOverdue ? "bad" : "good"} />
        <Fact label="Departments at risk" value={m.departmentsAtRisk} tone={m.departmentsAtRisk ? "warn" : "good"} />
      </div>
      {m.departments.some((d) => d.atRisk) && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          At risk:{" "}
          {m.departments
            .filter((d) => d.atRisk)
            .map((d) => `${d.department} (${d.rate}%)`)
            .join(", ")}
        </p>
      )}
      <TileLink href={TRAINING_HREF}>View compliance</TileLink>
    </Tile>
  );
}

/** Employee Loans at a glance — the loan book HR is tracking. */
export function LoansTile() {
  const { rows, loading } = useLoans();
  const { format } = useCurrency();
  const summary = useMemo(() => summariseLoans(rows), [rows]);
  if (loading && rows.length === 0) return <Skeleton className="h-56 w-full rounded-xl" />;
  return (
    <Tile>
      <TileLabel>Employee loans</TileLabel>
      <TileSub>Outstanding across active & defaulted loans</TileSub>
      <TileNum>{format(summary.outstanding, { compact: true })}</TileNum>
      <div className="mt-2">
        <Fact label="Total active loans" value={summary.activeLoans} />
        <Fact label="Loan value" value={format(summary.loanValue, { compact: true })} />
        <Fact label="Loans due this month" value={summary.dueThisMonth} />
        <Fact label="Awaiting approval" value={summary.pending} tone={summary.pending ? "warn" : undefined} />
      </div>
      <TileLink href={LOANS_HREF}>Open loan register</TileLink>
    </Tile>
  );
}

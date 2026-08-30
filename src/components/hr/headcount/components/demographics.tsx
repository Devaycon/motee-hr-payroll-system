"use client";

import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import { GenderSplitBreakdown } from "@/src/components/shared/gender-figures";
import {
  SUPPRESSION_THRESHOLD,
  type SuppressedBreakdown,
} from "@/src/lib/types/diversity";
import type { DiversityReport } from "../use-diversity";
import type { DemographicsItem } from "../types";

interface DemographicsCardProps {
  title: string;
  items: DemographicsItem[];
  emptyText?: string;
}

/**
 * Gender, drawn as pictograms instead of the bar rows every other breakdown
 * uses — the same treatment as the HR dashboard, so the two agree.
 *
 * `percentage` is recomputed here rather than trusted: the hook fills it for
 * some breakdowns and leaves it undefined for others, and a figure captioned
 * "0%" beside a real headcount would be worse than no figure.
 */
function GenderSection({ items }: { items: DemographicsItem[] }) {
  if (items.length === 0) return null;

  const total = items.reduce((sum, i) => sum + (i.count ?? 0), 0);
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-medium">By Gender</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-5">
        <GenderSplitBreakdown
          items={items.map((i) => ({
            label: i.label,
            count: i.count ?? 0,
            percentage: Math.round(((i.count ?? 0) / total) * 100),
          }))}
          total={total}
        />
      </CardContent>
    </Card>
  );
}

function DemographicsCard({ title, items, emptyText }: DemographicsCardProps) {
  const maxCount = Math.max(...items.map((i) => i.count ?? 0), 1);

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {items.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {emptyText ?? "No data available"}
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <DemographicsRow
                key={item.label}
                item={item}
                maxCount={maxCount}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * One segment of a breakdown. When the hook supplied an `href`, the row links
 * through to that filtered employee list (client feedback §6.25).
 */
function DemographicsRow({
  item,
  maxCount,
}: {
  item: DemographicsItem;
  maxCount: number;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-medium text-foreground">
          {item.label}
          {item.href && (
            <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {item.count ?? 0} · {item.percentage ?? 0}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary/60"
          style={{ width: `${((item.count ?? 0) / maxCount) * 100}%` }}
        />
      </div>
    </>
  );

  if (!item.href) {
    return <div className="space-y-1">{body}</div>;
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "group block space-y-1 rounded-sm",
        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      title={`View ${item.label} employees`}
    >
      {body}
    </Link>
  );
}

interface DemographicsProps {
  employmentType: DemographicsItem[];
  tenure: DemographicsItem[];
  department: DemographicsItem[];
  status: DemographicsItem[];
  // §6.23 — read straight off the employee record.
  age: DemographicsItem[];
  gender: DemographicsItem[];
  grade: DemographicsItem[];
  location: DemographicsItem[];
  /** §6.23 — self-declared D&I, already suppressed and aggregated. */
  diversity: DiversityReport;
}

/**
 * Workforce breakdown, grouped into the sections the client asked for (§6.26),
 * expanded with the employee-profile and D&I dimensions from §6.23.
 */
export function Demographics({
  employmentType,
  tenure,
  department,
  status,
  age,
  gender,
  grade,
  location,
  diversity,
}: DemographicsProps) {
  return (
    <div className="flex flex-col gap-6">
      <Section title="Workforce Composition">
        <DemographicsCard title="By Employment Type" items={employmentType} />
        <DemographicsCard title="By Employment Status" items={status} />
      </Section>

      <Section title="Workforce Distribution">
        <DemographicsCard title="By Department" items={department} />
        <DemographicsCard title="By Work Location" items={location} />
      </Section>

      <Section title="Workforce Trends">
        <DemographicsCard title="By Tenure Range" items={tenure} />
      </Section>

      {/* Gender is drawn as figures rather than bars — see
          `shared/gender-figures`. It sits outside the two-column Section grid
          because the pictograms need the full width and height. */}
      <GenderSection items={gender} />

      <Section title="Employee Profile">
        <DemographicsCard title="By Age Band" items={age} />
        <DemographicsCard title="By Job Grade" items={grade} />
      </Section>

      <DiversitySection report={diversity} />
    </div>
  );
}

/**
 * §6.23 — self-declared diversity data.
 *
 * Kept visually distinct from the rest of the page because it behaves
 * differently: it is voluntary, incomplete by design, and suppressed. Reading
 * it like the other cards would invite false conclusions from partial data,
 * so the declaration rate is stated before any of the breakdowns.
 */
function DiversitySection({ report }: { report: DiversityReport }) {
  const hasAnything = report.breakdowns.some(
    (b) => b.breakdown.rows.length > 0,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Diversity &amp; Inclusion
        </h3>
        <Badge variant="outline" className="gap-1 text-[10px]">
          <ShieldCheck className="h-2.5 w-2.5" />
          Self-declared · anonymised
        </Badge>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
        <p className="text-xs text-foreground">
          <span className="font-medium">
            {report.declaredAny} of {report.eligible} employees
          </span>{" "}
          ({report.ratePercent}%) have chosen to answer.
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Groups of fewer than {SUPPRESSION_THRESHOLD} people are withheld so
          individuals cannot be identified. Percentages are of those who
          answered, not of the whole workforce — treat low response rates with
          caution.
        </p>
      </div>

      {!hasAnything ? (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Nothing can be reported yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            {report.declaredAny === 0
              ? "No employees have completed a declaration."
              : `Every group is currently below the ${SUPPRESSION_THRESHOLD}-person reporting threshold.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {report.breakdowns.map(({ category, breakdown }) => (
            <SuppressedCard
              key={category.key}
              title={category.label}
              breakdown={breakdown}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SuppressedCard({
  title,
  breakdown,
}: {
  title: string;
  breakdown: SuppressedBreakdown;
}) {
  const maxCount = Math.max(...breakdown.rows.map((r) => r.count), 1);

  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {breakdown.rows.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {breakdown.declared === 0
              ? "No responses yet"
              : "All groups below the reporting threshold"}
          </p>
        ) : (
          <div className="space-y-3">
            {breakdown.rows.map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {row.label}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {row.count} · {row.percentage}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {breakdown.suppressedCount > 0 && (
          <p className="mt-3 border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
            {breakdown.suppressedCount} response
            {breakdown.suppressedCount === 1 ? "" : "s"} across{" "}
            {breakdown.suppressedGroups} group
            {breakdown.suppressedGroups === 1 ? "" : "s"} withheld to protect
            anonymity.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { DimensionPicker } from "./components/dimension-picker";
import { LensFilterBar } from "./components/lens-filter-bar";
import { LensGroups } from "./components/lens-groups";
import { useWorkforceLens } from "./hooks";
import {
  ALL,
  LENS_DIMENSIONS,
  LENS_LIFECYCLES,
  DEFAULT_LENS_FILTERS,
  isLensDimension,
  type LensDimension,
  type LensFilters,
  type LensLifecycle,
} from "@/src/lib/workforce-lens/group";
import { SUPPRESSION_THRESHOLD } from "@/src/lib/types/diversity";

/**
 * Seed the filters once from the URL so the Employees page can hand its
 * current view across (same pattern as the Employees page itself).
 */
function filtersFromParams(params: URLSearchParams): LensFilters {
  const lifecycle = params.get("lifecycle");
  return {
    ...DEFAULT_LENS_FILTERS,
    lifecycle: LENS_LIFECYCLES.some((l) => l.value === lifecycle)
      ? (lifecycle as LensLifecycle)
      : DEFAULT_LENS_FILTERS.lifecycle,
    employmentType: params.get("employmentType") ?? ALL,
    branch: params.get("branch") ?? ALL,
    department: params.get("department") ?? ALL,
  };
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function WorkforceLensPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<LensFilters>(() =>
    filtersFromParams(searchParams),
  );
  const [dimension, setDimension] = useState<LensDimension>(() => {
    const group = searchParams.get("group");
    return isLensDimension(group) ? group : "department";
  });

  const { loading, total, groups, ethnicity, ethnicityAvailable } =
    useWorkforceLens(filters, dimension);

  const dimensions = useMemo(
    () =>
      LENS_DIMENSIONS.filter((d) => d.key !== "ethnicity" || ethnicityAvailable),
    [ethnicityAvailable],
  );
  // A deep link to a dimension this tenant doesn't have falls back gracefully.
  const activeKey = dimensions.some((d) => d.key === dimension)
    ? dimension
    : "department";
  const meta = dimensions.find((d) => d.key === activeKey)!;
  const largest = groups[0];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6">
        <Link
          href="/organization/employees"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Employees
        </Link>
        <h1 className="text-4xl font-bold text-foreground">Workforce Lens</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Look at your people through any lens: skill, country, department and
          more.
        </p>
      </div>

      <DimensionPicker
        dimensions={dimensions}
        value={activeKey}
        onChange={setDimension}
      />

      <LensFilterBar filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryTile label="People" value={total} hint="matching your filters" />
        <SummaryTile
          label={`${meta.label} groups`}
          value={groups.length}
          hint={
            meta.multiValue
              ? "people can sit in more than one"
              : "each person in exactly one"
          }
        />
        <SummaryTile
          label="Largest group"
          value={largest ? largest.label : "—"}
          hint={largest ? `${largest.count} · ${largest.pct}%` : undefined}
        />
      </div>

      {groups.length > 0 ? (
        <LensGroups groups={groups} />
      ) : (
        <EmptyState aggregateOnly={meta.aggregateOnly} noPeople={total === 0} />
      )}

      {meta.multiValue && groups.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Anyone with more than one {meta.label.toLowerCase()} appears on each
          matching card, so percentages can add up to more than 100%.
        </p>
      )}

      {meta.aggregateOnly && ethnicity && groups.length > 0 && (
        <PrivacyNote suppressed={ethnicity.suppressedCount} />
      )}
    </div>
  );
}

function EmptyState({
  aggregateOnly,
  noPeople,
}: {
  aggregateOnly?: boolean;
  noPeople: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card py-20 text-center">
      <p className="text-sm font-medium">
        {noPeople
          ? "No one matches these filters"
          : aggregateOnly
            ? "Nothing to show yet"
            : "No data for this grouping"}
      </p>
      <p className="max-w-md text-xs text-muted-foreground">
        {noPeople
          ? "Try widening the lifecycle, team or location."
          : aggregateOnly
            ? `Ethnicity is self-declared and only shown in groups of ${SUPPRESSION_THRESHOLD} or more, so nothing can point at one person.`
            : "None of these people have a value recorded for it."}
      </p>
    </div>
  );
}

function PrivacyNote({ suppressed }: { suppressed: number }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
      <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Self-declared and shown as totals only. Groups under{" "}
        {SUPPRESSION_THRESHOLD} people are hidden
        {suppressed > 0 ? ` (${suppressed} not shown)` : ""}, and percentages
        are of people who answered.
      </span>
    </p>
  );
}

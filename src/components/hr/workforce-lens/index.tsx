"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ExportMenu } from "@/src/components/shared/export-menu";
import { DimensionPicker } from "./components/dimension-picker";
import { LensFilterBar } from "./components/lens-filter-bar";
import { LensGroups } from "./components/lens-groups";
import { useWorkforceLens } from "./hooks";
import {
  ALL,
  LENS_DIMENSIONS,
  LENS_LIFECYCLES,
  DEFAULT_LENS_FILTERS,
  NO_VALUE,
  isLensDimension,
  type LensDimension,
  type LensFilters,
  type LensGroup,
  type LensLifecycle,
  type LensMember,
} from "@/src/lib/workforce-lens/group";
import { SUPPRESSION_THRESHOLD } from "@/src/lib/types/diversity";
import { employmentTypeLabel } from "@/src/lib/constants/employment-types";
import { employeeStatusLabel } from "@/src/lib/utils/employee-status";
import type { ReportColumn } from "@/src/lib/reports/types";

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

  // Every person, deduped, from whichever groups the current dimension
  // produced — covers multi-value dimensions (skill) without duplicating a
  // roster row per group. Aggregate-only dimensions (ethnicity) never carry
  // members, so this — and the roster export it feeds — comes back empty
  // rather than reconstructing individuals from suppressed counts.
  const rosterMembers = useMemo(() => {
    const seen = new Map<string, LensMember>();
    for (const g of groups) {
      if (g.aggregateOnly) continue;
      for (const m of g.members) seen.set(m.id, m);
    }
    return [...seen.values()];
  }, [groups]);

  /** Which group label(s) each person falls under, for the roster's dimension column. */
  const dimensionByMember = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const g of groups) {
      if (g.aggregateOnly) continue;
      for (const m of g.members) {
        const arr = map.get(m.id) ?? [];
        arr.push(g.label);
        map.set(m.id, arr);
      }
    }
    return map;
  }, [groups]);

  const summaryColumns = useMemo<ReportColumn<LensGroup>[]>(
    () => [
      { key: "label", header: meta.label, value: (g) => g.label },
      { key: "count", header: "People", value: (g) => g.count },
      {
        key: "pct",
        header: meta.aggregateOnly ? "% of those who answered" : "% of people",
        value: (g) => `${g.pct}%`,
      },
    ],
    [meta.label, meta.aggregateOnly],
  );

  const rosterColumns = useMemo<ReportColumn<LensMember>[]>(
    () => [
      { key: "name", header: "Name", value: (m) => m.name },
      { key: "jobTitle", header: "Job Title", value: (m) => m.jobTitle },
      { key: "department", header: "Department", value: (m) => m.department },
      {
        key: "dimension",
        header: meta.label,
        value: (m) => (dimensionByMember.get(m.id) ?? []).join(", ") || NO_VALUE,
      },
      {
        key: "employmentType",
        header: "Employment Type",
        value: (m) => employmentTypeLabel(m.employmentType),
      },
      {
        key: "branch",
        header: "Location",
        value: (m) => m.branchName ?? m.city ?? "—",
      },
      { key: "country", header: "Country", value: (m) => m.country ?? "—" },
      { key: "grade", header: "Grade", value: (m) => m.grade ?? "—" },
      { key: "gender", header: "Gender", value: (m) => m.gender ?? "—" },
      {
        key: "status",
        header: "Status",
        value: (m) => employeeStatusLabel(m.status),
      },
    ],
    [meta.label, dimensionByMember],
  );

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
      <div className="flex flex-wrap items-start justify-between gap-4 py-6">
        <div>
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

        {/* Two export targets: the group-level summary (always available,
            even for the privacy-suppressed Ethnicity dimension) and the
            underlying roster (hidden there, since aggregate-only groups carry
            no members to list). */}
        <div className="flex shrink-0 items-center gap-2">
          <ExportMenu
            name={`workforce-lens-${activeKey}-summary`}
            title={`Workforce Lens — ${meta.label} breakdown`}
            columns={summaryColumns}
            rows={groups}
            label={`Export ${groups.length} group${groups.length === 1 ? "" : "s"}`}
            buttonLabel="Export Summary"
            variant="outline"
            buttonClassName="h-9 text-xs"
          />
          {!meta.aggregateOnly && (
            <ExportMenu
              name={`workforce-lens-${activeKey}-roster`}
              title={`Workforce Lens — ${meta.label} roster`}
              columns={rosterColumns}
              rows={rosterMembers}
              label={`Export ${rosterMembers.length} ${rosterMembers.length === 1 ? "person" : "people"}`}
              buttonLabel="Export Roster"
              variant="outline"
              buttonClassName="h-9 text-xs"
            />
          )}
        </div>
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

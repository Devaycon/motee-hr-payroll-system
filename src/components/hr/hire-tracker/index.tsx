"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, GitBranch, UserCheck, Users } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import {
  HIRING_STAGES,
  STALL_DAYS,
  type HiringRow,
} from "@/src/lib/hiring/resolve-stage";
import { cn } from "@/src/lib/utils";
import { useHiringChainSeed, useHiringRows } from "./hooks";

const STAGE_LABELS = new Map(HIRING_STAGES.map((s) => [s.id, s.label]));

/**
 * One row per hiring effort, across all six hiring stages.
 *
 * The chain lives in five separate slices and five separate screens, so
 * "what stage is this recruitment on?" previously meant opening Workforce
 * Requests, Requisition, Recruitment and Onboarding and matching them up by
 * job title. This is the join; the per-stage detail lives on the row's own
 * page rather than being crammed into a column here.
 */
export function HireTrackerPage() {
  const router = useRouter();
  // Every vacancy gets its requisition and workforce request before we list.
  useHiringChainSeed();
  const rows = useHiringRows();
  const [stageFilter, setStageFilter] = useState("all");
  const [stalledOnly, setStalledOnly] = useState(false);
  /** Set by the "Being Filled" / "Joining" KPI cards — a step range rather
   *  than a single stage, so it lives outside the stage dropdown. */
  const [quickFilter, setQuickFilter] = useState<"filling" | "joining" | null>(
    null,
  );

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        if (stageFilter !== "all" && row.stageId !== stageFilter) return false;
        if (stalledOnly && !row.stalled) return false;
        if (quickFilter === "filling" && !(row.step >= 3 && row.step <= 4))
          return false;
        if (quickFilter === "joining" && row.step < 5) return false;
        return true;
      }),
    [rows, stageFilter, stalledOnly, quickFilter],
  );

  const stalled = rows.filter((r) => r.stalled).length;
  const filling = rows.filter((r) => r.step >= 3 && r.step <= 4).length;
  const joining = rows.filter((r) => r.step >= 5).length;

  const cards: HrStatCardItem[] = [
    {
      label: "Hires In Flight",
      value: rows.length,
      sub: "Across all six stages",
      zeroSub: "Nothing in the hiring pipeline",
      icon: GitBranch,
      tone: "violet",
      active: stageFilter === "all" && !stalledOnly && !quickFilter,
      onClick: () => {
        setStageFilter("all");
        setStalledOnly(false);
        setQuickFilter(null);
      },
    },
    {
      label: "Being Filled",
      value: filling,
      sub: "Advertising or selecting",
      zeroSub: "No roles in selection",
      icon: Users,
      tone: "blue",
      active: quickFilter === "filling",
      onClick: () => {
        setStageFilter("all");
        setStalledOnly(false);
        setQuickFilter((f) => (f === "filling" ? null : "filling"));
      },
    },
    {
      label: "Joining",
      value: joining,
      sub: "In pre-employment or onboarding",
      zeroSub: "No hires joining",
      icon: UserCheck,
      tone: "emerald",
      active: quickFilter === "joining",
      onClick: () => {
        setStageFilter("all");
        setStalledOnly(false);
        setQuickFilter((f) => (f === "joining" ? null : "joining"));
      },
    },
    {
      label: "Stalled",
      value: stalled,
      sub: `No movement in ${STALL_DAYS}+ days`,
      zeroSub: "Everything is moving",
      icon: AlertTriangle,
      tone: "red",
      active: stalledOnly,
      onClick: () => {
        setQuickFilter(null);
        setStalledOnly((v) => !v);
      },
    },
  ];

  const columns = useMemo<ColumnDef<HiringRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: sortableHeader("Role"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{row.original.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {row.original.person ? `${row.original.person} · ` : ""}
              {row.original.department}
            </p>
          </div>
        ),
      },
      {
        id: "stage",
        header: sortableHeader("Stage"),
        accessorFn: (r) => r.step,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[11px] font-medium">
            {row.original.step}. {STAGE_LABELS.get(row.original.stageId)}
          </Badge>
        ),
      },
      {
        accessorKey: "detail",
        header: sortableHeader("What is happening"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.detail}
          </span>
        ),
      },
      {
        accessorKey: "owner",
        header: sortableHeader("With"),
        cell: ({ row }) => <span className="text-sm">{row.original.owner}</span>,
      },
      {
        accessorKey: "days",
        header: sortableHeader("Idle"),
        cell: ({ row }) => (
          <span
            className={cn(
              "text-sm tabular-nums",
              row.original.stalled
                ? "font-medium text-rose-600 dark:text-rose-400"
                : "text-muted-foreground",
            )}
          >
            {row.original.days}d
          </span>
        ),
      },
    ],
    [],
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Select value={stageFilter} onValueChange={setStageFilter}>
        <SelectTrigger className="h-9 w-48">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {HIRING_STAGES.map((stage) => (
            <SelectItem key={stage.id} value={stage.id}>
              {stage.step}. {stage.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {stalledOnly && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => setStalledOnly(false)}
        >
          Clear stalled filter
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl font-semibold text-foreground">Hire Tracker</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Every hiring effort in one list, from workforce request through to
          onboarding. Open a row to see its full timeline.
        </p>
      </div>

      <HrStatCardsGrid stats={cards} columns={4} />

      <DataTable
        exportTitle="Hire Tracker"
        columns={columns}
        data={filtered}
        getRowId={(r) => r.id}
        searchPlaceholder="Search role, person, department or owner"
        toolbarActions={toolbar}
        onRowClick={(r) => router.push(`/talent/hire-tracker/${r.id}`)}
        emptyMessage="Nothing matches those filters."
        pageSize={10}
      />

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {rows.length} hiring efforts
      </p>
    </div>
  );
}

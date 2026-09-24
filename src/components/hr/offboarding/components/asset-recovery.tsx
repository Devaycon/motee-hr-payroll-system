"use client";

import { useMemo, useState } from "react";
import {
  Laptop,
  Smartphone,
  IdCard,
  Car,
  KeyRound,
  PackageCheck,
  PackageX,
  Users,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Progress } from "@/src/components/ui/progress";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  ASSET_TYPE_PLURALS,
  recordAssets,
} from "@/src/lib/offboarding/assets";
import type {
  OffboardingAsset,
  OffboardingAssetType,
  OffboardingRecord,
} from "../types";

export const ASSET_TYPE_ICONS: Record<OffboardingAssetType, LucideIcon> = {
  laptop: Laptop,
  phone: Smartphone,
  id_card: IdCard,
  vehicle: Car,
  access_card: KeyRound,
};

/** Leavers whose kit HR is actually chasing — not turned-down exits. */
const RECOVERY_STATUSES = new Set<OffboardingRecord["status"]>([
  "approved",
  "in_progress",
  "completed",
  "pending",
]);

interface AssetRow extends OffboardingAsset {
  record: OffboardingRecord;
  overdue: boolean;
}

type StatusFilter = "outstanding" | "overdue" | "returned" | "all";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "outstanding", label: "Outstanding" },
  { value: "overdue", label: "Overdue" },
  { value: "returned", label: "Returned" },
  { value: "all", label: "All" },
];

interface AssetRecoveryProps {
  /** Records after the page's search / department / reason filters. */
  records: OffboardingRecord[];
  onToggleReturned: (record: OffboardingRecord, assetId: string) => void;
}

/**
 * Asset Recovery dashboard (Offboarding feedback §4): how much company
 * property has come back, broken down by kind, with the outstanding items
 * listed so they can be marked returned as they arrive.
 */
export function AssetRecovery({ records, onToggleReturned }: AssetRecoveryProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("outstanding");
  const [typeFilter, setTypeFilter] = useState<OffboardingAssetType | "all">(
    "all",
  );

  const rows = useMemo<AssetRow[]>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return records
      .filter((r) => RECOVERY_STATUSES.has(r.status))
      .flatMap((record) =>
        recordAssets(record).map((asset) => ({
          ...asset,
          record,
          overdue: !asset.returned && record.lastWorkingDate < today,
        })),
      );
  }, [records]);

  const total = rows.length;
  const returned = rows.filter((r) => r.returned).length;
  const outstanding = total - returned;
  const overdue = rows.filter((r) => r.overdue).length;
  const holders = new Set(
    rows.filter((r) => !r.returned).map((r) => r.record.id),
  ).size;
  const returnedPct = total ? Math.round((returned / total) * 100) : 0;

  const stats: HrStatCardItem[] = [
    {
      label: "Assets Returned",
      value: `${returnedPct}%`,
      sub: `${returned} of ${total} items back`,
      icon: PackageCheck,
      tone: "emerald",
      active: statusFilter === "returned",
      onClick: () => setStatusFilter("returned"),
    },
    {
      label: "Outstanding Assets",
      value: outstanding,
      sub: "Still with leavers",
      zeroSub: "Everything is back",
      icon: PackageX,
      tone: "amber",
      active: statusFilter === "outstanding",
      onClick: () => setStatusFilter("outstanding"),
    },
    {
      label: "Overdue Returns",
      value: overdue,
      sub: "Past the last working day",
      zeroSub: "Nothing overdue",
      icon: AlertTriangle,
      tone: "red",
      active: statusFilter === "overdue",
      onClick: () => setStatusFilter("overdue"),
    },
    {
      label: "Leavers Holding Assets",
      value: holders,
      sub: "Employees with items out",
      zeroSub: "No one is holding kit",
      icon: Users,
      tone: "blue",
    },
  ];

  const visible = rows.filter((r) => {
    const matchType = typeFilter === "all" || r.type === typeFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "returned" && r.returned) ||
      (statusFilter === "outstanding" && !r.returned) ||
      (statusFilter === "overdue" && r.overdue);
    return matchType && matchStatus;
  });

  const columns = useMemo<ColumnDef<AssetRow>[]>(
    () => [
      {
        id: "employee",
        accessorFn: (r) => r.record.employeeName,
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <PersonAvatar
              name={row.original.record.employeeName}
              initials={row.original.record.employeeInitials}
              className="h-7 w-7"
              fallbackClassName="text-[10px] font-semibold bg-destructive/10 text-destructive"
            />
            <div>
              <p className="text-sm font-medium text-foreground leading-none">
                {row.original.record.employeeName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {row.original.record.department}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "asset",
        accessorFn: (r) => ASSET_TYPE_LABELS[r.type],
        header: sortableHeader("Asset"),
        cell: ({ row }) => {
          const Icon = ASSET_TYPE_ICONS[row.original.type];
          return (
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-foreground leading-none">
                  {ASSET_TYPE_LABELS[row.original.type]}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {row.original.label}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "tag",
        header: sortableHeader("Asset Tag"),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.tag}
          </span>
        ),
      },
      {
        id: "lastWorkingDate",
        accessorFn: (r) => r.record.lastWorkingDate,
        header: sortableHeader("Last Working Day"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.original.record.lastWorkingDate}
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (r) =>
          r.returned ? "Returned" : r.overdue ? "Overdue" : "Outstanding",
        header: sortableHeader("Status"),
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex flex-col">
              <span
                className={cn(
                  "inline-flex w-fit items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  r.returned
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                    : r.overdue
                      ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
                )}
              >
                {r.returned ? "Returned" : r.overdue ? "Overdue" : "Outstanding"}
              </span>
              {r.returned && r.returnedAt && (
                <span className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                  {r.returnedAt}
                </span>
              )}
            </div>
          );
        },
      },
      actionsColumn<AssetRow>((r) =>
        r.returned ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => onToggleReturned(r.record, r.id)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Undo
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => onToggleReturned(r.record, r.id)}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Mark returned
          </Button>
        ),
      ),
    ],
    [onToggleReturned],
  );

  return (
    <div className="flex flex-col gap-4">
      <HrStatCardsGrid stats={stats} columns={4} />

      <Card className="gap-0 py-0">
        <div className="flex items-baseline justify-between gap-2 px-4 pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            Recovery by asset type
          </p>
          {typeFilter !== "all" && (
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => setTypeFilter("all")}
            >
              Show all types
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-3">
          {ASSET_TYPES.map((type) => {
            const ofType = rows.filter((r) => r.type === type);
            const back = ofType.filter((r) => r.returned).length;
            const pct = ofType.length
              ? Math.round((back / ofType.length) * 100)
              : 0;
            const out = ofType.length - back;
            const Icon = ASSET_TYPE_ICONS[type];
            const active = typeFilter === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => setTypeFilter(active ? "all" : type)}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active && "ring-2 ring-primary border-primary",
                )}
              >
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" />
                  {ASSET_TYPE_PLURALS[type]}
                </span>
                <span className="flex items-baseline gap-1">
                  <span className="text-xl font-semibold tabular-nums text-foreground leading-none">
                    {back}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    / {ofType.length} returned
                  </span>
                </span>
                <Progress value={pct} className="h-1.5" />
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    out > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground",
                  )}
                >
                  {out > 0 ? `${out} outstanding` : "All recovered"}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <DataTable
        exportTitle="Asset Recovery"
        columns={columns}
        data={visible}
        getRowId={(r) => r.id}
        toolbarActions={
          <div className="flex items-center rounded-md border border-border p-0.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={statusFilter === f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs transition-colors",
                  statusFilter === f.value
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        }
        emptyMessage={
          statusFilter === "outstanding" || statusFilter === "overdue"
            ? "Nothing to recover — every item in this view is back."
            : "No assets match these filters."
        }
      />
    </div>
  );
}

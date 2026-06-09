"use client";

import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { useMemo } from "react";
import {
  Laptop2,
  Monitor,
  Smartphone,
  Tablet,
  Printer,
  Keyboard,
  Mouse,
  Headphones,
  Camera,
  Package2,
  CheckCircle2,
  AlertTriangle,
  Undo2,
  Eye,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import {
  ASSET_CONDITION_LABELS,
  ASSET_CONDITION_STYLES,
  ASSET_TYPE_LABELS,
} from "../data";
import type { Asset } from "../types";

const ASSET_TYPE_ICONS: Record<string, React.ElementType> = {
  laptop: Laptop2,
  desktop: Monitor,
  monitor: Monitor,
  phone: Smartphone,
  tablet: Tablet,
  printer: Printer,
  keyboard: Keyboard,
  mouse: Mouse,
  headset: Headphones,
  camera: Camera,
  other: Package2,
};

function formatNaira(value?: number) {
  if (value === undefined || value === null) return "—";
  return formatMoneyLocale(value);
}

interface PendingReturnsTableProps {
  assets: Asset[];
  onMarkReturned: (id: string) => void;
  onView: (a: Asset) => void;
}

export function PendingReturnsTable({
  assets,
  onMarkReturned,
  onView,
}: PendingReturnsTableProps) {
  const pending = assets.filter((a) => a.pendingReturn === true);

  const columns = useMemo<ColumnDef<Asset>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Asset"),
        cell: ({ row }) => {
          const TypeIcon =
            ASSET_TYPE_ICONS[row.original.assetType] ?? Package2;
          return (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <TypeIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {row.original.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.original.serialNumber}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "assetType",
        header: sortableHeader("Type"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {ASSET_TYPE_LABELS[row.original.assetType]}
          </span>
        ),
      },
      {
        accessorKey: "assignedTo",
        header: sortableHeader("Last Assigned To"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-red-500/10 text-xs font-semibold text-red-500">
              {row.original.assignedToInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm">{row.original.assignedTo}</p>
              <Badge
                variant="secondary"
                className="mt-0.5 bg-red-500/10 text-xs text-red-600 dark:text-red-400"
              >
                Offboarded
              </Badge>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "assignedToDepartment",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.assignedToDepartment ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "condition",
        header: sortableHeader("Condition"),
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={`text-xs font-medium ${ASSET_CONDITION_STYLES[row.original.condition]}`}
          >
            {ASSET_CONDITION_LABELS[row.original.condition]}
          </Badge>
        ),
      },
      {
        accessorKey: "purchaseValue",
        header: sortableHeader("Value"),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatNaira(row.original.purchaseValue)}
          </span>
        ),
      },
      actionsColumn<Asset>(
        (asset) => (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={() => onView(asset)}
            >
              <Eye className="size-3.5" />
              Details
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => onMarkReturned(asset.id)}
            >
              <Undo2 className="size-3.5" />
              Mark Returned
            </Button>
          </div>
        ),
        "Actions",
      ),
    ],
    [onView, onMarkReturned],
  );

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border/60 bg-card py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="size-6 text-emerald-500" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">All assets have been returned</p>
          <p className="text-xs text-muted-foreground">
            There are no pending asset returns at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <span className="font-semibold">
            {pending.length} asset{pending.length > 1 ? "s" : ""}
          </span>{" "}
          {pending.length > 1 ? "require" : "requires"} return from offboarded
          employee{pending.length > 1 ? "s" : ""}.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={pending}
        getRowId={(a) => a.id}
        emptyMessage="No pending returns."
      />
    </div>
  );
}

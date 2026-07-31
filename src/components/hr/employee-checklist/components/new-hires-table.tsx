"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import {
  employeeIdColumns,
  HIDE_SYSTEM_ID,
} from "@/src/components/shared/employee-id-columns";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import { cn } from "@/src/lib/utils";
import {
  NEW_HIRE_STATUS_LABELS,
  NEW_HIRE_STATUS_STYLES,
  formatDate,
} from "../data";
import type { NewHire } from "../types";

interface NewHiresTableProps {
  hires: NewHire[];
}

export function NewHiresTable({ hires }: NewHiresTableProps) {
  const identity = useEmployeeIdentity();
  const columns = useMemo<ColumnDef<NewHire>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("New Hire"),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <PersonAvatar
              name={row.original.name}
              initials={row.original.initials}
              className="size-8 shrink-0"
              fallbackClassName="bg-primary/10 text-primary text-xs font-semibold"
            />
            <div>
              <p className="font-medium text-foreground text-sm">
                {row.original.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {row.original.department}
              </p>
            </div>
          </div>
        ),
      },
      ...employeeIdColumns<NewHire>({
        identity,
        name: (r) => r.name,
      }),
      {
        accessorKey: "jobTitle",
        header: sortableHeader("Job Title"),
        cell: ({ row }) => (
          <p className="text-sm text-foreground">{row.original.jobTitle}</p>
        ),
      },
      {
        accessorKey: "startDate",
        header: sortableHeader("Start Date"),
        cell: ({ row }) => (
          <p className="text-sm text-foreground">
            {formatDate(row.original.startDate)}
          </p>
        ),
      },
      {
        id: "progress",
        header: "Progress",
        cell: ({ row }) => {
          const pct = Math.round(
            (row.original.completedItems / row.original.totalItems) * 100,
          );
          return (
            <div className="flex items-center gap-2 min-w-40">
              <Progress value={pct} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground shrink-0">
                {row.original.completedItems}/{row.original.totalItems}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-medium",
              NEW_HIRE_STATUS_STYLES[row.original.status],
            )}
          >
            {NEW_HIRE_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
    ],
    [identity],
  );

  return (
    <DataTable
      columns={columns}
      initialColumnVisibility={HIDE_SYSTEM_ID}
      enableColumnVisibility
      data={hires}
      getRowId={(h) => h.id}
      emptyMessage="No new hires at the moment."
    />
  );
}

"use client";

import { useMemo } from "react";
import { Pencil, MoreHorizontal } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import { STATUS_STYLES, STATUS_LABELS } from "../data";
import type { HierarchyNode } from "../types";

interface ReportingTableProps {
  nodes: HierarchyNode[];
  onEdit: (node: HierarchyNode) => void;
}

export function ReportingTable({ nodes, onEdit }: ReportingTableProps) {
  const columns = useMemo<ColumnDef<HierarchyNode>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <PersonAvatar
              name={row.original.name}
              initials={row.original.initials}
              gender={row.original.gender}
              className="size-7 shrink-0"
              fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
            />
            <span className="text-xs font-medium text-foreground">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "jobTitle",
        header: sortableHeader("Job Title"),
        cell: ({ row }) => (
          <span className="text-xs text-foreground">{row.original.jobTitle}</span>
        ),
      },
      {
        accessorKey: "managerName",
        header: "Reports To",
        cell: ({ row }) =>
          row.original.managerName ? (
            <span className="text-xs text-foreground">
              {row.original.managerName}
            </span>
          ) : (
            <span className="text-xs italic text-muted-foreground">
              Top level
            </span>
          ),
      },
      {
        accessorKey: "level",
        header: sortableHeader("Level"),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs font-mono px-2">
            L{row.original.level}
          </Badge>
        ),
      },
      {
        accessorKey: "directReports",
        header: sortableHeader("Direct Reports"),
        cell: ({ row }) =>
          row.original.directReports > 0 ? (
            <span className="text-xs font-medium text-foreground">
              {row.original.directReports}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("text-xs capitalize", STATUS_STYLES[row.original.status])}
          >
            {STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      actionsColumn<HierarchyNode>((node) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem className="text-xs gap-2" onClick={() => onEdit(node)}>
              <Pencil className="w-3.5 h-3.5" />
              Change Manager
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onEdit],
  );

  return (
    <DataTable
      columns={columns}
      data={nodes}
      getRowId={(n) => n.id}
      emptyMessage="No employees found."
    />
  );
}

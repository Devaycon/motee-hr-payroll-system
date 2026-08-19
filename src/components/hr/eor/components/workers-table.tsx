"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Eye, Plus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { PermissionGate } from "@/src/components/shared/permission-gate";
import { formatMoney } from "@/src/lib/hooks/use-currency";
import { cn } from "@/src/lib/utils";
import type { EorWorker } from "../types";
import { EOR_WORKER_STATUS_LABELS, EOR_WORKER_STATUS_STYLES } from "../data";

interface WorkersTableProps {
  workers: EorWorker[];
  onView: (worker: EorWorker) => void;
  onEdit: (worker: EorWorker) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function WorkersTable({
  workers,
  onView,
  onEdit,
  onDelete,
  onAdd,
}: WorkersTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<EorWorker>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Worker"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <PersonAvatar
              name={row.original.name}
              initials={row.original.initials}
              gender={row.original.gender}
              size="sm"
              fallbackClassName="bg-primary/10 text-primary font-semibold"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{row.original.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {row.original.role}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "country",
        header: sortableHeader("Country"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{row.original.country}</span>
            <span className="rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground">
              {row.original.countryCode}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "providerName",
        header: "Provider",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.providerName}
          </span>
        ),
      },
      {
        accessorKey: "grossSalaryMonthly",
        header: sortableHeader("Gross / mo"),
        cell: ({ row }) => (
          <span className="text-sm">
            {formatMoney(row.original.grossSalaryMonthly, row.original.currencySymbol)}
            <span className="ml-1 text-[10px] text-muted-foreground">
              {row.original.currency}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("text-xs", EOR_WORKER_STATUS_STYLES[row.original.status])}
          >
            {EOR_WORKER_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      actionsColumn<EorWorker>((worker) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem className="text-xs gap-2" onClick={() => onView(worker)}>
              <Eye className="w-3.5 h-3.5" />
              View
            </DropdownMenuItem>
            <PermissionGate module="organization.eor" action="edit">
              <DropdownMenuItem className="text-xs gap-2" onClick={() => onEdit(worker)}>
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </DropdownMenuItem>
            </PermissionGate>
            <PermissionGate module="organization.eor" action="delete">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2 text-destructive focus:text-destructive"
                onClick={() => setDeleteId(worker.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </DropdownMenuItem>
            </PermissionGate>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onView, onEdit],
  );

  return (
    <>
      <DataTable
        exportTitle="EOR Workers"
        columns={columns}
        data={workers}
        getRowId={(w) => w.id}
        searchPlaceholder="Search workers by name, role or country..."
        onRowClick={(w) => onView(w)}
        emptyMessage="No EOR workers yet."
        toolbarActions={
          <PermissionGate module="organization.eor" action="create">
            <Button size="sm" className="gap-1.5" onClick={onAdd}>
              <Plus className="w-3.5 h-3.5" />
              Add Worker
            </Button>
          </PermissionGate>
        }
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove EOR Worker</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the worker from the EOR register. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

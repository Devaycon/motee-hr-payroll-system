"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
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
import { cn } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import type { EorProvider } from "../types";
import { EOR_PROVIDER_STATUS_LABELS, EOR_PROVIDER_STATUS_STYLES } from "../data";

interface ProvidersTableProps {
  providers: EorProvider[];
  onEdit: (provider: EorProvider) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export function ProvidersTable({
  providers,
  onEdit,
  onDelete,
  onAdd,
}: ProvidersTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<EorProvider>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Provider"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar size="sm">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {row.original.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{row.original.name}</p>
              {row.original.website && (
                <p className="text-xs text-muted-foreground truncate">
                  {row.original.website.replace(/^https?:\/\//, "")}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "workerCount",
        header: sortableHeader("Workers"),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.workerCount}</span>
        ),
      },
      {
        id: "countries",
        header: "Countries covered",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.countriesCovered.length} countries
          </span>
        ),
      },
      {
        accessorKey: "managementFeePct",
        header: sortableHeader("Mgmt fee"),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.managementFeePct}%</span>
        ),
      },
      {
        accessorKey: "since",
        header: sortableHeader("Partner since"),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.since)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              EOR_PROVIDER_STATUS_STYLES[row.original.status],
            )}
          >
            {EOR_PROVIDER_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      actionsColumn<EorProvider>((provider) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <PermissionGate module="organization.eor" action="edit">
              <DropdownMenuItem className="text-xs gap-2" onClick={() => onEdit(provider)}>
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </DropdownMenuItem>
            </PermissionGate>
            <PermissionGate module="organization.eor" action="delete">
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2 text-destructive focus:text-destructive"
                onClick={() => setDeleteId(provider.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </DropdownMenuItem>
            </PermissionGate>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onEdit],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={providers}
        getRowId={(p) => p.id}
        searchPlaceholder="Search providers..."
        emptyMessage="No EOR providers yet."
        toolbarActions={
          <PermissionGate module="organization.eor" action="create">
            <Button size="sm" className="gap-1.5" onClick={onAdd}>
              <Plus className="w-3.5 h-3.5" />
              Add Provider
            </Button>
          </PermissionGate>
        }
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Provider</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this EOR provider partnership. Workers assigned to it will
              keep their record. This action cannot be undone.
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

"use client";

import { useMemo } from "react";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
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
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  DataTable,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import {
  RESPONSIBLE_PARTY_LABELS,
  RESPONSIBLE_PARTY_STYLES,
  formatDueDateRule,
} from "../data";
import type { ChecklistItem, DueDateRule } from "../types";

interface ChecklistTableProps {
  items: ChecklistItem[];
  onEdit: (item: ChecklistItem) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export function ChecklistTable({
  items,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ChecklistTableProps) {
  const count = items.length;

  const columns = useMemo<ColumnDef<ChecklistItem>[]>(
    () => [
      {
        id: "order",
        header: "#",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5 w-8">
            <button
              onClick={() => onMoveUp(row.original.id)}
              disabled={row.index === 0}
              className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronUp className="w-3 h-3 text-muted-foreground" />
            </button>
            <span className="text-xs text-muted-foreground text-center">
              {row.original.order}
            </span>
            <button
              onClick={() => onMoveDown(row.original.id)}
              disabled={row.index === count - 1}
              className="p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        ),
      },
      {
        accessorKey: "taskName",
        header: "Task Name",
        cell: ({ row }) => (
          <p className="font-medium text-foreground text-sm">
            {row.original.taskName}
          </p>
        ),
      },
      {
        accessorKey: "responsibleParty",
        header: "Responsible Party",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-medium",
              RESPONSIBLE_PARTY_STYLES[row.original.responsibleParty],
            )}
          >
            {RESPONSIBLE_PARTY_LABELS[row.original.responsibleParty]}
          </Badge>
        ),
      },
      {
        id: "dueDateRule",
        header: "Due Date Rule",
        cell: ({ row }) => (
          <p className="text-xs text-foreground">
            {formatDueDateRule(
              row.original.dueDateRule as DueDateRule,
              row.original.dueDateOffset,
            )}
          </p>
        ),
      },
      {
        accessorKey: "isRequired",
        header: "Required",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-medium",
              row.original.isRequired
                ? "border-red-500/30 bg-red-500/10 text-red-600"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {row.original.isRequired ? "Required" : "Optional"}
          </Badge>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <p className="text-xs text-muted-foreground truncate max-w-56">
            {row.original.description || "—"}
          </p>
        ),
      },
      actionsColumn<ChecklistItem>((item) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onEdit(item)}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Item
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-xs gap-2 text-destructive focus:text-destructive"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Item</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{item.taskName}&quot;?
                    This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(item.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [count, onEdit, onDelete, onMoveUp, onMoveDown],
  );

  return (
    <DataTable
      columns={columns}
      data={items}
      getRowId={(i) => i.id}
      enablePagination={false}
      emptyMessage="No checklist items yet."
    />
  );
}

"use client";

import { useMemo, useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
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
import { shiftDurationHours } from "@/src/lib/types/shifts";
import type { ShiftTemplate } from "@/src/lib/types/shifts";

interface TemplatesTableProps {
  templates: ShiftTemplate[];
  onEdit: (template: ShiftTemplate) => void;
  onDelete: (id: string) => void;
  onAddTemplate: () => void;
}

export function TemplatesTable({
  templates,
  onEdit,
  onDelete,
  onAddTemplate,
}: TemplatesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<ShiftTemplate>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Shift Name"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: row.original.color }}
            />
            <span className="text-xs font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: "hours",
        header: "Hours",
        cell: ({ row }) => (
          <span className="text-xs font-mono">
            {row.original.startTime} – {row.original.endTime}
          </span>
        ),
      },
      {
        accessorKey: "breakMinutes",
        header: "Break",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.breakMinutes} min
          </span>
        ),
      },
      {
        id: "duration",
        header: "Daily Hours",
        cell: ({ row }) => (
          <span className="text-xs font-medium">
            {shiftDurationHours(row.original)}h/day
          </span>
        ),
      },
      {
        id: "workDays",
        header: "Applies To",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 flex-wrap">
            {row.original.workDays.map((day) => (
              <span
                key={day}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/10 text-primary"
              >
                {day}
              </span>
            ))}
          </div>
        ),
      },
      actionsColumn<ShiftTemplate>((template) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onEdit(template)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 text-destructive focus:text-destructive"
              onClick={() => setDeleteId(template.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onEdit],
  );

  return (
    <>
      <div className="flex items-center justify-end">
        <Button size="lg" onClick={onAddTemplate}>
          <Plus className="w-3.5 h-3.5" />
          Add Shift Template
        </Button>
      </div>

      <div className="mt-4">
        <DataTable
          exportTitle="Shift Templates"
          columns={columns}
          data={templates}
          getRowId={(t) => t.id}
          emptyMessage="No shift templates created."
        />
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shift Template</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this shift template and any roster
              entries assigned to it. This action cannot be undone.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

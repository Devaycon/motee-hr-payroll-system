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
import type { WorkSchedule } from "../types";

interface SchedulesTableProps {
  schedules: WorkSchedule[];
  onEdit: (schedule: WorkSchedule) => void;
  onDelete: (id: string) => void;
  onAddSchedule: () => void;
}

function computeDailyHours(
  startTime: string,
  endTime: string,
  breakMinutes: number,
): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const totalMinutes = eh * 60 + em - (sh * 60 + sm) - breakMinutes;
  return Math.round((totalMinutes / 60) * 10) / 10;
}

export function SchedulesTable({
  schedules,
  onEdit,
  onDelete,
  onAddSchedule,
}: SchedulesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<WorkSchedule>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Schedule Name"),
        cell: ({ row }) => (
          <span className="text-xs font-medium">{row.original.name}</span>
        ),
      },
      {
        id: "workDays",
        header: "Working Days",
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
      {
        id: "shift",
        header: "Shift Hours",
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
        id: "dailyHours",
        header: "Daily Hours",
        cell: ({ row }) => (
          <span className="text-xs font-medium">
            {computeDailyHours(
              row.original.startTime,
              row.original.endTime,
              row.original.breakMinutes,
            )}
            h/day
          </span>
        ),
      },
      {
        accessorKey: "assignedCount",
        header: sortableHeader("Assigned"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.assignedCount} employees
          </span>
        ),
      },
      actionsColumn<WorkSchedule>((schedule) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onEdit(schedule)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 text-destructive focus:text-destructive"
              onClick={() => setDeleteId(schedule.id)}
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
        <Button size="lg" onClick={onAddSchedule}>
          <Plus className="w-3.5 h-3.5" />
          Add Schedule
        </Button>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={schedules}
          getRowId={(s) => s.id}
          emptyMessage="No schedules created."
        />
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this work schedule. Employees
              currently assigned to it will not be affected. This action cannot
              be undone.
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

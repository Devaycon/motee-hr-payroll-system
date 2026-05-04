"use client";

import { useState } from "react";
import {
  Plus,
  MoreHorizontal,
  CalendarDays,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
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

  return (
    <>
      <div className="flex items-center justify-end">
        <Button
          size="lg"
          onClick={onAddSchedule}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Schedule
        </Button>
      </div>

      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Schedule Name
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Working Days
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Shift Hours
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Break
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Daily Hours
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Assigned
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CalendarDays className="w-8 h-8 opacity-30" />
                        <p className="text-sm font-medium">
                          No schedules created
                        </p>
                        <p className="text-xs">
                          Create a work schedule to assign to employees
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  schedules.map((schedule) => {
                    const dailyHours = computeDailyHours(
                      schedule.startTime,
                      schedule.endTime,
                      schedule.breakMinutes,
                    );
                    return (
                      <tr
                        key={schedule.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium">
                            {schedule.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 flex-wrap">
                            {schedule.workDays.map((day) => (
                              <span
                                key={day}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/10 text-primary"
                              >
                                {day}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono">
                            {schedule.startTime} – {schedule.endTime}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {schedule.breakMinutes} min
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium">
                            {dailyHours}h/day
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {schedule.assignedCount} employees
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                              >
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
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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

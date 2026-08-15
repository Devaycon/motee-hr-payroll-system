"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  deleteTimeEntry,
  logTime,
  setTimesheetStatus,
} from "@/src/lib/stores/projects-slice";
import { cn } from "@/src/lib/utils";
import type { Project, TimesheetEntry } from "@/src/lib/types/projects";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";

/** Mirrors the columns on screen, so an export reads the same as the table. */
const TIMESHEET_EXPORT_COLUMNS: ReportColumn<TimesheetEntry>[] = [
  { key: "date", header: "Date", value: (e) => e.date },
  { key: "employeeName", header: "Person", value: (e) => e.employeeName },
  { key: "hours", header: "Hours", value: (e) => e.hours },
  { key: "status", header: "Status", value: (e) => e.status },
  { key: "notes", header: "Notes", value: (e) => e.notes ?? "" },
];

const STATUS_STYLES: Record<TimesheetEntry["status"], string> = {
  draft: "border-border bg-muted text-muted-foreground",
  submitted:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
};

export function TimesheetsPanel({ project }: { project: Project }) {
  const dispatch = useAppDispatch();
  const allEntries = useAppSelector((s) => s.projects.timesheets);

  const [employeeId, setEmployeeId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");

  const entries = useMemo(
    () =>
      allEntries
        .filter((e) => e.projectId === project.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allEntries, project.id],
  );

  const totals = useMemo(() => {
    const by = (status: TimesheetEntry["status"]) =>
      entries
        .filter((e) => e.status === status)
        .reduce((s, e) => s + e.hours, 0);
    return {
      approved: by("approved"),
      submitted: by("submitted"),
      total: entries.reduce((s, e) => s + e.hours, 0),
    };
  }, [entries]);

  function handleLog() {
    const allocation = project.allocations.find(
      (a) => a.employeeId === employeeId,
    );
    if (!allocation) {
      toast.error("Pick someone assigned to this project.");
      return;
    }
    const value = Number(hours);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Enter the hours worked.");
      return;
    }
    // A day has 24 hours; anything beyond that is a typo, not overtime.
    if (value > 24) {
      toast.error("That's more than 24 hours in a day.");
      return;
    }
    dispatch(
      logTime({
        projectId: project.id,
        taskId: taskId || undefined,
        employeeId: allocation.employeeId,
        employeeName: allocation.employeeName,
        date,
        hours: value,
        status: "submitted",
      }),
    );
    setHours("");
    setTaskId("");
    toast.success(`${value}h logged for ${allocation.employeeName}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/60 p-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Person</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="h-9 w-52">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {project.allocations.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Assign someone to the project first
                </div>
              ) : (
                project.allocations.map((a) => (
                  <SelectItem key={a.employeeId} value={a.employeeId}>
                    {a.employeeName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Task</Label>
          <Select
            value={taskId || "none"}
            onValueChange={(v) => setTaskId(v === "none" ? "" : v)}
          >
            <SelectTrigger className="h-9 w-52">
              <SelectValue placeholder="General" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">General project work</SelectItem>
              {project.tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Input
            type="date"
            className="h-9 w-40"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Hours</Label>
          <Input
            type="number"
            min={0}
            step="0.25"
            className="h-9 w-24"
            placeholder="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>
        <Button className="h-9 gap-1.5" onClick={handleLog}>
          <Plus className="h-4 w-4" />
          Log time
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{totals.approved}h</span>{" "}
          approved
        </span>
        <span>
          <span className="font-medium text-foreground">
            {totals.submitted}h
          </span>{" "}
          awaiting approval
        </span>
        <span>
          <span className="font-medium text-foreground">{totals.total}h</span>{" "}
          logged in total
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            No time logged yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Only approved time counts toward project spend.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <div className="flex justify-end border-b border-border/40 bg-muted/30 px-3 py-2">
            <ExportMenu
              name={`${project.code}-timesheets`}
              title={`${project.name} — Timesheets`}
              columns={TIMESHEET_EXPORT_COLUMNS}
              rows={entries}
              variant="outline"
              buttonClassName="h-7 text-xs"
            />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Person</th>
                <th className="px-3 py-2 font-medium">Task</th>
                <th className="px-3 py-2 text-right font-medium">Hours</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const task = project.tasks.find((t) => t.id === entry.taskId);
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="px-3 py-2 text-muted-foreground">
                      {entry.date}
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground">
                      {entry.employeeName}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {task?.name ?? "General project work"}
                      {entry.notes && (
                        <p className="text-[10px] text-muted-foreground/70">
                          {entry.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-foreground">
                      {entry.hours}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", STATUS_STYLES[entry.status])}
                      >
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-0.5">
                        {entry.status === "submitted" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
                              aria-label="Approve"
                              onClick={() =>
                                dispatch(
                                  setTimesheetStatus({
                                    entryId: entry.id,
                                    status: "approved",
                                  }),
                                )
                              }
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-amber-600 dark:text-amber-400"
                              aria-label="Reject"
                              onClick={() =>
                                dispatch(
                                  setTimesheetStatus({
                                    entryId: entry.id,
                                    status: "rejected",
                                  }),
                                )
                              }
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          aria-label="Delete entry"
                          onClick={() => dispatch(deleteTimeEntry(entry.id))}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

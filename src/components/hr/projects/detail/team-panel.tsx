"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, List, Network, Plus, Trash2 } from "lucide-react";
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
  removeAllocation,
  setAllocation,
} from "@/src/lib/stores/projects-slice";
import { cn } from "@/src/lib/utils";
import {
  approvedHoursForEmployee,
  findOverAllocations,
  taskCountForEmployee,
  type Project,
  type ProjectAllocation,
  type TimesheetEntry,
} from "@/src/lib/types/projects";
import { ExportMenu } from "@/src/components/shared/export-menu";
import type { ReportColumn } from "@/src/lib/reports/types";
import { TeamOrgChart } from "./team-org-chart";

/** Mirrors the columns on screen, so an export reads the same as the table. */
function buildExportColumns(
  project: Project,
  timesheets: TimesheetEntry[],
): ReportColumn<ProjectAllocation>[] {
  return [
    { key: "employeeName", header: "Person", value: (a) => a.employeeName },
    { key: "projectRole", header: "Role", value: (a) => a.projectRole },
    {
      key: "allocationPercent",
      header: "Allocation %",
      value: (a) => a.allocationPercent,
    },
    {
      key: "hours",
      header: "Hours",
      value: (a) =>
        approvedHoursForEmployee(timesheets, project.id, a.employeeId),
    },
    {
      key: "tasks",
      header: "Tasks",
      value: (a) => taskCountForEmployee(project, a.employeeId, a.employeeName),
    },
    {
      key: "hourlyRate",
      header: "Rate",
      value: (a) => a.hourlyRate ?? 0,
      money: true,
    },
    { key: "startDate", header: "Start", value: (a) => a.startDate },
    { key: "endDate", header: "End", value: (a) => a.endDate ?? "—" },
  ];
}

export function TeamPanel({ project }: { project: Project }) {
  const dispatch = useAppDispatch();
  const employees = useAppSelector((s) => s.locale.data?.employees ?? []);
  const allProjects = useAppSelector((s) => s.projects.projects);
  const timesheets = useAppSelector((s) => s.projects.timesheets);

  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [percent, setPercent] = useState("50");
  const [rate, setRate] = useState("");
  const [view, setView] = useState<"list" | "org">("list");

  /**
   * Commitment is a property of the person across *every* project, not of this
   * one. Computing it from the whole set is the only way the warning means
   * anything.
   */
  const overByEmployee = useMemo(() => {
    const map = new Map<string, number>();
    for (const over of findOverAllocations(allProjects)) {
      map.set(over.employeeId, over.totalPercent);
    }
    return map;
  }, [allProjects]);

  function handleAdd() {
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) {
      toast.error("Pick someone to add.");
      return;
    }
    const pct = Number(percent);
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      toast.error("Allocation must be between 1 and 100%.");
      return;
    }
    dispatch(
      setAllocation({
        projectId: project.id,
        allocation: {
          employeeId: employee.id,
          employeeName: employee.fullName,
          projectRole: role.trim() || employee.jobTitle,
          allocationPercent: pct,
          startDate: project.startDate,
          hourlyRate: rate ? Number(rate) : undefined,
        },
      }),
    );
    setEmployeeId("");
    setRole("");
    setPercent("50");
    setRate("");
    toast.success(`${employee.fullName} added to the project`);
  }

  const available = employees.filter(
    (e) => !project.allocations.some((a) => a.employeeId === e.id),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border/60 bg-card p-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Person</Label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="h-9 w-56">
              <SelectValue placeholder="Select someone" />
            </SelectTrigger>
            <SelectContent>
              {available.slice(0, 60).map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Project role</Label>
          <Input
            className="h-9 w-48"
            placeholder="e.g. Data Analyst"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Allocation %</Label>
          <Input
            type="number"
            min={1}
            max={100}
            className="h-9 w-24"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Rate / hr</Label>
          <Input
            type="number"
            min={0}
            className="h-9 w-24"
            placeholder="—"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
        </div>
        <Button className="h-9 gap-1.5" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Assign
        </Button>
      </div>

      {project.allocations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Nobody assigned yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <div className="flex items-center overflow-hidden rounded-md border border-border">
              <Button
                variant={view === "list" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 rounded-none border-0 text-xs"
                onClick={() => setView("list")}
              >
                <List className="h-3.5 w-3.5" />
                List
              </Button>
              <div className="h-5 w-px bg-border" />
              <Button
                variant={view === "org" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-1.5 rounded-none border-0 text-xs"
                onClick={() => setView("org")}
              >
                <Network className="h-3.5 w-3.5" />
                Organogram
              </Button>
            </div>
          </div>

          {view === "org" ? (
            <TeamOrgChart project={project} />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
              <div className="flex justify-end border-b border-border/40 bg-muted/30 px-3 py-2">
                <ExportMenu
                  name={`${project.code}-team`}
                  title={`${project.name} — Team`}
                  columns={buildExportColumns(project, timesheets)}
                  rows={project.allocations}
                  variant="outline"
                  buttonClassName="h-7 text-xs"
                />
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Team member</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 text-center font-medium">
                      Allocation
                    </th>
                    <th className="px-3 py-2 text-center font-medium">Hours</th>
                    <th className="px-3 py-2 text-center font-medium">Tasks</th>
                    <th className="px-3 py-2 text-right font-medium">Rate</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {project.allocations.map((a) => {
                    const totalPercent = overByEmployee.get(a.employeeId);
                    return (
                      <tr
                        key={a.employeeId}
                        className="border-b border-border/30 last:border-0"
                      >
                        <td className="px-3 py-2">
                          <span className="font-medium text-foreground">
                            {a.employeeName}
                          </span>
                          {totalPercent && (
                            <p className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              {totalPercent}% committed across all projects
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {a.projectRole}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            className={cn(
                              "mx-auto h-7 w-20 text-center text-xs",
                              totalPercent && "border-amber-500/50",
                            )}
                            value={a.allocationPercent}
                            onChange={(e) =>
                              dispatch(
                                setAllocation({
                                  projectId: project.id,
                                  allocation: {
                                    ...a,
                                    allocationPercent: Math.min(
                                      100,
                                      Math.max(0, Number(e.target.value) || 0),
                                    ),
                                  },
                                }),
                              )
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">
                          {approvedHoursForEmployee(
                            timesheets,
                            project.id,
                            a.employeeId,
                          )}
                          h
                        </td>
                        <td className="px-3 py-2 text-center text-muted-foreground">
                          {taskCountForEmployee(
                            project,
                            a.employeeId,
                            a.employeeName,
                          )}
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {a.hourlyRate ? a.hourlyRate.toLocaleString() : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() =>
                              dispatch(
                                removeAllocation({
                                  projectId: project.id,
                                  employeeId: a.employeeId,
                                }),
                              )
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

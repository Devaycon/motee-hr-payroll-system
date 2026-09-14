"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import { isoDateOf, parseIsoDate } from "@/src/lib/types/attendance";
import { resolveShiftForDate } from "@/src/lib/stores/shifts-selectors";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { ShiftAssignment, ShiftTemplate } from "@/src/lib/types/shifts";

interface RosterGridProps {
  employees: LocaleEmployee[];
  templates: ShiftTemplate[];
  assignments: ShiftAssignment[];
  weekStart: string;
  onWeekChange: (weekStart: string) => void;
  onAssign: (employeeId: string, date: string, templateId: string) => void;
  onClear: (employeeId: string, date: string) => void;
}

function addDays(iso: string, n: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + n);
  return isoDateOf(d);
}

export function RosterGrid({
  employees,
  templates,
  assignments,
  weekStart,
  onWeekChange,
  onAssign,
  onClear,
}: RosterGridProps) {
  const [search, setSearch] = useState("");
  const [openCell, setOpenCell] = useState<string | null>(null);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const visibleEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q),
    );
  }, [employees, search]);

  const weekLabel = `${parseIsoDate(weekStart).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })} – ${parseIsoDate(addDays(weekStart, 6)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <Card className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onWeekChange(addDays(weekStart, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold text-foreground min-w-40 text-center">
            {weekLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onWeekChange(addDays(weekStart, 7))}
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-xs max-w-64"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[820px]">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide py-2 px-2 sticky left-0 bg-card">
                Employee
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide py-2 px-1 min-w-28"
                >
                  {parseIsoDate(day).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                  <div className="text-foreground font-bold text-xs normal-case">
                    {Number(day.slice(8, 10))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleEmployees.map((employee) => (
              <tr key={employee.id} className="border-t border-border">
                <td className="py-2 px-2 sticky left-0 bg-card">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-foreground">
                      {employee.fullName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {employee.departmentName}
                    </span>
                  </div>
                </td>
                {days.map((day) => {
                  const cellKey = `${employee.id}:${day}`;
                  const resolved = resolveShiftForDate(
                    employee.id,
                    day,
                    employee.workPattern,
                    templates,
                    assignments,
                  );
                  return (
                    <td key={day} className="py-1.5 px-1 text-center">
                      <Popover
                        open={openCell === cellKey}
                        onOpenChange={(o) => setOpenCell(o ? cellKey : null)}
                      >
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "w-full rounded-md px-1.5 py-1.5 text-[10px] font-medium border transition-colors hover:opacity-80",
                              resolved
                                ? "text-white border-transparent"
                                : "text-muted-foreground border-dashed border-border bg-muted/30",
                            )}
                            style={
                              resolved
                                ? {
                                    backgroundColor: resolved.template.color,
                                    opacity: resolved.isDefault ? 0.55 : 1,
                                  }
                                : undefined
                            }
                          >
                            {resolved ? (
                              <span className="block truncate">
                                {resolved.template.name}
                              </span>
                            ) : (
                              "Off"
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="center">
                          <p className="text-[11px] font-semibold text-foreground mb-1.5">
                            {employee.fullName.split(" ")[0]} —{" "}
                            {parseIsoDate(day).toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </p>
                          <div className="flex flex-col gap-1">
                            {templates.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => {
                                  onAssign(employee.id, day, template.id);
                                  setOpenCell(null);
                                }}
                                className={cn(
                                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left hover:bg-muted transition-colors",
                                  resolved?.template.id === template.id &&
                                    !resolved.isDefault &&
                                    "bg-muted",
                                )}
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: template.color }}
                                />
                                <span className="truncate">
                                  {template.name}
                                </span>
                                <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                                  {template.startTime}
                                </span>
                              </button>
                            ))}
                            {resolved?.assignment && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClear(employee.id, day);
                                  setOpenCell(null);
                                }}
                                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Clear assignment
                              </button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  );
                })}
              </tr>
            ))}
            {!visibleEmployees.length && (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-xs text-muted-foreground"
                >
                  No employees match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

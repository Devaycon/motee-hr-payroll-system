"use client";

import { useMemo } from "react";
import { AlertTriangle, Building2, CheckCircle2, UserX } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Progress } from "@/src/components/ui/progress";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { EmployeeLink } from "@/src/components/shared/employee-link";
import { formatDate } from "@/src/lib/utils/format-date";
import { cn } from "@/src/lib/utils";
import {
  DEPARTMENT_AT_RISK_THRESHOLD,
  type MandatoryComplianceSummary,
  type OverdueAssignment,
} from "@/src/lib/learning/mandatory-compliance";

interface MandatoryCompliancePanelProps {
  summary: MandatoryComplianceSummary;
  mandatoryCourseTitles: string[];
}

/**
 * Mandatory training compliance — completion across every mandatory course,
 * who is overdue, and which departments are falling behind. The view
 * regulators (and healthcare, finance, manufacturing and public-sector
 * clients) ask for.
 */
export function MandatoryCompliancePanel({
  summary,
  mandatoryCourseTitles,
}: MandatoryCompliancePanelProps) {
  const cards: HrStatCardItem[] = [
    {
      label: "Mandatory Training Completion",
      value: `${summary.completionRate}%`,
      sub: `${summary.completed} of ${summary.required} assignments`,
      icon: CheckCircle2,
      tone: summary.completionRate >= 90 ? "emerald" : "amber",
    },
    {
      label: "Employees Overdue",
      value: summary.employeesOverdue,
      sub: `${summary.overdue.length} overdue assignment${summary.overdue.length === 1 ? "" : "s"}`,
      zeroSub: "Everyone is on track",
      icon: UserX,
      tone: "red",
    },
    {
      label: "Departments at Risk",
      value: summary.departmentsAtRisk,
      sub: `Below ${DEPARTMENT_AT_RISK_THRESHOLD}% completion`,
      zeroSub: "No department below target",
      icon: Building2,
      tone: "amber",
    },
  ];

  const overdueColumns = useMemo<ColumnDef<OverdueAssignment>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <EmployeeLink name={row.original.employeeName} employeeId={row.original.employeeId} />
        ),
      },
      {
        accessorKey: "departmentName",
        header: sortableHeader("Department"),
        cell: ({ row }) => <span className="text-xs">{row.original.departmentName}</span>,
      },
      {
        accessorKey: "courseTitle",
        header: sortableHeader("Mandatory Course"),
        cell: ({ row }) => <span className="text-xs">{row.original.courseTitle}</span>,
      },
      {
        id: "dueDate",
        accessorFn: (r) => r.dueDate ?? "",
        header: sortableHeader("Due"),
        cell: ({ row }) => (
          <span className="text-xs text-red-600">
            {row.original.dueDate ? formatDate(row.original.dueDate) : "Not enrolled"}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <HrStatCardsGrid stats={cards} columns={3} />

      <p className="text-xs text-muted-foreground">
        Mandatory courses:{" "}
        <span className="text-foreground">{mandatoryCourseTitles.join(" · ") || "none set"}</span>
        . Mark a course as mandatory from its Edit screen.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="gap-0 py-0">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-sm">Completion by department</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4 pb-4">
            {summary.departments.map((d) => (
              <div key={d.department} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 truncate">
                    {d.atRisk && <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />}
                    {d.department}
                  </span>
                  <span
                    className={cn(
                      "tabular-nums font-medium",
                      d.atRisk ? "text-amber-600" : "text-emerald-600",
                    )}
                  >
                    {d.rate}%
                  </span>
                </div>
                <Progress value={d.rate} className="h-1.5" />
                {d.overdue > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    {d.overdue} overdue
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Overdue assignments</p>
          <DataTable
            exportTitle="Overdue Mandatory Training"
            columns={overdueColumns}
            data={summary.overdue}
            getRowId={(r) => `${r.employeeId}-${r.courseId}`}
            emptyMessage="No overdue mandatory training."
          />
        </div>
      </div>
    </div>
  );
}

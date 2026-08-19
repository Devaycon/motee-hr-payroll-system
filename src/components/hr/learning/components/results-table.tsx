"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/src/components/ui/badge";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import type { Course, Enrollment } from "../types";

interface ResultRow {
  courseId: string;
  course: string;
  hasQuiz: boolean;
  passingScore: number | null;
  enrolled: number;
  attempts: number;
  passed: number;
  failed: number;
  passRate: number | null;
  avgProgress: number;
}

interface ResultsTableProps {
  courses: Course[];
  enrollments: Enrollment[];
}

export function ResultsTable({ courses, enrollments }: ResultsTableProps) {
  const rows = useMemo<ResultRow[]>(() => {
    return courses.map((c) => {
      const ens = enrollments.filter((e) => e.courseId === c.id);
      const attempted = ens.filter((e) => (e.quizAttempts?.length ?? 0) > 0);
      const passed = ens.filter((e) => e.quizPassed).length;
      const failed = attempted.length - passed;
      const attempts = ens.reduce((s, e) => s + (e.quizAttempts?.length ?? 0), 0);
      const avgProgress = ens.length
        ? Math.round(ens.reduce((s, e) => s + e.progress, 0) / ens.length)
        : 0;
      return {
        courseId: c.id,
        course: c.title,
        hasQuiz: Boolean(c.quiz),
        passingScore: c.quiz?.passingScore ?? null,
        enrolled: ens.length,
        attempts,
        passed,
        failed,
        passRate: attempted.length ? Math.round((passed / attempted.length) * 100) : null,
        avgProgress,
      };
    });
  }, [courses, enrollments]);

  const columns = useMemo<ColumnDef<ResultRow>[]>(
    () => [
      {
        accessorKey: "course",
        header: sortableHeader("Course"),
        cell: ({ row }) => (
          <div className="max-w-56">
            <p className="text-xs font-medium truncate">{row.original.course}</p>
            <p className="text-[10px] text-muted-foreground">
              {row.original.hasQuiz
                ? `Pass ≥ ${row.original.passingScore}%`
                : "No quiz"}
            </p>
          </div>
        ),
      },
      { accessorKey: "enrolled", header: sortableHeader("Enrolled"), cell: ({ row }) => <span className="text-xs">{row.original.enrolled}</span> },
      { accessorKey: "attempts", header: sortableHeader("Attempts"), cell: ({ row }) => <span className="text-xs">{row.original.attempts}</span> },
      {
        accessorKey: "passed",
        header: "Passed / Failed",
        cell: ({ row }) => (
          <span className="text-xs">
            <span className="text-emerald-600 font-medium">{row.original.passed}</span>
            {" / "}
            <span className="text-rose-600 font-medium">{row.original.failed}</span>
          </span>
        ),
      },
      {
        accessorKey: "passRate",
        header: sortableHeader("Pass rate"),
        cell: ({ row }) => {
          const r = row.original.passRate;
          if (r === null) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                r >= 70
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                  : r >= 40
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-600",
              )}
            >
              {r}%
            </Badge>
          );
        },
      },
      {
        accessorKey: "avgProgress",
        header: "Avg video progress",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.avgProgress}%</span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      exportTitle="Learning Results"
      columns={columns}
      data={rows}
      getRowId={(r) => r.courseId}
      searchPlaceholder="Search courses…"
      emptyMessage="No results yet."
    />
  );
}

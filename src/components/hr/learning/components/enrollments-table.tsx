"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import {
  employeeIdColumns,
  HIDE_SYSTEM_ID,
} from "@/src/components/shared/employee-id-columns";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import { ENROLLMENT_STATUS_LABELS, ENROLLMENT_STATUS_STYLES } from "../data";
import { formatDate } from "@/src/lib/utils/format-date";
import type { Enrollment, Course } from "../types";
import { EnrollmentsToolbar } from "./enrollments-toolbar";

interface EnrollmentsTableProps {
  enrollments: Enrollment[];
  courses: Course[];
  onDelete: (id: string) => void;
  onEnroll: () => void;
}

export function EnrollmentsTable({
  enrollments,
  courses,
  onDelete,
  onEnroll,
}: EnrollmentsTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = enrollments.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      e.employeeName.toLowerCase().includes(q) ||
      (e.courseTitle ?? "").toLowerCase().includes(q) ||
      (e.department ?? "").toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || e.department === deptFilter;
    const matchCourse = courseFilter === "all" || e.courseId === courseFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchDept && matchCourse && matchStatus;
  });

  const identity = useEmployeeIdentity();
  const columns = useMemo<ColumnDef<Enrollment>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
              {row.original.employeeInitials}
            </div>
            <span className="text-xs font-medium">
              {row.original.employeeName}
            </span>
          </div>
        ),
      },
      ...employeeIdColumns<Enrollment>({
        identity,
        name: (r) => r.employeeName,
      }),
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.department}
          </span>
        ),
      },
      {
        accessorKey: "courseTitle",
        header: sortableHeader("Course"),
        cell: ({ row }) => (
          <p className="text-xs truncate max-w-44">{row.original.courseTitle}</p>
        ),
      },
      {
        accessorKey: "enrolledDate",
        header: sortableHeader("Enrolled"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.enrolledDate
              ? new Date(row.original.enrolledDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "dueDate",
        header: sortableHeader("Due"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.dueDate ? formatDate(row.original.dueDate) : "—"}
          </span>
        ),
      },
      {
        accessorKey: "progress",
        header: "Progress",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 w-36">
            <Progress value={row.original.progress} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground shrink-0 w-7 text-right">
              {row.original.progress}%
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${ENROLLMENT_STATUS_STYLES[row.original.status]}`}
          >
            {ENROLLMENT_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      {
        accessorKey: "score",
        header: sortableHeader("Quiz"),
        cell: ({ row }) => {
          const e = row.original;
          const attempts = e.quizAttempts?.length ?? 0;
          if (attempts === 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          const best = Math.max(...(e.quizAttempts ?? []).map((a) => a.score));
          return (
            <span className="text-xs">
              <span className={e.quizPassed ? "text-emerald-600" : "text-rose-600"}>
                {e.quizPassed ? "Passed" : "Failed"}
              </span>
              <span className="text-muted-foreground"> · {best}% · {attempts} att.</span>
            </span>
          );
        },
      },
      actionsColumn<Enrollment>((enrollment) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-xs gap-2 text-destructive focus:text-destructive"
              onClick={() => setDeleteId(enrollment.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [identity],
  );

  return (
    <>
      <EnrollmentsToolbar
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        courseFilter={courseFilter}
        onCourseFilterChange={setCourseFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        courses={courses}
        onEnroll={onEnroll}
      />
      <div className="mt-4">
        <DataTable
          columns={columns}
          initialColumnVisibility={HIDE_SYSTEM_ID}
          enableColumnVisibility
          data={filtered}
          getRowId={(e) => e.id}
          emptyMessage="No enrollments found."
        />
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Enrollment</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this employee&apos;s enrollment from the course.
              This action cannot be undone.
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

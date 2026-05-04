"use client";

import { useState } from "react";
import { MoreHorizontal, Users, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
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
import { ENROLLMENT_STATUS_LABELS, ENROLLMENT_STATUS_STYLES } from "../data";
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
      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Employee
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Department
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Course
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Enrolled
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs w-36">
                    Progress
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Status
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Score
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3 text-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Users className="w-8 h-8 opacity-30" />
                        <p className="text-sm font-medium">
                          No enrollments found
                        </p>
                        <p className="text-xs">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                            {enrollment.employeeInitials}
                          </div>
                          <span className="text-xs font-medium">
                            {enrollment.employeeName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {enrollment.department}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-44">
                        <p className="text-xs truncate">
                          {enrollment.courseTitle}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {enrollment.enrolledDate
                            ? new Date(
                                enrollment.enrolledDate,
                              ).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress
                            value={enrollment.progress}
                            className="h-1.5 flex-1"
                          />
                          <span className="text-[10px] text-muted-foreground shrink-0 w-7 text-right">
                            {enrollment.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${ENROLLMENT_STATUS_STYLES[enrollment.status]}`}
                        >
                          {ENROLLMENT_STATUS_LABELS[enrollment.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {enrollment.score !== undefined
                            ? `${enrollment.score}%`
                            : "—"}
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
                              className="text-xs gap-2 text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(enrollment.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
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

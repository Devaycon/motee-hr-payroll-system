"use client";

import { useState } from "react";
import {
  MoreHorizontal,
  BookOpen,
  Pencil,
  Trash2,
  Clock,
  Users,
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
import {
  COURSE_CATEGORY_LABELS,
  COURSE_CATEGORY_STYLES,
  DELIVERY_MODE_LABELS,
  COURSE_STATUS_LABELS,
  COURSE_STATUS_STYLES,
} from "../data";
import type { Course } from "../types";
import { CoursesToolbar } from "./courses-toolbar";

interface CoursesTableProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
  onAddCourse: () => void;
}

export function CoursesTable({
  courses,
  onEdit,
  onDelete,
  onAddCourse,
}: CoursesTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      (c.instructor ?? "").toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q);
    const matchCat = categoryFilter === "all" || c.category === categoryFilter;
    const matchMode = modeFilter === "all" || c.deliveryMode === modeFilter;
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchCat && matchMode && matchStatus;
  });

  return (
    <>
      <CoursesToolbar
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        modeFilter={modeFilter}
        onModeFilterChange={setModeFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddCourse={onAddCourse}
      />
      <Card className="mt-4">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Course
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Category
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Provider
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Duration
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Delivery
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Enrolled / Completed
                  </th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3 text-xs">
                    Status
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
                        <BookOpen className="w-8 h-8 opacity-30" />
                        <p className="text-sm font-medium">No courses found</p>
                        <p className="text-xs">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 max-w-56">
                        <p className="text-xs font-medium truncate">
                          {course.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {course.description}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${COURSE_CATEGORY_STYLES[course.category]}`}
                        >
                          {COURSE_CATEGORY_LABELS[course.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {course.instructor}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {course.durationHours}h
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground">
                          {DELIVERY_MODE_LABELS[course.deliveryMode]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {course.enrolledCount} / {course.completionCount}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${COURSE_STATUS_STYLES[course.status]}`}
                        >
                          {COURSE_STATUS_LABELS[course.status]}
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
                              onClick={() => onEdit(course)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs gap-2 text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(course.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
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
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this course and all its data. This
              action cannot be undone.
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

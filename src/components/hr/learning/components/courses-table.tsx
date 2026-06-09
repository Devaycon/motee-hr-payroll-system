"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Clock, Users, ListChecks } from "lucide-react";
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
  onManageQuiz: (course: Course) => void;
}

export function CoursesTable({
  courses,
  onEdit,
  onDelete,
  onAddCourse,
  onManageQuiz,
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

  const columns = useMemo<ColumnDef<Course>[]>(
    () => [
      {
        accessorKey: "title",
        header: sortableHeader("Course"),
        cell: ({ row }) => (
          <div className="max-w-56">
            <p className="text-xs font-medium truncate">{row.original.title}</p>
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
              {row.original.description}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: sortableHeader("Category"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${COURSE_CATEGORY_STYLES[row.original.category]}`}
          >
            {COURSE_CATEGORY_LABELS[row.original.category]}
          </span>
        ),
      },
      {
        accessorKey: "instructor",
        header: "Provider",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.instructor}
          </span>
        ),
      },
      {
        accessorKey: "durationHours",
        header: sortableHeader("Duration"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {row.original.durationHours}h
          </div>
        ),
      },
      {
        accessorKey: "deliveryMode",
        header: "Delivery",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {DELIVERY_MODE_LABELS[row.original.deliveryMode]}
          </span>
        ),
      },
      {
        id: "enrolled",
        header: "Enrolled / Completed",
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            {row.original.enrolledCount} / {row.original.completionCount}
          </div>
        ),
      },
      {
        id: "quiz",
        header: "Quiz",
        cell: ({ row }) => {
          const n = row.original.quiz?.questions.length ?? 0;
          return (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ListChecks className="w-3 h-3" />
              {n > 0 ? `${n} Q` : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${COURSE_STATUS_STYLES[row.original.status]}`}
          >
            {COURSE_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      actionsColumn<Course>((course) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
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
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onManageQuiz(course)}
            >
              <ListChecks className="w-3.5 h-3.5" />
              Manage quiz
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
      )),
    ],
    [onEdit, onManageQuiz],
  );

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
      <div className="mt-4">
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(c) => c.id}
          emptyMessage="No courses found."
        />
      </div>

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

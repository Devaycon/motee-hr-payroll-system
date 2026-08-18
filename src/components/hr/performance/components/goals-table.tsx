"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Progress } from "@/src/components/ui/progress";
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
  employeeIdColumns,
  HIDE_SYSTEM_ID,
} from "@/src/components/shared/employee-id-columns";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import {
  GOAL_STATUS_LABELS,
  GOAL_STATUS_STYLES,
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_STYLES,
} from "../data";
import type { PerformanceGoal } from "../types";
import { GoalsToolbar } from "./goals-toolbar";

interface GoalsTableProps {
  goals: PerformanceGoal[];
  onEdit: (goal: PerformanceGoal) => void;
  onDelete: (id: string) => void;
  onAddGoal: () => void;
}

export function GoalsTable({
  goals,
  onEdit,
  onDelete,
  onAddGoal,
}: GoalsTableProps) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = goals.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      g.employeeName.toLowerCase().includes(q) ||
      g.goalTitle.toLowerCase().includes(q) ||
      g.department.toLowerCase().includes(q);
    const matchDept = deptFilter === "all" || g.department === deptFilter;
    const matchCat = categoryFilter === "all" || g.category === categoryFilter;
    const matchStatus = statusFilter === "all" || g.status === statusFilter;
    return matchSearch && matchDept && matchCat && matchStatus;
  });

  const identity = useEmployeeIdentity();
  const columns = useMemo<ColumnDef<PerformanceGoal>[]>(
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
      ...employeeIdColumns<PerformanceGoal>({
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
        accessorKey: "goalTitle",
        header: sortableHeader("Goal Title"),
        cell: ({ row }) => (
          <p className="text-xs font-medium truncate max-w-48">
            {row.original.goalTitle}
          </p>
        ),
      },
      {
        accessorKey: "category",
        header: sortableHeader("Category"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${GOAL_CATEGORY_STYLES[row.original.category]}`}
          >
            {GOAL_CATEGORY_LABELS[row.original.category]}
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
        accessorKey: "dueDate",
        header: sortableHeader("Due Date"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.dueDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${GOAL_STATUS_STYLES[row.original.status]}`}
          >
            {GOAL_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      actionsColumn<PerformanceGoal>((goal) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onEdit(goal)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit / Update
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 text-destructive focus:text-destructive"
              onClick={() => setDeleteId(goal.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onEdit, identity],
  );

  return (
    <>
      <GoalsToolbar
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddGoal={onAddGoal}
      />
      <div className="mt-4">
        <DataTable
          exportTitle="Performance Goals"
          columns={columns}
          initialColumnVisibility={HIDE_SYSTEM_ID}
          enableColumnVisibility
          data={filtered}
          getRowId={(g) => g.id}
          emptyMessage="No goals found."
        />
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Goal</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this performance goal. This action
              cannot be undone.
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

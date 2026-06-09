"use client";
import { formatDate } from "@/src/lib/utils/format-date";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2, MoreHorizontal, UserPlus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { AddEmployeeModal } from "./add-employee-modal";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
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
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import { STATUS_STYLES, formatBudget } from "../data";
import type { Department } from "../types";

interface DepartmentsTableProps {
  departments: Department[];
  onEdit: (dept: Department) => void;
  onDelete: (id: string) => void;
}

export function DepartmentsTable({
  departments,
  onEdit,
  onDelete,
}: DepartmentsTableProps) {
  const router = useRouter();
  const [addEmpDept, setAddEmpDept] = useState<Department | null>(null);

  const columns = useMemo<ColumnDef<Department>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {row.original.code}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "head",
        header: "Head",
        cell: ({ row }) =>
          row.original.head ? (
            <div className="flex items-center gap-2">
              <PersonAvatar
                name={row.original.head}
                initials={row.original.headInitials}
                className="size-6 shrink-0"
                fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
              />
              <span className="text-sm text-foreground">{row.original.head}</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              Unassigned
            </span>
          ),
      },
      {
        accessorKey: "employeeCount",
        header: sortableHeader("Employees"),
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {row.original.employeeCount}
          </span>
        ),
      },
      {
        accessorKey: "openPositions",
        header: "Open Positions",
        cell: ({ row }) =>
          row.original.openPositions > 0 ? (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-primary/30 bg-primary/10 text-primary"
            >
              {row.original.openPositions} open
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "budget",
        header: "Budget",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {formatBudget(row.original.budgetMonthly ?? 0)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 capitalize",
              STATUS_STYLES[row.original.status],
            )}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: sortableHeader("Created"),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      actionsColumn<Department>((dept) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onClick={() =>
                router.push(`/organization/departments/${dept.id}`)
              }
            >
              <Eye className="w-3.5 h-3.5" /> View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onSelect={(e) => {
                e.preventDefault();
                setAddEmpDept(dept);
              }}
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Employee
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 cursor-pointer"
              onClick={() => onEdit(dept)}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-xs gap-2 text-red-500 focus:text-red-500 cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete department?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove <strong>{dept.name}</strong> and
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => onDelete(dept.id)}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [router, onEdit, onDelete],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={departments}
        getRowId={(d) => d.id}
        emptyMessage="No departments found."
      />

      {addEmpDept && (
        <AddEmployeeModal
          open={!!addEmpDept}
          onOpenChange={(v) => {
            if (!v) setAddEmpDept(null);
          }}
          departmentName={addEmpDept.name}
          currentMembers={[]}
          onAdd={() => setAddEmpDept(null)}
        />
      )}
    </>
  );
}

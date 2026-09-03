"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Users,
  Filter,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
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
import { BRANCH_KIND_LABELS, BRANCH_STATUS_STYLES } from "../data";
import type { Branch } from "../types";

interface BranchesTableProps {
  branches: Branch[];
  onEdit: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
  /** Scopes the whole app to this branch, via the navbar switcher's state. */
  onScopeTo: (id: string) => void;
}

export function BranchesTable({
  branches,
  onEdit,
  onDelete,
  onScopeTo,
}: BranchesTableProps) {
  const router = useRouter();

  const columns = useMemo<ColumnDef<Branch>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Branch"),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {row.original.code} · {BRANCH_KIND_LABELS[row.original.kind]}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "city",
        header: sortableHeader("Location"),
        cell: ({ row }) => (
          <div className="max-w-56">
            <p className="text-sm text-foreground">{row.original.city}</p>
            {row.original.region && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {row.original.region}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "managerName",
        header: "Branch Head",
        cell: ({ row }) =>
          row.original.managerName ? (
            <div className="flex items-center gap-2">
              <PersonAvatar
                name={row.original.managerName}
                initials={row.original.managerInitials}
                className="size-6 shrink-0"
                fallbackClassName="bg-primary/10 text-primary text-[10px] font-semibold"
              />
              <span className="text-sm text-foreground">
                {row.original.managerName}
              </span>
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
            {row.original.headcountTarget ? (
              <span className="text-muted-foreground font-normal">
                {" "}
                / {row.original.headcountTarget}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        accessorKey: "departmentCount",
        header: "Departments",
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.departmentCount}
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
              BRANCH_STATUS_STYLES[row.original.status],
            )}
          >
            {row.original.status}
          </Badge>
        ),
      },
      actionsColumn<Branch>((branch) => {
        // A branch with people cannot be deleted — the records would be
        // orphaned and would vanish from every scoped view.
        const occupied = branch.employeeCount > 0;
        return (
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="text-xs gap-2 cursor-pointer"
                onClick={() => router.push(`/organization/branches/${branch.id}`)}
              >
                <Eye className="w-3.5 h-3.5" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-2 cursor-pointer"
                onClick={() => onScopeTo(branch.id)}
              >
                <Filter className="w-3.5 h-3.5" /> Scope app to this branch
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs gap-2 cursor-pointer"
                onClick={() =>
                  router.push(
                    `/organization/employees?branch=${encodeURIComponent(branch.id)}`,
                  )
                }
              >
                <Users className="w-3.5 h-3.5" /> View employees
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs gap-2 cursor-pointer"
                onClick={() => onEdit(branch)}
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
                    <AlertDialogTitle>
                      {occupied ? "Branch still has people" : "Delete branch?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {occupied ? (
                        <>
                          <strong>{branch.name}</strong> has{" "}
                          {branch.employeeCount} employee
                          {branch.employeeCount === 1 ? "" : "s"} posted to it.
                          Move them to another branch first — deleting it now
                          would leave them with nowhere to belong.
                        </>
                      ) : (
                        <>
                          This will permanently remove{" "}
                          <strong>{branch.name}</strong> and cannot be undone.
                        </>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {occupied ? "Close" : "Cancel"}
                    </AlertDialogCancel>
                    {occupied ? (
                      <AlertDialogAction
                        onClick={() =>
                          router.push(
                            `/organization/employees?branch=${encodeURIComponent(branch.id)}`,
                          )
                        }
                      >
                        View employees
                      </AlertDialogAction>
                    ) : (
                      <AlertDialogAction
                        className="bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => onDelete(branch)}
                      >
                        Delete
                      </AlertDialogAction>
                    )}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }),
    ],
    [router, onEdit, onDelete, onScopeTo],
  );

  return (
    <DataTable
      exportTitle="Branches"
      columns={columns}
      data={branches}
      getRowId={(b) => b.id}
      onRowClick={(b) => router.push(`/organization/branches/${b.id}`)}
      emptyMessage="No branches found."
    />
  );
}

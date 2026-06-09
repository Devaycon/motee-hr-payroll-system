"use client";

import { useMemo, useState } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
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
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_STYLES } from "../data";
import type { LeavePolicy, LeaveTypeName } from "../types";

interface PoliciesTableProps {
  policies: LeavePolicy[];
  onEdit: (policy: LeavePolicy) => void;
  onDelete: (id: string) => void;
  onAddPolicy: () => void;
}

export function PoliciesTable({
  policies,
  onEdit,
  onDelete,
  onAddPolicy,
}: PoliciesTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns = useMemo<ColumnDef<LeavePolicy>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Policy Name"),
        cell: ({ row }) => (
          <div>
            <p className="text-xs font-medium">{row.original.name}</p>
            {row.original.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-56 truncate">
                {row.original.description}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "leaveType",
        header: sortableHeader("Leave Type"),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${LEAVE_TYPE_STYLES[row.original.leaveType as LeaveTypeName]}`}
          >
            {LEAVE_TYPE_LABELS[row.original.leaveType as LeaveTypeName]}
          </span>
        ),
      },
      {
        accessorKey: "maxDaysPerYear",
        header: sortableHeader("Max Days/Year"),
        cell: ({ row }) => (
          <span className="text-xs font-medium">
            {row.original.maxDaysPerYear} days
          </span>
        ),
      },
      {
        accessorKey: "minNoticeDays",
        header: "Min Notice",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.minNoticeDays === 0
              ? "None"
              : `${row.original.minNoticeDays} day${row.original.minNoticeDays !== 1 ? "s" : ""}`}
          </span>
        ),
      },
      {
        accessorKey: "maxConsecutiveDays",
        header: "Max Consecutive",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.maxConsecutiveDays} days
          </span>
        ),
      },
      {
        id: "medCert",
        header: "Med. Cert",
        cell: ({ row }) =>
          row.original.requiresMedicalCertificate ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <X className="w-3.5 h-3.5 text-muted-foreground/40" />
          ),
      },
      {
        id: "carryOver",
        header: "Carry Over",
        cell: ({ row }) =>
          row.original.carryOverAllowed ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Up to {row.original.maxCarryOverDays}d
            </span>
          ) : (
            <X className="w-3.5 h-3.5 text-muted-foreground/40" />
          ),
      },
      actionsColumn<LeavePolicy>((policy) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onEdit(policy)}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2 text-destructive focus:text-destructive"
              onClick={() => setDeleteId(policy.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onEdit],
  );

  return (
    <>
      <div className="flex items-center justify-end">
        <Button size="lg" onClick={onAddPolicy}>
          <Plus className="w-3.5 h-3.5" />
          Add Policy
        </Button>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={policies}
          getRowId={(p) => p.id}
          emptyMessage="No policies created."
        />
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Policy</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this leave policy. Existing leave
              balances will not be affected. This action cannot be undone.
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

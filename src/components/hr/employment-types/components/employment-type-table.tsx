"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, PowerOff, Power, Eye } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
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
import { CONTRACT_DURATION_LABELS, CONTRACT_DURATION_STYLES } from "../data";
import { EmploymentTypeDetailModal } from "./employment-type-detail-modal";
import type { EmploymentTypeRow } from "../types";

interface EmploymentTypeTableProps {
  types: EmploymentTypeRow[];
  onEdit: (type: EmploymentTypeRow) => void;
  onToggleStatus: (id: string) => void;
}

export function EmploymentTypeTable({
  types,
  onEdit,
  onToggleStatus,
}: EmploymentTypeTableProps) {
  const [detailType, setDetailType] = useState<EmploymentTypeRow | null>(null);

  const columns = useMemo<ColumnDef<EmploymentTypeRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: sortableHeader("Type Name"),
        cell: ({ row }) => (
          <p className="font-medium text-foreground text-sm">
            {row.original.name}
          </p>
        ),
      },
      {
        accessorKey: "contractDuration",
        header: "Contract Duration",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-medium",
              CONTRACT_DURATION_STYLES[row.original.contractDuration],
            )}
          >
            {CONTRACT_DURATION_LABELS[row.original.contractDuration]}
          </Badge>
        ),
      },
      {
        accessorKey: "leaveEntitlement",
        header: "Leave Entitlement",
        cell: ({ row }) => (
          <p className="text-sm text-foreground">
            {row.original.leaveEntitlement}
          </p>
        ),
      },
      {
        id: "payroll",
        header: "Payroll",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-medium",
              row.original.payrollInclusion
                ? "border-blue-500/30 bg-blue-500/10 text-blue-600"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {row.original.payrollInclusion ? "Included" : "Excluded"}
          </Badge>
        ),
      },
      {
        id: "statutory",
        header: "Statutory Deductions",
        cell: ({ row }) =>
          row.original.statutoryDeductions.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.original.statutoryDeductions.map((d) => (
                <Badge
                  key={d}
                  variant="outline"
                  className="text-[10px] font-medium border-border bg-muted text-muted-foreground"
                >
                  {d}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "employeeCount",
        header: sortableHeader("Employees"),
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.employeeCount}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-medium",
              row.original.isActive
                ? "border-green-500/30 bg-green-500/10 text-green-600"
                : "border-border bg-muted text-muted-foreground",
            )}
          >
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      actionsColumn<EmploymentTypeRow>((type) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => setDetailType(type)}
            >
              <Eye className="w-3.5 h-3.5" /> View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => onEdit(type)}
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Type
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="text-xs gap-2"
                  onSelect={(e) => e.preventDefault()}
                >
                  {type.isActive ? (
                    <>
                      <PowerOff className="w-3.5 h-3.5" /> Deactivate
                    </>
                  ) : (
                    <>
                      <Power className="w-3.5 h-3.5" /> Activate
                    </>
                  )}
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {type.isActive
                      ? "Deactivate Employment Type"
                      : "Activate Employment Type"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {type.isActive
                      ? `Deactivating "${type.name}" will prevent it from being assigned to new employees.`
                      : `Activating "${type.name}" will make it available for assignment again.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onToggleStatus(type.id)}>
                    {type.isActive ? "Deactivate" : "Activate"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [onEdit, onToggleStatus],
  );

  return (
    <>
      <DataTable
        exportTitle="Employment Types"
        columns={columns}
        data={types}
        getRowId={(t) => t.id}
        emptyMessage="No employment types found."
      />

      <EmploymentTypeDetailModal
        type={detailType}
        open={!!detailType}
        onOpenChange={(v) => {
          if (!v) setDetailType(null);
        }}
      />
    </>
  );
}

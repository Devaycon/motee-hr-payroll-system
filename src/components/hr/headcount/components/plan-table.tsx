"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
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
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { cn } from "@/src/lib/utils";
import {
  GAP_SEVERITY_LABELS,
  GAP_SEVERITY_STYLES,
  gapSeverity,
} from "../data";
import { PlanDetailModal } from "./plan-detail-modal";
import type { HeadcountPlan } from "../types";

interface PlanTableProps {
  plans: HeadcountPlan[];
  onEdit?: (plan: HeadcountPlan) => void;
  onDelete?: (id: string) => void;
  /** Hide edit/remove actions (view-only embed, e.g. Workforce Planning). */
  readOnly?: boolean;
}

export function PlanTable({ plans, onEdit, onDelete, readOnly }: PlanTableProps) {
  const [detailPlan, setDetailPlan] = useState<HeadcountPlan | null>(null);

  const columns = useMemo<ColumnDef<HeadcountPlan>[]>(
    () => [
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <p className="font-medium text-foreground text-sm">
            {row.original.department}
          </p>
        ),
      },
      {
        accessorKey: "target",
        header: sortableHeader("Target"),
        cell: ({ row }) => (
          <p className="text-sm text-foreground font-medium">
            {row.original.target}
          </p>
        ),
      },
      {
        accessorKey: "actual",
        header: sortableHeader("Actual"),
        cell: ({ row }) => (
          <p className="text-sm text-foreground font-medium">
            {row.original.actual}
          </p>
        ),
      },
      {
        id: "fillRate",
        header: "Fill Rate",
        cell: ({ row }) => {
          const fillRate =
            row.original.target > 0
              ? Math.min(
                  100,
                  Math.round((row.original.actual / row.original.target) * 100),
                )
              : 0;
          return (
            <div className="flex items-center gap-2 min-w-36">
              <Progress value={fillRate} className="h-1.5 w-24" />
              <span className="text-xs text-muted-foreground tabular-nums">
                {fillRate}%
              </span>
            </div>
          );
        },
      },
      {
        id: "gap",
        header: "Gap",
        cell: ({ row }) => {
          const gap = row.original.actual - row.original.target;
          return (
            <p
              className={cn(
                "text-sm font-medium tabular-nums",
                gap > 0 && "text-blue-600 dark:text-blue-400",
                gap < 0 && "text-red-600 dark:text-red-400",
                gap === 0 && "text-muted-foreground",
              )}
            >
              {gap > 0 ? `+${gap}` : gap === 0 ? "—" : gap}
            </p>
          );
        },
      },
      {
        accessorKey: "gapStatus",
        header: sortableHeader("Status"),
        // §6.7 — four colour-coded bands derived from the gap magnitude.
        cell: ({ row }) => {
          const severity = gapSeverity(row.original.actual, row.original.target);
          return (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                GAP_SEVERITY_STYLES[severity],
              )}
            >
              {GAP_SEVERITY_LABELS[severity]}
            </span>
          );
        },
      },
      actionsColumn<HeadcountPlan>((plan) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="text-xs gap-2"
              onClick={() => setDetailPlan(plan)}
            >
              <Eye className="w-3.5 h-3.5" />
              View Details
            </DropdownMenuItem>
            {!readOnly && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-xs gap-2"
                  onClick={() => onEdit?.(plan)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Target
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-xs gap-2 text-destructive focus:text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Plan
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Headcount Plan</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove the headcount plan for{" "}
                        <span className="font-semibold text-foreground">
                          {plan.department}
                        </span>
                        ? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => onDelete?.(plan.id)}
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [readOnly, onEdit, onDelete],
  );

  return (
    <>
      <DataTable
        exportTitle="Headcount Plan"
        columns={columns}
        data={plans}
        getRowId={(p) => p.id}
        emptyMessage="No headcount plans found."
      />

      <PlanDetailModal
        plan={detailPlan}
        open={!!detailPlan}
        onOpenChange={(v) => {
          if (!v) setDetailPlan(null);
        }}
      />
    </>
  );
}

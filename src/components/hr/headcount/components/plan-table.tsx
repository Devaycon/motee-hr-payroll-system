"use client";

import { useState } from "react";
import { MoreHorizontal, BarChart3, Pencil, Trash2, Eye } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
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
import { cn } from "@/src/lib/utils";
import { GAP_STATUS_LABELS, GAP_STATUS_STYLES } from "../data";
import { PlanDetailModal } from "./plan-detail-modal";
import type { HeadcountPlan } from "../types";

interface PlanTableProps {
  plans: HeadcountPlan[];
  onEdit: (plan: HeadcountPlan) => void;
  onDelete: (id: string) => void;
}

export function PlanTable({ plans, onEdit, onDelete }: PlanTableProps) {
  const [detailPlan, setDetailPlan] = useState<HeadcountPlan | null>(null);

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No headcount plans found
          </p>
          <p className="text-xs text-muted-foreground">
            Add a target for a department to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Target
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Actual
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground min-w-36">
                    Fill Rate
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Gap
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const fillRate =
                    plan.target > 0
                      ? Math.min(
                          100,
                          Math.round((plan.actual / plan.target) * 100),
                        )
                      : 0;
                  const gap = plan.actual - plan.target;

                  return (
                    <tr
                      key={plan.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground text-sm">
                          {plan.department}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground font-medium">
                          {plan.target}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-foreground font-medium">
                          {plan.actual}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={fillRate} className="h-1.5 w-24" />
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {fillRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            GAP_STATUS_STYLES[plan.gapStatus],
                          )}
                        >
                          {GAP_STATUS_LABELS[plan.gapStatus]}
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
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-xs gap-2"
                              onClick={() => onEdit(plan)}
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
                                  <AlertDialogTitle>
                                    Remove Headcount Plan
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove the
                                    headcount plan for{" "}
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
                                    onClick={() => onDelete(plan.id)}
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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

"use client";

import {
  MoreHorizontal,
  UserMinus,
  ClipboardList,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
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
import {
  OFFBOARDING_STATUS_LABELS,
  OFFBOARDING_STATUS_STYLES,
  EXIT_REASON_LABELS,
  EXIT_REASON_STYLES,
} from "../data";
import type { OffboardingRecord } from "../types";

interface PipelineTableProps {
  records: OffboardingRecord[];
  onViewDetails: (record: OffboardingRecord) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PipelineTable({
  records,
  onViewDetails,
  onComplete,
  onDelete,
}: PipelineTableProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <UserMinus className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No offboarding records found
          </p>
          <p className="text-xs text-muted-foreground">
            Initiate offboarding from an employee profile or the button above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Employee
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Department
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Last Working Day
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Exit Reason
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground min-w-36">
                  Clearance
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Exit Interview
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
              {records.map((record) => {
                const clearedCount = record.clearanceItems.filter(
                  (c) => c.completed,
                ).length;
                const totalClearance = record.clearanceItems.length;
                const clearancePct =
                  totalClearance > 0
                    ? Math.round((clearedCount / totalClearance) * 100)
                    : 0;
                const allClearanceDone = clearedCount === totalClearance;

                return (
                  <tr
                    key={record.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] font-semibold bg-destructive/10 text-destructive">
                            {record.employeeInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground leading-none">
                            {record.employeeName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {record.jobTitle}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        {record.department}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {record.lastWorkingDate}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          EXIT_REASON_STYLES[record.exitReason],
                        )}
                      >
                        {EXIT_REASON_LABELS[record.exitReason]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 min-w-32">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {clearedCount}/{totalClearance} items
                          </span>
                          <span className="text-xs font-medium text-foreground">
                            {clearancePct}%
                          </span>
                        </div>
                        <Progress value={clearancePct} className="h-1.5" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {record.exitInterviewCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          OFFBOARDING_STATUS_STYLES[record.status],
                        )}
                      >
                        {OFFBOARDING_STATUS_LABELS[record.status]}
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
                            onClick={() => onViewDetails(record)}
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            View Details
                          </DropdownMenuItem>
                          {record.status !== "completed" &&
                            allClearanceDone && (
                              <DropdownMenuItem
                                className="text-xs gap-2 text-emerald-600 focus:text-emerald-600 dark:text-emerald-400"
                                onClick={() => onComplete(record.id)}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Mark Complete
                              </DropdownMenuItem>
                            )}
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-xs gap-2 text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Remove Offboarding Record
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove the
                                  offboarding record for{" "}
                                  <span className="font-semibold text-foreground">
                                    {record.employeeName}
                                  </span>
                                  ?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => onDelete(record.id)}
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
  );
}

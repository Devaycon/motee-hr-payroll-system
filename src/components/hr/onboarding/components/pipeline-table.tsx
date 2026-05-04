"use client";

import {
  MoreHorizontal,
  UserPlus,
  ListChecks,
  Mail,
  ChevronRight,
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
  ONBOARDING_STAGE_LABELS,
  ONBOARDING_STAGE_STYLES,
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_STATUS_STYLES,
  STAGE_ORDER,
} from "../data";
import type { OnboardingRecord } from "../types";

interface PipelineTableProps {
  records: OnboardingRecord[];
  onViewTasks: (record: OnboardingRecord) => void;
  onAdvanceStage: (id: string) => void;
  onSendWelcomeEmail: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PipelineTable({
  records,
  onViewTasks,
  onAdvanceStage,
  onSendWelcomeEmail,
  onDelete,
}: PipelineTableProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
            <UserPlus className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No onboarding records found
          </p>
          <p className="text-xs text-muted-foreground">
            Initiate onboarding for a new hire to get started.
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
                  Start Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                  Stage
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground min-w-36">
                  Progress
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
                const progressPct =
                  record.totalTasks > 0
                    ? Math.round(
                        (record.completedTasks / record.totalTasks) * 100,
                      )
                    : 0;
                const currentStageIdx = STAGE_ORDER.indexOf(record.stage);
                const canAdvance =
                  currentStageIdx >= 0 &&
                  currentStageIdx < STAGE_ORDER.length - 1 &&
                  record.stage !== "completed";

                return (
                  <tr
                    key={record.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
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
                        {record.startDate}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          ONBOARDING_STAGE_STYLES[record.stage],
                        )}
                      >
                        {ONBOARDING_STAGE_LABELS[record.stage]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 min-w-32">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {record.completedTasks}/{record.totalTasks} tasks
                          </span>
                          <span className="text-xs font-medium text-foreground">
                            {progressPct}%
                          </span>
                        </div>
                        <Progress value={progressPct} className="h-1.5" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          ONBOARDING_STATUS_STYLES[record.status],
                        )}
                      >
                        {ONBOARDING_STATUS_LABELS[record.status]}
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
                            onClick={() => onViewTasks(record)}
                          >
                            <ListChecks className="w-3.5 h-3.5" />
                            View Tasks
                          </DropdownMenuItem>
                          {canAdvance && (
                            <DropdownMenuItem
                              className="text-xs gap-2"
                              onClick={() => onAdvanceStage(record.id)}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                              Advance Stage
                            </DropdownMenuItem>
                          )}
                          {!record.welcomeEmailSent && (
                            <DropdownMenuItem
                              className="text-xs gap-2"
                              onClick={() => onSendWelcomeEmail(record.id)}
                            >
                              <Mail className="w-3.5 h-3.5" />
                              Send Welcome Email
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
                                  Remove Onboarding Record
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove the onboarding
                                  record for{" "}
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

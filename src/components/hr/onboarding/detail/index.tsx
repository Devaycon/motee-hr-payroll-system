"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { approveTask } from "@/src/lib/stores/onboarding-records-slice";
import { cn } from "@/src/lib/utils";
import {
  ONBOARDING_STAGE_LABELS,
  ONBOARDING_STAGE_STYLES,
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_STATUS_STYLES,
} from "../data";
import type { OnboardingTask } from "../types";

const TASK_ICON = {
  completed: CheckCircle2,
  overdue: AlertCircle,
  pending: Circle,
};

function formatDate(d: string) {
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function OnboardingDetailPage({ recordId }: { recordId: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const record = useAppSelector((s) =>
    s.onboardingRecords.records.find((r) => r.id === recordId),
  );
  const actorName = useAppSelector((s) => s.auth.user?.name ?? "HR");

  // Index of the next task awaiting approval (drives the approval chain).
  const currentTaskIndex = useMemo(() => {
    if (!record) return -1;
    return record.tasks.findIndex((t) => t.status !== "completed");
  }, [record]);

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <Workflow className="w-10 h-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          This onboarding record was not found — it may have been completed and
          moved to Employees.
        </p>
        <Button variant="outline" onClick={() => router.push("/talent/onboarding")}>
          Back to Onboarding
        </Button>
      </div>
    );
  }

  const pct =
    record.totalTasks > 0
      ? Math.round((record.completedTasks / record.totalTasks) * 100)
      : 0;

  const handleApprove = (task: OnboardingTask) => {
    // Will this approval complete every required task? (Clearing to Employees
    // is handled in the reducer.)
    const willComplete =
      task.isRequired &&
      record.tasks
        .filter((t) => t.isRequired)
        .every((t) => t.id === task.id || t.status === "completed");

    dispatch(approveTask({ recordId: record.id, taskId: task.id, actorName }));

    if (willComplete) {
      toast.success(`${record.employeeName} cleared — added to Employees`);
      router.push("/talent/onboarding");
    } else {
      toast.success(`Approved: ${task.taskName}`);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit gap-1.5 text-muted-foreground -ml-2"
        onClick={() => router.push("/talent/onboarding")}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Onboarding
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex items-start gap-4 flex-wrap">
            <PersonAvatar
              name={record.employeeName}
              initials={record.employeeInitials}
              className="size-12 shrink-0"
              fallbackClassName="bg-primary/10 text-primary text-sm font-semibold"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-foreground">
                {record.employeeName}
              </h1>
              <p className="text-sm text-muted-foreground">
                {record.jobTitle} · {record.department}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    ONBOARDING_STAGE_STYLES[record.stage],
                  )}
                >
                  {ONBOARDING_STAGE_LABELS[record.stage]}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    ONBOARDING_STATUS_STYLES[record.status],
                  )}
                >
                  {ONBOARDING_STATUS_LABELS[record.status]}
                </span>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Workflow className="w-3 h-3" />
                  {record.workflowName ?? "Onboarding Workflow"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Start date {formatDate(record.startDate)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 max-w-md">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Workflow progress — {record.completedTasks}/{record.totalTasks}{" "}
                tasks approved
              </span>
              <span className="font-medium text-foreground">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Workflow tasks */}
        <Card className="lg:col-span-2">
          <CardHeader className="px-5 py-3 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Workflow tasks
            </h2>
            <p className="text-xs text-muted-foreground">
              Each task is approved by its reviewer in order. The workflow
              completes once every task is approved.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {record.tasks.map((task, i) => {
              const Icon = TASK_ICON[task.status];
              const isCurrent = i === currentTaskIndex;
              const canApprove = isCurrent && record.status !== "completed";
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-start gap-3 px-5 py-3.5 border-b border-border last:border-0",
                    isCurrent && "bg-primary/5",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 mt-0.5 shrink-0",
                      task.status === "completed"
                        ? "text-emerald-500"
                        : task.status === "overdue"
                          ? "text-red-500"
                          : "text-muted-foreground",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.status === "completed"
                          ? "text-muted-foreground line-through"
                          : "text-foreground",
                      )}
                    >
                      {task.taskName}
                      {task.isRequired && (
                        <span className="text-red-500 ml-0.5">*</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge
                        variant="outline"
                        className="text-[10px] gap-1 border-primary/20 bg-primary/5 text-primary"
                      >
                        <ShieldCheck className="w-3 h-3" />
                        Reviewer: {task.reviewer}
                      </Badge>
                      {task.approvedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          Approved {formatDate(task.approvedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  {task.status === "completed" ? (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 shrink-0"
                    >
                      Approved
                    </Badge>
                  ) : canApprove ? (
                    <Button
                      size="sm"
                      className="h-7 text-xs shrink-0"
                      onClick={() => handleApprove(task)}
                    >
                      Approve
                    </Button>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground shrink-0"
                    >
                      Awaiting
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          {/* Submissions */}
          <Card>
            <CardHeader className="px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Submissions
              </h2>
              <p className="text-xs text-muted-foreground">
                Documents &amp; details the hire has submitted.
              </p>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-2.5">
              {(record.submissions ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nothing submitted yet.
                </p>
              ) : (
                record.submissions!.map((s) => (
                  <div key={s.id} className="flex items-start gap-2.5">
                    {s.kind === "document" ? (
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {s.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {s.value}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                      {formatDate(s.submittedAt)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader className="px-5 py-3 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Activity
              </h2>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-3">
              {(record.history ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No activity yet.</p>
              ) : (
                record.history!.map((h) => (
                  <div key={h.id} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-foreground">
                        {h.type === "submitted" && "Onboarding initiated"}
                        {h.type === "approved" &&
                          `${h.actorName} approved “${h.taskName}”`}
                        {h.type === "completed" && "Workflow completed"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDate(h.at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

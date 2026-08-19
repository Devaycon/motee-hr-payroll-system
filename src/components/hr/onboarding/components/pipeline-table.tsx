"use client";
import { formatDate } from "@/src/lib/utils/format-date";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  ListChecks,
  Mail,
  Rocket,
  Trash2,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
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
import {
  employeeIdColumns,
  HIDE_SYSTEM_ID,
} from "@/src/components/shared/employee-id-columns";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import { cn } from "@/src/lib/utils";
import {
  ONBOARDING_STAGE_LABELS,
  ONBOARDING_STAGE_STYLES,
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_STATUS_STYLES,
} from "../data";
import {
  INVITATION_STATUS_LABELS,
  INVITATION_STATUS_STYLES,
} from "@/src/lib/types/onboarding";
import type { OnboardingRecord } from "../types";

interface PipelineTableProps {
  records: OnboardingRecord[];
  onViewTasks: (record: OnboardingRecord) => void;
  onSendWelcomeEmail: (id: string) => void;
  /** §2.1 — reissue an invitation whose link has lapsed or been ignored. */
  onResendInvitation: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PipelineTable({
  records,
  onViewTasks,
  onSendWelcomeEmail,
  onResendInvitation,
  onDelete,
}: PipelineTableProps) {
  const router = useRouter();
  const identity = useEmployeeIdentity();
  const columns = useMemo<ColumnDef<OnboardingRecord>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <PersonAvatar
              name={row.original.employeeName}
              initials={row.original.employeeInitials}
              className="h-7 w-7"
              fallbackClassName="text-[10px] font-semibold bg-primary/10 text-primary"
            />
            <div>
              <p className="text-sm font-medium text-foreground leading-none">
                {row.original.employeeName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {row.original.jobTitle}
              </p>
            </div>
          </div>
        ),
      },
      ...employeeIdColumns<OnboardingRecord>({
        identity,
        employeeId: (r) => r.referenceId,
        name: (r) => r.employeeName,
      }),
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <p className="text-xs text-muted-foreground">
            {row.original.department}
          </p>
        ),
      },
      {
        accessorKey: "startDate",
        header: sortableHeader("Start Date"),
        cell: ({ row }) => (
          <p className="text-xs text-muted-foreground tabular-nums">
            {formatDate(row.original.startDate)}
          </p>
        ),
      },
      {
        accessorKey: "stage",
        header: sortableHeader("Stage"),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              ONBOARDING_STAGE_STYLES[row.original.stage],
            )}
          >
            {ONBOARDING_STAGE_LABELS[row.original.stage]}
          </span>
        ),
      },
      {
        id: "progress",
        header: "Progress",
        cell: ({ row }) => {
          const progressPct =
            row.original.totalTasks > 0
              ? Math.round(
                  (row.original.completedTasks / row.original.totalTasks) * 100,
                )
              : 0;
          return (
            <div className="flex flex-col gap-1 min-w-32">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {row.original.completedTasks}/{row.original.totalTasks} tasks
                </span>
                <span className="text-xs font-medium text-foreground">
                  {progressPct}%
                </span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
            </div>
          );
        },
      },
      {
        // §2.1 — "invitation sent" alone couldn't distinguish an ignored
        // invite from one mid-flight, so HR chased the wrong people.
        id: "invitation",
        header: "Invitation",
        cell: ({ row }) => {
          const invite = row.original.invitation;
          if (row.original.mode !== "invited" || !invite) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          const expired =
            invite.expiresAt &&
            new Date(invite.expiresAt) < new Date() &&
            invite.status !== "submitted";
          const status = expired ? "expired" : invite.status;
          return (
            <div className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  INVITATION_STATUS_STYLES[status],
                )}
              >
                {INVITATION_STATUS_LABELS[status]}
              </span>
              {(invite.remindersSent ?? 0) > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {invite.remindersSent} reminder
                  {invite.remindersSent === 1 ? "" : "s"} sent
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
              ONBOARDING_STATUS_STYLES[row.original.status],
            )}
          >
            {ONBOARDING_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      actionsColumn<OnboardingRecord>((record) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
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
              {/* §2.1 — a sent invite can now be reissued, not just sent once. */}
              <DropdownMenuItem
                className="text-xs gap-2"
                onClick={() =>
                  record.welcomeEmailSent
                    ? onResendInvitation(record.id)
                    : onSendWelcomeEmail(record.id)
                }
              >
                <Mail className="w-3.5 h-3.5" />
                {record.welcomeEmailSent
                  ? "Resend Invitation"
                  : "Send Welcome Email"}
              </DropdownMenuItem>
              {record.mode === "invited" && (
                <DropdownMenuItem
                  className="text-xs gap-2"
                  onClick={() => router.push(`/join/${record.id}`)}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  Open Onboarding Wizard
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
                      Are you sure you want to remove the onboarding record for{" "}
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
        );
      }),
    ],
    [
      onViewTasks,
      onSendWelcomeEmail,
      onResendInvitation,
      onDelete,
      router,
      identity,
    ],
  );

  return (
    <DataTable
      exportTitle="Onboarding Pipeline"
      columns={columns}
      initialColumnVisibility={HIDE_SYSTEM_ID}
      enableColumnVisibility
      data={records}
      getRowId={(r) => r.id}
      emptyMessage="No onboarding records found."
    />
  );
}

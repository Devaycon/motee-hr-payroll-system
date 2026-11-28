"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Check,
  CircleCheck,
  CircleX,
  Clock,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { EmployeeLink } from "@/src/components/shared/employee-link";
import { RowActions } from "@/src/components/hr/employees/employee-detail/row-actions";
import {
  CHANGE_REQUEST_TONES,
  ChangeRequestDetailModal,
  RejectChangeRequestDialog,
  RequestValue,
} from "@/src/components/shared/profile-fields";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { approveRequest } from "@/src/lib/stores/profile-edits-slice";
import { useCan } from "@/src/lib/permissions/use-can";
import { formatDate } from "@/src/lib/utils/format-date";
import { cn } from "@/src/lib/utils";
import type { ChangeRequestStatus } from "@/src/lib/types/profile-edits";
import { useChangeRequestQueue, type QueueRow } from "./use-change-request-queue";

const STATUS_LABELS: Record<ChangeRequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const DAY_MS = 86_400_000;

const daysSince = (iso?: string) =>
  iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS)) : 0;

/**
 * Employee Management → Profile Change Requests. Every change employees have
 * asked to make to their own records, across the company, so HR can work the
 * queue in one place instead of profile by profile. Each employee's own log
 * (Profile Change Request Log) shows the same requests.
 */
export function ChangeRequestsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const actorId = useAppSelector((s) => s.auth.user?.employeeId);
  const canDecide = useCan("organization.employees", "edit");
  const { rows, loading, error } = useChangeRequestQueue();

  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | ChangeRequestStatus>("all");
  const [department, setDepartment] = useState("all");
  const [viewing, setViewing] = useState<QueueRow | null>(null);
  const [rejecting, setRejecting] = useState<QueueRow | null>(null);

  const pending = useMemo(() => rows.filter((r) => r.status === "pending"), [rows]);
  const departments = useMemo(
    () => [...new Set(rows.map((r) => r.departmentName).filter(Boolean))].sort(),
    [rows],
  );

  /** The status filter only exists on the All tab. */
  const filter = (list: QueueRow[], byStatus: boolean) => {
    const q = search.trim().toLowerCase();
    return list
      .filter((r) => !byStatus || status === "all" || r.status === status)
      .filter((r) => department === "all" || r.departmentName === department)
      .filter(
        (r) =>
          !q ||
          [r.employeeName, r.label, r.reason, r.departmentName, r.requestedValue]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(q)),
      );
  };

  const approve = (r: QueueRow) => {
    dispatch(approveRequest({ id: r.id, actorName, actorId }));
    toast.success(`${r.employeeName}: ${r.label} change approved`);
  };

  const columns = useMemo<ColumnDef<QueueRow>[]>(
    () => [
      {
        id: "employee",
        accessorFn: (r) => r.employeeName,
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <EmployeeLink
              name={row.original.employeeName}
              employeeId={row.original.employeeId}
              gender={row.original.gender}
            />
            {row.original.departmentName && (
              <p className="ml-7 text-[10px] text-muted-foreground">
                {row.original.departmentName}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "label",
        header: sortableHeader("Field"),
        cell: ({ row }) => <span className="text-xs font-medium">{row.original.label}</span>,
      },
      {
        id: "change",
        header: "Change",
        cell: ({ row }) => (
          <span className="flex max-w-64 items-center gap-1.5 truncate text-xs">
            <span className="truncate text-muted-foreground line-through decoration-muted-foreground/40">
              <RequestValue field={row.original.field} value={row.original.currentValue} />
            </span>
            <span className="text-muted-foreground/50">→</span>
            <span className="truncate font-medium text-foreground">
              <RequestValue field={row.original.field} value={row.original.requestedValue} />
            </span>
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="block max-w-48 truncate text-xs text-muted-foreground">
            {row.original.reason || "—"}
          </span>
        ),
      },
      {
        accessorKey: "requestedAt",
        header: sortableHeader("Submitted"),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDate(row.original.requestedAt)}
            {row.original.status === "pending" && (
              <span className="block text-[10px]">
                waiting {daysSince(row.original.requestedAt)} day
                {daysSince(row.original.requestedAt) === 1 ? "" : "s"}
              </span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("w-fit text-[10px] capitalize", CHANGE_REQUEST_TONES[row.original.status])}
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "decidedBy",
        accessorFn: (r) => r.decidedBy ?? "",
        header: "Decided by",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.decidedBy
              ? `${row.original.decidedBy} · ${formatDate(row.original.decidedAt)}`
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="text-right" onClick={(e) => e.stopPropagation()}>
              <RowActions
                label={`Actions for ${r.employeeName}'s ${r.label} request`}
                onView={() => setViewing(r)}
                extra={[
                  {
                    label: "Open profile",
                    icon: UserRound,
                    onSelect: () => router.push(`/organization/employees/${r.employeeId}`),
                  },
                  ...(r.status === "pending" && canDecide
                    ? [
                        {
                          label: "Approve",
                          icon: Check,
                          separatorBefore: true,
                          onSelect: () => approve(r),
                        },
                        {
                          label: "Reject",
                          icon: X,
                          destructive: true,
                          onSelect: () => setRejecting(r),
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          );
        },
      },
    ],
    // approve only closes over values that are stable for the page's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canDecide, router],
  );

  if (loading && rows.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const recent = (s: ChangeRequestStatus) =>
    rows.filter((r) => r.status === s && daysSince(r.decidedAt ?? r.requestedAt) <= 30).length;
  const oldest = pending.reduce((max, r) => Math.max(max, daysSince(r.requestedAt)), 0);
  const waitingEmployees = new Set(pending.map((r) => r.employeeId)).size;

  const drill = (next: "all" | ChangeRequestStatus) => {
    setTab(next === "pending" ? "pending" : "all");
    setStatus(next === "pending" ? "all" : next);
  };

  const cards: HrStatCardItem[] = [
    {
      label: "Awaiting Review",
      value: pending.length,
      sub: `Oldest waiting ${oldest} day${oldest === 1 ? "" : "s"}`,
      zeroSub: "Nothing waiting for review",
      icon: Clock,
      tone: "amber",
      onClick: () => drill("pending"),
      active: tab === "pending",
    },
    {
      label: "Approved",
      value: recent("approved"),
      sub: "In the last 30 days",
      zeroSub: "None approved in the last 30 days",
      icon: CircleCheck,
      tone: "emerald",
      onClick: () => drill("approved"),
      active: tab === "all" && status === "approved",
    },
    {
      label: "Rejected",
      value: recent("rejected"),
      sub: "In the last 30 days",
      zeroSub: "None rejected in the last 30 days",
      icon: CircleX,
      tone: "red",
      onClick: () => drill("rejected"),
      active: tab === "all" && status === "rejected",
    },
    {
      label: "Employees Waiting",
      value: waitingEmployees,
      sub: "With at least one pending request",
      zeroSub: "No one is waiting on a decision",
      icon: Users,
      tone: "violet",
      onClick: () => drill("pending"),
    },
  ];

  const toolbar = (showStatus: boolean) => (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-52 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by employee, field or reason..."
          className="h-8 pl-8 text-xs"
        />
      </div>
      {showStatus && (
        <Select value={status} onValueChange={(v) => setStatus(v as "all" | ChangeRequestStatus)}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            {(Object.keys(STATUS_LABELS) as ChangeRequestStatus[]).map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Select value={department} onValueChange={setDepartment}>
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All departments</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d} value={d} className="text-xs">
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-semibold">Profile Change Requests</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Changes employees have asked to make to their own records: personal and
          contact details, addresses, emergency contacts, bank details and IDs.
          Nothing changes on the record until HR approves it.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <HrStatCardsGrid stats={cards} columns={4} />

      <Tabs value={tab} onValueChange={setTab}>
        <PageTabsList
          tabs={[
            { value: "pending", label: `Awaiting Review (${pending.length})` },
            { value: "all", label: `All Requests (${rows.length})` },
          ]}
        />
        <TabsContent value="pending" className="mt-4 flex flex-col gap-3">
          {toolbar(false)}
          <DataTable
            exportTitle="Profile Change Requests Awaiting Review"
            columns={columns}
            data={filter(pending, false)}
            getRowId={(r) => r.id}
            onRowClick={(r) => setViewing(r)}
            emptyMessage="No change requests are waiting for review."
          />
        </TabsContent>
        <TabsContent value="all" className="mt-4 flex flex-col gap-3">
          {toolbar(true)}
          <DataTable
            exportTitle="Profile Change Requests"
            columns={columns}
            data={filter(rows, true)}
            getRowId={(r) => r.id}
            onRowClick={(r) => setViewing(r)}
            emptyMessage="No change requests match this view."
          />
        </TabsContent>
      </Tabs>

      {viewing && (
        <ChangeRequestDetailModal request={viewing} onClose={() => setViewing(null)} />
      )}
      <RejectChangeRequestDialog request={rejecting} onClose={() => setRejecting(null)} />
    </div>
  );
}

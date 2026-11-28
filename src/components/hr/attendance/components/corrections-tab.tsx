"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { EmployeeLink } from "@/src/components/shared/employee-link";
import { RowActions } from "@/src/components/hr/employees/employee-detail/row-actions";
import { useIsLive, useLiveSender } from "@/src/lib/live/use-is-live";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { resolveCorrection } from "@/src/lib/stores/attendance-slice";
import { cn } from "@/src/lib/utils";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  useApproveAttendanceCorrectionMutation,
  useGetAttendanceCorrectionsQuery,
  useRejectAttendanceCorrectionMutation,
} from "@/src/store/services/attendance";
import type { CorrectionStatus } from "@/src/types/attendance";

interface Row {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  date: string;
  original: string;
  requested: string;
  reason: string;
  status: CorrectionStatus;
  requestedAt: string;
  resolvedBy?: string;
  note?: string;
}

const TONE: Record<CorrectionStatus, string> = {
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-600",
  approved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  rejected: "border-red-500/20 bg-red-500/10 text-red-600",
};

const clock = (iso?: string | null) =>
  iso ? (iso.includes("T") ? new Date(iso).toTimeString().slice(0, 5) : iso.slice(0, 5)) : "—";

/**
 * Attendance → Corrections. Employees ask for a past punch to be fixed from
 * My Attendance; HR approves (the record changes) or rejects with a note.
 * Signed in: GET /attendance/corrections, POST …/{id}/approve | reject.
 * Signed out: the requests made in this session's demo.
 */
export function CorrectionsTab() {
  const live = useIsLive();
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const employees = useAppSelector((s) => s.locale.data?.employees);
  const demo = useAppSelector((s) => s.attendance.corrections);
  const [status, setStatus] = useState<"all" | CorrectionStatus>("pending");
  const q = useGetAttendanceCorrectionsQuery(
    { PageSize: 200, Status: status === "all" ? undefined : status },
    { skip: !live },
  );
  const [approve] = useApproveAttendanceCorrectionMutation();
  const [reject] = useRejectAttendanceCorrectionMutation();
  const send = useLiveSender(["AttendanceCorrections", "Attendance", "Timesheets"]);
  const [deciding, setDeciding] = useState<{ row: Row; approve: boolean } | null>(null);
  const [note, setNote] = useState("");

  const rows = useMemo<Row[]>(() => {
    if (live) {
      return (q.data?.data.items ?? []).map((c) => ({
        id: c.id,
        employeeId: c.employeeId,
        employeeName: c.employeeName,
        departmentName: c.departmentName ?? "",
        date: c.date.slice(0, 10),
        original: `${clock(c.originalClockInAt)} – ${clock(c.originalClockOutAt)}`,
        requested: `${clock(c.requestedClockInAt)} – ${clock(c.requestedClockOutAt)}`,
        reason: c.reason,
        status: c.status,
        requestedAt: c.requestedAt,
        resolvedBy: c.resolvedByName ?? undefined,
        note: c.resolutionNote ?? undefined,
      }));
    }
    const byId = new Map((employees ?? []).map((e) => [e.id, e]));
    return demo
      .filter((c) => status === "all" || c.status === status)
      .map((c) => ({
        id: c.id,
        employeeId: c.employeeId,
        employeeName: byId.get(c.employeeId)?.fullName ?? "Employee",
        departmentName: byId.get(c.employeeId)?.departmentName ?? "",
        date: c.date,
        original: "—",
        requested: `${c.requestedClockIn ?? "—"} – ${c.requestedClockOut ?? "—"}`,
        reason: c.reason,
        status: c.status,
        requestedAt: c.requestedAt,
        resolvedBy: c.resolvedBy,
        note: c.resolutionNote,
      }));
  }, [live, q.data, demo, employees, status]);

  async function decide() {
    if (!deciding) return;
    const { row, approve: yes } = deciding;
    const body = { note: note.trim() || null };
    if (live) {
      const ok = await send(
        () => (yes ? approve({ id: row.id, body }) : reject({ id: row.id, body })).unwrap(),
        yes ? "Could not approve the correction." : "Could not reject the correction.",
      );
      if (!ok) return;
    } else {
      dispatch(
        resolveCorrection({
          id: row.id,
          status: yes ? "approved" : "rejected",
          resolvedBy: actor,
          note: note.trim() || undefined,
        }),
      );
    }
    toast.success(`${row.employeeName}'s correction ${yes ? "approved" : "rejected"}`);
    setDeciding(null);
    setNote("");
  }

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "employee",
        accessorFn: (r) => r.employeeName,
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div>
            <EmployeeLink name={row.original.employeeName} employeeId={row.original.employeeId} />
            {row.original.departmentName && (
              <p className="ml-7 text-[10px] text-muted-foreground">{row.original.departmentName}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: sortableHeader("Day"),
        cell: ({ row }) => <span className="text-xs">{formatDate(row.original.date)}</span>,
      },
      {
        id: "change",
        header: "Change",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs">
            <span className="text-muted-foreground line-through">{row.original.original}</span>
            <span className="mx-1 text-muted-foreground/50">→</span>
            <span className="font-medium">{row.original.requested}</span>
          </span>
        ),
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <span className="block max-w-56 truncate text-xs text-muted-foreground">{row.original.reason}</span>
        ),
      },
      {
        accessorKey: "status",
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <div>
            <Badge variant="outline" className={cn("text-[10px] capitalize", TONE[row.original.status])}>
              {row.original.status}
            </Badge>
            {row.original.resolvedBy && (
              <p className="mt-0.5 text-[10px] text-muted-foreground">by {row.original.resolvedBy}</p>
            )}
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status === "pending" ? (
            <div className="text-right">
              <RowActions
                label={`Actions for ${row.original.employeeName}'s correction`}
                extra={[
                  { label: "Approve", icon: Check, onSelect: () => setDeciding({ row: row.original, approve: true }) },
                  {
                    label: "Reject",
                    icon: X,
                    destructive: true,
                    onSelect: () => setDeciding({ row: row.original, approve: false }),
                  },
                ]}
              />
            </div>
          ) : null,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Employees ask for a past clock-in or clock-out to be fixed. Approving changes the record.
        </p>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
            <SelectItem value="approved" className="text-xs">Approved</SelectItem>
            <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
            <SelectItem value="all" className="text-xs">All</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        exportTitle="Attendance Corrections"
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        emptyMessage={live && q.isLoading ? "Loading corrections…" : "No correction requests here."}
      />

      <Dialog open={!!deciding} onOpenChange={(v) => !v && setDeciding(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {deciding?.approve ? "Approve" : "Reject"} correction for {deciding?.row.employeeName}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {deciding && `${formatDate(deciding.row.date)} · ${deciding.row.requested}`}
          </p>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={deciding?.approve ? "Note (optional)" : "Why is this being rejected? (optional)"}
            className="min-h-20 resize-none text-xs"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant={deciding?.approve ? "default" : "destructive"}
              onClick={() => void decide()}
            >
              {deciding?.approve ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

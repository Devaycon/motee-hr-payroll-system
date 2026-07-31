"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarDays, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import { useEmployeeIdentity } from "@/src/lib/hooks/use-employee-identity";
import { LEAVE_TYPE_LABELS, LEAVE_TYPE_STYLES } from "../data";
import type { LeaveBalance, LeaveRequest, LeaveTypeName } from "../types";

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * The "Currently on Leave" card previously showed a bare count. Clicking it now
 * opens this list, with the per-person detail the client asked for: employee
 * ID, job title, manager and remaining balance (client feedback round 2, §F2).
 */
export function OnLeavePanel({
  open,
  onClose,
  requests,
  balances,
}: {
  open: boolean;
  onClose: () => void;
  requests: LeaveRequest[];
  balances: LeaveBalance[];
}) {
  const today = isoToday();
  const identity = useEmployeeIdentity();

  const rows = useMemo(() => {
    const onLeave = requests.filter(
      (r) => r.status === "approved" && r.startDate <= today && r.endDate >= today,
    );
    return onLeave.map((r) => {
      // Remaining days for this person on the leave type they're taking.
      const bal = balances.find(
        (b) =>
          (r.employeeId && b.employeeId === r.employeeId) ||
          b.employeeName === r.employeeName,
      );
      const remaining = bal
        ? Math.max(0, bal.totalEntitlement - bal.daysUsed - bal.daysPending)
        : null;
      return { request: r, remaining };
    });
  }, [requests, balances, today]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Currently on leave
          </DialogTitle>
          <DialogDescription className="text-xs">
            {rows.length === 0
              ? "Nobody is absent today."
              : `${rows.length} employee${rows.length === 1 ? "" : "s"} absent on ${new Date(
                  today,
                ).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}.`}
          </DialogDescription>
        </DialogHeader>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Everyone is at work today.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map(({ request: r, remaining }) => (
              <li
                key={r.id}
                className="rounded-xl border border-border px-3 py-2.5 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {r.employeeInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {r.employeeName}
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground truncate">
                      {identity.resolve(r.employeeId ?? r.employeeName)
                        ?.employeeId ?? "—"}
                      {r.employeeId && ` · ${r.employeeId}`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {r.jobTitle} · {r.department}
                    </p>
                    {r.managerName && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        Manager: {r.managerName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                      LEAVE_TYPE_STYLES[r.leaveType as LeaveTypeName],
                    )}
                  >
                    {LEAVE_TYPE_LABELS[r.leaveType as LeaveTypeName]}
                  </span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {fmt(r.startDate)} – {fmt(r.endDate)} · back{" "}
                    {fmt(addDays(r.endDate, 1))}
                  </span>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {remaining == null
                      ? "Balance unavailable"
                      : `${remaining} days remaining`}
                  </span>
                  {r.employeeId && (
                    <Link
                      href={`/organization/employees/${r.employeeId}`}
                      className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      View profile <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

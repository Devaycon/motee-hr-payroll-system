"use client";

import { useState } from "react";
import { Plus, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
  LEAVE_REQUESTS,
  LEAVE_BALANCES,
} from "@/src/data/leave-demo";
import type { LeaveStatus } from "@/src/lib/types/leave";
import { BalanceCards } from "./components/balance-cards";
import { RequestCard } from "./components/request-card";
import { LeaveRequestForm } from "./components/leave-request-form";
import { LeaveDetailModal } from "./components/leave-detail-modal";
import { LeaveCancelModal } from "./components/leave-cancel-modal";
import type { LeaveBalance, LeaveRequestEntry } from "./components/types";
import { useAppSelector } from "@/src/lib/stores/hooks";

const STATUS_ICON = {
  approved: <CheckCircle2 className="w-3.5 h-3.5 text-[#1D9E75]" />,
  pending: <Clock className="w-3.5 h-3.5 text-amber-500" />,
  rejected: <XCircle className="w-3.5 h-3.5 text-red-500" />,
  cancelled: <XCircle className="w-3.5 h-3.5 text-muted-foreground" />,
};

function buildMyBalances(employeeName: string | undefined): LeaveBalance {
  const base: LeaveBalance = {
    annual: { total: 20, used: 0, pending: 0 },
    sick: { total: 10, used: 0, pending: 0 },
    maternity: { total: 90, used: 0, pending: 0 },
    paternity: { total: 5, used: 0, pending: 0 },
    compassionate: { total: 3, used: 0, pending: 0 },
    study: { total: 5, used: 0, pending: 0 },
    unpaid: { total: 30, used: 0, pending: 0 },
  };
  if (!employeeName) return base;
  LEAVE_BALANCES.filter((b) => b.employeeName === employeeName).forEach((b) => {
    base[b.leaveType] = {
      total: b.totalEntitlement,
      used: b.daysUsed,
      pending: b.daysPending,
    };
  });
  return base;
}

/**
 * The leave-request body (balance stat cards, new-request form, pending list
 * and history). Used both on the standalone My Leave Request page and as the
 * "Leave" tab inside the self My Profile page. Scoped to the logged-in user.
 */
export function LeaveRequestPanel() {
  const employeeName = useAppSelector((s) => s.auth.user?.name);
  const MY_BALANCES = buildMyBalances(employeeName);
  const initialRequests: LeaveRequestEntry[] = LEAVE_REQUESTS.filter(
    (r) => r.employeeName === employeeName,
  ).map((r) => ({
    id: r.id,
    leaveType: r.leaveType,
    startDate: r.startDate,
    endDate: r.endDate,
    totalDays: r.totalDays,
    isHalfDay: r.isHalfDay,
    halfDayPeriod: r.halfDayPeriod,
    status: r.status,
    notes: r.notes,
    approvedBy: r.approvedBy,
    rejectionReason: r.rejectionReason,
    submittedAt: r.submittedAt,
  }));
  const [requests, setRequests] = useState<LeaveRequestEntry[]>(initialRequests);
  const [formOpen, setFormOpen] = useState(false);
  const [detailReq, setDetailReq] = useState<LeaveRequestEntry | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  function handleNewRequest(entry: LeaveRequestEntry) {
    setRequests((prev) => [entry, ...prev]);
  }

  function handleCancel(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "cancelled" as LeaveStatus } : r,
      ),
    );
    setCancelTarget(null);
  }

  const pending = requests.filter((r) => r.status === "pending");
  const past = requests.filter((r) => r.status !== "pending");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Submit a new leave request or manage your existing ones.
        </p>
        <Button
          className="gap-2 bg-[#4361ee] hover:bg-[#3451d1] text-white shrink-0"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> New Request
        </Button>
      </div>

      <BalanceCards balances={MY_BALANCES} />

      {pending.length > 0 && (
        <div>
          <p className="text-md font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pending Approval
          </p>
          <div className="flex flex-col gap-2">
            {pending.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                onView={setDetailReq}
                onCancel={setCancelTarget}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-md font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Leave History
        </p>
        {past.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4">
            No past leave requests.
          </p>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y divide-border/50">
              {past.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setDetailReq(r)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                          LEAVE_TYPE_STYLES[r.leaveType],
                        )}
                      >
                        {LEAVE_TYPE_LABELS[r.leaveType]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(r.startDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                        })}
                        {" – "}
                        {new Date(r.endDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[11px] font-medium text-foreground">
                        ({r.totalDays} day{r.totalDays !== 1 ? "s" : ""})
                      </span>
                    </div>
                    {r.notes && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {r.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {STATUS_ICON[r.status]}
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                        LEAVE_STATUS_STYLES[r.status],
                      )}
                    >
                      {LEAVE_STATUS_LABELS[r.status]}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <LeaveRequestForm
        open={formOpen}
        balances={MY_BALANCES}
        onClose={() => setFormOpen(false)}
        onSubmit={handleNewRequest}
      />

      <LeaveDetailModal
        request={detailReq}
        onClose={() => setDetailReq(null)}
        onCancelRequest={setCancelTarget}
      />

      <LeaveCancelModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && handleCancel(cancelTarget)}
      />
    </div>
  );
}

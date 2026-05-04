"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
  LEAVE_POLICIES,
} from "@/src/data/leave-demo";
import type { LeaveTypeName, LeaveStatus } from "@/src/lib/types/leave";

// ─── Demo data for the logged-in employee ─────────────────────────────────────

const MY_BALANCES: {
  type: LeaveTypeName;
  totalEntitlement: number;
  daysUsed: number;
  daysPending: number;
  carryOver?: number;
}[] = [
  {
    type: "annual",
    totalEntitlement: 20,
    daysUsed: 8,
    daysPending: 0,
    carryOver: 3,
  },
  { type: "sick", totalEntitlement: 10, daysUsed: 2, daysPending: 0 },
  { type: "compassionate", totalEntitlement: 3, daysUsed: 0, daysPending: 0 },
  { type: "study", totalEntitlement: 5, daysUsed: 0, daysPending: 0 },
  { type: "paternity", totalEntitlement: 5, daysUsed: 0, daysPending: 0 },
  { type: "maternity", totalEntitlement: 90, daysUsed: 0, daysPending: 0 },
  { type: "unpaid", totalEntitlement: 30, daysUsed: 0, daysPending: 0 },
];

const MY_HISTORY: {
  id: string;
  leaveType: LeaveTypeName;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: LeaveStatus;
  notes?: string;
  approvedBy?: string;
  rejectionReason?: string;
  submittedAt: string;
}[] = [
  {
    id: "mlr-001",
    leaveType: "annual",
    startDate: "2026-02-03",
    endDate: "2026-02-07",
    totalDays: 5,
    status: "approved",
    notes: "Family trip",
    approvedBy: "Chidinma Okeke",
    submittedAt: "2026-01-24",
  },
  {
    id: "mlr-002",
    leaveType: "sick",
    startDate: "2026-03-11",
    endDate: "2026-03-12",
    totalDays: 2,
    status: "approved",
    notes: "Doctor's visit",
    approvedBy: "Chidinma Okeke",
    submittedAt: "2026-03-11",
  },
  {
    id: "mlr-003",
    leaveType: "annual",
    startDate: "2026-01-06",
    endDate: "2026-01-08",
    totalDays: 3,
    status: "approved",
    notes: "New Year break",
    approvedBy: "Chidinma Okeke",
    submittedAt: "2025-12-27",
  },
  {
    id: "mlr-004",
    leaveType: "study",
    startDate: "2026-05-12",
    endDate: "2026-05-14",
    totalDays: 3,
    status: "pending",
    notes: "ICAN professional exams",
    submittedAt: "2026-04-20",
  },
];

// ─── Type colours ─────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<LeaveTypeName, { bar: string; bg: string }> = {
  annual: { bar: "#2563EB", bg: "#2563EB18" },
  sick: { bar: "#EF4444", bg: "#EF444418" },
  maternity: { bar: "#EC4899", bg: "#EC489918" },
  paternity: { bar: "#7C3AED", bg: "#7C3AED18" },
  unpaid: { bar: "#6B7280", bg: "#6B728018" },
  compassionate: { bar: "#D97706", bg: "#D9770618" },
  study: { bar: "#0D9488", bg: "#0D948818" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function remaining(b: (typeof MY_BALANCES)[0]) {
  return b.totalEntitlement - b.daysUsed - b.daysPending;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MyLeaveBalancePage() {
  const [policyPlan, setPolicyPlan] = useState<
    (typeof LEAVE_POLICIES)[0] | null
  >(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [expandedType, setExpandedType] = useState<LeaveTypeName | null>(null);

  const totalRemaining = MY_BALANCES.filter(
    (b) => b.type === "annual" || b.type === "sick",
  ).reduce((s, b) => s + remaining(b), 0);

  const pendingCount = MY_HISTORY.filter((h) => h.status === "pending").length;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Leave Balance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your leave entitlements and usage for the current leave year.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Annual Remaining",
            value: `${remaining(MY_BALANCES[0])} days`,
            icon: CalendarDays,
            color: "#2563EB",
          },
          {
            label: "Sick Remaining",
            value: `${remaining(MY_BALANCES[1])} days`,
            icon: TrendingUp,
            color: "#EF4444",
          },
          {
            label: "Pending Requests",
            value: pendingCount,
            icon: Clock,
            color: "#F59E0B",
          },
          {
            label: "Total Leave Taken",
            value: `${MY_HISTORY.filter((h) => h.status === "approved").reduce((s, h) => s + h.totalDays, 0)} days`,
            icon: CheckCircle2,
            color: "#1D9E75",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${s.color}18` }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground leading-none">
                  {s.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Balance breakdown */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Leave Entitlements
        </p>
        <div className="flex flex-col gap-3">
          {MY_BALANCES.map((b) => {
            const rem = remaining(b);
            const usedPct = (b.daysUsed / b.totalEntitlement) * 100;
            const pendPct = (b.daysPending / b.totalEntitlement) * 100;
            const colors = TYPE_COLORS[b.type];
            const policy = LEAVE_POLICIES.find((p) => p.leaveType === b.type);
            const expanded = expandedType === b.type;

            return (
              <Card key={b.type} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: colors.bg }}
                      >
                        <CalendarDays
                          className="w-3.5 h-3.5"
                          style={{ color: colors.bar }}
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {LEAVE_TYPE_LABELS[b.type]}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {b.totalEntitlement} days/yr
                          {b.carryOver
                            ? ` · ${b.carryOver} days carried over`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-foreground">
                          {rem}{" "}
                          <span className="font-normal text-muted-foreground text-[10px]">
                            remaining
                          </span>
                        </p>
                        {b.daysPending > 0 && (
                          <p className="text-[10px] text-amber-600">
                            {b.daysPending} pending
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {policy && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={() => setPolicyPlan(policy)}
                          >
                            <Info className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setExpandedType(expanded ? null : b.type)
                          }
                        >
                          {expanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="flex flex-col gap-1">
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                      <div
                        className="h-full rounded-l-full transition-all"
                        style={{ width: `${usedPct}%`, background: colors.bar }}
                      />
                      {pendPct > 0 && (
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${pendPct}%`,
                            background: `${colors.bar}70`,
                          }}
                        />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>
                        {b.daysUsed} used
                        {b.daysPending > 0 ? ` · ${b.daysPending} pending` : ""}
                      </span>
                      <span>
                        {rem} of {b.totalEntitlement} remaining
                      </span>
                    </div>
                  </div>

                  {/* Expanded breakdown */}
                  {expanded && (
                    <div className="border-t border-border/50 pt-3 grid grid-cols-3 gap-3">
                      {[
                        {
                          label: "Entitlement",
                          value: `${b.totalEntitlement} days`,
                        },
                        { label: "Days Used", value: `${b.daysUsed} days` },
                        { label: "Remaining", value: `${rem} days` },
                        ...(b.carryOver
                          ? [
                              {
                                label: "Carried Over",
                                value: `${b.carryOver} days`,
                              },
                            ]
                          : []),
                        ...(b.daysPending > 0
                          ? [
                              {
                                label: "Pending",
                                value: `${b.daysPending} days`,
                              },
                            ]
                          : []),
                      ].map((r) => (
                        <div key={r.label} className="flex flex-col gap-0.5">
                          <p className="text-[10px] text-muted-foreground">
                            {r.label}
                          </p>
                          <p className="text-xs font-semibold text-foreground">
                            {r.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Leave history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Leave History
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setHistoryOpen(true)}
          >
            <FileText className="w-3.5 h-3.5" /> View All
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {MY_HISTORY.slice(0, 4).map((h) => (
                <HistoryRow key={h.id} request={h} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policy detail modal */}
      <Dialog open={!!policyPlan} onOpenChange={() => setPolicyPlan(null)}>
        <DialogContent className="sm:max-w-sm">
          {policyPlan && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center"
                    style={{
                      background:
                        TYPE_COLORS[policyPlan.leaveType as LeaveTypeName].bg,
                    }}
                  >
                    <Info
                      className="w-4 h-4"
                      style={{
                        color:
                          TYPE_COLORS[policyPlan.leaveType as LeaveTypeName]
                            .bar,
                      }}
                    />
                  </div>
                  <DialogTitle className="text-sm font-semibold">
                    {policyPlan.name}
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="flex flex-col gap-3 py-1">
                {policyPlan.description && (
                  <p className="text-xs text-muted-foreground">
                    {policyPlan.description}
                  </p>
                )}
                <Separator />
                {[
                  {
                    label: "Max days/year",
                    value: `${policyPlan.maxDaysPerYear} days`,
                  },
                  {
                    label: "Min notice required",
                    value:
                      policyPlan.minNoticeDays === 0
                        ? "None"
                        : `${policyPlan.minNoticeDays} days`,
                  },
                  {
                    label: "Max consecutive days",
                    value: `${policyPlan.maxConsecutiveDays} days`,
                  },
                  {
                    label: "Medical cert required",
                    value: policyPlan.requiresMedicalCertificate
                      ? "Yes (3+ consecutive days)"
                      : "No",
                  },
                  {
                    label: "Carry-over allowed",
                    value: policyPlan.carryOverAllowed
                      ? `Yes — up to ${policyPlan.maxCarryOverDays} days`
                      : "No",
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center justify-between py-1 border-b border-border/50 last:border-0"
                  >
                    <span className="text-[11px] text-muted-foreground">
                      {r.label}
                    </span>
                    <span className="text-[11px] font-medium text-foreground">
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Full history modal */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              All Leave History
            </DialogTitle>
          </DialogHeader>
          <div className="divide-y divide-border/50">
            {MY_HISTORY.map((h) => (
              <HistoryRow key={h.id} request={h} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── History Row ──────────────────────────────────────────────────────────────

function HistoryRow({ request }: { request: (typeof MY_HISTORY)[0] }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
              LEAVE_TYPE_STYLES[request.leaveType],
            )}
          >
            {LEAVE_TYPE_LABELS[request.leaveType]}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(request.startDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
            {" – "}
            {new Date(request.endDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-[11px] text-foreground font-medium">
            ({request.totalDays} day{request.totalDays > 1 ? "s" : ""})
          </span>
        </div>
        {request.notes && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {request.notes}
          </p>
        )}
        {request.rejectionReason && (
          <p className="text-[10px] text-red-500 mt-0.5 truncate">
            {request.rejectionReason}
          </p>
        )}
      </div>
      <span
        className={cn(
          "text-[10px] px-2 py-0.5 rounded-full border font-semibold shrink-0",
          LEAVE_STATUS_STYLES[request.status],
        )}
      >
        {LEAVE_STATUS_LABELS[request.status]}
      </span>
    </div>
  );
}

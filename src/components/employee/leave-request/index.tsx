"use client";

import { useState, useMemo } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Info,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Send,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_STYLES,
  LEAVE_TYPE_OPTIONS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_STYLES,
  LEAVE_POLICIES,
  LEAVE_REQUESTS,
  LEAVE_BALANCES,
} from "@/src/data/leave-demo";
import type { LeaveTypeName, LeaveStatus } from "@/src/lib/types/leave";

const MY_EMPLOYEE = "Adaeze Okonkwo";

const MY_BALANCES: Record<
  LeaveTypeName,
  { total: number; used: number; pending: number }
> = (() => {
  const base: Record<
    LeaveTypeName,
    { total: number; used: number; pending: number }
  > = {
    annual: { total: 20, used: 0, pending: 0 },
    sick: { total: 10, used: 0, pending: 0 },
    maternity: { total: 90, used: 0, pending: 0 },
    paternity: { total: 5, used: 0, pending: 0 },
    compassionate: { total: 3, used: 0, pending: 0 },
    study: { total: 5, used: 0, pending: 0 },
    unpaid: { total: 30, used: 0, pending: 0 },
  };
  LEAVE_BALANCES.filter((b) => b.employeeName === MY_EMPLOYEE).forEach((b) => {
    base[b.leaveType] = {
      total: b.totalEntitlement,
      used: b.daysUsed,
      pending: b.daysPending,
    };
  });
  return base;
})();

const INITIAL_MY_REQUESTS = LEAVE_REQUESTS.filter(
  (r) => r.employeeName === MY_EMPLOYEE,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function workingDaysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_ICON = {
  approved: <CheckCircle2 className="w-3.5 h-3.5 text-[#1D9E75]" />,
  pending: <Clock className="w-3.5 h-3.5 text-amber-500" />,
  rejected: <XCircle className="w-3.5 h-3.5 text-red-500" />,
  cancelled: <XCircle className="w-3.5 h-3.5 text-muted-foreground" />,
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function MyLeaveRequestPage() {
  const [requests, setRequests] = useState(INITIAL_MY_REQUESTS);
  const [formOpen, setFormOpen] = useState(false);
  const [detailReq, setDetailReq] = useState<
    (typeof INITIAL_MY_REQUESTS)[0] | null
  >(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [fType, setFType] = useState<LeaveTypeName | "">("");
  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [fHalf, setFHalf] = useState(false);
  const [fHalfPeriod, setFHalfPeriod] = useState<"morning" | "afternoon">(
    "morning",
  );
  const [fNotes, setFNotes] = useState("");

  const computedDays = fHalf ? 0.5 : workingDaysBetween(fStart, fEnd);

  const selectedBalance = fType ? MY_BALANCES[fType as LeaveTypeName] : null;
  const balanceRemaining = selectedBalance
    ? selectedBalance.total - selectedBalance.used - selectedBalance.pending
    : null;
  const insufficientBalance =
    balanceRemaining !== null && computedDays > balanceRemaining;

  const selectedPolicy = fType
    ? LEAVE_POLICIES.find((p) => p.leaveType === fType)
    : null;
  const minNoticeOk = useMemo(() => {
    if (!selectedPolicy || !fStart) return true;
    const notice = Math.ceil(
      (new Date(fStart).getTime() - Date.now()) / 86400000,
    );
    return notice >= selectedPolicy.minNoticeDays;
  }, [selectedPolicy, fStart]);

  const formValid =
    fType &&
    fStart &&
    (fHalf || fEnd) &&
    computedDays > 0 &&
    !insufficientBalance &&
    minNoticeOk;

  function handleSubmit() {
    if (!fType || !fStart) return;
    const end = fHalf ? fStart : fEnd;
    const newReq = {
      id: `mlr-${Date.now()}`,
      leaveType: fType as LeaveTypeName,
      startDate: fStart,
      endDate: end,
      totalDays: computedDays,
      isHalfDay: fHalf,
      halfDayPeriod: fHalf ? fHalfPeriod : undefined,
      status: "pending" as LeaveStatus,
      notes: fNotes || undefined,
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    setRequests((prev) => [newReq, ...prev]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormOpen(false);
      setFType("");
      setFStart("");
      setFEnd("");
      setFHalf(false);
      setFNotes("");
    }, 1600);
  }

  function handleCancel(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: "cancelled" as LeaveStatus } : r,
      ),
    );
    setCancelTarget(null);
    if (detailReq?.id === id)
      setDetailReq((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
  }

  const pending = requests.filter((r) => r.status === "pending");
  const past = requests.filter((r) => r.status !== "pending");

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Request Leave</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submit a new leave request or manage your existing ones.
          </p>
        </div>
        <Button
          className="h-9 text-xs gap-2 bg-[#7F77DD] hover:bg-[#6c64cc] text-white mt-1 shrink-0"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" /> New Request
        </Button>
      </div>

      {/* Balance quick-view strip */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {(["annual", "sick", "compassionate", "study"] as LeaveTypeName[]).map(
          (t) => {
            const b = MY_BALANCES[t];
            const rem = b.total - b.used - b.pending;
            return (
              <div
                key={t}
                className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card"
              >
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                    LEAVE_TYPE_STYLES[t],
                  )}
                >
                  {LEAVE_TYPE_LABELS[t]}
                </span>
                <span className="text-xs font-bold text-foreground">{rem}</span>
                <span className="text-[10px] text-muted-foreground">
                  / {b.total} days
                </span>
              </div>
            );
          },
        )}
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
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

      {/* Past */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
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
                          month: "short",
                        })}
                        {" – "}
                        {new Date(r.endDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
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

      {/* ── New Request Form ── */}
      <Dialog
        open={formOpen}
        onOpenChange={(v) => {
          if (!submitted) setFormOpen(v);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#7F77DD]/10 flex items-center justify-center">
                <Send className="w-4 h-4 text-[#7F77DD]" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                New Leave Request
              </DialogTitle>
            </div>
          </DialogHeader>

          {submitted ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-[#1D9E75] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#1D9E75]">
                Request submitted
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Your manager will be notified and will review your request.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              {/* Leave type */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Leave type</p>
                <Select
                  value={fType}
                  onValueChange={(v) => setFType(v as LeaveTypeName)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t} className="text-xs">
                        <span className="flex items-center gap-2">
                          {LEAVE_TYPE_LABELS[t]}
                          <span className="text-muted-foreground text-[10px]">
                            (
                            {MY_BALANCES[t].total -
                              MY_BALANCES[t].used -
                              MY_BALANCES[t].pending}{" "}
                            days remaining)
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Policy hint */}
              {selectedPolicy && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                  <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {selectedPolicy.description}
                    {selectedPolicy.minNoticeDays > 0
                      ? ` Minimum ${selectedPolicy.minNoticeDays}-day advance notice required.`
                      : ""}
                    {selectedPolicy.requiresMedicalCertificate
                      ? " Medical certificate may be required."
                      : ""}
                  </p>
                </div>
              )}

              {/* Half day toggle */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    className={cn(
                      "w-8 h-4 rounded-full transition-colors relative cursor-pointer",
                      fHalf ? "bg-[#7F77DD]" : "bg-muted",
                    )}
                    onClick={() => setFHalf((v) => !v)}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all",
                        fHalf ? "left-4" : "left-0.5",
                      )}
                    />
                  </div>
                  <span className="text-xs text-foreground">Half day</span>
                </label>
                {fHalf && (
                  <Select
                    value={fHalfPeriod}
                    onValueChange={(v) =>
                      setFHalfPeriod(v as "morning" | "afternoon")
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning" className="text-xs">
                        Morning
                      </SelectItem>
                      <SelectItem value="afternoon" className="text-xs">
                        Afternoon
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Dates */}
              <div
                className={cn(
                  "grid gap-3",
                  fHalf ? "grid-cols-1" : "grid-cols-2",
                )}
              >
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium">
                    {fHalf ? "Date" : "Start date"}
                  </p>
                  <Input
                    type="date"
                    value={fStart}
                    onChange={(e) => setFStart(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                {!fHalf && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium">End date</p>
                    <Input
                      type="date"
                      value={fEnd}
                      min={fStart}
                      onChange={(e) => setFEnd(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Duration chip */}
              {computedDays > 0 && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-foreground font-medium">
                    {computedDays} working day{computedDays !== 1 ? "s" : ""}
                  </span>
                  {balanceRemaining !== null && (
                    <span className="text-[10px] text-muted-foreground">
                      · {balanceRemaining} days remaining after request:{" "}
                      <span
                        className={cn(
                          "font-semibold",
                          insufficientBalance
                            ? "text-red-500"
                            : "text-[#1D9E75]",
                        )}
                      >
                        {balanceRemaining - computedDays} days
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Validation warnings */}
              {insufficientBalance && (
                <div className="flex items-center gap-2 text-[11px] text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Insufficient leave balance. You only have {
                    balanceRemaining
                  }{" "}
                  days remaining.
                </div>
              )}
              {!minNoticeOk && fStart && selectedPolicy && (
                <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  This leave type requires at least{" "}
                  {selectedPolicy.minNoticeDays} days advance notice.
                </div>
              )}

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">
                  Reason / notes{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </p>
                <Textarea
                  value={fNotes}
                  onChange={(e) => setFNotes(e.target.value)}
                  placeholder="Provide any additional context for your manager…"
                  className="text-xs min-h-16 resize-none"
                />
              </div>
            </div>
          )}

          {!submitted && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
                onClick={handleSubmit}
                disabled={!formValid}
              >
                Submit Request
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Detail Modal ── */}
      <Dialog open={!!detailReq} onOpenChange={() => setDetailReq(null)}>
        <DialogContent className="sm:max-w-sm">
          {detailReq && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                      LEAVE_TYPE_STYLES[detailReq.leaveType],
                    )}
                  >
                    {LEAVE_TYPE_LABELS[detailReq.leaveType]}
                  </div>
                  <DialogTitle className="text-sm font-semibold">
                    Leave Request Details
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="flex flex-col gap-1 py-1">
                {[
                  {
                    label: "Start date",
                    value: formatDate(detailReq.startDate),
                  },
                  { label: "End date", value: formatDate(detailReq.endDate) },
                  {
                    label: "Duration",
                    value: `${detailReq.totalDays} day${detailReq.totalDays !== 1 ? "s" : ""}${detailReq.isHalfDay ? ` (${detailReq.halfDayPeriod} half-day)` : ""}`,
                  },
                  {
                    label: "Submitted",
                    value: formatDate(detailReq.submittedAt),
                  },
                  ...(detailReq.approvedBy
                    ? [{ label: "Approved by", value: detailReq.approvedBy }]
                    : []),
                  ...(detailReq.rejectionReason
                    ? [{ label: "Reason", value: detailReq.rejectionReason }]
                    : []),
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-start justify-between py-1.5 border-b border-border/50 last:border-0 gap-4"
                  >
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {r.label}
                    </span>
                    <span className="text-[11px] font-medium text-foreground text-right">
                      {r.value}
                    </span>
                  </div>
                ))}
                {detailReq.notes && (
                  <div className="pt-2">
                    <p className="text-[10px] text-muted-foreground mb-1">
                      Notes
                    </p>
                    <p className="text-xs text-foreground">{detailReq.notes}</p>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={() => setDetailReq(null)}
                >
                  Close
                </Button>
                {detailReq.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 border-red-500/30 text-red-600 hover:bg-red-500/10"
                    onClick={() => {
                      setCancelTarget(detailReq.id);
                      setDetailReq(null);
                    }}
                  >
                    Cancel Request
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Cancel Confirm ── */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Cancel Leave Request?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            This action cannot be undone. Your leave request will be marked as
            cancelled.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => setCancelTarget(null)}
            >
              Keep
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white"
              onClick={() => cancelTarget && handleCancel(cancelTarget)}
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Request Card (pending) ───────────────────────────────────────────────────

function RequestCard({
  request,
  onView,
  onCancel,
}: {
  request: (typeof INITIAL_MY_REQUESTS)[0];
  onView: (r: (typeof INITIAL_MY_REQUESTS)[0]) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <Card className="border-amber-500/20">
      <CardContent className="px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
        </div>
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
            <span className="text-[11px] font-medium text-foreground">
              ({request.totalDays} day{request.totalDays !== 1 ? "s" : ""})
            </span>
          </div>
          {request.notes && (
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {request.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onView(request)}
          >
            <FileText className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-muted-foreground hover:text-red-500"
            onClick={() => onCancel(request.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

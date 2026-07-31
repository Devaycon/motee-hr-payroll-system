"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
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
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { reliefConflict } from "@/src/lib/leave/conflicts";
import { workingDaysBetween } from "@/src/lib/leave/planning";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_OPTIONS,
  LEAVE_POLICIES,
  LEAVE_REQUESTS,
} from "@/src/data/leave-demo";
import type { LeaveTypeName, LeaveStatus } from "@/src/lib/types/leave";
import { RequestSummaryPanel } from "./request-summary-panel";
import type { LeaveBalance, LeavePrefill, LeaveRequestEntry } from "./types";

interface LeaveRequestFormProps {
  open: boolean;
  balances: LeaveBalance;
  /** Dates carried in from a suggested window. */
  prefill?: LeavePrefill | null;
  onClose: () => void;
  onSubmit: (entry: LeaveRequestEntry) => void;
}

export function LeaveRequestForm({
  open,
  balances,
  prefill,
  onClose,
  onSubmit,
}: LeaveRequestFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [fType, setFType] = useState<LeaveTypeName | "">("");
  const [fStart, setFStart] = useState("");
  const [fEnd, setFEnd] = useState("");
  const [fHalf, setFHalf] = useState(false);
  const [fHalfPeriod, setFHalfPeriod] = useState<"morning" | "afternoon">(
    "morning",
  );
  const [fNotes, setFNotes] = useState("");
  const [fReliefId, setFReliefId] = useState("");
  const [fReliefName, setFReliefName] = useState("");

  const user = useAppSelector((s) => s.auth.user);
  const myEmployeeId = user?.employeeId;
  const myDepartment = user?.departmentName;
  // Requests already in the store, plus the shared demo fixtures the employee
  // portal reads — enough to spot a cover clash at request time (§3.2).
  const storeRequests = useAppSelector((s) => s.leave.requests);
  const allRequests = storeRequests.length ? storeRequests : LEAVE_REQUESTS;

  // A window picked from the assistant lands here. Seeded during render on the
  // transition into `open` — an effect would overwrite the employee's own edits
  // on every re-render, and cascade an extra one each time the form opens.
  const [seededFor, setSeededFor] = useState<LeavePrefill | null>(null);
  if (open && prefill && prefill !== seededFor) {
    setSeededFor(prefill);
    setFStart(prefill.startDate);
    setFEnd(prefill.endDate);
    setFHalf(false);
  }
  if (!open && seededFor) setSeededFor(null);

  const computedDays = fHalf ? 0.5 : workingDaysBetween(fStart, fEnd);

  const reliefConflictMessage =
    fReliefId && fStart
      ? (reliefConflict(
          {
            id: "",
            startDate: fStart,
            endDate: fHalf ? fStart : fEnd || fStart,
            reliefEmployeeId: fReliefId,
            reliefEmployeeName: fReliefName,
          },
          allRequests,
        )?.message ?? null)
      : null;

  const selectedBalance = fType ? balances[fType as LeaveTypeName] : null;
  const balanceRemaining = selectedBalance
    ? selectedBalance.total - selectedBalance.used - selectedBalance.pending
    : null;
  const insufficientBalance =
    balanceRemaining !== null && computedDays > balanceRemaining;

  // Staffing awareness, the policy explainer and the running summary all live
  // in the right-hand rail (`RequestSummaryPanel`) — this column stays about
  // the fields themselves and the errors that block submission.
  const selectedPolicy = fType
    ? (LEAVE_POLICIES.find((p) => p.leaveType === fType) ?? null)
    : null;

  function checkMinNotice(): boolean {
    if (!selectedPolicy || !fStart) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const notice = Math.ceil(
      (new Date(fStart).getTime() - today.getTime()) / 86400000,
    );
    return notice >= selectedPolicy.minNoticeDays;
  }
  const minNoticeOk = checkMinNotice();

  const formValid =
    fType &&
    fStart &&
    (fHalf || fEnd) &&
    computedDays > 0 &&
    !insufficientBalance &&
    minNoticeOk;

  function reset() {
    setFType("");
    setFStart("");
    setFEnd("");
    setFHalf(false);
    setFNotes("");
    setFReliefId("");
    setFReliefName("");
    setSubmitted(false);
  }

  function handleSubmit() {
    if (!fType || !fStart) return;
    const end = fHalf ? fStart : fEnd;
    const newEntry: LeaveRequestEntry = {
      id: `mlr-${Date.now()}`,
      leaveType: fType as LeaveTypeName,
      startDate: fStart,
      endDate: end,
      totalDays: computedDays,
      isHalfDay: fHalf,
      halfDayPeriod: fHalf ? fHalfPeriod : undefined,
      status: "pending" as LeaveStatus,
      notes: fNotes || undefined,
      reliefEmployeeId: fReliefId || undefined,
      reliefEmployeeName: fReliefName || undefined,
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    onSubmit(newEntry);
    setSubmitted(true);
    setTimeout(() => {
      reset();
      onClose();
    }, 1600);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!submitted && !v) onClose();
      }}
    >
      {/* Two columns: the form on the left, and a live read of the request —
          days, policy and the Smart Leave Assistant — on the right. The dialog
          scrolls as one column on mobile, and per pane from md up. */}
      <DialogContent className="sm:max-w-3xl max-h-[88vh] gap-0 p-0 overflow-hidden grid-rows-[auto_minmax(0,1fr)]">
        <DialogHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#4361ee]/10 flex items-center justify-center">
              <Send className="w-4 h-4 text-[#4361ee]" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              New Leave Request
            </DialogTitle>
          </div>
        </DialogHeader>

        {submitted ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#1D9E75] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#1D9E75]">
              Request submitted
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your manager will be notified and will review your request.
            </p>
          </div>
        ) : (
          <div className="grid min-h-0 overflow-y-auto md:grid-cols-[minmax(0,1fr)_20rem] md:overflow-hidden">
            <div className="flex min-h-0 flex-col">
              <div className="flex flex-col gap-4 px-5 py-4 md:overflow-y-auto">
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
                              {balances[t].total -
                                balances[t].used -
                                balances[t].pending}{" "}
                              days remaining)
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      className={cn(
                        "w-8 h-4 rounded-full transition-colors relative cursor-pointer",
                        fHalf ? "bg-[#4361ee]" : "bg-muted",
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
                    This leave type requires at least {
                      selectedPolicy.minNoticeDays
                    }{" "}
                    days advance notice.
                  </div>
                )}

                {/* Optional cover while away (client feedback §3.1). */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium">
                    Relief employee{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </p>
                  <EmployeePicker
                    value={fReliefId || undefined}
                    excludeIds={myEmployeeId ? [myEmployeeId] : undefined}
                    preferDepartment={myDepartment}
                    placeholder="Who will cover for you?"
                    onChange={(picked) => {
                      setFReliefId(picked?.id ?? "");
                      setFReliefName(picked?.name ?? "");
                    }}
                  />
                </div>

                {reliefConflictMessage && (
                  <div className="flex items-center gap-2 text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    {reliefConflictMessage}
                  </div>
                )}

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

              <DialogFooter className="gap-2 border-t border-border px-5 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="text-xs h-8 bg-[#4361ee] hover:bg-[#3451d1] text-white"
                  onClick={handleSubmit}
                  disabled={!formValid}
                >
                  Submit Request
                </Button>
              </DialogFooter>
            </div>

            {/* Right rail: what you're asking for, the policy, the assistant. */}
            <aside className="min-h-0 border-t border-border bg-muted/30 px-4 py-4 md:border-t-0 md:border-l md:overflow-y-auto">
              <RequestSummaryPanel
                leaveType={fType}
                startDate={fStart}
                endDate={fEnd}
                isHalfDay={fHalf}
                halfDayPeriod={fHalfPeriod}
                days={computedDays}
                balanceRemaining={balanceRemaining}
                policy={selectedPolicy}
                onPickWindow={(w) => {
                  setFStart(w.startDate);
                  setFEnd(w.endDate);
                  setFHalf(false);
                }}
              />
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

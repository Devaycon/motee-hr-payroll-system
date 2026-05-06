"use client";

import { useState } from "react";
import {
  CalendarDays,
  Info,
  AlertTriangle,
  CheckCircle2,
  Send,
} from "lucide-react";
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
import {
  LEAVE_TYPE_LABELS,
  LEAVE_TYPE_OPTIONS,
  LEAVE_POLICIES,
} from "@/src/data/leave-demo";
import type { LeaveTypeName, LeaveStatus } from "@/src/lib/types/leave";
import type { LeaveBalance, LeaveRequestEntry } from "./types";

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

interface LeaveRequestFormProps {
  open: boolean;
  balances: LeaveBalance;
  onClose: () => void;
  onSubmit: (entry: LeaveRequestEntry) => void;
}

export function LeaveRequestForm({
  open,
  balances,
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

  const computedDays = fHalf ? 0.5 : workingDaysBetween(fStart, fEnd);

  const selectedBalance = fType ? balances[fType as LeaveTypeName] : null;
  const balanceRemaining = selectedBalance
    ? selectedBalance.total - selectedBalance.used - selectedBalance.pending
    : null;
  const insufficientBalance =
    balanceRemaining !== null && computedDays > balanceRemaining;

  const selectedPolicy = fType
    ? LEAVE_POLICIES.find((p) => p.leaveType === fType)
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
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
                        insufficientBalance ? "text-red-500" : "text-[#1D9E75]",
                      )}
                    >
                      {balanceRemaining - computedDays} days
                    </span>
                  </span>
                )}
              </div>
            )}

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
        )}
      </DialogContent>
    </Dialog>
  );
}

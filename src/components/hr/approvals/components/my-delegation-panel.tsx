"use client";

import { useState } from "react";
import { UserCog, Trash2, CalendarRange } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import {
  EmployeePicker,
  type PickedEmployee,
} from "@/src/components/shared/employee-picker";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { addDelegation, removeDelegation } from "@/src/lib/stores/approvals-slice";
import { toast } from "sonner";

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * §4.1 mechanism 1 — "Pre-configured delegation": a manager sets a date
 * range and their approvals route to someone else automatically during it.
 * Distinct from mechanism 2 (the per-chain hierarchy fallback configured in
 * the chain builder), which only applies when no delegate like this exists.
 */
export function MyDelegationPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const allDelegations = useAppSelector((s) => s.approvals.delegations);

  const [delegate, setDelegate] = useState<PickedEmployee | null>(null);
  const [startDate, setStartDate] = useState(isoToday());
  const [endDate, setEndDate] = useState(isoToday());
  const [reason, setReason] = useState("");

  const myEmployeeId = user?.employeeId;
  const mine = allDelegations.filter((d) => d.delegatorEmployeeId === myEmployeeId);
  const today = isoToday();

  function handleCreate() {
    if (!myEmployeeId || !user) {
      toast.error("Sign in as an employee to set a delegation.");
      return;
    }
    if (!delegate) {
      toast.error("Choose who to delegate to.");
      return;
    }
    if (endDate < startDate) {
      toast.error("End date must be on or after the start date.");
      return;
    }
    dispatch(
      addDelegation({
        delegatorEmployeeId: myEmployeeId,
        delegatorName: user.name,
        delegateEmployeeId: delegate.id,
        delegateName: delegate.name,
        startDate,
        endDate,
        reason: reason.trim() || undefined,
      }),
    );
    toast.success(`Approvals will route to ${delegate.name} from ${fmt(startDate)} to ${fmt(endDate)}`);
    setDelegate(null);
    setReason("");
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserCog className="w-4 h-4 text-primary" />
            Manage my delegation
          </DialogTitle>
          <DialogDescription className="text-xs">
            While you're away, your approvals will automatically route to whoever you choose
            below, for the dates you set.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {mine.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs">Active &amp; upcoming delegations</Label>
              <ul className="flex flex-col gap-1.5">
                {mine.map((d) => {
                  const active = d.startDate <= today && today <= d.endDate;
                  return (
                    <li
                      key={d.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {d.delegateName}
                          {active && (
                            <Badge className="ml-1.5 bg-emerald-500 text-white text-[9px]">Active</Badge>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <CalendarRange className="w-3 h-3" />
                          {fmt(d.startDate)} – {fmt(d.endDate)}
                        </p>
                        {d.reason && (
                          <p className="text-[11px] text-muted-foreground truncate">{d.reason}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => dispatch(removeDelegation(d.id))}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <Label className="text-xs">New delegation</Label>
            <EmployeePicker
              value={delegate?.id}
              onChange={setDelegate}
              excludeIds={myEmployeeId ? [myEmployeeId] : []}
              placeholder="Route my approvals to…"
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground">From</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground">To</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <Textarea
              rows={2}
              placeholder="Reason (optional) — e.g. Annual leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCreate} className="gap-1.5">
            <UserCog className="w-4 h-4" />
            Set delegation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

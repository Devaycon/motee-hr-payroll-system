"use client";

import { useState } from "react";
import { PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCurrentActor, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { AvcRequest, Payslip } from "@/src/lib/payroll/types";

const money = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const firstOfNextMonth = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
};

/** The employee's top PAYE rate on their latest payslip — what each naira of AVC saves in tax. */
function topRate(p?: Payslip): number {
  const bands = p?.computation.tax.bands ?? [];
  return [...bands].reverse().find((b) => b.tax > 0)?.rate ?? 0;
}

/**
 * Self-service: the employee's voluntary pension (AVC) — what they pay now,
 * any request waiting for HR, and a form to start, change or stop it.
 */
export function MyAvcCard({ latest }: { latest?: Payslip }) {
  const me = useAppSelector((s) => s.auth.user?.employeeId);
  const { data } = useTenantPayroll();
  const actions = usePayrollActions();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"fixed" | "percent" | "stop">("fixed");
  const [value, setValue] = useState("");
  const [from, setFrom] = useState(firstOfNextMonth());
  const [agree, setAgree] = useState(false);
  if (!data || !me) return null;
  const profile = data.profiles.find((p) => p.employeeId === me);
  const avc = profile?.avc && (!profile.avc.endDate || profile.avc.endDate >= new Date().toISOString().slice(0, 10)) ? profile.avc : null;
  const pending = data.avcRequests?.find((r) => r.employeeId === me && r.status === "pending");
  const last = data.avcRequests?.find((r) => r.employeeId === me && r.status !== "pending");
  const rate = topRate(latest);
  const pensionable = latest?.computation.bases.pensionable ?? 0;
  const amount = mode === "percent" ? (pensionable * (Number(value) || 0)) / 100 : Number(value) || 0;

  const submit = () => {
    const r = actions.requestAvcChange({ action: mode === "stop" ? "stop" : "set", mode: mode === "stop" ? "fixed" : mode, value: mode === "stop" ? 0 : Number(value) || 0, effectiveFrom: from });
    if (!r.ok) return toast.error(r.reason);
    toast.success("Request sent to HR for approval");
    setOpen(false);
    setValue("");
    setAgree(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600"><PiggyBank className="h-4 w-4" /></span>
        <div>
          <p className="text-sm font-semibold">Voluntary pension (AVC)</p>
          <p className="text-xs text-muted-foreground">
            {avc ? `${avc.mode === "percent" ? `${avc.value}% of pensionable pay` : `${money(avc.value)} a month`} into your RSA${avc.startDate ? ` since ${fmt(avc.startDate)}` : ""} — relieved from PAYE.` : "Top up your pension from your pay. Contributions are relieved from PAYE."}
          </p>
          {pending && <p className="mt-0.5 text-[11px] text-amber-700">Waiting for HR: {pending.action === "stop" ? "stop" : pending.mode === "percent" ? `${pending.value}%` : money(pending.value)} from {fmt(pending.effectiveFrom)}.</p>}
          {!pending && last && last.status === "rejected" && <p className="mt-0.5 text-[11px] text-rose-600">Your last request was not approved{last.decisionNote ? `: ${last.decisionNote}` : "."}</p>}
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>{avc ? "Change or stop" : "Start contributing"}</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voluntary pension contribution</DialogTitle>
            <DialogDescription>Deducted from your pay each month and paid into your RSA with your mandatory pension. HR approves the change before payroll applies it.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">I want to</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed" className="text-xs">Contribute a fixed amount</SelectItem>
                    <SelectItem value="percent" className="text-xs">Contribute a % of pensionable pay</SelectItem>
                    {avc && <SelectItem value="stop" className="text-xs">Stop contributing</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              {mode !== "stop" && (
                <div className="space-y-1">
                  <Label className="text-xs">{mode === "percent" ? "Percentage (%)" : "Amount a month (₦)"}</Label>
                  <Input type="number" min={0} step={mode === "percent" ? 0.5 : 1000} className="h-9 text-xs" value={value} onChange={(e) => setValue(e.target.value)} />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input type="date" className="h-9 text-xs" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
            </div>
            {mode !== "stop" && amount > 0 && (
              <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300">
                About {money(amount)} a month into your RSA. At your current top tax rate ({Math.round(rate * 100)}%) your PAYE falls by about {money(amount * rate)}, so your take-home pay drops by about {money(amount * (1 - rate))}.
              </p>
            )}
            {mode !== "stop" && (
              <label className="flex items-start gap-2 text-xs">
                <Checkbox checked={agree} onCheckedChange={(c) => setAgree(c === true)} className="mt-0.5" />
                <span>I authorise my employer to deduct this voluntary contribution from my pay and remit it to my PFA. This is my signed mandate.</span>
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={mode !== "stop" && (!agree || !(Number(value) > 0))} onClick={submit}>Send to HR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** HR: voluntary pension requests waiting for a decision. */
export function AvcRequestsPanel({ canEdit }: { canEdit: boolean }) {
  const { data } = useTenantPayroll();
  const actions = usePayrollActions();
  const me = useCurrentActor();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const list = (data?.avcRequests ?? []).filter((r) => r.status === "pending");
  const recent = (data?.avcRequests ?? []).filter((r) => r.status !== "pending").slice(0, 5);
  if (!list.length && !recent.length) return null;
  const describe = (r: AvcRequest) => (r.action === "stop" ? `Stop from ${fmt(r.effectiveFrom)}` : `${r.mode === "percent" ? `${r.value}% of pensionable pay` : `${money(r.value)} a month`} from ${fmt(r.effectiveFrom)}`);
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-semibold"><PiggyBank className="h-4 w-4 text-primary" /> Voluntary pension requests {list.length > 0 && <Badge className="text-[10px]">{list.length} pending</Badge>}</p>
      <ul className="mt-3 divide-y text-xs">
        {list.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>
              <span className="font-medium">{r.employeeName}</span> — {describe(r)}
              <span className="block text-[10px] text-muted-foreground">Requested {fmt(r.requestedAt)} · mandate {r.mandate.reference}</span>
            </span>
            {canEdit && (
              <span className="flex items-center gap-2">
                <Input className="h-7 w-44 text-[11px]" placeholder="Note (required to reject)" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                <Button size="sm" className="h-7 text-[11px]" disabled={r.employeeId === me.employeeId} onClick={() => { const x = actions.decideAvcRequest(r.id, true, notes[r.id]); if (!x.ok) toast.error(x.reason); else toast.success("Approved — the profile is updated"); }}>Approve</Button>
                <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { const x = actions.decideAvcRequest(r.id, false, notes[r.id]); if (!x.ok) toast.error(x.reason); else toast.success("Request rejected"); }}>Reject</Button>
              </span>
            )}
          </li>
        ))}
        {recent.map((r) => (
          <li key={r.id} className="flex justify-between gap-2 py-2 text-muted-foreground">
            <span>{r.employeeName} — {describe(r)}</span>
            <span>{r.status === "approved" ? "Approved" : "Rejected"} by {r.decidedBy}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

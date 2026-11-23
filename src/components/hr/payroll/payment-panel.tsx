"use client";

import { useState } from "react";
import { BadgeCheck, Banknote, CheckCircle2, CircleDashed, Landmark, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { companySnapshot } from "@/src/lib/payroll/run-builder";
import { downloadExport, type ExportFormat } from "@/src/lib/payroll/exports";
import { PAYMENT_AUTHORISER_ROLES, useCurrentActor, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { PayrollRun } from "@/src/lib/payroll/types";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { cn } from "@/src/lib/utils";
import { fmtDate, money } from "./components/shared";
import { DownloadMenu } from "./components/row-actions";

/**
 * Bank payment of a finalized run: Finance authorises the batch (never the
 * preparer or an approver), the NIBSS file goes to the bank, and the bank's
 * settlement is reconciled account by account — rejected payments stay open
 * until they are paid another way.
 */
export function PaymentPanel({ run, people }: { run: PayrollRun; people: Map<string, LocaleEmployee> }) {
  const actions = usePayrollActions();
  const actor = useCurrentActor();
  const { data, bundle } = useTenantPayroll();
  const [bankRef, setBankRef] = useState("");
  const [settling, setSettling] = useState(false);
  const [rejected, setRejected] = useState<Record<string, string>>({});
  const [resolving, setResolving] = useState<string | null>(null);
  const [how, setHow] = useState("");
  const pay = run.payment;
  const payable = run.employees.filter((e) => e.included && e.computation && e.computation.net > 0);
  const total = payable.reduce((s, e) => s + e.computation!.net, 0);
  const legacy = !pay && run.status === "disbursed";
  const isAuthoriser = PAYMENT_AUTHORISER_ROLES.includes(actor.roleId ?? "");

  const steps = [
    { label: "Authorise payment", done: !!pay || legacy, detail: pay?.authorisedBy ? `${pay.authorisedBy.name} · ${fmtDate(pay.authorisedAt ?? "")}` : legacy ? "Paid before payment batches" : "Finance / Payment Authoriser" },
    { label: "Send the bank file", done: pay?.status === "submitted" || pay?.status === "settled" || legacy, detail: pay?.bankReference ? `Ref ${pay.bankReference} · ${fmtDate(pay.submittedAt ?? "")}` : "NIBSS bulk payment file" },
    { label: "Reconcile settlement", done: pay?.status === "settled" || legacy, detail: pay?.reconciledAt ? `${pay.reconciledBy} · ${fmtDate(pay.reconciledAt)}` : "Match the bank report to approved net pay" },
  ];

  const nibss = (format: ExportFormat = "csv") => {
    const profiles = new Map((data?.profiles ?? []).map((p) => [p.employeeId, p]));
    const excluded = downloadExport("nibss", { run, people, profiles, settings: data?.settings, company: bundle ? companySnapshot(bundle) : undefined, elements: data?.elements }, format);
    actions.logExport(run.id, `NIBSS bulk payment file (${format.toUpperCase()})`);
    if (excluded.length) toast.warning(`${excluded.length} account${excluded.length === 1 ? "" : "s"} left out of the file`, { description: excluded.slice(0, 3).join(" · ") });
    else toast.success("NIBSS payment file downloaded");
  };

  const results = pay?.results ?? {};
  const rejectedRows = Object.entries(results).filter(([, r]) => r.status === "rejected");

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.label} className={cn("flex items-start gap-2 rounded-xl border bg-card p-3", s.done && "border-emerald-500/30")}>
            {s.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> : <CircleDashed className="mt-0.5 h-4 w-4 text-muted-foreground" />}
            <div>
              <p className="text-xs font-semibold">{i + 1}. {s.label}</p>
              <p className="text-[11px] text-muted-foreground">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold"><Banknote className="h-4 w-4 text-primary" /> Payment batch</p>
            <p className="text-xs text-muted-foreground">{money(pay?.amount ?? total)} to {pay?.count ?? payable.length} accounts · pay day {fmtDate(run.period.payDate)}</p>
          </div>

          {legacy ? (
            <p className="text-xs text-emerald-700">Paid on {fmtDate(run.disbursedAt ?? "")}.</p>
          ) : !pay ? (
            <div className="text-right">
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!isAuthoriser}
                onClick={() => {
                  const r = actions.authorisePayment(run.id);
                  if (r.ok) toast.success("Payment authorised", { description: "The NIBSS file can now be sent to the bank." });
                  else toast.error(r.reason);
                }}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Authorise payment release
              </Button>
              <p className="mt-1 max-w-xs text-[10px] text-muted-foreground">
                {isAuthoriser ? "You must not have prepared, finalized or approved this run." : "Only a Finance / Payment Authoriser can release payment. System administrators don't get this right automatically."}
              </p>
            </div>
          ) : pay.status === "authorised" ? (
            <div className="flex flex-wrap items-end gap-2">
              <DownloadMenu label="NIBSS file" formats={["csv", "pdf"]} onDownload={nibss} />
              <div className="space-y-1">
                <Label htmlFor="bank-ref" className="text-[11px]">Bank batch reference</Label>
                <Input id="bank-ref" className="h-8 w-48 text-xs" value={bankRef} onChange={(e) => setBankRef(e.target.value)} placeholder="e.g. NIP-BATCH-88213" />
              </div>
              <Button
                size="sm"
                disabled={bankRef.trim().length < 3}
                onClick={() => {
                  const r = actions.submitPayment(run.id, bankRef.trim());
                  if (r.ok) toast.success("Marked as sent to the bank");
                  else toast.error(r.reason);
                }}
              >
                Sent to bank
              </Button>
            </div>
          ) : pay.status === "submitted" ? (
            <div className="flex gap-2">
              <DownloadMenu label="NIBSS file" formats={["csv", "pdf"]} onDownload={nibss} />
              <Button size="sm" className="gap-1.5" onClick={() => { setRejected({}); setSettling(true); }}><Landmark className="h-3.5 w-3.5" /> Reconcile bank settlement</Button>
            </div>
          ) : (
            <div className="text-right text-xs">
              <p className="flex items-center justify-end gap-1 font-medium text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" /> Settled {money(pay.settledAmount ?? 0)}</p>
              {pay.settledAmount !== undefined && Math.abs(pay.settledAmount + rejectedRows.reduce((s, [id]) => s + (run.employees.find((e) => e.employeeId === id)?.computation?.net ?? 0), 0) - pay.amount) < 1 && (
                <p className="text-[11px] text-muted-foreground">Settled + rejected = approved net pay</p>
              )}
            </div>
          )}
        </div>
      </div>

      {rejectedRows.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <p className="border-b px-4 py-2.5 text-sm font-semibold">Rejected payments ({rejectedRows.length})</p>
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr><th className="px-4 py-2 font-medium">Employee</th><th className="px-4 py-2 font-medium">Bank&apos;s reason</th><th className="px-4 py-2 text-right font-medium">Amount</th><th className="px-4 py-2 font-medium">Resolution</th></tr></thead>
            <tbody>
              {rejectedRows.map(([id, r]) => (
                <tr key={id} className="border-t">
                  <td className="px-4 py-2">{people.get(id)?.fullName ?? id}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.reason}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{money(run.employees.find((e) => e.employeeId === id)?.computation?.net ?? 0)}</td>
                  <td className="px-4 py-2">
                    {r.resolvedBy ? (
                      <span className="text-emerald-700">{r.resolvedBy}</span>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => { setResolving(id); setHow(""); }}>Record how it was paid</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t px-4 py-2 text-[11px] text-muted-foreground">Correct the bank details on the employee&apos;s tax &amp; statutory profile, then pay them through an off-cycle run or a manual transfer and record it here.</p>
        </div>
      )}

      <Dialog open={settling} onOpenChange={setSettling}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reconcile the bank settlement</DialogTitle>
            <DialogDescription>Tick any account the bank rejected and give its reason. Every other account is recorded as paid its approved net pay.</DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto rounded-md border">
            <table className="w-full text-xs">
              <tbody>
                {payable.map((e) => {
                  const on = e.employeeId in rejected;
                  return (
                    <tr key={e.employeeId} className="border-b last:border-0">
                      <td className="w-8 px-3 py-1.5"><Checkbox checked={on} onCheckedChange={(v) => setRejected((m) => { const n = { ...m }; if (v) n[e.employeeId] = "Invalid account"; else delete n[e.employeeId]; return n; })} /></td>
                      <td className="py-1.5">{people.get(e.employeeId)?.fullName ?? e.employeeId}<span className="block font-mono text-[10px] text-muted-foreground">{e.snapshot?.bankName} · {e.snapshot?.accountNumber}</span></td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{money(e.computation!.net)}</td>
                      <td className="w-48 px-3 py-1.5">{on && <Input className="h-7 text-[11px]" value={rejected[e.employeeId]} onChange={(ev) => setRejected((m) => ({ ...m, [e.employeeId]: ev.target.value }))} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs">
            Settled: <b className="tabular-nums">{money(payable.filter((e) => !(e.employeeId in rejected)).reduce((s, e) => s + e.computation!.net, 0))}</b> · rejected:{" "}
            <b className="tabular-nums">{Object.keys(rejected).length}</b>
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettling(false)}>Cancel</Button>
            <Button
              onClick={() => {
                const r = actions.recordSettlement(run.id, Object.entries(rejected).map(([employeeId, reason]) => ({ employeeId, reason: reason || "Rejected by bank" })));
                if (!r.ok) return toast.error(r.reason);
                setSettling(false);
                toast.success("Settlement reconciled", { description: Object.keys(rejected).length ? "Rejected payments are listed for follow-up." : "Every account was paid." });
              }}
            >
              Save reconciliation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resolving} onOpenChange={(o) => !o && setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How was it paid?</DialogTitle>
            <DialogDescription>{resolving && people.get(resolving)?.fullName}: e.g. &quot;Re-paid by off-cycle run after bank details corrected&quot;.</DialogDescription>
          </DialogHeader>
          <Input value={how} onChange={(e) => setHow(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolving(null)}>Cancel</Button>
            <Button disabled={how.trim().length < 5} onClick={() => { actions.resolveRejectedPayment(run.id, resolving!, how.trim()); setResolving(null); toast.success("Resolution recorded"); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {!legacy && !pay && <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><XCircle className="h-3.5 w-3.5" /> The NIBSS file is locked until the payment is authorised.</p>}
    </div>
  );
}

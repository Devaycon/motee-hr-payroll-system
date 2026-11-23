"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import { store } from "@/src/lib/stores/store";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { exceptionDetail, inputOrigin } from "@/src/lib/payroll/drilldowns";
import { payableExpenses, resolvedLoans, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { EXCEPTION_RULE_LABELS } from "@/src/lib/payroll/validation";
import type { PayrollException, PayrollRun, PeriodInput } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { DetailModal } from "./components/row-actions";
import { fmtDate, money } from "./components/shared";

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Drill-down for one exception: the rule in plain English, the figures, how to clear it. */
export function ExceptionDetailModal({ run, exception, onClose, onAcknowledge, editable }: { run: PayrollRun; exception: PayrollException | null; onClose: () => void; onAcknowledge: (e: PayrollException) => void; editable: boolean }) {
  const { data, bundle } = useTenantPayroll();
  const d = useMemo(() => {
    if (!exception || !data || !bundle) return null;
    return exceptionDetail(exception, run, {
      data,
      people: new Map(bundle.employees.map((e) => [e.id, e])),
      profiles: new Map(data.profiles.map((p) => [p.employeeId, p])),
      ruleLabel: EXCEPTION_RULE_LABELS[exception.rule],
    });
  }, [exception, data, bundle, run]);
  if (!exception || !d) return null;
  const empId = exception.employeeId;
  return (
    <DetailModal
      open={!!exception}
      onClose={onClose}
      title={d.title}
      description={exception.message}
      facts={d.facts}
      actions={
        <>
          {empId && <Button size="sm" variant="outline" asChild><Link href={`${PAYROLL_HREF}/${run.id}/employees/${empId}`}>Employee&apos;s pay this month</Link></Button>}
          {empId && <Button size="sm" variant="outline" asChild><Link href={`/organization/employees/${empId}`}>Employee profile</Link></Button>}
          {exception.rule === "variance" && <Button size="sm" variant="outline" asChild><Link href={`${PAYROLL_HREF}/compare?current=${run.id}`}>Payroll comparison</Link></Button>}
          {editable && !exception.acknowledged && <Button size="sm" onClick={() => { onAcknowledge(exception); onClose(); }}>Acknowledge…</Button>}
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">What this check means</p>
          <p className="mt-1 text-sm">{d.what}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">How to clear it</p>
          <p className="mt-1 text-sm">{d.fix}</p>
        </div>
      </div>
      {d.lines.length > 0 && (
        <table className="w-full text-xs">
          <thead className="text-left text-muted-foreground"><tr><th className="py-1 font-medium">This employee</th><th className="py-1 text-right font-medium">Previous payslip</th><th className="py-1 text-right font-medium">{run.period.label}</th></tr></thead>
          <tbody>
            {d.lines.map((l) => (
              <tr key={l.label} className={cn("border-t", l.label === "Net pay" && "font-semibold")}>
                <td className="py-1.5">{l.label}</td>
                <td className="py-1.5 text-right tabular-nums text-muted-foreground">{l.previous === null ? "—" : money(l.previous)}</td>
                <td className="py-1.5 text-right tabular-nums">{money(l.current)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {d.notes.length > 0 && <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">{d.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
    </DetailModal>
  );
}

/** Drill-down for one pay input: where it came from, who added it and when. */
export function InputDetailModal({ run, input, onClose }: { run: PayrollRun; input: PeriodInput | null; onClose: () => void }) {
  const { data, bundle } = useTenantPayroll();
  const o = useMemo(() => {
    if (!input || !data || !bundle) return null;
    const s = store.getState();
    return inputOrigin(input, run, {
      loans: resolvedLoans(s, bundle),
      expenses: payableExpenses(s),
      people: new Map(bundle.employees.map((e) => [e.id, e])),
      audit: data.audit,
      profiles: new Map(data.profiles.map((p) => [p.employeeId, p])),
    });
  }, [input, data, bundle, run]);
  if (!input || !o) return null;
  const emp = bundle?.employees.find((e) => e.id === input.employeeId);
  const line = run.employees.find((e) => e.employeeId === input.employeeId)?.computation?.lines.find((l) => l.code === input.code);
  return (
    <DetailModal
      open={!!input}
      onClose={onClose}
      title={`${line?.name ?? input.code} · ${emp?.fullName ?? input.employeeId}`}
      description={input.description || o.how}
      facts={[
        { label: "Source", value: o.module },
        { label: "Added by", value: o.addedBy },
        { label: "Added on", value: when(o.addedAt) },
        { label: input.amount !== undefined ? "Amount" : "Units", value: input.amount !== undefined ? money(input.amount) : `${input.units} ${input.code === "UNPAID_LEAVE" ? "days" : "hrs"}` },
      ]}
      actions={
        <>
          <Button size="sm" variant="outline" asChild><Link href={`${PAYROLL_HREF}/${run.id}/employees/${input.employeeId}`}>Employee&apos;s pay this month</Link></Button>
          {input.source === "loan" && <Button size="sm" variant="outline" asChild><Link href={`/organization/employees/${input.employeeId}`}>Loan on employee profile</Link></Button>}
        </>
      }
    >
      <div className="rounded-lg border p-3 text-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">How it got onto this run</p>
        <p className="mt-1">{o.how}</p>
        {line && <p className="mt-1 text-xs text-muted-foreground">Paid as {money(line.amount)}{line.note ? ` · ${line.note}` : ""}.</p>}
      </div>
      {o.facts.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
          {o.facts.map((f) => (
            <div key={f.label} className="contents">
              <dt className="text-muted-foreground">{f.label}</dt>
              <dd className={cn("tabular-nums", f.tone === "warn" && "text-amber-700", f.tone === "good" && "text-emerald-700")}>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Activity on this run</p>
        <ol className="mt-1.5 space-y-1 text-xs">
          {o.history.map((h, i) => (
            <li key={i}><span className="font-medium">{h.actor}</span> — {h.action}{h.detail ? ` · ${h.detail}` : ""} <span className="text-[10px] text-muted-foreground">· {when(h.at)}</span></li>
          ))}
          {!o.history.length && <li className="text-muted-foreground">Built with the run on {fmtDate(run.createdAt)}; no later changes recorded.</li>}
        </ol>
      </div>
    </DetailModal>
  );
}

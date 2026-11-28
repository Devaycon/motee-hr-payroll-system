"use client";

import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, FileCheck2 } from "lucide-react";
import { DetailModal } from "@/src/components/hr/payroll/components/row-actions";
import { EXPLAIN_SOURCE_LABELS, explainLine } from "@/src/lib/payroll/explain";
import { useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { Payslip, PayslipLine } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";

const money = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "How was this calculated?" for one payslip line (client feedback B6). */
export function LineExplainDialog({ payslip, line, onClose }: { payslip: Payslip; line: PayslipLine | null; onClose: () => void }) {
  const { data } = useTenantPayroll();
  const x = useMemo(() => {
    if (!line || !data) return null;
    return explainLine(payslip, line, { data, profile: data.profiles.find((p) => p.employeeId === payslip.employeeId) ?? null });
  }, [payslip, line, data]);
  if (!line) return null;
  const max = Math.max(1, ...(x?.history ?? []).map((h) => Math.abs(h.amount)));
  const kindWord = line.category === "earning" ? "paid" : line.category === "deduction" ? "deducted" : "paid by your employer";

  return (
    <DetailModal
      open
      wide
      onClose={onClose}
      title={`How your ${line.name.toLowerCase()} was calculated`}
      description={`${payslip.period.label} · ${money(line.amount)} ${kindWord}`}
      facts={
        x
          ? [
              { label: "Amount", value: money(x.amount) },
              { label: "Basis", value: x.basis ? money(x.basis.amount) : "—" },
              { label: "Rate", value: x.rate ?? "—" },
              { label: "Period", value: x.period },
            ]
          : undefined
      }
    >
      {x && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border">
              <p className="border-b px-3 py-2 text-xs font-semibold">Calculation</p>
              {x.basis && <p className="px-3 pt-2 text-[11px] text-muted-foreground">Basis: {x.basis.label}</p>}
              <table className="w-full text-xs tabular-nums">
                <tbody>
                  {x.formula.map((f, i) => (
                    <tr key={i} className={cn("border-t first:border-t-0", i === x.formula.length - 1 && "font-semibold")}>
                      <td className="px-3 py-1.5">{f.label}</td>
                      <td className="px-3 py-1.5 text-right">{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold"><FileCheck2 className="h-3.5 w-3.5 text-primary" /> Where it came from</p>
                <p className="mt-1 text-xs font-medium">{EXPLAIN_SOURCE_LABELS[x.source.kind]}</p>
                <p className="text-[11px] text-muted-foreground">{x.source.detail}</p>
                {(x.source.reference || x.source.approvedBy) && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {[x.source.reference && `Ref ${x.source.reference}`, x.source.approvedBy && `Approved by ${x.source.approvedBy}`].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
              {x.change && (
                <div className="flex items-center justify-between rounded-lg border p-3 text-xs">
                  <span>
                    <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Against {x.change.previousLabel}</span>
                    {money(x.change.previous)} → {money(x.amount)}
                  </span>
                  <span className={cn("flex items-center gap-1 font-semibold tabular-nums", Math.abs(x.change.delta) < 0.005 ? "text-muted-foreground" : x.change.delta > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600")}>
                    {Math.abs(x.change.delta) < 0.005 ? "No change" : (
                      <>
                        {x.change.delta > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {money(Math.abs(x.change.delta))}
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {x.history.length > 1 && (
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold">Month by month, {payslip.period.year}</p>
              <div className="mt-3 flex h-28 items-end gap-1.5">
                {x.history.map((h) => (
                  <div key={h.month} className="flex min-w-0 flex-1 flex-col items-center gap-1" title={`${h.label}: ${money(h.amount)}`}>
                    <div className={cn("w-full rounded-t", h.current ? "bg-primary" : "bg-primary/30")} style={{ height: `${Math.max(2, (Math.abs(h.amount) / max) * 88)}px` }} />
                    <span className={cn("text-[10px]", h.current ? "font-semibold" : "text-muted-foreground")}>{h.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">Year to date: {money(x.history.reduce((s, h) => s + h.amount, 0))}. Earlier months come from final payslips and the balance brought forward.</p>
            </div>
          )}

          {x.notes.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-[11px] text-muted-foreground">
              {x.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
          )}
        </div>
      )}
    </DetailModal>
  );
}

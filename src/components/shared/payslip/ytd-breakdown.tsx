"use client";

import { useMemo } from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { DetailModal, DownloadMenu } from "@/src/components/hr/payroll/components/row-actions";
import { writeTable, type ExportTable } from "@/src/lib/payroll/exports";
import { useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { ytdBreakdown, ytdCtxFor, type YtdBreakdown } from "@/src/lib/payroll/ytd";
import type { Payslip } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";

const money = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = (n: number) => `${n < 0 ? "−" : "+"}${money(Math.abs(n))}`;

const SOURCE_LABEL = {
  brought_forward: "Brought forward",
  brought_forward_total: "Brought forward (total)",
  payslip: "Final payslip",
} as const;

/** The breakdown for one payslip's YTD: every month behind it, read from final payslips and the opening balance. */
export function useYtdBreakdown(payslip: Payslip | null): YtdBreakdown | null {
  const { data } = useTenantPayroll();
  return useMemo(() => {
    if (!data || !payslip) return null;
    const { year, month } = payslip.period;
    return ytdBreakdown(data, payslip.employeeId, year, month, ytdCtxFor(data.structures, payslip.employeeId, year), {
      // A draft preview isn't in the store yet — add it so the totals match what the slip shows.
      extra: payslip.status === "draft" ? payslip : null,
    });
  }, [data, payslip]);
}

export function ytdTable(b: YtdBreakdown, name: string): ExportTable {
  return {
    preamble: [[`Year-to-date breakdown — ${name} — ${b.year}`], []],
    headers: ["Month", "Source", "Reference", "Gross", "Pension (8%)", "Voluntary pension", "NHF", "PAYE", "Total deductions", "Net pay", "What varied"],
    data: b.rows.map((r) => [
      r.label,
      SOURCE_LABEL[r.source],
      r.reference ?? "",
      r.gross,
      r.pensionEmployee,
      r.voluntaryPension,
      r.nhf,
      r.paye,
      r.totalDeductions,
      r.net,
      r.variations.map((v) => `${v.label} ${signed(v.amount)}`).join("; "),
    ]),
    trailer: [
      ["Year to date", "", "", b.totals.gross, b.totals.pensionEmployee, b.totals.voluntaryPension, b.totals.nhf, b.totals.paye, b.totals.totalDeductions, b.totals.net, ""],
      [],
      ["Regular salary × months", "", "", b.expectedIfUnchanged],
      ["Difference explained by variations", "", "", b.difference],
    ],
  };
}

/** Summary sentence + month table. Used in the payslip dialog and the run's employee page. */
export function YtdBreakdownBody({ b, compact }: { b: YtdBreakdown; compact?: boolean }) {
  const byMonth = b.variations.filter((v) => Math.abs(v.amount) >= 0.01);
  return (
    <div className="space-y-4">
      <div className={cn("rounded-lg border p-3 text-sm", b.explained ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5")}>
        <p className="flex items-center gap-2 font-medium">
          {b.explained ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
          {b.explained ? "Every naira of this YTD is accounted for" : "Part of this YTD isn't explained by the lines on record"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {b.regularMonths} month{b.regularMonths === 1 ? "" : "s"} of regular salary come to <b className="tabular-nums text-foreground">{money(b.expectedIfUnchanged)}</b>. YTD gross is{" "}
          <b className="tabular-nums text-foreground">{money(b.totals.gross)}</b>
          {Math.abs(b.difference) >= 0.01 ? (
            <>
              , a difference of <b className="tabular-nums text-foreground">{signed(b.difference)}</b>
              {byMonth.length ? ", made up of:" : "."}
            </>
          ) : (
            ", exactly as expected."
          )}
        </p>
        {byMonth.length > 0 && (
          <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
            {byMonth.map((v, i) => (
              <li key={i} className="flex justify-between gap-3 rounded bg-background/60 px-2 py-1">
                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground">{v.monthLabel}:</span> {v.label}
                </span>
                <span className={cn("shrink-0 tabular-nums", v.amount < 0 ? "text-rose-600" : "text-emerald-700 dark:text-emerald-400")}>{signed(v.amount)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          YTD counts only final payslips (regular, off-cycle and adjustment runs) and the balance brought forward — never draft or cancelled runs. Pension and NHF follow
          their own bases each month, so a month with unpaid leave or a one-off moves them too.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[760px] text-xs tabular-nums">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">Month</th>
              <th className="px-2 py-1.5 text-right font-medium">Gross</th>
              <th className="px-2 py-1.5 text-right font-medium">Pension</th>
              <th className="px-2 py-1.5 text-right font-medium">Vol. pension</th>
              <th className="px-2 py-1.5 text-right font-medium">NHF</th>
              <th className="px-2 py-1.5 text-right font-medium">PAYE</th>
              <th className="px-2 py-1.5 text-right font-medium">Net pay</th>
              {!compact && <th className="px-2 py-1.5 text-left font-medium">What varied</th>}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r) => (
              <tr key={r.key} className="border-t">
                <td className="px-2 py-1.5">
                  <p className="font-medium">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground">{r.reference ?? SOURCE_LABEL[r.source]}</p>
                </td>
                <td className={cn("px-2 py-1.5 text-right", r.variations.length > 0 && "font-semibold text-amber-700 dark:text-amber-400")}>{money(r.gross)}</td>
                <td className="px-2 py-1.5 text-right">{money(r.pensionEmployee)}</td>
                <td className="px-2 py-1.5 text-right">{money(r.voluntaryPension)}</td>
                <td className="px-2 py-1.5 text-right">{money(r.nhf)}</td>
                <td className="px-2 py-1.5 text-right">{money(r.paye)}</td>
                <td className="px-2 py-1.5 text-right">{money(r.net)}</td>
                {!compact && (
                  <td className="px-2 py-1.5 text-left">
                    {r.variations.length === 0 ? (
                      <span className="text-muted-foreground">Regular salary</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {r.variations.map((v, i) => (
                          <Badge key={i} variant="outline" className="font-normal">
                            {v.label} {signed(v.amount)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            <tr className="border-t-2 border-foreground/70 font-semibold">
              <td className="px-2 py-1.5">Year to date</td>
              <td className="px-2 py-1.5 text-right">{money(b.totals.gross)}</td>
              <td className="px-2 py-1.5 text-right">{money(b.totals.pensionEmployee)}</td>
              <td className="px-2 py-1.5 text-right">{money(b.totals.voluntaryPension)}</td>
              <td className="px-2 py-1.5 text-right">{money(b.totals.nhf)}</td>
              <td className="px-2 py-1.5 text-right">{money(b.totals.paye)}</td>
              <td className="px-2 py-1.5 text-right">{money(b.totals.net)}</td>
              {!compact && <td />}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function YtdBreakdownDialog({ payslip, open, onClose }: { payslip: Payslip; open: boolean; onClose: () => void }) {
  const b = useYtdBreakdown(open ? payslip : null);
  return (
    <DetailModal
      open={open}
      onClose={onClose}
      wide
      title={`Year-to-date breakdown · ${payslip.employee.fullName}`}
      description={`Every month behind the YTD figures on the ${payslip.period.label} payslip, tax year ${payslip.period.year}.`}
      facts={
        b
          ? [
              { label: "YTD gross", value: money(b.totals.gross) },
              { label: "YTD pension", value: money(b.totals.pensionEmployee) },
              { label: "YTD NHF", value: money(b.totals.nhf) },
              { label: "YTD PAYE", value: money(b.totals.paye) },
            ]
          : undefined
      }
      actions={b && <DownloadMenu onDownload={(f) => writeTable(`ytd-${payslip.employee.employeeNumber}-${payslip.period.year}-${String(payslip.period.month).padStart(2, "0")}`, "YTD breakdown", ytdTable(b, payslip.employee.fullName), f)} />}
    >
      {b ? <YtdBreakdownBody b={b} /> : <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>}
    </DetailModal>
  );
}

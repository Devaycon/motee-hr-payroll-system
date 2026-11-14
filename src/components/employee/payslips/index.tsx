"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronRight, Clock3, FileText, Wallet } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { StatStrip } from "@/src/components/hr/employees/employee-detail/ui";
import { PayslipDocument, PayslipPrintStyles } from "@/src/components/shared/payslip/payslip-document";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { ESS_PAYSLIPS_HREF, essPayslipHref } from "@/src/lib/payroll/constants";
import { useDraftPayslip, useEmployeePayslipList, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { cn } from "@/src/lib/utils";

const money = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Self-service: every payslip the employee has been issued, plus next month's preview. */
export function MyPayslipsPage() {
  const me = useAppSelector((s) => s.auth.user?.employeeId);
  const { payslips, loading, supported, data } = useEmployeePayslipList(me);
  const years = useMemo(() => [...new Set(payslips.map((p) => p.period.year))].sort((a, b) => b - a), [payslips]);
  const [year, setYear] = useState<string>("latest");
  const activeYear = year === "latest" ? years[0] : Number(year);
  const shown = payslips.filter((p) => p.period.year === activeYear);
  const latest = shown[0];

  // PayCheck Before Payday — a preview of the run being prepared, clearly marked as draft.
  // Only when the company enables it, only regular runs, and only once HR has submitted them.
  const draftRun = data?.settings.employeePreview
    ? data.runs.find((r) => r.type === "regular" && (r.status === "in_review" || r.status === "approved") && r.employees.some((e) => e.employeeId === me && e.included && e.computation))
    : undefined;
  const draftNet = draftRun?.employees.find((e) => e.employeeId === me)?.computation?.net;

  if (!supported) {
    return (
      <Header>
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Payslips are available for Nigerian tenants. UK payroll is the next statutory module.
        </p>
      </Header>
    );
  }
  if (loading && !payslips.length) {
    return (
      <Header>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-72 w-full" />
      </Header>
    );
  }

  return (
    <Header
      right={
        years.length > 1 ? (
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Tax year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Tax year {years[0]}</SelectItem>
              {years.slice(1).map((y) => <SelectItem key={y} value={String(y)}>Tax year {y}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : undefined
      }
    >
      {latest && (
        <StatStrip
          items={[
            { label: `Gross pay · ${activeYear} YTD`, value: money(latest.computation.ytd.gross) },
            { label: "PAYE paid YTD", value: money(latest.computation.ytd.paye) },
            { label: "Pension (you + employer)", value: money(latest.computation.ytd.pensionEmployee + latest.computation.ytd.pensionEmployer) },
            { label: "Net pay YTD", value: money(latest.computation.ytd.net), accent: "text-emerald-600" },
          ]}
        />
      )}

      {draftRun && draftNet !== undefined && (
        <Link
          href={`${ESS_PAYSLIPS_HREF}/preview/${draftRun.id}`}
          className="group flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 transition hover:bg-amber-500/10"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600"><Clock3 className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-semibold">{draftRun.period.label} pay is being prepared</p>
              <p className="text-xs text-muted-foreground">
                Estimated net pay <span className="font-semibold text-foreground">{money(draftNet)}</span> · pay day {fmt(draftRun.period.payDate)}. Figures can still change until payroll is approved.
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
        </Link>
      )}

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
          <FileText className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No payslips have been issued to you yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {shown.map((p, i) => {
            const prev = shown[i + 1];
            const delta = prev ? p.computation.net - prev.computation.net : 0;
            return (
              <Link key={p.id} href={essPayslipHref(p.id)} className="group flex items-center gap-4 border-b px-4 py-3 last:border-0 hover:bg-muted/40">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Wallet className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {p.period.label}
                    {p.runType !== "regular" && <Badge variant="outline" className="text-[10px]">{p.runType === "off_cycle" ? "Off-cycle" : "Adjustment"}</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">Paid {fmt(p.period.payDate)} · {p.reference}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Gross</p>
                  <p className="text-xs tabular-nums">{money(p.computation.gross)}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Deductions</p>
                  <p className="text-xs tabular-nums text-amber-600">{money(p.computation.totalDeductions)}</p>
                </div>
                <div className="w-36 text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Net pay</p>
                  <p className="text-sm font-semibold tabular-nums">{money(p.computation.net)}</p>
                  {prev && Math.abs(delta) >= 1 && (
                    <p className={cn("text-[10px] tabular-nums", delta > 0 ? "text-emerald-600" : "text-amber-600")}>
                      {delta > 0 ? "▲" : "▼"} {money(Math.abs(delta))}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}
    </Header>
  );
}

function Header({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Wallet className="h-6 w-6 text-primary" /> My Payslips
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every payslip issued to you, with year-to-date totals for your tax records, loan and visa applications.
          </p>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/** Self-service draft preview — the run being prepared, watermarked DRAFT. */
export function MyDraftPayslipPage({ runId }: { runId: string }) {
  const me = useAppSelector((s) => s.auth.user?.employeeId) ?? "";
  const { loading, data } = useTenantPayroll();
  const run = data?.runs.find((r) => r.id === runId);
  const visible = !!run && !!data?.settings.employeePreview && run.type === "regular" && (run.status === "in_review" || run.status === "approved");
  const draft = useDraftPayslip(runId, me);
  const payslip = visible ? draft : null;
  return (
    <div className="flex flex-col gap-5 pb-10">
      <PayslipPrintStyles />
      <div className="print:hidden">
        <Link href={ESS_PAYSLIPS_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> My payslips
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">Preview · {payslip?.period.label ?? "upcoming pay"}</h1>
        <p className="text-xs text-muted-foreground">
          A preview of the payroll being prepared. It is not final — figures can change until payroll is approved, and the issued payslip replaces it.
        </p>
      </div>
      {payslip ? (
        <div className="payslip-print-root">
          <PayslipDocument payslip={payslip} />
        </div>
      ) : loading ? (
        <Skeleton className="mx-auto h-[1000px] w-full max-w-[880px] rounded-xl" />
      ) : (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No preview is available for you on this run.</p>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { amountInWords } from "@/src/lib/payroll/amount-in-words";
import { useEmployeePayslipList } from "@/src/lib/payroll/use-payroll";
import { ytdBreakdown, ytdCtxFor } from "@/src/lib/payroll/ytd";
import { PayslipPrintStyles } from "./payslip-document";

const money = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * The employee's annual PAYE certificate: every month's pay, reliefs and tax
 * for the tax year, built only from final payslips. It's what employees need
 * for their own records, visa and loan applications, and the State IRS.
 */
export function TaxCertificatePage({ employeeId, year, backHref, backLabel }: { employeeId: string; year: number; backHref: string; backLabel: string }) {
  const me = useAppSelector((s) => s.auth.user?.employeeId);
  const country = useAppSelector((s) => s.locale.country);
  const canViewPayroll = useCan(PAYROLL_MODULE, "view");
  const allowed = !!me && (me === employeeId || canViewPayroll);
  const { payslips, loading, data } = useEmployeePayslipList(employeeId, { enabled: allowed });
  const yearSlips = useMemo(() => payslips.filter((p) => p.period.year === year), [payslips, year]);
  const latest = yearSlips[0];
  // Same rows as the payslip's YTD breakdown: each brought-forward month and each final payslip.
  const breakdown = useMemo(
    () => (data ? ytdBreakdown(data, employeeId, year, 12, ytdCtxFor(data.structures, employeeId, year)) : null),
    [data, employeeId, year],
  );

  // Nigeria-only (PAYE under the Nigeria Tax Act). Hooks above run first so
  // their order never changes between countries.
  if (country !== "ng") return <p className="py-24 text-center text-sm text-muted-foreground">Annual tax certificates are available for Nigerian tenants. UK payroll is the next statutory module.</p>;
  if (!allowed) return <p className="py-24 text-center text-sm text-muted-foreground">Tax certificates are confidential: only the employee and payroll staff can open them.</p>;
  if (loading && !latest) return <Skeleton className="mx-auto h-[900px] w-full max-w-[880px] rounded-xl" />;
  if (!latest) return <p className="py-24 text-center text-sm text-muted-foreground">No final payslips for {year} yet.</p>;

  const { company, employee } = latest;
  const accent = company.primaryColor || "#047857";
  const rows = breakdown?.rows ?? [];
  const totals = breakdown?.totals;
  // Relief totals by label, over the same rows.
  const reliefMap = new Map<string, number>();
  const add = (r: Record<string, number> | undefined) => {
    for (const [k, v] of Object.entries(r ?? {})) reliefMap.set(k, (reliefMap.get(k) ?? 0) + v);
  };
  const opening = data?.openingYtd[employeeId];
  const openingMonths = data?.openingMonths?.[employeeId]?.filter((m) => m.figures.year === year) ?? [];
  if (opening && opening.year === year && !openingMonths.length) add(opening.reliefs);
  for (const m of openingMonths) add(m.figures.reliefs);
  for (const p of yearSlips) add(p.computation.period?.reliefs);
  const reliefs = [...reliefMap.entries()].filter(([, v]) => v > 0);
  const paye = totals?.paye ?? 0;
  const monthsCovered =
    new Set(rows.filter((r) => r.source !== "brought_forward_total").map((r) => r.month)).size +
    rows.filter((r) => r.source === "brought_forward_total").reduce((n, r) => n + r.month, 0);

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PayslipPrintStyles />
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Annual tax certificate · {year}</h1>
          <p className="text-xs text-muted-foreground">PAYE deducted and remitted for {employee.fullName}, built from final payslips.</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Print / Save as PDF</Button>
      </div>

      <div className="payslip-print-root">
        <article className="payslip-paper mx-auto w-full max-w-[880px] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] print:rounded-none print:border-0 print:shadow-none">
          <div className="h-1.5" style={{ background: accent }} />
          <div className="space-y-6 px-8 py-7 print:px-6">
            <header className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <h2 className="text-[1.05rem] font-bold">{company.legalName}</h2>
                <p className="text-[0.7rem] text-slate-500">{company.address}</p>
                <p className="text-[0.66rem] text-slate-500">{[company.registrationNumber, company.taxId].filter(Boolean).join("  ·  ")}</p>
              </div>
              <div className="text-right">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>Certificate of tax deducted</p>
                <p className="text-[1.35rem] font-bold">Tax year {year}</p>
                <p className="text-[0.66rem] text-slate-500">Issued {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </header>

            <section className="grid grid-cols-2 gap-x-6 gap-y-2 text-[0.75rem] sm:grid-cols-4">
              {[
                ["Employee", employee.fullName],
                ["Employee ID", employee.employeeNumber],
                ["Tax ID (TIN)", employee.tin || "—"],
                ["Tax state", employee.stateOfResidence ? `${employee.stateOfResidence} IRS` : "—"],
                ["Job title", employee.jobTitle],
                ["Pension RSA PIN", employee.rsaPin || "—"],
                ["Pension administrator", employee.pfaName || "—"],
                ["Months covered", `${monthsCovered}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-slate-500">{k}</p>
                  <p className="font-medium">{v}</p>
                </div>
              ))}
            </section>

            <section className="rounded-lg border p-4" style={{ borderColor: `${accent}40`, background: `${accent}0d` }}>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-slate-600">PAYE deducted in {year}</p>
              <p className="mt-0.5 text-[2rem] font-bold tabular-nums" style={{ color: accent }}>{money(paye)}</p>
              <p className="text-[0.66rem] italic text-slate-600">{amountInWords(paye)}</p>
            </section>

            {/* Monthly table: full width, fixed right-aligned numeric columns wide enough for 8-figure kobo amounts. */}
            <section className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-fixed text-[0.7rem] tabular-nums">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[16%]" />
                  <col className="w-[15%]" />
                  <col className="w-[16%]" />
                  <col className="w-[15%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead className="text-slate-500">
                  <tr className="border-b border-slate-300">
                    <th className="pb-1 pr-2 text-left font-medium">Month</th>
                    <th className="whitespace-nowrap pb-1 pl-2 text-right font-medium">Gross pay</th>
                    <th className="whitespace-nowrap pb-1 pl-2 text-right font-medium">Reliefs</th>
                    <th className="whitespace-nowrap pb-1 pl-2 text-right font-medium">Chargeable</th>
                    <th className="whitespace-nowrap pb-1 pl-2 text-right font-medium">PAYE</th>
                    <th className="whitespace-nowrap pb-1 pl-2 text-right font-medium">Net pay</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className={r.source === "payslip" ? "border-b border-slate-100" : "border-b border-slate-100 text-slate-600"}>
                      <td className="py-1 pr-2">
                        {r.label}
                        {r.source !== "payslip" && <span className="block text-[0.58rem] text-slate-400">brought forward</span>}
                      </td>
                      <td className="whitespace-nowrap py-1 pl-2 text-right">{money(r.gross)}</td>
                      <td className="whitespace-nowrap py-1 pl-2 text-right">{money(r.reliefs)}</td>
                      <td className="whitespace-nowrap py-1 pl-2 text-right">{money(r.chargeable)}</td>
                      <td className="whitespace-nowrap py-1 pl-2 text-right">{money(r.paye)}</td>
                      <td className="whitespace-nowrap py-1 pl-2 text-right">{money(r.net)}</td>
                    </tr>
                  ))}
                  {totals && (
                    <tr className="border-t-2 border-slate-800 font-bold">
                      <td className="pt-1 pr-2">Total {year}</td>
                      <td className="whitespace-nowrap pt-1 pl-2 text-right">{money(totals.gross)}</td>
                      <td className="whitespace-nowrap pt-1 pl-2 text-right">{money(totals.reliefs)}</td>
                      <td className="whitespace-nowrap pt-1 pl-2 text-right">{money(totals.chargeable)}</td>
                      <td className="whitespace-nowrap pt-1 pl-2 text-right">{money(totals.paye)}</td>
                      <td className="whitespace-nowrap pt-1 pl-2 text-right">{money(totals.net)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Reliefs and contributions: their own block below the table, never beside it. */}
            <section className="grid gap-6 sm:grid-cols-2 print:grid-cols-2">
              <div className="text-[0.7rem]">
                <p className="mb-1 border-b border-slate-200 pb-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-slate-500">Reliefs allowed</p>
                {reliefs.map(([k, v]) => (
                  <Row key={k} label={k} value={money(v)} />
                ))}
                <Row label="Total reliefs" value={money(reliefs.reduce((s, [, v]) => s + v, 0))} strong />
              </div>
              <div className="text-[0.7rem]">
                <p className="mb-1 border-b border-slate-200 pb-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-slate-500">Contributions &amp; net pay</p>
                <Row label="Pension — you" value={money(totals?.pensionEmployee ?? 0)} />
                <Row label="Voluntary pension — you" value={money(totals?.voluntaryPension ?? 0)} />
                <Row label="Pension — employer" value={money(totals?.pensionEmployer ?? 0)} />
                <Row label="National Housing Fund" value={money(totals?.nhf ?? 0)} />
                <Row label="Net pay received" value={money(totals?.net ?? 0)} strong />
              </div>
            </section>

            <footer className="border-t border-slate-200 pt-3 text-[0.6rem] leading-relaxed text-slate-500">
              We certify that the tax shown was deducted from the employee&apos;s emoluments under the Nigeria Tax Act 2025 and remitted to the{" "}
              {employee.stateOfResidence || "State"} Internal Revenue Service. Figures are taken from the employee&apos;s final payslips; each payslip can be verified with its own code.
              Computer-generated via MOTEE — valid without a signature.
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "mt-1 flex justify-between gap-4 border-t border-slate-200 pt-1 font-semibold" : "flex justify-between gap-4 py-0.5"}>
      <span className={strong ? "min-w-0" : "min-w-0 text-slate-600"}>{label}</span>
      <span className="shrink-0 whitespace-nowrap tabular-nums">{value}</span>
    </div>
  );
}

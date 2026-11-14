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
import { sumYtd } from "@/src/lib/payroll/ng/engine";
import { useEmployeePayslipList } from "@/src/lib/payroll/use-payroll";
import { PayslipPrintStyles } from "./payslip-document";

const money = (n: number) => `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * The employee's annual PAYE certificate: every month's pay, reliefs and tax
 * for the tax year, built only from final payslips. It's what employees need
 * for their own records, visa and loan applications, and the State IRS.
 */
export function TaxCertificatePage({ employeeId, year, backHref, backLabel }: { employeeId: string; year: number; backHref: string; backLabel: string }) {
  const me = useAppSelector((s) => s.auth.user?.employeeId);
  const canViewPayroll = useCan(PAYROLL_MODULE, "view");
  const allowed = !!me && (me === employeeId || canViewPayroll);
  const { payslips, loading, data } = useEmployeePayslipList(employeeId, { enabled: allowed });
  const yearSlips = useMemo(() => payslips.filter((p) => p.period.year === year), [payslips, year]);
  const latest = yearSlips[0];
  const opening = data?.openingYtd[employeeId];
  const ytd = useMemo(() => sumYtd(year, yearSlips.map((p) => p.computation.period).filter(Boolean), opening), [year, yearSlips, opening]);

  if (!allowed) return <p className="py-24 text-center text-sm text-muted-foreground">Tax certificates are confidential: only the employee and payroll staff can open them.</p>;
  if (loading && !latest) return <Skeleton className="mx-auto h-[900px] w-full max-w-[880px] rounded-xl" />;
  if (!latest) return <p className="py-24 text-center text-sm text-muted-foreground">No final payslips for {year} yet.</p>;

  const byMonth = new Map<number, { gross: number; reliefs: number; chargeable: number; paye: number; net: number }>();
  for (const p of yearSlips) {
    const f = p.computation.period;
    if (!f) continue;
    const row = byMonth.get(f.month) ?? { gross: 0, reliefs: 0, chargeable: 0, paye: 0, net: 0 };
    row.gross += f.gross;
    row.reliefs += Object.values(f.reliefs).reduce((s, v) => s + v, 0);
    row.chargeable += f.chargeable;
    row.paye += f.paye;
    row.net += f.net;
    byMonth.set(f.month, row);
  }
  const { company, employee } = latest;
  const accent = company.primaryColor || "#047857";
  const reliefs = Object.entries(ytd.reliefs).filter(([, v]) => v > 0);

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
                ["Months covered", `${byMonth.size + (opening && opening.year === year ? opening.months : 0)}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-slate-500">{k}</p>
                  <p className="font-medium">{v}</p>
                </div>
              ))}
            </section>

            <section className="rounded-lg border p-4" style={{ borderColor: `${accent}40`, background: `${accent}0d` }}>
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-slate-600">PAYE deducted in {year}</p>
              <p className="mt-0.5 text-[2rem] font-bold tabular-nums" style={{ color: accent }}>{money(ytd.paye)}</p>
              <p className="text-[0.66rem] italic text-slate-600">{amountInWords(ytd.paye)}</p>
            </section>

            <section className="grid gap-6 md:grid-cols-[1.4fr_1fr] print:grid-cols-[1.4fr_1fr]">
              <table className="w-full text-[0.7rem] tabular-nums">
                <thead className="text-slate-500">
                  <tr className="border-b border-slate-200">
                    <th className="pb-1 text-left font-medium">Month</th>
                    <th className="pb-1 text-right font-medium">Gross</th>
                    <th className="pb-1 text-right font-medium">Reliefs</th>
                    <th className="pb-1 text-right font-medium">Chargeable</th>
                    <th className="pb-1 text-right font-medium">PAYE</th>
                  </tr>
                </thead>
                <tbody>
                  {opening && opening.year === year && opening.months > 0 && (
                    <tr className="border-b border-slate-100 text-slate-500">
                      <td className="py-1">Jan–{MONTHS[opening.months - 1]} (brought forward)</td>
                      <td className="py-1 text-right">{money(opening.gross)}</td>
                      <td className="py-1 text-right">{money(Object.values(opening.reliefs ?? {}).reduce((s, v) => s + v, 0))}</td>
                      <td className="py-1 text-right">{money(opening.chargeable)}</td>
                      <td className="py-1 text-right">{money(opening.paye)}</td>
                    </tr>
                  )}
                  {[...byMonth.entries()].sort((a, b) => a[0] - b[0]).map(([m, r]) => (
                    <tr key={m} className="border-b border-slate-100">
                      <td className="py-1">{MONTHS[m - 1]} {year}</td>
                      <td className="py-1 text-right">{money(r.gross)}</td>
                      <td className="py-1 text-right">{money(r.reliefs)}</td>
                      <td className="py-1 text-right">{money(r.chargeable)}</td>
                      <td className="py-1 text-right">{money(r.paye)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-800 font-bold">
                    <td className="pt-1">Total {year}</td>
                    <td className="pt-1 text-right">{money(ytd.gross)}</td>
                    <td className="pt-1 text-right">{money(reliefs.reduce((s, [, v]) => s + v, 0))}</td>
                    <td className="pt-1 text-right">{money(ytd.chargeable)}</td>
                    <td className="pt-1 text-right">{money(ytd.paye)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="space-y-1 text-[0.7rem]">
                <p className="mb-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-slate-500">Reliefs allowed</p>
                {reliefs.map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-slate-600">{k}</span><span className="tabular-nums">{money(v)}</span></div>
                ))}
                <div className="mt-3 flex justify-between border-t pt-1"><span className="text-slate-600">Pension — you</span><span className="tabular-nums">{money(ytd.pensionEmployee)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Pension — employer</span><span className="tabular-nums">{money(ytd.pensionEmployer)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">National Housing Fund</span><span className="tabular-nums">{money(ytd.nhf)}</span></div>
                <div className="flex justify-between font-semibold"><span>Net pay received</span><span className="tabular-nums">{money(ytd.net)}</span></div>
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

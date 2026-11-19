"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileSpreadsheet, Printer } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import type { RemittanceItem } from "@/src/lib/payroll/exports";
import { REMITTANCE_ITEMS, downloadRemittanceSchedule, lockedRunsByMonth, remittanceStatement } from "@/src/lib/payroll/remittances";
import { companySnapshot } from "@/src/lib/payroll/run-builder";
import { usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { cn } from "@/src/lib/utils";
import { NotSupported, fmtDate, money } from "./components/shared";

/**
 * A printable remittance statement (what's owed to one authority for a pay
 * month, with the per-employee schedule) or, once the payment is recorded, the
 * remittance receipt. "Print / Save as PDF" uses the browser, like payslips.
 */
export function RemittanceStatementPage({ month }: { month: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const item = (REMITTANCE_ITEMS.includes(search.get("item") as RemittanceItem) ? search.get("item") : "paye") as RemittanceItem;
  const doc = search.get("doc") === "receipt" ? "receipt" : "statement";
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();

  const people = useMemo(() => new Map((bundle?.employees ?? []).map((e) => [e.id, e])), [bundle]);
  const profiles = useMemo(() => new Map((data?.profiles ?? []).map((p) => [p.employeeId, p])), [data]);
  const runs = useMemo(() => (data ? lockedRunsByMonth(data.runs).get(month) ?? [] : []), [data, month]);
  const st = useMemo(() => remittanceStatement(item, runs, { people, profiles, settings: data?.settings }), [item, runs, people, profiles, data]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data) return <Skeleton className="h-150 w-full rounded-xl" />;
  if (!st) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        No finalized pay for {month}. <Link href={PAYROLL_HREF} className="text-primary hover:underline">Back to payroll</Link>
      </p>
    );
  }

  const company = bundle ? companySnapshot(bundle) : null;
  const record = data.remittances?.[`${month}:${item}`];
  // Only a CONFIRMED payment is evidence. A payment instruction (submitted) is not.
  const paid = record && record.status !== "submitted" ? record : undefined;
  const isReceipt = doc === "receipt" && !!paid;
  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(search.toString());
    p.set(k, v);
    router.replace(`?${p.toString()}`);
  };
  const print = () => {
    const previous = document.title;
    document.title = `${st.title} ${isReceipt ? "payment confirmation" : "liability statement"} ${st.monthLabel}`;
    window.addEventListener("afterprint", () => (document.title = previous), { once: true });
    actions.logExport("", `${st.title} ${isReceipt ? "payment confirmation" : "liability statement"} — ${st.monthLabel}`);
    window.print();
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          html, body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .remit-paper, .remit-paper * { visibility: visible !important; }
          .remit-paper { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: 0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .remit-paper tr { break-inside: avoid; }
        }
      `}</style>

      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <Link href={`${PAYROLL_HREF}?tab=remittances`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Statutory remittances
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">
            {st.title} · {st.monthLabel}
          </h1>
          <p className="text-xs text-muted-foreground">
            {isReceipt ? "Payment confirmation — built from the recorded payment reference and bank receipt." : "Liability statement — the amount due and the per-employee schedule. It is not proof of payment."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-0.5 text-xs">
            {REMITTANCE_ITEMS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setParam("item", k)}
                className={cn("rounded-md px-2.5 py-1 uppercase", k === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {k}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border p-0.5 text-xs">
            <button type="button" onClick={() => setParam("doc", "statement")} className={cn("rounded-md px-2.5 py-1", !isReceipt ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              Liability statement
            </button>
            <button
              type="button"
              disabled={!paid}
              title={paid ? undefined : "Record the payment first"}
              onClick={() => setParam("doc", "receipt")}
              className={cn("rounded-md px-2.5 py-1 disabled:opacity-40", isReceipt ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              Payment confirmation
            </button>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" disabled={!st.contributors} onClick={() => downloadRemittanceSchedule(st, "xlsx")}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> Schedule (XLSX)
          </Button>
          <Button size="sm" className="gap-1.5" onClick={print}>
            <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <article className="remit-paper mx-auto w-full max-w-[210mm] rounded-xl border bg-white p-8 text-[12px] text-neutral-900 shadow-sm">
        <header className="flex items-start justify-between gap-6 border-b pb-5" style={{ borderColor: company?.primaryColor }}>
          <div className="flex items-center gap-3">
            {company?.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt="" className="h-10 w-auto" />
            )}
            <div>
              <p className="text-base font-semibold">{company?.legalName}</p>
              <p className="text-[11px] text-neutral-500">{company?.address}</p>
              {company?.taxId && (
                <p className="text-[11px] text-neutral-500">
                  {/^tin/i.test(company.taxId) ? company.taxId : `TIN ${company.taxId}`}
                  {company.registrationNumber && ` · ${/^rc/i.test(company.registrationNumber) ? company.registrationNumber : `RC ${company.registrationNumber}`}`}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">{isReceipt ? "Payment confirmation" : "Liability statement — not proof of payment"}</p>
            <p className="text-lg font-semibold">{st.title}</p>
            <p className="text-[11px] text-neutral-500">Pay month {st.monthLabel}</p>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Payable to" value={st.to} />
          <Field label="Due date" value={fmtDate(st.due)} />
          <Field label="Contributors" value={String(st.contributors)} />
          <Field label={isReceipt ? "Amount remitted" : "Amount due"} value={money(isReceipt ? paid?.amountPaid ?? st.total : st.total)} strong />
        </section>
        <p className="mt-2 text-[11px] text-neutral-500">{st.basis}. Covers {st.runs.map((r) => r.title).join(", ")}.</p>

        <section
          className={cn(
            "mt-5 rounded-lg border px-4 py-3",
            paid ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900",
          )}
        >
          {paid ? (
            <p>
              <span className="font-semibold">{paid.status === "reconciled" ? "Paid and reconciled" : "Paid"}</span> on {fmtDate(paid.date)} · payment reference <span className="font-mono font-semibold">{paid.reference}</span> · recorded by {paid.by} on {fmtDate(paid.at)}
              {paid.receipt ? ` · bank receipt on file (${paid.receipt.fileName})` : " · bank receipt not yet uploaded"}
              {paid.amountPaid !== undefined && paid.amountPaid < st.total - 0.5 ? ` · ${money(st.total - paid.amountPaid)} still outstanding` : ""}
            </p>
          ) : record?.status === "submitted" ? (
            <p>
              <span className="font-semibold">Payment instruction sent</span> on {fmtDate(record.date)} (ref {record.reference}) — not yet confirmed. This statement is not proof of payment.
            </p>
          ) : (
            <p>
              <span className="font-semibold">Not yet remitted.</span> Pay {money(st.total)} to {st.to} by {fmtDate(st.due)}, then record the payment reference in Payroll → Statutory Remittances.
            </p>
          )}
        </section>

        {st.groups.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Summary by payee</h2>
            <table className="w-full">
              <thead className="border-b text-left text-[10px] uppercase text-neutral-500">
                <tr>
                  <th className="py-1.5 font-medium">Payee</th>
                  <th className="py-1.5 font-medium">Employer reference</th>
                  <th className="py-1.5 text-right font-medium">Employees</th>
                  <th className="py-1.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {st.groups.map((g) => (
                  <tr key={g.name} className="border-b border-neutral-100">
                    <td className="py-1.5">{g.name}</td>
                    <td className="py-1.5 font-mono text-[11px]">{g.reference || "—"}</td>
                    <td className="py-1.5 text-right tabular-nums">{g.count}</td>
                    <td className="py-1.5 text-right tabular-nums">{money(g.amount)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-1.5" colSpan={2}>Total</td>
                  <td className="py-1.5 text-right tabular-nums">{st.contributors}</td>
                  <td className="py-1.5 text-right tabular-nums">{money(st.total)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Schedule</h2>
          {st.contributors === 0 ? (
            <p className="text-neutral-500">Nothing is due for this remittance this month.</p>
          ) : (
            <table className="w-full text-[11px]">
              <thead className="border-b text-left text-[10px] uppercase text-neutral-500">
                <tr>
                  {st.table.headers.map((h, i) => (
                    <th key={h} className={cn("py-1.5 pr-2 font-medium", typeof st.table.data[0]?.[i] === "number" && "text-right")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {st.table.data.map((row, r) => (
                  <tr key={r} className="border-b border-neutral-100">
                    {row.map((c, i) => (
                      <td key={i} className={cn("py-1 pr-2", typeof c === "number" && "text-right tabular-nums")}>{typeof c === "number" ? money(c) : c}</td>
                    ))}
                  </tr>
                ))}
                {(st.table.trailer ?? []).map((row, r) => (
                  <tr key={`t${r}`} className="font-semibold">
                    {row.map((c, i) => (
                      <td key={i} className={cn("py-1.5 pr-2", typeof c === "number" && "text-right tabular-nums")}>{typeof c === "number" ? money(c) : c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <footer className="mt-8 flex justify-between border-t pt-3 text-[10px] text-neutral-500">
          <span>Generated {fmtDate(new Date().toISOString())} from the finalized payroll</span>
          <span>{company?.tradingName}</span>
        </footer>
      </article>
    </div>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className={cn("tabular-nums", strong ? "text-base font-semibold" : "font-medium")}>{value}</p>
    </div>
  );
}

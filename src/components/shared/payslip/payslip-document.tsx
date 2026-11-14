"use client";

import { useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import {
  CalendarCheck2,
  Landmark,
  PiggyBank,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { amountInWords } from "@/src/lib/payroll/amount-in-words";
import { ELEMENT_GROUP_LABELS, ELEMENT_GROUP_ORDER } from "@/src/lib/payroll/elements-seed";
import { verifyHref } from "@/src/lib/payroll/constants";
import type { Payslip, PayslipInsight, PayslipLine } from "@/src/lib/payroll/types";
import { PayslipQr } from "./payslip-qr";

/**
 * The payslip — one generator for every pathway. It renders whatever line
 * items the payslip carries and never asks whether they were calculated or
 * uploaded.
 *
 * Always drawn on "paper" (white, slate ink) whatever the app theme, because
 * it is a document: what's on screen is what prints. Sized for one A4 page;
 * the print stylesheet in `PayslipPrintStyles` shrinks the root font so the
 * whole slip fits.
 */

const money = (n: number) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const whole = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
const fmtDate = (iso: string) =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

function serviceLength(start: string, asOf: string): string {
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${asOf}T00:00:00Z`);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months -= 1;
  if (months < 1) return "Under 1 month";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} yr${y === 1 ? "" : "s"}` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
}

/** Mix the brand colour with white for tints that still print in greyscale. */
function tint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const noopSubscribe = () => () => {};

// ── Small building blocks ───────────────────────────────────────────────────

function Label({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-slate-500", className)}>{children}</p>;
}

function Field({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <p className={cn("mt-0.5 truncate text-[0.75rem] font-medium text-slate-900", mono && "font-mono tracking-tight")}>{value || "—"}</p>
    </div>
  );
}

function SectionTitle({ children, right, accent }: { children: ReactNode; right?: ReactNode; accent: string }) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3 border-b border-slate-200 pb-1.5">
      <h3 className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-slate-800">
        <span className="inline-block h-3 w-1 rounded-full" style={{ background: accent }} />
        {children}
      </h3>
      {right}
    </div>
  );
}

function LineRow({ line, negative }: { line: PayslipLine; negative?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-[0.3rem]">
      <div className="min-w-0">
        <p className="text-[0.75rem] leading-tight text-slate-800">{line.name}</p>
        {line.note && <p className="mt-0.5 text-[0.62rem] leading-tight text-slate-500">{line.note}</p>}
      </div>
      <p className={cn("shrink-0 text-[0.75rem] tabular-nums text-slate-900", negative && "text-slate-700")}>
        {money(line.amount)}
      </p>
    </div>
  );
}

function GroupedLines({ lines, groupLabels = true }: { lines: PayslipLine[]; groupLabels?: boolean }) {
  const groups = ELEMENT_GROUP_ORDER.map((g) => ({ g, items: lines.filter((l) => l.group === g) })).filter((x) => x.items.length);
  return (
    <div className="divide-y divide-slate-100">
      {groups.map(({ g, items }) => (
        <div key={g} className="py-1">
          {groupLabels && groups.length > 1 && <p className="pt-1 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-slate-400">{ELEMENT_GROUP_LABELS[g]}</p>}
          {items.map((l, i) => (
            <LineRow key={`${l.code}-${i}`} line={l} />
          ))}
        </div>
      ))}
    </div>
  );
}

const INSIGHT_ICON: Record<PayslipInsight["type"], typeof Sparkles> = {
  net_change: TrendingUp,
  deduction_split: Scale,
  tax_progress: Landmark,
  pension_growth: PiggyBank,
  leave_nudge: CalendarCheck2,
};

// ── The document ────────────────────────────────────────────────────────────

export interface PayslipDocumentProps {
  payslip: Payslip;
  className?: string;
  /** Absolute origin for the QR link (defaults to the current site). */
  origin?: string;
}

export function PayslipDocument({ payslip, className, origin }: PayslipDocumentProps) {
  const { company, employee, computation: c, attendance, period, display } = payslip;
  const accent = /^#[0-9a-f]{3,6}$/i.test(company.primaryColor) ? company.primaryColor : "#047857";
  const browserOrigin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
  const site = origin ?? browserOrigin;
  const verifyUrl = `${site}${verifyHref(payslip.verification.code)}`;

  const earnings = c.lines.filter((l) => l.category === "earning");
  const deductions = c.lines.filter((l) => l.category === "deduction");
  const STAT_ORDER = ["PAYE", "WHT", "PENSION_EE", "VOL_PENSION", "NHF", "NHIS_EE"];
  const statutory = deductions
    .filter((l) => l.statutory || l.group === "statutory")
    .sort((a, b) => (STAT_ORDER.indexOf(a.code) + 99) % 99 - (STAT_ORDER.indexOf(b.code) + 99) % 99);
  const other = deductions.filter((l) => !(l.statutory || l.group === "statutory"));
  const employer = c.lines.filter((l) => l.category === "employer");

  const tax = c.lines.filter((l) => l.code === "PAYE" || l.code === "WHT").reduce((s, l) => s + l.amount, 0);
  const pension = c.lines.filter((l) => l.code === "PENSION_EE" || l.code === "VOL_PENSION").reduce((s, l) => s + l.amount, 0);
  const otherDed = Math.max(0, c.totalDeductions - tax - pension);
  const share = (n: number) => (c.gross > 0 ? Math.max(0, n / c.gross) : 0);
  const split = [
    { label: "Take-home", value: c.net, color: accent },
    { label: "Tax", value: tax, color: "#334155" },
    { label: "Pension", value: pension, color: "#64748b" },
    { label: "Other", value: otherDed, color: "#cbd5e1" },
  ].filter((s) => s.value > 0);

  const draft = payslip.status === "draft";
  const t = c.tax;
  const showTax = display.showTaxBreakdown && t.regime === "paye" && !t.exemptReason?.startsWith("PAYE as uploaded");
  // Cumulative payslips show the to-date calculation, which reconciles exactly
  // with this month's PAYE (including bonus months). Annualised ones show the year.
  const cumulative = t.method === "cumulative" || payslip.runType !== "regular";
  const steps = cumulative
    ? {
        taxable: { label: `Taxable pay to date (${t.monthOfYear} month${t.monthOfYear === 1 ? "" : "s"})`, value: t.taxableToDate },
        reliefs: t.reliefs.map((r) => ({ label: r.label, value: r.toDate })),
        chargeable: { label: "Chargeable income to date", value: t.cumulativeChargeable },
        bands: t.bandsToDate,
        bandsTitle: `Bands to date (${t.monthOfYear}/12 of the year)`,
        totalLabel: "Tax due to date",
        total: t.taxDueToDate,
      }
    : {
        taxable: { label: "Taxable pay (× 12)", value: t.periodTaxableGross * 12 },
        reliefs: t.reliefs.map((r) => ({ label: r.label, value: r.annual })),
        chargeable: { label: "Chargeable income", value: t.annualisedChargeable },
        bands: t.bands,
        bandsTitle: "Annual bands",
        totalLabel: "Annual tax",
        total: t.annualisedTax,
      };
  // Reliefs already taken through earlier payslips appear on the to-date side even when 0 this month.
  const reliefTotal = steps.reliefs.reduce((s, r) => s + r.value, 0);
  const NetIcon = payslip.insights.find((i) => i.type === "net_change")?.tone === "attention" ? TrendingDown : TrendingUp;

  return (
    <article
      className={cn(
        "payslip-paper relative isolate mx-auto w-full max-w-[880px] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_12px_40px_-12px_rgba(15,23,42,0.18)] print:max-w-none print:rounded-none print:border-0 print:shadow-none",
        className,
      )}
      style={{ "--slip-accent": accent } as CSSProperties}
      aria-label={`Payslip for ${employee.fullName}, ${period.label}`}
    >
      {/* Security background: faint guilloche-like pattern + diagonal draft mark */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${accent} 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, ${accent} 0 1px, transparent 1px 9px)`,
        }}
      />
      {draft && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <p className="rotate-[-24deg] select-none text-[6rem] font-black tracking-[0.2em] text-rose-500/10">DRAFT</p>
        </div>
      )}

      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${accent}, ${tint(accent, 0.55)})` }} />

      <div className="px-8 pb-6 pt-6 print:px-6">
        {/* ── Header ───────────────────────────────────────────── */}
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-3.5">
            <CompanyMark name={company.tradingName} logoUrl={company.logoUrl} accent={accent} />
            <div className="min-w-0">
              <h1 className="text-[1.05rem] font-bold leading-tight text-slate-900">{company.legalName}</h1>
              <p className="mt-0.5 max-w-[22rem] text-[0.68rem] leading-snug text-slate-500">{company.address}</p>
              <p className="mt-1 text-[0.62rem] font-medium text-slate-500">
                {[company.registrationNumber, company.taxId].filter(Boolean).join("  ·  ")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>
              {payslip.runType === "regular" ? "Payslip" : payslip.runType === "off_cycle" ? "Off-cycle payslip" : "Adjustment payslip"}
            </p>
            <p className="mt-0.5 text-[1.35rem] font-bold leading-tight tracking-tight text-slate-900">{period.label}</p>
            <dl className="mt-2 grid grid-cols-[auto_auto] justify-end gap-x-3 gap-y-0.5 text-[0.66rem]">
              <dt className="text-slate-500">Pay period</dt>
              <dd className="text-right font-medium text-slate-800">{fmtDate(period.start)} – {fmtDate(period.end)}</dd>
              <dt className="text-slate-500">Pay date</dt>
              <dd className="text-right font-medium text-slate-800">{fmtDate(period.payDate)}</dd>
              <dt className="text-slate-500">Reference</dt>
              <dd className="text-right font-mono font-medium text-slate-800">{payslip.reference}</dd>
            </dl>
          </div>
        </header>

        {/* ── Net pay hero ─────────────────────────────────────── */}
        <section
          className="mt-5 grid gap-4 rounded-lg border p-4 sm:grid-cols-[1.25fr_1fr] print:grid-cols-[1.25fr_1fr]"
          style={{ background: tint(accent, 0.05), borderColor: tint(accent, 0.22) }}
        >
          <div className="min-w-0">
            <Label className="text-slate-600">Net pay</Label>
            <p className="mt-0.5 text-[2.1rem] font-bold leading-none tracking-tight tabular-nums" style={{ color: accent }}>
              {money(c.net)}
            </p>
            <p className="mt-1.5 text-[0.66rem] italic leading-snug text-slate-600">{amountInWords(c.net)}</p>
            <p className="mt-2 flex items-center gap-1.5 text-[0.66rem] text-slate-600">
              <Landmark className="h-3 w-3" />
              Paid to <span className="font-semibold text-slate-800">{employee.bankName || "—"}</span>
              <span className="font-mono">{employee.accountMasked}</span>
              on {fmtDate(period.payDate)}
            </p>
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex items-baseline justify-between text-[0.66rem] text-slate-600">
              <span>Gross pay <span className="font-semibold tabular-nums text-slate-900">{money(c.gross)}</span></span>
              <span>You keep <span className="font-semibold text-slate-900">{pct(share(c.net))}</span></span>
            </div>
            <div className="mt-1.5 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              {split.map((s) => (
                <span key={s.label} style={{ width: `${share(s.value) * 100}%`, background: s.color }} className="h-full" />
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
              {split.map((s) => (
                <div key={s.label} className="flex items-center justify-between gap-2 text-[0.62rem]">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="tabular-nums text-slate-800">{whole(s.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Employee ─────────────────────────────────────────── */}
        <section className="mt-5 grid grid-cols-2 gap-x-5 gap-y-2.5 sm:grid-cols-4 print:grid-cols-4">
          <Field label="Employee" value={employee.fullName} />
          <Field label="Employee ID" value={employee.employeeNumber} mono />
          <Field label="Job title" value={employee.jobTitle} />
          <Field label="Department" value={employee.departmentName} />
          <Field label="Grade" value={employee.grade} />
          <Field label="Employment type" value={employee.employmentType} />
          <Field label="Date joined" value={fmtDate(employee.startDate)} />
          <Field label="Length of service" value={serviceLength(employee.startDate, period.end)} />
          <Field label="Tax ID (TIN)" value={employee.tin} mono />
          <Field label="Pension RSA PIN" value={employee.rsaPin} mono />
          <Field label="Pension administrator" value={employee.pfaName} />
          <Field label="Tax state" value={employee.stateOfResidence ? `${employee.stateOfResidence} IRS` : ""} />
        </section>

        {/* ── Attendance ───────────────────────────────────────── */}
        <section className="mt-4 grid grid-cols-5 divide-x divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/70">
          {[
            ["Working days", attendance.workingDays],
            ["Days worked", attendance.daysWorked],
            ["Paid leave", attendance.paidLeaveDays],
            ["Unpaid leave", attendance.unpaidLeaveDays],
            ["Overtime hrs", attendance.overtimeHours],
          ].map(([k, v]) => (
            <div key={k} className="px-3 py-2 text-center">
              <p className="text-[0.95rem] font-semibold tabular-nums text-slate-900">{v}</p>
              <p className="text-[0.58rem] uppercase tracking-[0.06em] text-slate-500">{k}</p>
            </div>
          ))}
        </section>

        {/* ── Earnings | Deductions ────────────────────────────── */}
        <section className="mt-5 grid gap-6 md:grid-cols-2 print:grid-cols-2">
          <div className="flex flex-col">
            <SectionTitle accent={accent}>Earnings</SectionTitle>
            <div className="flex-1">
              <GroupedLines lines={earnings} />
            </div>
            <div className="mt-1 flex items-center justify-between border-t-2 border-slate-800 pt-1.5">
              <p className="text-[0.75rem] font-bold text-slate-900">Gross pay</p>
              <p className="text-[0.8rem] font-bold tabular-nums text-slate-900">{money(c.gross)}</p>
            </div>
          </div>
          <div className="flex flex-col">
            <SectionTitle accent="#475569">Deductions</SectionTitle>
            <div className="flex-1 divide-y divide-slate-100">
              {statutory.length > 0 && (
                <div className="py-1">
                  <p className="pt-1 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-slate-400">Statutory</p>
                  {statutory.map((l, i) => <LineRow key={`${l.code}-${i}`} line={l} negative />)}
                </div>
              )}
              {other.length > 0 && (
                <div className="py-1">
                  <p className="pt-1 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-slate-400">Other deductions</p>
                  {other.map((l, i) => <LineRow key={`${l.code}-${i}`} line={l} negative />)}
                </div>
              )}
              {deductions.length === 0 && <p className="py-2 text-[0.7rem] text-slate-500">No deductions this period.</p>}
            </div>
            <div className="mt-1 flex items-center justify-between border-t-2 border-slate-800 pt-1.5">
              <p className="text-[0.75rem] font-bold text-slate-900">Total deductions</p>
              <p className="text-[0.8rem] font-bold tabular-nums text-slate-900">{money(c.totalDeductions)}</p>
            </div>
          </div>
        </section>

        {/* ── Tax computation & YTD ────────────────────────────── */}
        <section className={cn("mt-5 grid gap-6", showTax ? "md:grid-cols-[1.35fr_1fr] print:grid-cols-[1.35fr_1fr]" : "")}>
          {showTax && (
            <div>
              <SectionTitle accent={accent} right={<span className="text-[0.6rem] text-slate-500">Effective rate {t.effectiveRatePct.toFixed(1)}% of gross</span>}>
                How your tax was calculated
              </SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 print:grid-cols-2">
                <div className="space-y-[0.2rem] text-[0.66rem]">
                  <TaxStep label={steps.taxable.label} value={whole(steps.taxable.value)} />
                  {steps.reliefs.map((r) => (
                    <TaxStep key={r.label} label={`− ${r.label}`} value={whole(r.value)} muted />
                  ))}
                  {steps.reliefs.length > 0 && <TaxStep label="Total reliefs" value={`− ${whole(reliefTotal)}`} muted />}
                  <TaxStep label={steps.chargeable.label} value={whole(steps.chargeable.value)} strong />
                </div>
                <div>
                  <table className="w-full text-[0.62rem]">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="pb-1 text-left font-medium">{steps.bandsTitle}</th>
                        <th className="pb-1 text-right font-medium">Rate</th>
                        <th className="pb-1 text-right font-medium">Tax</th>
                      </tr>
                    </thead>
                    <tbody className="tabular-nums">
                      {steps.bands.map((b) => (
                        <tr key={b.label} className={cn("border-t border-slate-100", b.taxable === 0 && "text-slate-400")}>
                          <td className="py-[0.15rem] pr-2">{b.label}</td>
                          <td className="py-[0.15rem] text-right">{Math.round(b.rate * 100)}%</td>
                          <td className="py-[0.15rem] text-right">{whole(b.tax)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-slate-300 font-semibold text-slate-900">
                        <td className="pt-1" colSpan={2}>{steps.totalLabel}</td>
                        <td className="pt-1 text-right">{whole(steps.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="mt-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-[0.62rem] leading-snug text-slate-600">
                {t.exemptReason ? (
                  t.exemptReason
                ) : cumulative ? (
                  <>
                    Cumulative method, tax month {t.monthOfYear}: tax due to date <b className="tabular-nums">{money(t.taxDueToDate)}</b> − already paid{" "}
                    <b className="tabular-nums">{money(t.taxPaidBefore)}</b> = <b className="tabular-nums text-slate-900">{money(t.taxThisPeriod)}</b> {t.taxThisPeriod < 0 ? "refunded" : "this month"}.
                  </>
                ) : (
                  <>Annual tax {whole(t.annualisedTax)} ÷ 12 = <b className="tabular-nums text-slate-900">{money(t.taxThisPeriod)}</b> this month.</>
                )}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <SectionTitle accent={accent}>Year to date · {period.year}</SectionTitle>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 print:grid-cols-3">
                <Field label="Gross" value={<span className="tabular-nums">{whole(c.ytd.gross)}</span>} />
                <Field label="PAYE" value={<span className="tabular-nums">{whole(c.ytd.paye)}</span>} />
                <Field label="Net pay" value={<span className="tabular-nums">{whole(c.ytd.net)}</span>} />
                <Field label="Pension (you)" value={<span className="tabular-nums">{whole(c.ytd.pensionEmployee)}</span>} />
                <Field label="Pension (employer)" value={<span className="tabular-nums">{whole(c.ytd.pensionEmployer)}</span>} />
                <Field label="NHF" value={<span className="tabular-nums">{whole(c.ytd.nhf)}</span>} />
              </div>
            </div>

            {display.showEmployerContributions && employer.length > 0 && (
              <div>
                <SectionTitle accent="#94a3b8" right={<span className="text-[0.6rem] tabular-nums text-slate-500">{money(c.employerCost)}</span>}>
                  Paid by your employer
                </SectionTitle>
                <div className="space-y-[0.15rem]">
                  {employer.map((l) => (
                    <div key={l.code} className="flex justify-between text-[0.66rem]">
                      <span className="text-slate-600">{l.name}</span>
                      <span className="tabular-nums text-slate-800">{money(l.amount)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-[0.58rem] italic text-slate-500">Not deducted from your pay — shown for transparency.</p>
              </div>
            )}

            {display.showLeaveBalance && payslip.leave && (
              <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <div>
                  <Label>Annual leave balance</Label>
                  <p className="text-[0.66rem] text-slate-600">
                    {payslip.leave.used} of {payslip.leave.entitlement} days used
                  </p>
                </div>
                <p className="text-[1.1rem] font-bold tabular-nums" style={{ color: accent }}>
                  {payslip.leave.remaining}
                  <span className="ml-1 text-[0.6rem] font-medium text-slate-500">days left</span>
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Insights ─────────────────────────────────────────── */}
        {payslip.insights.length > 0 && (
          <section className="mt-5">
            <SectionTitle accent={accent} right={<span className="text-[0.58rem] text-slate-400">Generated with this payslip</span>}>
              <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Your pay at a glance</span>
            </SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 print:grid-cols-2">
              {payslip.insights.map((ins) => {
                const Icon = ins.type === "net_change" ? NetIcon : INSIGHT_ICON[ins.type];
                return (
                  <div key={ins.type} className="flex gap-2.5 rounded-md border border-slate-200 bg-white px-3 py-2">
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                      style={{ background: tint(ins.tone === "attention" ? "#d97706" : accent, 0.12), color: ins.tone === "attention" ? "#b45309" : accent }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.7rem] font-semibold leading-tight text-slate-900">{ins.title}</p>
                      <p className="mt-0.5 text-[0.62rem] leading-snug text-slate-600">{ins.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Footer: verification & authority ─────────────────── */}
        <footer className="mt-6 grid items-center gap-4 border-t border-slate-200 pt-4 sm:grid-cols-[auto_1fr_auto] print:grid-cols-[auto_1fr_auto]">
          <div className="flex items-center gap-3">
            <div className="rounded-md border border-slate-200 bg-white p-1.5">
              <PayslipQr value={verifyUrl} size={68} />
            </div>
            <div>
              <p className="flex items-center gap-1 text-[0.62rem] font-semibold text-slate-800">
                <ShieldCheck className="h-3 w-3" style={{ color: accent }} /> Verify this payslip
              </p>
              <p className="mt-0.5 font-mono text-[0.78rem] font-bold tracking-wider text-slate-900">{payslip.verification.code}</p>
              <p className="text-[0.56rem] text-slate-500">Scan, or enter the code at {site.replace(/^https?:\/\//, "") || "motee"}/verify</p>
            </div>
          </div>
          <div className="text-[0.6rem] leading-relaxed text-slate-500 sm:px-2">
            <p>
              <span className="font-semibold text-slate-700">Approved by</span> {payslip.approvedBy ?? "— (not yet approved)"} ·{" "}
              <span className="font-semibold text-slate-700">Generated</span>{" "}
              {new Date(payslip.generatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <p>
              Statutory rules: Nigeria Tax Act 2025 · PRA 2014 · NHF Act. Tax method: {t.method}. Tax is remitted to the {employee.stateOfResidence || "State"} Internal Revenue Service.
            </p>
            <p className="mt-1">Private &amp; confidential. This payslip is computer-generated and valid without a signature.</p>
          </div>
          <div className="text-right">
            <p className="text-[0.55rem] uppercase tracking-[0.12em] text-slate-400">Issued via</p>
            <p className="text-[0.8rem] font-bold tracking-tight text-slate-700">MOTEE</p>
            <p className="font-mono text-[0.5rem] text-slate-400" title={payslip.verification.hash}>
              #{payslip.verification.hash.slice(0, 12)}
            </p>
          </div>
        </footer>
      </div>
    </article>
  );
}

function TaxStep({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3", strong && "border-t border-slate-300 pt-1 font-semibold text-slate-900", muted && "text-slate-500")}>
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 tabular-nums">{value}</span>
    </div>
  );
}

function CompanyMark({ name, logoUrl, accent }: { name: string; logoUrl: string; accent: string }) {
  const [ok, setOk] = useState(false);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-[0.85rem] font-bold text-white" style={{ background: accent }}>
      {initials}
      {logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className={cn("absolute inset-0 h-full w-full bg-white object-contain p-1", !ok && "hidden")}
          onLoad={() => setOk(true)}
          onError={() => setOk(false)}
        />
      )}
    </div>
  );
}

/**
 * Print isolation: only the payslip prints, on one A4 page, whatever app
 * chrome surrounds it. Rendered once on any page that shows a payslip.
 */
export function PayslipPrintStyles() {
  return (
    <style>{`
      @media print {
        @page { size: A4 portrait; margin: 8mm; }
        html { font-size: 10px !important; }
        html, body { background: #fff !important; }
        body * { visibility: hidden !important; }
        .payslip-print-root, .payslip-print-root * { visibility: visible !important; }
        .payslip-print-root { position: fixed; left: 0; top: 0; width: 100%; margin: 0 !important; }
        .payslip-paper { -webkit-print-color-adjust: exact; print-color-adjust: exact; break-inside: avoid; }
      }
    `}</style>
  );
}

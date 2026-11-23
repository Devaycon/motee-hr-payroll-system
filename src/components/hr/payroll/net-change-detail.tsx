"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { KIND_LABELS, SOURCE_LABELS, compareRuns } from "@/src/lib/payroll/comparison";
import { comparisonCtxOf, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { PayrollRun } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { DetailModal } from "./components/row-actions";
import { money, pctArrow } from "./components/shared";

const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${money(Math.abs(n))}`;
const pct = (a: number, b: number) => (a ? ((b - a) / Math.abs(a)) * 100 : null);
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Drill-down for one row of the run's Variance tab: the employee's previous
 * payslip against this run, line by line — earnings, deductions, net pay and
 * the employer's cost — with the explanation and the transactions behind it.
 */
export function NetChangeDetailModal({ run, employeeId, onClose }: { run: PayrollRun; employeeId: string | null; onClose: () => void }) {
  const { data, bundle } = useTenantPayroll();
  const d = useMemo(() => {
    if (!employeeId || !data || !bundle) return null;
    const key = run.period.year * 100 + run.period.month;
    // The same payslip the Variance tab compares against: the latest final regular one before this month.
    const prior = data.payslips
      .filter((p) => p.employeeId === employeeId && p.status === "final" && p.runType === "regular" && p.runId !== run.id && p.period.year * 100 + p.period.month < key)
      .sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month))[0];
    const now = run.employees.find((e) => e.employeeId === employeeId)?.computation ?? null;
    if (!now) return null;
    const prev = prior?.computation ?? null;
    const priorRun = prior ? data.runs.find((r) => r.id === prior.runId) : undefined;
    const variance = priorRun ? compareRuns(run, priorRun, comparisonCtxOf(data, bundle)).employees.find((e) => e.employeeId === employeeId) : undefined;
    const rows: { section: "earning" | "deduction" | "employer"; code: string; name: string; before: number; after: number }[] = [];
    for (const section of ["earning", "deduction", "employer"] as const) {
      const m = new Map<string, { name: string; before: number; after: number }>();
      const add = (lines: typeof now.lines, k: "before" | "after") => {
        for (const l of lines) {
          if (l.category !== section) continue;
          const r = m.get(l.code) ?? { name: l.name, before: 0, after: 0 };
          r[k] = r2(r[k] + l.amount);
          m.set(l.code, r);
        }
      };
      add(prev?.lines ?? [], "before");
      add(now.lines, "after");
      for (const [code, r] of m) rows.push({ section, code, ...r });
    }
    return { prior, prev, now, rows, variance, emp: bundle.employees.find((e) => e.id === employeeId) };
  }, [employeeId, data, bundle, run]);

  if (!employeeId || !d) return null;
  const { prev, now, prior, variance, emp, rows } = d;
  const netDiff = prev ? r2(now.net - prev.net) : null;

  return (
    <DetailModal
      wide
      open
      onClose={onClose}
      title={`${emp?.fullName ?? employeeId} — net pay comparison`}
      description={`${emp?.employeeNumber ?? ""} · ${emp?.departmentName ?? ""} — ${prior ? `${prior.period.label} payslip (${prior.reference})` : "no previous payslip"} against ${run.title}`}
      facts={[
        { label: "Previous net", value: prev ? money(prev.net) : "—" },
        { label: "This net", value: money(now.net) },
        { label: "Net change", value: netDiff === null ? "First pay" : `${signed(netDiff)} ${pctArrow(pct(prev!.net, now.net))}`, tone: netDiff === null ? undefined : netDiff < 0 ? "bad" : "good" },
        { label: "Gross change", value: prev ? `${signed(r2(now.gross - prev.gross))} ${pctArrow(pct(prev.gross, now.gross))}` : money(now.gross) },
      ]}
      actions={
        <>
          <Button size="sm" variant="outline" asChild><Link href={`${PAYROLL_HREF}/${run.id}/employees/${employeeId}`}>Pay this month</Link></Button>
          <Button size="sm" variant="outline" asChild><Link href={`/organization/employees/${employeeId}`}>Employee profile</Link></Button>
          <Button size="sm" asChild><Link href={`${PAYROLL_HREF}/compare?current=${run.id}${prior ? `&previous=${prior.runId}` : ""}`}>Full comparison</Link></Button>
        </>
      }
    >
      {variance && <p className={cn("rounded-lg border p-3 text-sm", Math.abs(variance.unexplained) >= 0.005 && "border-amber-500/40 bg-amber-500/5")}>{variance.explanation}</p>}
      {!prev && <p className="rounded-lg border p-3 text-sm text-muted-foreground">No earlier final payslip — this is the employee&apos;s first pay on this payroll.</p>}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-xs">
          <thead className="text-left text-muted-foreground">
            <tr>
              <th className="py-1 font-medium" />
              <th className="py-1 text-right font-medium">{prior?.period.label ?? "Previous"}</th>
              <th className="py-1 text-right font-medium">{run.period.label}</th>
              <th className="py-1 text-right font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            <Section title="Earnings" />
            {rows.filter((r) => r.section === "earning").map((r) => <Line key={`e-${r.code}`} name={r.name} a={prev ? r.before : null} b={r.after} />)}
            <Line name="Gross pay" a={prev?.gross ?? null} b={now.gross} strong />
            <Section title="Deductions" note="taken from pay" />
            {rows.filter((r) => r.section === "deduction").map((r) => <Line key={`d-${r.code}`} name={r.name} a={prev ? r.before : null} b={r.after} costUp />)}
            <Line name="Total deductions" a={prev?.totalDeductions ?? null} b={now.totalDeductions} strong costUp />
            <Line name="Net pay" a={prev?.net ?? null} b={now.net} strong highlight />
            <Section title="Employer contributions" note="paid on top — not deducted" />
            {rows.filter((r) => r.section === "employer").map((r) => <Line key={`r-${r.code}`} name={r.name} a={prev ? r.before : null} b={r.after} costUp />)}
            <Line name="Total cost to employer" a={prev ? r2(prev.gross + prev.employerCost) : null} b={r2(now.gross + now.employerCost)} strong costUp />
          </tbody>
        </table>
      </div>

      {variance && variance.movements.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Why gross pay moved</p>
          <ul className="mt-1.5 space-y-1 text-xs">
            {variance.movements.map((m, i) => (
              <li key={`${m.code}-${i}`} className="flex justify-between gap-3">
                <span>
                  {m.name} <span className="text-muted-foreground">· {KIND_LABELS[m.kind]} · {SOURCE_LABELS[m.source.type]}: {m.source.detail}</span>
                </span>
                <span className={cn("shrink-0 tabular-nums", m.change < 0 ? "text-rose-600" : "text-emerald-700")}>{signed(m.change)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DetailModal>
  );
}

function Section({ title, note }: { title: string; note?: string }) {
  return (
    <tr>
      <td colSpan={4} className="pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
        {note && <span className="ml-1.5 font-normal normal-case tracking-normal">· {note}</span>}
      </td>
    </tr>
  );
}

/** One line: previous, now, change. `costUp` lines (deductions, employer costs) are good when they fall. */
function Line({ name, a, b, strong, highlight, costUp }: { name: string; a: number | null; b: number; strong?: boolean; highlight?: boolean; costUp?: boolean }) {
  const diff = a === null ? null : r2(b - a);
  const good = diff !== null && diff !== 0 && (costUp ? diff < 0 : diff > 0);
  return (
    <tr className={cn("border-t", strong && "font-semibold", highlight && "bg-primary/5")}>
      <td className={cn("py-1.5", !strong && "pl-3")}>{name}</td>
      <td className="py-1.5 text-right tabular-nums text-muted-foreground">{a === null ? "—" : money(a)}</td>
      <td className="py-1.5 text-right tabular-nums">{money(b)}</td>
      <td className={cn("whitespace-nowrap py-1.5 text-right tabular-nums", diff && (good ? "text-emerald-700" : "text-rose-600"))}>{diff ? `${signed(diff)} ${pctArrow(pct(a ?? 0, b))}` : "—"}</td>
    </tr>
  );
}

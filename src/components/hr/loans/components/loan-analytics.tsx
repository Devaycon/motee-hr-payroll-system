"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Progress } from "@/src/components/ui/progress";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { cn } from "@/src/lib/utils";
import {
  LOANS_HREF,
  LOAN_STATUS_LABELS,
  breakdownByType,
  loanTypeLabel,
  type LoanStatus,
  type LoanSummary,
} from "@/src/lib/loans/loans";
import type { LoanRow } from "@/src/lib/loans/use-loans";

const STATUS_BAR: Record<LoanStatus, string> = {
  pending: "bg-amber-400",
  active: "bg-blue-500",
  closed: "bg-emerald-500",
  defaulted: "bg-rose-500",
  rejected: "bg-slate-400",
};

/** Where the loan book sits: by product, by status, by department, and the largest balances. */
export function LoanAnalytics({ rows, summary }: { rows: LoanRow[]; summary: LoanSummary }) {
  const { format } = useCurrency();
  const byType = useMemo(() => breakdownByType(rows), [rows]);
  const maxValue = Math.max(1, ...byType.map((t) => t.value));

  const byStatus = useMemo(() => {
    const m = new Map<LoanStatus, number>();
    for (const r of rows) m.set(r.status, (m.get(r.status) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const byDept = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (r.outstanding <= 0) continue;
      const d = r.employee?.departmentName ?? "—";
      m.set(d, (m.get(d) ?? 0) + r.outstanding);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const maxDept = Math.max(1, ...byDept.map(([, v]) => v));

  const largest = useMemo(
    () => [...rows].filter((r) => r.outstanding > 0).sort((a, b) => b.outstanding - a.outstanding).slice(0, 5),
    [rows],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="gap-0 py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm">By loan type</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4 pb-4">
          {byType.map((t) => (
            <div key={t.loanType} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {loanTypeLabel(t.loanType)}{" "}
                  <span className="font-normal text-muted-foreground">· {t.count}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {format(t.outstanding, { compact: true })} of {format(t.value, { compact: true })} outstanding
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-blue-200 dark:bg-blue-900/60"
                  style={{ width: `${(t.value / maxValue) * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-blue-500"
                  style={{ width: `${(t.outstanding / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {byType.length === 0 && <p className="text-xs text-muted-foreground">No loans yet.</p>}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm">Recovery & status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4 pb-4">
          <div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">Principal recovered</span>
              <span className="text-lg font-semibold tabular-nums">{summary.recoveryRate}%</span>
            </div>
            <Progress value={summary.recoveryRate} className="mt-1 h-1.5" />
          </div>
          {rows.length > 0 && (
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {byStatus.map(([s, n]) => (
                <div
                  key={s}
                  className={cn("h-full", STATUS_BAR[s])}
                  style={{ width: `${(n / rows.length) * 100}%` }}
                  title={`${LOAN_STATUS_LABELS[s]}: ${n}`}
                />
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {byStatus.map(([s, n]) => (
              <span key={s} className="flex items-center gap-1.5 text-xs">
                <span className={cn("h-2 w-2 rounded-full", STATUS_BAR[s])} />
                {LOAN_STATUS_LABELS[s]} <span className="text-muted-foreground">{n}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm">Outstanding by department</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 px-4 pb-4">
          {byDept.map(([d, v]) => (
            <div key={d} className="grid grid-cols-[140px_1fr_80px] items-center gap-2 text-xs">
              <span className="truncate">{d}</span>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-violet-500" style={{ width: `${(v / maxDept) * 100}%` }} />
              </div>
              <span className="text-right tabular-nums text-muted-foreground">{format(v, { compact: true })}</span>
            </div>
          ))}
          {byDept.length === 0 && <p className="text-xs text-muted-foreground">Nothing outstanding.</p>}
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm">Largest outstanding balances</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col px-4 pb-4">
          {largest.map((r) => (
            <Link
              key={r.id}
              href={`${LOANS_HREF}/${r.id}`}
              className="flex items-center justify-between border-b border-border/50 py-1.5 text-xs last:border-0 hover:text-primary"
            >
              <span className="truncate">
                {r.employee?.fullName}{" "}
                <span className="text-muted-foreground">· {loanTypeLabel(r.loanType)}</span>
              </span>
              <span className={cn("tabular-nums font-medium", r.status === "defaulted" && "text-rose-600")}>
                {format(r.outstanding)}
              </span>
            </Link>
          ))}
          {largest.length === 0 && <p className="text-xs text-muted-foreground">Nothing outstanding.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Search } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { DetailModal, DownloadMenu } from "@/src/components/hr/payroll/components/row-actions";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { writeTable, type ExportTable } from "@/src/lib/payroll/exports";
import type { ReportStat, ReportStatDrill } from "@/src/lib/reports/types";
import { cn } from "@/src/lib/utils";

const round2 = (n: number) => Math.round(n * 100) / 100;

export function drillTable(stat: ReportStat, d: ReportStatDrill): ExportTable {
  const comp = d.components ?? [];
  return {
    preamble: [[d.title ?? stat.label], ...(d.scope ? [[`Scope: ${d.scope}`]] : []), ...(comp.length ? [[], ["Component", "Basis", "Amount"], ...comp.map((c) => [c.label, c.basis ?? "", c.value]), ["Total", "", Number(stat.value)], []] : [])],
    headers: d.table?.headers ?? [],
    data: d.table?.rows ?? [],
    trailer: d.table?.footer ? [d.table.footer] : undefined,
  };
}

/** The detail behind one KPI card: components that add up to it, then the employee-level rows. */
export function StatDrillDialog({ stat, open, onClose }: { stat: ReportStat; open: boolean; onClose: () => void }) {
  const d = stat.drill!;
  const [q, setQ] = useState("");
  const comp = d.components ?? [];
  const compTotal = round2(comp.reduce((s, c) => s + c.value, 0));
  const ties = !comp.length || Math.abs(compTotal - Number(stat.value)) < 0.01;
  const fmt = (v: string | number, money?: boolean) => (money && typeof v === "number" ? formatMoneyLocale(v) : typeof v === "number" ? v.toLocaleString() : v);
  const rows = useMemo(() => {
    const all = d.table?.rows ?? [];
    const t = q.trim().toLowerCase();
    return t ? all.filter((r) => r.some((c) => String(c).toLowerCase().includes(t))) : all;
  }, [d.table, q]);

  return (
    <DetailModal
      open={open}
      onClose={onClose}
      wide
      title={d.title ?? stat.label}
      description={d.description}
      facts={[
        { label: stat.label, value: stat.money ? formatMoneyLocale(Number(stat.value)) : String(stat.value) },
        ...(d.scope ? [{ label: "Scope", value: d.scope }] : []),
        ...(d.table ? [{ label: "Rows", value: d.table.rows.length.toLocaleString() }] : []),
      ]}
      actions={
        <>
          {(d.links ?? []).map((l) => (
            <Button key={l.href} variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={l.href}>
                {l.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ))}
          <DownloadMenu onDownload={(f) => writeTable(`${stat.label.toLowerCase().replace(/\s+/g, "-")}-detail`, stat.label.slice(0, 31), drillTable(stat, d), f)} />
        </>
      }
    >
      {comp.length > 0 && (
        <div className="rounded-lg border">
          <table className="w-full text-xs tabular-nums">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium">What makes up {stat.label.toLowerCase()}</th>
                <th className="px-3 py-1.5 text-left font-medium">Basis</th>
                <th className="px-3 py-1.5 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {comp.map((c) => (
                <tr key={c.label} className="border-t">
                  <td className="px-3 py-1.5 font-medium">{c.label}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{c.basis ?? "—"}</td>
                  <td className="px-3 py-1.5 text-right">{fmt(c.value, c.money ?? stat.money)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-foreground/60 font-semibold">
                <td className="px-3 py-1.5" colSpan={2}>
                  <span className="inline-flex items-center gap-1.5">
                    {ties && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                    Total {ties ? "— matches the card" : `— differs from the card by ${fmt(round2(Number(stat.value) - compTotal), stat.money)}`}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right">{fmt(compTotal, stat.money)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {d.table && (
        <div className="space-y-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search rows…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 pl-8 text-xs" />
          </div>
          <div className="max-h-[45vh] overflow-auto rounded-lg border">
            <table className="w-full text-xs tabular-nums">
              <thead className="sticky top-0 bg-muted text-muted-foreground">
                <tr>
                  {d.table.headers.map((h, i) => (
                    <th key={h} className={cn("whitespace-nowrap px-2 py-1.5 font-medium", d.table!.money?.[i] ? "text-right" : "text-left")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={ri} className="border-t">
                    {r.map((c, i) => (
                      <td key={i} className={cn("whitespace-nowrap px-2 py-1.5", d.table!.money?.[i] && "text-right")}>
                        {i === 0 && d.table!.hrefs?.[d.table!.rows.indexOf(r)] ? (
                          <Link className="text-primary hover:underline" href={d.table!.hrefs![d.table!.rows.indexOf(r)]!}>
                            {fmt(c)}
                          </Link>
                        ) : (
                          fmt(c, d.table!.money?.[i])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={d.table.headers.length} className="px-2 py-6 text-center text-muted-foreground">
                      No rows match.
                    </td>
                  </tr>
                )}
              </tbody>
              {d.table.footer && !q && (
                <tfoot className="sticky bottom-0 bg-muted font-semibold">
                  <tr>
                    {d.table.footer.map((c, i) => (
                      <td key={i} className={cn("whitespace-nowrap px-2 py-1.5", d.table!.money?.[i] && "text-right")}>
                        {fmt(c, d.table!.money?.[i])}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </DetailModal>
  );
}

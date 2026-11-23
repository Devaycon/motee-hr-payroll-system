"use client";

import Link from "next/link";
import { ArrowRight, Check, Download, FileSpreadsheet, Globe2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import { RUN_PIPELINE, RUN_STATUS_LABELS, RUN_STATUS_STYLES } from "@/src/lib/payroll/constants";
import { downloadExport, EXPORT_LABELS, type ExportKind } from "@/src/lib/payroll/exports";
import { companySnapshot } from "@/src/lib/payroll/run-builder";
import { useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { PayrollRun, PayrollRunStatus } from "@/src/lib/payroll/types";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import type { EmployeeTaxProfile } from "@/src/lib/payroll/types";

export const money = (n: number, dp = 2) =>
  `₦${n.toLocaleString("en-NG", { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
export const compact = (n: number) =>
  Math.abs(n) >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(2)}m` : Math.abs(n) >= 10_000 ? `₦${(n / 1000).toFixed(1)}k` : money(n, 0);
/** "▲ 9.0%" / "▼ 37.5%" — direction by arrow, never by a +/− sign (client request). */
export const pctArrow = (p: number | null | undefined, dp = 1) => (p === null || p === undefined ? "—" : p === 0 ? `${(0).toFixed(dp)}%` : `${p > 0 ? "▲" : "▼"} ${Math.abs(p).toFixed(dp)}%`);
/** "▲ ₦150,000.00" — an amount's direction by arrow. */
export const moneyArrow = (n: number, dp = 2) => (Math.abs(n) < 0.005 ? money(0, dp) : `${n > 0 ? "▲" : "▼"} ${money(Math.abs(n), dp)}`);
export const fmtDate = (iso?: string) =>
  iso ? new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

export function RunStatusBadge({ status, className }: { status: PayrollRunStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium", RUN_STATUS_STYLES[status], className)}>
      {RUN_STATUS_LABELS[status]}
    </Badge>
  );
}

export function RunTypeBadge({ type }: { type: PayrollRun["type"] }) {
  if (type === "regular") return null;
  return (
    <Badge variant="outline" className="text-[10px]">
      {type === "off_cycle" ? "Off-cycle" : "Adjustment"}
    </Badge>
  );
}

/** Draft → Approval → Approved → Finalized → Paid, with the current step lit. */
export function PipelineStepper({ status }: { status: PayrollRunStatus }) {
  const index = RUN_PIPELINE.findIndex((s) => s.status === status);
  return (
    <ol className="flex w-full items-center gap-1 overflow-x-auto">
      {RUN_PIPELINE.map((step, i) => {
        const done = i < index || status === "disbursed";
        const current = i === index && status !== "disbursed";
        return (
          <li key={step.status} className="flex min-w-fit flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                done && "border-emerald-500 bg-emerald-500 text-white",
                current && "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15",
                !done && !current && "border-border bg-background text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn("whitespace-nowrap text-xs", current ? "font-semibold" : "text-muted-foreground")}>{step.label}</span>
            {i < RUN_PIPELINE.length - 1 && <span className={cn("mx-1 h-px min-w-6 flex-1", done ? "bg-emerald-500" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}

export function RunExportsMenu({
  run,
  people,
  profiles,
  onExport,
}: {
  run: PayrollRun;
  people: Map<string, LocaleEmployee>;
  profiles: Map<string, EmployeeTaxProfile>;
  onExport?: (what: string) => void;
}) {
  // The bank file pays real money: only from a finalized (locked) run.
  const locked = run.status === "finalized" || run.status === "disbursed";
  // …and only once a Payment Authoriser has released it (runs paid before payment batches existed keep their file).
  const released = locked && (!!run.payment || run.status === "disbursed");
  const { data, bundle } = useTenantPayroll();
  const go = (kind: ExportKind, format: "csv" | "xlsx") => {
    const company = bundle ? companySnapshot(bundle) : undefined;
    const costCentres = new Map((bundle?.departments ?? []).map((d) => [d.name, d.costCenter]));
    const excluded = downloadExport(kind, { run, people, profiles, settings: data?.settings, company, costCentres, elements: data?.elements }, format);
    onExport?.(`${EXPORT_LABELS[kind]} (${format.toUpperCase()})`);
    if (excluded.length)
      toast.warning(`${EXPORT_LABELS[kind]} downloaded — ${excluded.length} left out`, { description: excluded.slice(0, 4).join(" · ") + (excluded.length > 4 ? " …" : ""), duration: 10000 });
    else toast.success(`${EXPORT_LABELS[kind]} downloaded`);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Exports
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs">Statutory & bank files</DropdownMenuLabel>
        {(Object.keys(EXPORT_LABELS) as ExportKind[]).map((k) => (
          <DropdownMenuItem key={k} onClick={() => go(k, k === "nibss" ? "csv" : "xlsx")} className="gap-2 text-xs" disabled={!released && k === "nibss"}>
            {k === "nibss" ? <Globe2 className="h-3.5 w-3.5" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
            {EXPORT_LABELS[k]}
            <span className="ml-auto text-[10px] text-muted-foreground">{k === "nibss" ? (released ? "CSV" : locked ? "Authorise first" : "After finalize") : "XLSX"}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => go("register", "csv")} className="text-xs">Payroll register (CSV)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function NotSupported() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card p-14 text-center">
      <Globe2 className="h-7 w-7 text-muted-foreground" />
      <p className="text-base font-semibold">Payroll is live for Nigerian tenants</p>
      <p className="max-w-md text-sm text-muted-foreground">
        The calculation engine is built as country modules. The Nigeria module (PAYE under the Nigeria Tax Act 2025, pension, NHF, NSITF, ITF) is ready; UK PAYE &amp; NI is the next module. Switch the demo to the Nigeria tenant to try it.
      </p>
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
  href,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "good" | "warn" | "muted";
  /** Makes the card a link to its drill-down. */
  href?: string;
  onClick?: () => void;
}) {
  const interactive = !!(href || onClick);
  const body = (
    <>
      <p className="flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {interactive && <ArrowRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />}
      </p>
      <p className={cn("mt-0.5 truncate text-lg font-semibold tabular-nums", tone === "good" && "text-emerald-600", tone === "warn" && "text-amber-600")}>{value}</p>
      {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
    </>
  );
  const cls = cn(
    "group min-w-0 flex-1 rounded-xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10",
    interactive && "cursor-pointer transition hover:ring-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  );
  if (href) return <Link href={href} className={cls}>{body}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{body}</button>;
  return <div className={cls}>{body}</div>;
}

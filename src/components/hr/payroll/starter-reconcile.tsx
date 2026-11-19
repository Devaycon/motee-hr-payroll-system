"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { writeTable } from "@/src/lib/payroll/exports";
import { RECON_FIELDS, RECON_TOLERANCE, reconcileBatch, type ReconRow } from "@/src/lib/payroll/starter-import";
import { usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { cn } from "@/src/lib/utils";
import { NotSupported, RunStatusBadge, fmtDate, money } from "./components/shared";

type Status = "match" | "explained" | "investigate" | "no_expected" | "not_in_run";
const statusOf = (r: ReconRow): Status => (r.status === "variance" ? (r.explained ? "explained" : "investigate") : r.status);

const STATUS: Record<Status, { label: string; tone: string }> = {
  match: { label: "Matches", tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400" },
  explained: { label: "Explained difference", tone: "bg-sky-500/12 text-sky-700 dark:text-sky-400" },
  investigate: { label: "Investigate", tone: "bg-rose-500/12 text-rose-700 dark:text-rose-400" },
  no_expected: { label: "No expected figures", tone: "bg-muted text-muted-foreground" },
  not_in_run: { label: "Not in the run", tone: "bg-amber-500/14 text-amber-800 dark:text-amber-300" },
};

const REPORTS = [
  { view: "gross", label: "Gross pay", hint: "Every earning line by department" },
  { view: "paye", label: "PAYE", hint: "By State IRS, with TINs" },
  { view: "pension", label: "Pension", hint: "Employee, employer and AVC by PFA" },
  { view: "net", label: "Net pay & bank schedule", hint: "Bank, account number, amount" },
  { view: "deductions", label: "All deductions", hint: "Statutory and voluntary" },
  { view: "third-party", label: "Third-party payments", hint: "Unions, cooperatives, loans" },
];

const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${money(Math.abs(n))}`;

/**
 * `/time-payroll/payroll/import/[batchId]?status=` — the first MOTEE month for
 * an imported team against the figures the previous payroll (or the client's
 * calculator) produced: totals, every employee, and why any figure differs.
 */
export function StarterReconcilePage({ batchId }: { batchId: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const batch = data?.imports?.find((b) => b.id === batchId) ?? null;

  const run = useMemo(() => {
    if (!data || !batch) return null;
    const ids = new Set(batch.employees.map((e) => e.id));
    return (
      data.runs.find((r) => r.id === batch.runId) ??
      [...data.runs]
        .filter((r) => r.type === "regular" && r.employees.some((e) => ids.has(e.employeeId)))
        .sort((a, b) => a.period.year * 100 + a.period.month - (b.period.year * 100 + b.period.month))[0] ??
      null
    );
  }, [data, batch]);
  const openRun = useMemo(
    () => [...(data?.runs ?? [])].filter((r) => r.type === "regular" && r.status === "draft").sort((a, b) => a.period.year * 100 + a.period.month - (b.period.year * 100 + b.period.month))[0] ?? null,
    [data],
  );
  const rows = useMemo(() => (batch ? reconcileBatch(batch, run, data?.openingYtd ?? {}) : []), [batch, run, data]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data) return <Skeleton className="h-150 w-full rounded-xl" />;
  if (!batch) {
    return (
      <p className="py-20 text-center text-sm text-muted-foreground">
        This import no longer exists.{" "}
        <Link href={`${PAYROLL_HREF}/import`} className="text-primary hover:underline">
          Back to imports
        </Link>
      </p>
    );
  }

  const filter = (search.get("status") as Status | null) ?? null;
  const count = (s: Status) => rows.filter((r) => statusOf(r) === s).length;
  const shown = filter ? rows.filter((r) => statusOf(r) === filter) : rows;
  const compared = rows.filter((r) => r.status === "match" || r.status === "variance");
  const totals = RECON_FIELDS.map((f) => {
    const expected = compared.reduce((s, r) => s + (r.figures[f.key].expected ?? 0), 0);
    const actual = compared.reduce((s, r) => s + r.figures[f.key].actual, 0);
    return { ...f, expected, actual, diff: Math.round((actual - expected) * 100) / 100 };
  });
  const setFilter = (s: Status | null) => {
    const p = new URLSearchParams(search.toString());
    if (s) p.set("status", s);
    else p.delete("status");
    router.replace(`?${p.toString()}`);
  };

  const download = () => {
    const headers = ["Employee ID", "Name", "Department", "Status", ...RECON_FIELDS.flatMap((f) => [`${f.label} expected`, `${f.label} MOTEE`, `${f.label} difference`]), "Why"];
    const table = rows.map((r) => [
      r.employeeNumber,
      r.name,
      r.department,
      STATUS[statusOf(r)].label,
      ...RECON_FIELDS.flatMap((f) => [r.figures[f.key].expected ?? "", r.figures[f.key].actual, r.figures[f.key].diff ?? ""]),
      r.explanations.join(" "),
    ]);
    writeTable(`starter-reconciliation-${batch.id}`, "Reconciliation", { headers, data: table, preamble: [[`Reconciliation — ${batch.fileName}`], [`${run?.title ?? "No run"} · tolerance ₦${RECON_TOLERANCE}`], []] }, "xlsx");
    actions.logExport(run?.id ?? "", `Starter reconciliation — ${batch.fileName}`);
    toast.success("Reconciliation downloaded");
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`${PAYROLL_HREF}/import`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Import new starters
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">Reconciliation · {batch.fileName}</h1>
          <p className="text-xs text-muted-foreground">
            {batch.employees.length} employees imported {fmtDate(batch.importedAt)} by {batch.importedBy} ·{" "}
            {run ? (
              <>
                compared with{" "}
                <Link href={`${PAYROLL_HREF}/${run.id}`} className="text-primary hover:underline">
                  {run.title}
                </Link>{" "}
                <RunStatusBadge status={run.status} />
              </>
            ) : (
              "not in a pay run yet"
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!run && openRun && (
            <Button
              className="gap-2"
              onClick={() => {
                actions.addStartersToRun(openRun.id, batch.employees.map((e) => e.id));
                toast.success(`Added to ${openRun.title}`);
              }}
            >
              <UserPlus className="h-4 w-4" /> Add to {openRun.title}
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={download}>
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["match", "explained", "investigate", "no_expected", "not_in_run"] as Status[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(filter === s ? null : s)}
            className={cn("rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/50", filter === s && "border-primary ring-1 ring-primary/30")}
          >
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{STATUS[s].label}</p>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                s === "match" && "text-emerald-600",
                s === "explained" && count(s) && "text-sky-600",
                s === "investigate" && count(s) && "text-rose-600",
                s === "not_in_run" && count(s) && "text-amber-600",
              )}
            >
              {count(s)}
            </p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-4 lg:col-span-3">
          <p className="text-sm font-semibold">Totals — employees with expected figures ({compared.length})</p>
          <p className="text-[11px] text-muted-foreground">
            Differences up to ₦{RECON_TOLERANCE} per figure (kobo rounding between systems) count as a match.
            {count("explained") > 0 && !count("investigate") && " Every difference below is explained by a payroll rule — see the employees marked Explained."}
          </p>
          <table className="mt-3 w-full text-sm">
            <thead className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-1.5 font-medium" />
                <th className="py-1.5 text-right font-medium">Expected</th>
                <th className="py-1.5 text-right font-medium">MOTEE</th>
                <th className="py-1.5 text-right font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((t) => (
                <tr key={t.key} className="border-b last:border-0">
                  <td className="py-2">{t.label}</td>
                  <td className="py-2 text-right tabular-nums">{money(t.expected)}</td>
                  <td className="py-2 text-right tabular-nums">{money(t.actual)}</td>
                  <td
                    className={cn(
                      "whitespace-nowrap py-2 text-right tabular-nums",
                      Math.abs(t.diff) <= RECON_TOLERANCE ? "text-emerald-600" : count("investigate") ? "font-medium text-rose-600" : "font-medium text-sky-700 dark:text-sky-400",
                    )}
                  >
                    {Math.abs(t.diff) <= RECON_TOLERANCE ? "—" : signed(t.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <p className="text-sm font-semibold">Payroll reports</p>
          <p className="text-[11px] text-muted-foreground">{run ? `${run.title} — everyone in the run, the new starters included.` : "Available once the starters are in a pay run."}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {REPORTS.map((r) =>
              run ? (
                <Link key={r.view} href={`${PAYROLL_HREF}/${run.id}/breakdown?view=${r.view}`} className="group rounded-lg border p-2.5 transition-colors hover:border-primary/50">
                  <span className="flex items-center justify-between text-sm font-medium">
                    {r.label} <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                  </span>
                  <span className="text-[11px] text-muted-foreground">{r.hint}</span>
                </Link>
              ) : (
                <span key={r.view} className="rounded-lg border p-2.5 text-sm text-muted-foreground opacity-60">
                  {r.label}
                </span>
              ),
            )}
          </div>
          {run && ["finalized", "disbursed"].includes(run.status) && (
            <Link href={`${PAYROLL_HREF}?tab=remittances`} className="mt-2 inline-block text-xs text-primary hover:underline">
              Statutory remittance statements →
            </Link>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Employee</th>
                {RECON_FIELDS.map((f) => (
                  <th key={f.key} className="px-3 py-2 text-right font-medium">
                    {f.label}
                  </th>
                ))}
                <th className="px-3 py-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const s = statusOf(r);
                return (
                  <Fragment key={r.employeeId}>
                  <tr className={cn("align-top", !r.explanations.length && "border-b")}>
                    <td className="min-w-52 px-3 py-2.5">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.employeeNumber} · {r.department}
                      </p>
                    </td>
                    {RECON_FIELDS.map((f) => {
                      const v = r.figures[f.key];
                      const off = v.diff !== undefined && Math.abs(v.diff) > RECON_TOLERANCE;
                      return (
                        <td key={f.key} className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                          <p>{r.status === "not_in_run" ? "—" : money(v.actual)}</p>
                          {off && (
                            <p className={cn("text-[11px]", s === "explained" ? "text-sky-700 dark:text-sky-400" : "text-rose-600")}>
                              {signed(v.diff!)} vs {money(v.expected!)}
                            </p>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5">
                      <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS[s].tone)}>{STATUS[s].label}</span>
                    </td>
                  </tr>
                  {r.explanations.length > 0 && (
                    <tr className="border-b">
                      <td colSpan={7} className="px-3 pb-3 pt-0">
                        <div className={cn("rounded-lg px-3 py-2 text-xs leading-snug", s === "explained" ? "bg-sky-500/8 text-sky-900 dark:text-sky-200" : "bg-rose-500/8 text-rose-900 dark:text-rose-200")}>
                          {r.explanations.map((x) => (
                            <p key={x}>{x}</p>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                );
              })}
              {!shown.length && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-xs text-muted-foreground">
                    Nothing in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

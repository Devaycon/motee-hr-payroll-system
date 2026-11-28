"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, CalendarClock, CheckCircle2, CircleDashed, GitPullRequestArrow, ShieldAlert, Sparkles, XCircle, Eye, FileSpreadsheet, FileText, ShieldCheck } from "lucide-react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { explainVariance } from "@/src/lib/payroll/intelligence";
import { EXCEPTION_RULE_LABELS } from "@/src/lib/payroll/validation";
import { INVESTIGATIONS_HREF, comparisonCtxOf, useRunReadiness, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { ReadinessCard } from "./readiness-card";
import type { PayrollRun } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { BarList, compactNaira } from "./components/charts";
import { RunStatusBadge, fmtDate, money } from "./components/shared";
import { RemittanceBadge, useRemittanceRows } from "./remittance-centre";
import { RowActions } from "./components/row-actions";
import { downloadRemittanceSchedule, remittanceStatement } from "@/src/lib/payroll/remittances";

type Check = { label: string; state: "done" | "todo" | "blocked"; detail: string; href?: string };

const BANK_RULES = new Set(["missing_bank", "missing_bank_code", "invalid_nuban", "duplicate_bank_account", "bank_changed"]);

/**
 * Payroll Control Centre — one screen for the payroll manager's day: is the
 * current run ready, what is blocking it, who has to approve what, is the
 * money ready to go, which statutory deadlines are coming, and why this
 * month's figures differ from last month's.
 */
export function PayrollControlCentre({ current, runs }: { current: PayrollRun | null; runs: PayrollRun[] }) {
  const { data, bundle } = useTenantPayroll();
  const requests = useAppSelector((s) => s.approvals.requests);
  const roles = bundle?.roles ?? [];
  const { rows, projected } = useRemittanceRows();
  // Readiness of the run being prepared (a locked run has passed its gates already).
  const readiness = useRunReadiness(current?.id);
  const remCtx = { people: new Map((bundle?.employees ?? []).map((e) => [e.id, e])), profiles: new Map((data?.profiles ?? []).map((p) => [p.employeeId, p])), settings: data?.settings };

  if (!data || !bundle) return null;

  // The run to watch: the open run, else the latest one still being paid.
  const lockedUnpaid = runs.find((r) => r.status === "finalized" || (r.status === "disbursed" && r.payment && r.payment.status !== "settled")) ?? null;
  const run = current ?? lockedUnpaid;
  const previous = run ? runs.filter((r) => r.type === "regular" && r.id !== run.id && r.period.year * 100 + r.period.month < run.period.year * 100 + run.period.month && (r.status === "finalized" || r.status === "disbursed"))[0] : undefined;
  const story = run && previous && run.type === "regular" ? explainVariance(run, previous, comparisonCtxOf(data, bundle)) : null;

  const errors = run?.exceptions.filter((e) => e.severity === "error" && !e.acknowledged) ?? [];
  const warnings = run?.exceptions.filter((e) => e.severity === "warning") ?? [];
  const bankIssues = run?.exceptions.filter((e) => BANK_RULES.has(e.rule) && !e.acknowledged) ?? [];
  const req = run?.approvalRequestId ? requests.find((r) => r.id === run.approvalRequestId) : undefined;
  const step = req && req.status === "in_progress" ? req.steps[req.currentStepIndex] : undefined;
  const stepWho = step ? step.resolvedEmployeeName || roles.find((r) => `ROLE:${r.id}` === step.approver)?.name || step.approver : null;
  const locked = run && (run.status === "finalized" || run.status === "disbursed");
  const pay = run?.payment;
  const rejected = pay ? Object.entries(pay.results).filter(([, r]) => r.status === "rejected" && !r.resolvedBy) : [];

  const checks: Check[] = run
    ? [
        { label: "Calculated and up to date", state: run.stale ? "blocked" : run.calculatedAt ? "done" : "todo", detail: run.stale ? run.stale.reason : run.calculatedAt ? `Calculated ${fmtDate(run.calculatedAt)}` : "Not calculated yet", href: `${PAYROLL_HREF}/${run.id}` },
        { label: "Errors resolved", state: errors.length ? "blocked" : "done", detail: errors.length ? `${errors.length} error${errors.length === 1 ? "" : "s"} block submission` : "No open errors", href: `${PAYROLL_HREF}/${run.id}?tab=exceptions` },
        { label: "Warnings reviewed", state: warnings.length ? "todo" : "done", detail: warnings.length ? `${warnings.length} warning${warnings.length === 1 ? "" : "s"} to review` : "No warnings", href: `${PAYROLL_HREF}/${run.id}?tab=exceptions` },
        { label: "Bank details valid", state: bankIssues.length ? "blocked" : "done", detail: bankIssues.length ? `${bankIssues.length} account issue${bankIssues.length === 1 ? "" : "s"}` : "Every account passes the NUBAN check", href: `${PAYROLL_HREF}/${run.id}?tab=exceptions` },
        {
          label: "Reviewed and approved",
          state: run.status === "approved" || locked ? "done" : run.status === "in_review" ? "todo" : "todo",
          detail: run.status === "approved" || locked ? `Approved${run.approvedBy ? ` by ${run.approvedBy.name}` : ""}` : run.status === "in_review" ? `Waiting on ${step?.label ?? "the approval chain"}${stepWho ? ` (${stepWho})` : ""}` : "Not submitted yet",
          href: `${PAYROLL_HREF}/${run.id}`,
        },
        { label: "Finalized and locked", state: locked ? "done" : "todo", detail: locked ? `Locked ${fmtDate(run.finalizedAt ?? "")} — payslips issued` : "Locks the figures and issues payslips", href: `${PAYROLL_HREF}/${run.id}` },
        {
          label: "Payment released",
          state: pay?.status === "settled" ? (rejected.length ? "blocked" : "done") : "todo",
          detail: !locked ? "After finalizing" : !pay ? "Awaiting Finance authorisation" : pay.status === "authorised" ? `Authorised by ${pay.authorisedBy?.name} — send the bank file` : pay.status === "submitted" ? `With the bank (${pay.bankReference}) — reconcile the settlement` : rejected.length ? `${rejected.length} payment${rejected.length === 1 ? "" : "s"} rejected by the bank` : `Settled ${fmtDate(pay.reconciledAt ?? "")}`,
          href: `${PAYROLL_HREF}/${run.id}?tab=payment`,
        },
      ]
    : [];
  const done = checks.filter((c) => c.state === "done").length;

  // Exceptions grouped by rule.
  const byRule = new Map<string, number>();
  for (const e of run?.exceptions ?? []) if (!e.acknowledged) byRule.set(e.rule, (byRule.get(e.rule) ?? 0) + 1);

  // Everything waiting on someone.
  const pendingSalary = data.structures.filter((s) => s.status === "pending");
  const pendingConfig = (data.configChanges ?? []).filter((c) => c.status === "pending");
  const unpaidRuns = runs.filter((r) => r.status === "finalized" && (!r.payment || r.payment.status !== "settled"));

  const deadlines = [...rows.filter((r) => r.outstanding > 0), ...projected].sort((a, b) => a.due.localeCompare(b.due)).slice(0, 7);

  return (
    <div className="flex flex-col gap-4">
      {readiness && current && <ReadinessCard readiness={readiness} run={current} />}

      {/* Pipeline */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{run ? `${run.title} — where it is` : "No run in progress"}</p>
            <p className="text-[11px] text-muted-foreground">{run ? `${done} of ${checks.length} checks complete · pay day ${fmtDate(run.period.payDate)}` : "Create the next regular run to start."}</p>
          </div>
          {run && (
            <div className="flex items-center gap-2">
              <RunStatusBadge status={run.status} />
              <Link href={`${PAYROLL_HREF}/${run.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Open run <ArrowRight className="h-3 w-3" /></Link>
            </div>
          )}
        </div>
        {run && (
          <>
            <div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${(done / checks.length) * 100}%` }} /></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {checks.map((c) => (
                <Link key={c.label} href={c.href ?? "#"} className="flex items-start gap-2 rounded-lg border px-3 py-2 transition hover:bg-muted/40">
                  {c.state === "done" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : c.state === "blocked" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /> : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="min-w-0">
                    <span className="block text-xs font-medium">{c.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{c.detail}</span>
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Exceptions */}
        <Panel icon={ShieldAlert} title="Exceptions" sub={run ? `${errors.length} errors · ${warnings.length} warnings in ${run.title}` : "—"} href={run ? `${PAYROLL_HREF}/${run.id}?tab=exceptions` : undefined}>
          {byRule.size ? (
            <ul className="space-y-1.5 text-xs">
              {[...byRule.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([rule, n]) => {
                const sev = run!.exceptions.find((e) => e.rule === rule)?.severity;
                return (
                  <li key={rule} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">{sev === "error" ? <XCircle className="h-3.5 w-3.5 text-rose-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}{EXCEPTION_RULE_LABELS[rule as keyof typeof EXCEPTION_RULE_LABELS] ?? rule}</span>
                    <span className="tabular-nums text-muted-foreground">{n}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Nothing open.</p>
          )}
        </Panel>

        {/* Approvals */}
        <Panel icon={GitPullRequestArrow} title="Approvals" sub="Everything waiting on someone">
          <ul className="space-y-2 text-xs">
            <li className="flex items-start justify-between gap-2">
              <span>Payroll run{run ? ` — ${run.title}` : ""}</span>
              <span className="text-right text-muted-foreground">{run?.status === "in_review" ? `${step?.label.split(" — ")[0] ?? "In review"}${stepWho ? ` · ${stepWho}` : ""}` : run?.status === "approved" || locked ? "Approved" : "Not submitted"}</span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <Link href={`${PAYROLL_HREF}/settings?tab=structures`} className="hover:underline">Salary changes</Link>
              <span className="text-muted-foreground">{pendingSalary.length ? `${pendingSalary.length} pending` : "None"}</span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <Link href={`${PAYROLL_HREF}/settings?tab=history`} className="hover:underline">Configuration changes</Link>
              <span className="text-muted-foreground">{pendingConfig.length ? `${pendingConfig.length} need a second approver` : "None"}</span>
            </li>
            <li className="flex items-start justify-between gap-2">
              <span>Payment release</span>
              <span className="text-right text-muted-foreground">{unpaidRuns.filter((r) => !r.payment).length ? `${unpaidRuns.filter((r) => !r.payment).length} run awaiting Finance` : "None"}</span>
            </li>
          </ul>
          <p className="mt-3 text-[10px] text-muted-foreground">Segregation of duties: whoever prepares a run cannot review, approve or release it, and nobody acts on two steps.</p>
        </Panel>

        {/* Payment readiness */}
        <Panel icon={Banknote} title="Payment readiness" sub={run ? `${run.totals.employees} accounts · ${money(run.totals.net)}` : "—"} href={run ? `${PAYROLL_HREF}/${run.id}/breakdown?view=net` : undefined}>
          {run ? (
            <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-xs">
              <dt className="text-muted-foreground">Net pay to send</dt><dd className="tabular-nums">{money(pay?.amount ?? run.totals.net)}</dd>
              <dt className="text-muted-foreground">Account issues</dt><dd className={cn("tabular-nums", bankIssues.length && "text-rose-600")}>{bankIssues.length}</dd>
              <dt className="text-muted-foreground">Payment batch</dt><dd>{!pay ? (locked ? "Awaiting authorisation" : "Not ready") : pay.status === "settled" ? "Settled" : pay.status === "submitted" ? "With the bank" : "Authorised"}</dd>
              {pay?.status === "settled" && (
                <>
                  <dt className="text-muted-foreground">Settled</dt><dd className="tabular-nums">{money(pay.settledAmount ?? 0)}</dd>
                  <dt className="text-muted-foreground">Rejected, unresolved</dt><dd className={cn("tabular-nums", rejected.length && "text-rose-600")}>{rejected.length}</dd>
                </>
              )}
            </dl>
          ) : (
            <p className="text-xs text-muted-foreground">No run to pay.</p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        {/* Deadlines */}
        <Panel icon={CalendarClock} title="Statutory deadlines" sub="Overdue first, then the next due" href={`${PAYROLL_HREF}?tab=remittances`}>
          <ul className="space-y-1.5 text-xs">
            {deadlines.map((r) => (
              <li key={r.key + (r.projected ? ":p" : "")} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate"><span className={cn("tabular-nums", r.overdue && "font-medium text-rose-600")}>{fmtDate(r.due)}</span> · {r.title} <span className="text-muted-foreground">({r.monthLabel}{r.projected ? ", estimate" : ""})</span></span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="tabular-nums">{compactNaira(r.outstanding)}</span>
                  {!r.projected && <RemittanceBadge status={r.status} />}
                  <RowActions
                    label={`${r.title} actions`}
                    actions={
                      r.projected
                        ? [{ label: "Open the run (estimate)", icon: Eye, href: `${PAYROLL_HREF}/${r.runs[0]?.id ?? ""}` }]
                        : [
                            { label: "View in Remittance Centre", icon: Eye, href: `${PAYROLL_HREF}?tab=remittances` },
                            {
                              label: "Download schedule",
                              icon: FileSpreadsheet,
                              download: { onDownload: (f) => { const st = remittanceStatement(r.item, r.runs, remCtx); if (st) downloadRemittanceSchedule(st, f); } },
                            },
                            { label: "Liability statement (PDF)", icon: FileText, href: `${PAYROLL_HREF}/remittances/${r.month}/statement?item=${r.item}` },
                            ...(r.record && r.record.status !== "submitted" ? [{ label: "Payment confirmation (PDF)", icon: ShieldCheck, href: `${PAYROLL_HREF}/remittances/${r.month}/statement?item=${r.item}&doc=receipt` }] : []),
                          ]
                    }
                  />
                </span>
              </li>
            ))}
            {!deadlines.length && <li className="text-muted-foreground">Nothing outstanding.</li>}
          </ul>
        </Panel>

        {/* Variance */}
        <Panel icon={Sparkles} title="Variance explanation" sub={story && previous ? `${run!.title} against ${previous.period.label}` : "Needs a previous month"} href={run && previous ? `${PAYROLL_HREF}/compare?current=${run.id}&previous=${previous.id}` : undefined}>
          {story ? (
            <>
              <p className="text-xs">{story.headline}</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <BarList rows={story.drivers.slice(0, 5).map((d) => ({ label: d.label, value: d.amount, sub: `${d.employees}` }))} emptyText="No movement." />
                <ul className="space-y-1 text-[11px]">
                  {story.topEmployees.slice(0, 5).map((e) => (
                    <li key={e.employeeId} className="flex justify-between gap-2"><span className="truncate">{e.name}</span><span className={cn("tabular-nums", e.change < 0 && "text-rose-600")}>{e.change > 0 ? "+" : ""}{compactNaira(e.change)}</span></li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-2 text-[11px]">
                <span className={cn(story.comparison.reconciliation.balanced ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400")}>
                  {story.comparison.reconciliation.balanced ? "Reconciled to the register" : "Not fully reconciled"}
                </span>
                {Math.abs(story.comparison.reconciliation.unexplained) >= 0.005 && <span className="text-amber-700 dark:text-amber-400">{compactNaira(story.comparison.reconciliation.unexplained)} unclassified</span>}
                <Link href={`${INVESTIGATIONS_HREF}?status=open`} className="text-muted-foreground hover:text-foreground hover:underline">
                  {(data.investigations ?? []).filter((i) => i.status !== "resolved").length} open investigation{(data.investigations ?? []).filter((i) => i.status !== "resolved").length === 1 ? "" : "s"}
                </Link>
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Once a month is finalized, the next month&apos;s changes are explained here.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ icon: Icon, title, sub, href, children }: { icon: React.ComponentType<{ className?: string }>; title: string; sub?: string; href?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold"><Icon className="h-4 w-4 text-primary" /> {title}</p>
          {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        {href && <Link href={href} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline">Open <ArrowRight className="h-3 w-3" /></Link>}
      </div>
      {children}
    </div>
  );
}

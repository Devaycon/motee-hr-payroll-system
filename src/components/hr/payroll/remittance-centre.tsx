"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { BellRing, CalendarDays, ChevronDown, ChevronRight, FileCheck2, FileSpreadsheet, FileText, Paperclip, Send, ShieldCheck, Users, Eye, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { HrStatCardsGrid, type HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import { PAYROLL_HREF, PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { DownloadMenu, RowActions } from "./components/row-actions";
import { REMITTANCE_ITEMS, downloadAllRemittances, downloadRemittanceSchedule, remittanceStatement, type RemittanceCtx } from "@/src/lib/payroll/remittances";
import { REMITTANCE_STATUS_META, projectedRows, remindersDue, remittanceRows, summarise, type RemittanceRow, type RemittanceStatus } from "@/src/lib/payroll/remittance-centre";
import { buildAuditPack, downloadAuditPack } from "@/src/lib/payroll/audit-pack";
import { useCurrentActor, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { useCan } from "@/src/lib/permissions/use-can";
import type { RemittanceRecord } from "@/src/lib/stores/payroll-slice";
import { cn } from "@/src/lib/utils";
import { compactNaira } from "./components/charts";
import { fmtDate, money } from "./components/shared";

const TONE: Record<string, string> = {
  muted: "bg-muted text-muted-foreground",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
};

export function RemittanceBadge({ status }: { status: RemittanceStatus }) {
  const m = REMITTANCE_STATUS_META[status];
  return <span title={m.hint} className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", TONE[m.tone])}>{m.label}</span>;
}

const today = () => new Date().toISOString().slice(0, 10);

/** The remittance rows for the tenant, plus projected ones for open runs. */
export function useRemittanceRows() {
  const { data } = useTenantPayroll();
  const [day] = useState(today);
  return useMemo(() => {
    const rows = remittanceRows(data?.runs ?? [], data?.remittances, day);
    return { rows, projected: projectedRows(data?.runs ?? [], day), today: day };
  }, [data, day]);
}

/**
 * Automated reminders: when someone who can act on payroll opens it, any
 * obligation due within the reminder window (or overdue) that hasn't been
 * reminded at that stage notifies the payroll and finance users once.
 */
export function useRemittanceReminders() {
  const { data } = useTenantPayroll();
  const actions = usePayrollActions();
  const canEdit = useCan(PAYROLL_MODULE, "create");
  const { rows } = useRemittanceRows();
  const fired = useRef(false);
  useEffect(() => {
    if (!data || !canEdit || fired.current || !actions.ready) return;
    fired.current = true;
    const due = remindersDue(rows, data.settings.remittanceReminderDays ?? 5, data.remindersSent);
    if (due.length) actions.sendRemittanceReminders(due);
  }, [data, canEdit, rows, actions]);
}

function readFile(file: File): Promise<NonNullable<RemittanceRecord["receipt"]>> {
  return new Promise((resolve) => {
    const base = { fileName: file.name, uploadedAt: new Date().toISOString() };
    // Small files are kept so the receipt can be opened again; large ones keep their name only (demo storage is the browser).
    if (file.size > 400_000) return resolve(base);
    const r = new FileReader();
    r.onload = () => resolve({ ...base, dataUrl: String(r.result) });
    r.onerror = () => resolve(base);
    r.readAsDataURL(file);
  });
}

type Dialogs = { kind: "submit" | "pay"; row: RemittanceRow } | null;

export function RemittanceCentre() {
  const { data, bundle } = useTenantPayroll();
  const actions = usePayrollActions();
  const actor = useCurrentActor();
  const canEdit = useCan(PAYROLL_MODULE, "create");
  const { rows, projected, today: day } = useRemittanceRows();
  const [open, setOpen] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(day);
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<RemittanceRecord["receipt"]>(null);
  const [view, setView] = useState<"months" | "calendar">("months");

  const ctx = useMemo<RemittanceCtx>(
    () => ({ people: new Map((bundle?.employees ?? []).map((e) => [e.id, e])), profiles: new Map((data?.profiles ?? []).map((p) => [p.employeeId, p])), settings: data?.settings }),
    [bundle, data],
  );
  const sum = summarise([...rows, ...projected]);
  const months = useMemo(() => {
    const m = new Map<string, RemittanceRow[]>();
    for (const r of rows) m.set(r.month, [...(m.get(r.month) ?? []), r]);
    return [...m.entries()];
  }, [rows]);

  if (!data) return null;
  if (!rows.length && !projected.length) return <p className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">Finalize a run to see what&apos;s due.</p>;

  const cards: HrStatCardItem[] = [
    { label: "Outstanding", value: compactNaira(sum.outstanding), sub: "Calculated or submitted, not yet confirmed paid", icon: FileText, tone: "violet" },
    { label: "Overdue", value: compactNaira(sum.overdue), sub: `${sum.overdueCount} remittance${sum.overdueCount === 1 ? "" : "s"} past the deadline`, icon: BellRing, tone: sum.overdueCount ? "red" : "emerald" },
    { label: "Due in 7 days", value: String(sum.dueSoonCount), sub: sum.nextDue ? `Next: ${sum.nextDue.title} · ${fmtDate(sum.nextDue.due)}` : "Nothing due soon", icon: CalendarDays, tone: "amber" },
    { label: "Awaiting reconciliation", value: String(sum.awaitingReconciliation), sub: "Paid — match the receipt against the liability", icon: FileCheck2, tone: "blue" },
  ];

  const openDialog = (kind: "submit" | "pay", row: RemittanceRow) => {
    setDialog({ kind, row });
    setRef(row.record?.reference ?? "");
    setDate(day);
    setAmount(String(row.outstanding || row.liability));
    setReceipt(row.record?.receipt ?? null);
  };

  const remind = () => {
    const due = remindersDue([...rows, ...projected.filter((p) => p.daysToDue >= 0)], data.settings.remittanceReminderDays ?? 5, undefined);
    if (!due.length) return toast.info("Nothing is due within the reminder window.");
    actions.sendRemittanceReminders(due);
    toast.success(`Reminded payroll and finance users of ${due.length} obligation${due.length === 1 ? "" : "s"}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <HrStatCardsGrid stats={cards} columns={4} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border p-0.5 text-xs">
          {(["months", "calendar"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={cn("rounded-md px-3 py-1", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
              {v === "months" ? "By pay month" : "Remittance calendar"}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Calculated → Submitted → Paid → Reconciled. A liability statement is never proof of payment. Reminders go to payroll and finance {data.settings.remittanceReminderDays ?? 5} days before each deadline and when overdue.
        </p>
      </div>

      {view === "calendar" ? (
        <Calendar rows={[...rows.filter((r) => r.outstanding > 0), ...projected]} onRemind={canEdit ? remind : undefined} />
      ) : (
        months.map(([month, monthRows]) => {
          const label = monthRows[0].monthLabel;
          const monthRuns = monthRows[0].runs;
          return (
            <div key={month} className="overflow-hidden rounded-xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{monthRuns.length} finalized run{monthRuns.length === 1 ? "" : "s"} · {monthRuns.map((r) => r.title).join(", ")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                <DownloadMenu
                  label="Audit pack"
                  title="Summary, reconciliation, outstanding, evidence, schedules, history"
                  onDownload={(f) => {
                    const pack = buildAuditPack(month, rows, ctx, data.audit, actor.name);
                    if (!pack) return;
                    downloadAuditPack(pack, f);
                    actions.logExport("", `Statutory Remittance Audit Pack — ${label} (${f.toUpperCase()})`);
                  }}
                />
                <DownloadMenu
                  label="All schedules"
                  onDownload={(f) => {
                    const all = REMITTANCE_ITEMS.map((i) => remittanceStatement(i, monthRuns, ctx)).filter((x) => !!x && x.total > 0);
                    downloadAllRemittances(all as NonNullable<(typeof all)[number]>[], month, f);
                    actions.logExport("", `All statutory remittance schedules — ${label} (${f.toUpperCase()})`);
                  }}
                />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-xs">
                  <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
                    <tr>
                      <th className="w-6 px-2" />
                      <th className="px-3 py-2 font-medium">Statutory authority</th>
                      <th className="px-3 py-2 text-right font-medium">Amount due</th>
                      <th className="px-3 py-2 font-medium">Due date</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 text-right font-medium">Outstanding</th>
                      <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthRows.map((r) => {
                      const expanded = open === r.key;
                      return (
                        <Fragment key={r.key}>
                          <tr className={cn("border-t", r.liability > 0 && "cursor-pointer hover:bg-muted/40")} onClick={() => r.liability > 0 && setOpen(expanded ? null : r.key)}>
                            <td className="px-2 text-muted-foreground">{r.liability > 0 && (expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)}</td>
                            <td className="px-3 py-2.5">
                              <p className="font-medium">{r.title}</p>
                              <p className="text-[10px] text-muted-foreground">{r.to}</p>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{money(r.liability)}</td>
                            <td className={cn("px-3 py-2.5 tabular-nums", r.overdue && "font-medium text-rose-600")}>{fmtDate(r.due)}</td>
                            <td className="px-3 py-2.5"><RemittanceBadge status={r.status} />{r.overdue && r.record?.status === "submitted" && <span className="ml-1 text-[10px] text-muted-foreground">(instruction sent)</span>}</td>
                            <td className={cn("px-3 py-2.5 text-right tabular-nums", r.outstanding > 0 && "font-medium")}>{r.liability > 0 ? money(r.outstanding) : "—"}</td>
                            <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                              {r.liability > 0 && (
                                <RowActions
                                  label={`${r.title} actions`}
                                  actions={[
                                    { label: expanded ? "Hide details" : "View details", icon: Eye, onSelect: () => setOpen(expanded ? null : r.key) },
                                    {
                                      label: "Download schedule",
                                      icon: FileSpreadsheet,
                                      download: {
                                        onDownload: (f) => {
                                          const st = remittanceStatement(r.item, r.runs, ctx);
                                          if (!st) return;
                                          downloadRemittanceSchedule(st, f);
                                          actions.logExport("", `${r.title} schedule — ${r.monthLabel} (${f.toUpperCase()})`);
                                        },
                                      },
                                    },
                                    { label: "Liability statement (PDF)", icon: FileText, href: `${PAYROLL_HREF}/remittances/${r.month}/statement?item=${r.item}` },
                                    ...(r.record && r.record.status !== "submitted" ? [{ label: "Payment confirmation (PDF)", icon: ShieldCheck, href: `${PAYROLL_HREF}/remittances/${r.month}/statement?item=${r.item}&doc=receipt` }] : []),
                                    ...(canEdit && r.status !== "reconciled" && (r.status === "calculated" || (r.status === "overdue" && !r.record)) ? [{ label: "Mark instruction sent", icon: Send, onSelect: () => openDialog("submit", r), separated: true }] : []),
                                    ...(canEdit && r.status !== "reconciled" && r.outstanding > 0 ? [{ label: "Record payment", icon: Banknote, onSelect: () => openDialog("pay", r) }] : []),
                                    ...(canEdit && r.status === "paid"
                                      ? [{ label: "Reconcile", icon: ShieldCheck, onSelect: () => { const res = actions.reconcileRemittance(r); if (res.ok) toast.success(`${r.title} reconciled`); else toast.error(res.reason); } }]
                                      : []),
                                  ]}
                                />
                              )}
                            </td>
                          </tr>
                          {expanded && <Detail row={r} ctx={ctx} canEdit={canEdit} />}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.kind === "submit" ? "Payment instruction sent" : "Record payment"}</DialogTitle>
            <DialogDescription>
              {dialog?.row.title} — {dialog?.row.monthLabel}.{" "}
              {dialog?.kind === "submit"
                ? "Marks the remittance as submitted. It isn't paid until the payment is confirmed."
                : "Confirms payment. A payment is only recorded with evidence: attach the bank receipt or the authority's acknowledgement."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="rem-ref" className="text-xs">{dialog?.kind === "submit" ? "Instruction / RRR reference" : "Payment reference"}</Label><Input id="rem-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. REMITA 2701-8834-1923" /></div>
            <div className="space-y-1"><Label htmlFor="rem-date" className="text-xs">{dialog?.kind === "submit" ? "Date sent" : "Date paid"}</Label><Input id="rem-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            {dialog?.kind === "pay" && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="rem-amt" className="text-xs">Amount paid (₦)</Label>
                  <Input id="rem-amt" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <p className="text-[10px] text-muted-foreground">Liability {money(dialog.row.liability)}{dialog.row.paid ? ` · ${money(dialog.row.paid)} paid already` : ""}</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rem-receipt" className="text-xs">Bank receipt or acknowledgement (required)</Label>
                  <Input id="rem-receipt" type="file" accept=".pdf,image/*" className="text-xs" onChange={async (e) => { const f = e.target.files?.[0]; setReceipt(f ? await readFile(f) : null); }} />
                  {receipt && <p className="truncate text-[10px] text-muted-foreground">{receipt.fileName}</p>}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              disabled={ref.trim().length < 3 || !date || (dialog?.kind === "pay" && (!(Number(amount) > 0) || !receipt))}
              onClick={() => {
                if (!dialog) return;
                if (dialog.kind === "submit") {
                  actions.submitRemittance(dialog.row.key, ref.trim(), date);
                  toast.success("Marked as submitted");
                } else {
                  const total = Math.min(dialog.row.liability, (dialog.row.record?.status === "submitted" ? 0 : dialog.row.paid) + Number(amount));
                  const res = actions.recordRemittancePayment(dialog.row.key, { reference: ref.trim(), date, amountPaid: Math.round(total * 100) / 100, receipt });
                  if (!res.ok) return toast.error(res.reason);
                  toast.success(total < dialog.row.liability - 0.5 ? `Part payment recorded — ${money(dialog.row.liability - total)} still outstanding` : "Payment recorded");
                }
                setDialog(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Level 2 (employee breakdown) and level 3 (payment evidence) for one remittance. */
function Detail({ row, ctx, canEdit }: { row: RemittanceRow; ctx: RemittanceCtx; canEdit: boolean }) {
  const actions = usePayrollActions();
  const st = useMemo(() => remittanceStatement(row.item, row.runs, ctx), [row, ctx]);
  const rec = row.record;
  const confirmed = rec && rec.status !== "submitted";
  const head = st?.table.headers ?? [];
  const data = st?.table.data ?? [];
  return (
    <tr className="border-t bg-[color-mix(in_oklab,var(--muted)_25%,var(--card))]">
      <td />
      <td colSpan={6} className="px-3 py-3">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold"><Users className="h-3.5 w-3.5" /> Employee breakdown · {st?.contributors ?? 0} employees</p>
            <div className="max-h-64 max-w-full overflow-auto rounded-md border bg-card">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-card text-left text-muted-foreground">
                  <tr>{head.map((h) => <th key={h} className="whitespace-nowrap px-2 py-1.5 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {data.slice(0, 200).map((r, i) => (
                    <tr key={i} className="border-t">{r.map((c, j) => <td key={j} className={cn("whitespace-nowrap px-2 py-1", typeof c === "number" && "text-right tabular-nums")}>{typeof c === "number" ? c.toLocaleString("en-NG", { maximumFractionDigits: 2 }) : c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="space-y-2 text-[11px]">
            <p className="flex items-center gap-1.5 font-semibold"><FileCheck2 className="h-3.5 w-3.5" /> Payment evidence</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-muted-foreground">Payment reference</dt><dd className="font-mono">{rec?.reference || "—"}</dd>
              <dt className="text-muted-foreground">{rec?.status === "submitted" ? "Instruction sent" : "Payment date"}</dt><dd>{rec?.date ? fmtDate(rec.date) : "—"}</dd>
              <dt className="text-muted-foreground">Amount paid</dt><dd className="tabular-nums">{confirmed ? money(row.paid) : "—"}</dd>
              <dt className="text-muted-foreground">Bank receipt</dt>
              <dd>
                {rec?.receipt ? (
                  rec.receipt.dataUrl ? <a href={rec.receipt.dataUrl} download={rec.receipt.fileName} className="text-primary hover:underline">{rec.receipt.fileName}</a> : rec.receipt.fileName
                ) : (
                  "Not uploaded"
                )}
              </dd>
              <dt className="text-muted-foreground">Reconciliation</dt>
              <dd>{rec?.status === "reconciled" ? `Reconciled by ${rec.reconciledBy} on ${fmtDate(rec.reconciledAt ?? "")}` : confirmed ? (row.outstanding > 0 ? `${money(row.outstanding)} short of the liability` : "Ready to reconcile") : "Not paid yet"}</dd>
            </dl>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" asChild>
                <Link href={`${PAYROLL_HREF}/remittances/${row.month}/statement?item=${row.item}`}><FileText className="h-3 w-3" /> Liability statement</Link>
              </Button>
              <DownloadMenu size="xs" label="Schedule" disabled={!st} onDownload={(f) => { if (st) { downloadRemittanceSchedule(st, f); actions.logExport("", `${row.title} schedule — ${row.monthLabel} (${f.toUpperCase()})`); } }} />
              {confirmed && (
                <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" asChild>
                  <Link href={`${PAYROLL_HREF}/remittances/${row.month}/statement?item=${row.item}&doc=receipt`}><ShieldCheck className="h-3 w-3" /> Payment confirmation</Link>
                </Button>
              )}
              {canEdit && confirmed && !rec?.receipt && (
                <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border px-2 text-[11px] hover:bg-muted">
                  <Paperclip className="h-3 w-3" /> Upload receipt
                  <input type="file" accept=".pdf,image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { actions.attachRemittanceReceipt(row.key, await readFile(f)); toast.success("Receipt attached"); } }} />
                </label>
              )}
              {canEdit && rec && rec.status !== "reconciled" && (
                <Button size="sm" variant="ghost" className="h-7 text-[11px] text-muted-foreground" onClick={() => { actions.clearRemittance(row.key); toast.success("Record cleared"); }}>Clear record</Button>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

/** Upcoming obligations by due date — overdue first, then the next 60 days. */
function Calendar({ rows, onRemind }: { rows: RemittanceRow[]; onRemind?: () => void }) {
  const sorted = [...rows].sort((a, b) => a.due.localeCompare(b.due));
  const overdue = sorted.filter((r) => r.overdue);
  const upcoming = sorted.filter((r) => !r.overdue && r.daysToDue >= 0 && r.daysToDue <= 60);
  const byDay = new Map<string, RemittanceRow[]>();
  for (const r of upcoming) byDay.set(r.due, [...(byDay.get(r.due) ?? []), r]);
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Remittance calendar</p>
          <p className="text-[11px] text-muted-foreground">Upcoming statutory obligations, including estimates from runs still being prepared.</p>
        </div>
        {onRemind && <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onRemind}><BellRing className="h-3.5 w-3.5" /> Send reminders now</Button>}
      </div>
      <div className="divide-y">
        {overdue.length > 0 && (
          <div className="px-4 py-3">
            <p className="mb-2 text-[11px] font-semibold text-rose-600">Overdue</p>
            {overdue.map((r) => <CalRow key={r.key} r={r} />)}
          </div>
        )}
        {[...byDay.entries()].map(([d, rs]) => (
          <div key={d} className="grid grid-cols-[88px_1fr] gap-3 px-4 py-3">
            <div>
              <p className="text-sm font-semibold tabular-nums">{new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</p>
              <p className="text-[10px] text-muted-foreground">{rs[0].daysToDue === 0 ? "Today" : `in ${rs[0].daysToDue} day${rs[0].daysToDue === 1 ? "" : "s"}`}</p>
            </div>
            <div>{rs.map((r) => <CalRow key={r.key} r={r} />)}</div>
          </div>
        ))}
        {!overdue.length && !upcoming.length && <p className="p-6 text-center text-xs text-muted-foreground">Nothing due in the next 60 days.</p>}
      </div>
    </div>
  );
}

function CalRow({ r }: { r: RemittanceRow }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-xs">
      <span className="min-w-0">
        <span className="font-medium">{r.title}</span> <span className="text-muted-foreground">· {r.monthLabel} · {r.to}</span>
        {r.projected && <span className="ml-1 rounded bg-muted px-1 text-[10px] text-muted-foreground">estimate</span>}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="tabular-nums">{money(r.outstanding)}</span>
        {!r.projected && <RemittanceBadge status={r.status} />}
      </span>
    </div>
  );
}

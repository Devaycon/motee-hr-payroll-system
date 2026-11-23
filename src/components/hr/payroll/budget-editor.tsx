"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Copy, Save, Send, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { PAYROLL_HREF, PAYROLL_SETTINGS_MODULE } from "@/src/lib/payroll/constants";
import { BUDGET_STATUS_LABELS, budgetFromCurrent, buildForecast, monthShort, spreadEvenly, yearMonths, type BudgetDimension, type BudgetVersion } from "@/src/lib/payroll/budget";
import { round2 } from "@/src/lib/payroll/ng/engine";
import { useCurrentActor, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import { compactNaira } from "./components/charts";
import { NotSupported, fmtDate, money } from "./components/shared";

const STATUS_TONE: Record<BudgetVersion["status"], string> = {
  draft: "text-muted-foreground",
  submitted: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  approved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  superseded: "text-muted-foreground line-through",
};

/**
 * `/time-payroll/payroll/budget/edit?version=…` — payroll budget versions:
 * monthly phasing by department or cost centre, submitted and approved by
 * a second person. Approved versions are kept; changes need a new version.
 */
export function PayrollBudgetEditor() {
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const me = useCurrentActor();
  const router = useRouter();
  const search = useSearchParams();
  const canEdit = useCan(PAYROLL_SETTINGS_MODULE, "edit");
  const versions = useMemo(() => [...(data?.budgets ?? [])].sort((a, b) => b.fiscalYear - a.fiscalYear || b.updatedAt.localeCompare(a.updatedAt)), [data]);
  const selectedId = search.get("version");
  const stored = versions.find((v) => v.id === selectedId) ?? null;
  const [draft, setDraft] = useState<BudgetVersion | null>(null);
  const [seed, setSeed] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [newYear, setNewYear] = useState<number | null>(null);
  const [uplift, setUplift] = useState("5");
  // Load the chosen version into the editor (adjusting state while rendering).
  const key = stored ? `${stored.id}:${stored.updatedAt}:${stored.status}` : null;
  if (key !== seed) {
    setSeed(key);
    setDraft(stored ? structuredClone(stored) : null);
  }

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data || !bundle) return <Skeleton className="h-150 w-full rounded-xl" />;

  const go = (id: string | null) => router.replace(id ? `?version=${id}` : "?");
  const editable = !!draft && canEdit && draft.status === "draft";
  const months = draft ? yearMonths(draft.fiscalYear) : [];
  const total = (m: string) => round2((draft?.lines ?? []).reduce((s, l) => s + (l.months[m] ?? 0), 0));
  const lineTotal = (l: BudgetVersion["lines"][number]) => round2(months.reduce((s, m) => s + (l.months[m] ?? 0), 0));
  const grand = round2(months.reduce((s, m) => s + total(m), 0));
  const baseYear = data.runs.reduce((y, r) => Math.max(y, r.period.year), 0) || new Date().getFullYear();
  const keysFor = (dim: BudgetDimension) => (dim === "department" ? bundle.departments.map((d) => d.name) : bundle.departments.map((d) => d.costCenter)).sort();

  const create = (from: "approved" | "current" | "empty") => {
    const year = newYear ?? baseYear + 1;
    const approved = versions.find((v) => v.fiscalYear === year && v.status === "approved");
    const f = buildForecast({ data, bundle });
    const lines =
      from === "approved" && approved
        ? structuredClone(approved.lines)
        : from === "current" && f
          ? budgetFromCurrent(f, year, Number(uplift) || 0, data, bundle)
          : keysFor("department").map((k) => ({ key: k, months: Object.fromEntries(yearMonths(year).map((m) => [m, 0])) }));
    const n = versions.filter((v) => v.fiscalYear === year).length + 1;
    const v: BudgetVersion = {
      id: `BUD-${year}-V${n}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      name: `FY${year} payroll budget — version ${n}`,
      fiscalYear: year,
      dimension: from === "approved" && approved ? approved.dimension : "department",
      lines,
      status: "draft",
      createdBy: me.name,
      createdById: me.employeeId,
      createdAt: "",
      updatedAt: "",
      history: [],
    };
    actions.saveBudgetVersion(v);
    go(v.id);
    toast.success("Draft budget created");
  };
  const setCell = (k: string, m: string, value: number) => setDraft((d) => (d ? { ...d, lines: d.lines.map((l) => (l.key === k ? { ...l, months: { ...l.months, [m]: value } } : l)) } : d));
  const spread = (k: string, annual: number) => setDraft((d) => (d ? { ...d, lines: d.lines.map((l) => (l.key === k ? { ...l, months: spreadEvenly(annual, d.fiscalYear) } : l)) } : d));
  const changed = !!draft && !!stored && JSON.stringify(draft.lines) !== JSON.stringify(stored.lines) || (!!draft && !!stored && draft.name !== stored.name);

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div>
        <Link href={`${PAYROLL_HREF}/budget`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Budget & Forecasting</Link>
        <h1 className="mt-1 text-2xl font-semibold">Payroll budgets</h1>
        <p className="text-xs text-muted-foreground">Annual payroll budget by department or cost centre, phased by month. Cost = gross pay + employer contributions. A second person approves each version; approved versions are kept for audit.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border bg-card">
            <p className="border-b px-4 py-3 text-sm font-semibold">Versions</p>
            <ul className="divide-y text-xs">
              {versions.map((v) => (
                <li key={v.id}>
                  <button type="button" onClick={() => go(v.id)} className={cn("w-full px-4 py-2 text-left hover:bg-muted/50", v.id === selectedId && "bg-muted")}>
                    <span className="font-medium">{v.name}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className={cn("text-[10px]", STATUS_TONE[v.status])}>{BUDGET_STATUS_LABELS[v.status]}</Badge>
                      {v.approvedBy && v.status !== "draft" ? `${v.approvedBy} · ${fmtDate(v.approvedAt)}` : `by ${v.createdBy}`}
                    </span>
                  </button>
                </li>
              ))}
              {!versions.length && <li className="px-4 py-3 text-muted-foreground">No budgets yet.</li>}
            </ul>
          </div>

          {canEdit && (
            <div className="space-y-2 rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold">New version</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Fiscal year</Label>
                  <Select value={String(newYear ?? baseYear + 1)} onValueChange={(v) => setNewYear(Number(v))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{[baseYear, baseYear + 1, baseYear + 2].map((y) => <SelectItem key={y} value={String(y)} className="text-xs">FY{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Uplift on current (%)</Label>
                  <Input className="h-8 text-xs" value={uplift} onChange={(e) => setUplift(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => create("current")}><Copy className="h-3.5 w-3.5" /> From current payroll cost + uplift</Button>
                <Button size="sm" variant="outline" disabled={!versions.some((v) => v.fiscalYear === (newYear ?? baseYear + 1) && v.status === "approved")} onClick={() => create("approved")}>Copy the approved version</Button>
                <Button size="sm" variant="ghost" onClick={() => create("empty")}>Start empty</Button>
              </div>
            </div>
          )}
        </div>

        {draft ? (
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Name</Label>
                <Input className="h-8 w-72 text-xs" value={draft.name} disabled={!editable} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Allocated by</Label>
                <Select
                  value={draft.dimension}
                  disabled={!editable}
                  onValueChange={(v) => {
                    const dim = v as BudgetDimension;
                    const map = new Map(bundle.departments.map((d) => (dim === "costCentre" ? [d.name, d.costCenter] : [d.costCenter, d.name])));
                    setDraft({ ...draft, dimension: dim, lines: draft.lines.map((l) => ({ ...l, key: map.get(l.key) ?? l.key })) });
                  }}
                >
                  <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="department" className="text-xs">Department</SelectItem><SelectItem value="costCentre" className="text-xs">Cost centre</SelectItem></SelectContent>
                </Select>
              </div>
              <Badge variant="outline" className={cn("mb-1.5 text-[10px]", STATUS_TONE[draft.status])}>{BUDGET_STATUS_LABELS[draft.status]}</Badge>
              <div className="ml-auto flex flex-wrap gap-2">
                {editable && (
                  <>
                    <Button size="sm" className="gap-1.5" disabled={!changed} onClick={() => { actions.saveBudgetVersion(draft); toast.success("Budget saved"); }}><Save className="h-3.5 w-3.5" /> Save</Button>
                    <Button size="sm" variant="outline" className="gap-1.5" disabled={changed || grand <= 0} onClick={() => { actions.submitBudgetVersion(draft.id); toast.success("Submitted for approval"); }}><Send className="h-3.5 w-3.5" /> Submit for approval</Button>
                    <Button size="sm" variant="ghost" className="gap-1 text-rose-600" onClick={() => { actions.deleteBudgetVersion(draft.id); go(null); }}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                  </>
                )}
              </div>
            </div>

            {draft.status === "submitted" && canEdit && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/5 p-3 text-xs">
                <span>Submitted by {draft.submittedBy} on {fmtDate(draft.submittedAt)}. {draft.submittedBy === me.name ? "Another person must approve it." : "Approving replaces the current approved version for the year, which is kept."}</span>
                {draft.submittedBy !== me.name && (
                  <span className="ml-auto flex flex-wrap items-center gap-2">
                    <Input className="h-8 w-56 text-xs" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
                    <Button size="sm" className="gap-1" onClick={() => { const r = actions.decideBudgetVersion(draft.id, true, note); if (!r.ok) toast.error(r.reason); else toast.success("Budget approved"); }}><ShieldCheck className="h-3.5 w-3.5" /> Approve</Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => { const r = actions.decideBudgetVersion(draft.id, false, note); if (!r.ok) toast.error(r.reason); else toast.success("Returned to draft"); }}><Undo2 className="h-3.5 w-3.5" /> Return</Button>
                  </span>
                )}
              </div>
            )}
            {(draft.status === "approved" || draft.status === "superseded") && (
              <p className="rounded-xl border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {draft.status === "approved" ? `Approved by ${draft.approvedBy} on ${fmtDate(draft.approvedAt)}.` : "Superseded by a later approved version."} Approved budgets can&apos;t be edited. Create a new version to change it.
              </p>
            )}

            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <p className="text-sm font-semibold">Monthly phasing · FY{draft.fiscalYear}</p>
                <p className="text-xs tabular-nums text-muted-foreground">Annual total <span className="font-semibold text-foreground">{money(grand, 0)}</span></p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px] text-[11px]">
                  <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
                    <tr>
                      <th className="sticky left-0 bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] px-3 py-2 font-medium">{draft.dimension === "department" ? "Department" : "Cost centre"}</th>
                      {months.map((m) => <th key={m} className="px-1 py-2 text-right font-medium">{monthShort(m)}</th>)}
                      <th className="px-3 py-2 text-right font-medium">Annual</th>
                      {editable && <th className="px-3 py-2 font-medium">Spread evenly</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {draft.lines.map((l) => (
                      <tr key={l.key} className="border-t">
                        <td className="sticky left-0 bg-card px-3 py-1 font-medium">{l.key}</td>
                        {months.map((m) => (
                          <td key={m} className="px-1 py-1">
                            {editable ? (
                              <Input type="number" className="h-7 w-[88px] px-1.5 text-right text-[11px] tabular-nums" value={l.months[m] ?? 0} onChange={(e) => setCell(l.key, m, Number(e.target.value) || 0)} aria-label={`${l.key} ${monthShort(m)}`} />
                            ) : (
                              <span className="block text-right tabular-nums">{compactNaira(l.months[m] ?? 0)}</span>
                            )}
                          </td>
                        ))}
                        <td className="px-3 py-1 text-right font-medium tabular-nums">{compactNaira(lineTotal(l))}</td>
                        {editable && (
                          <td className="px-3 py-1">
                            <SpreadInput onSpread={(annual) => spread(l.key, annual)} />
                          </td>
                        )}
                      </tr>
                    ))}
                    <tr className="border-t-2 border-foreground/20 font-semibold">
                      <td className="sticky left-0 bg-card px-3 py-1.5">Total</td>
                      {months.map((m) => <td key={m} className="px-1 py-1.5 text-right tabular-nums">{compactNaira(total(m))}</td>)}
                      <td className="px-3 py-1.5 text-right tabular-nums">{compactNaira(grand)}</td>
                      {editable && <td />}
                    </tr>
                  </tbody>
                </table>
              </div>
              {editable && (
                <div className="border-t px-4 py-2">
                  <AddLine keys={keysFor(draft.dimension).filter((k) => !draft.lines.some((l) => l.key === k))} onAdd={(k) => setDraft({ ...draft, lines: [...draft.lines, { key: k, months: Object.fromEntries(months.map((m) => [m, 0])) }] })} />
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold">Version history</p>
              <ol className="mt-2 space-y-1.5 text-xs">
                {[...draft.history].reverse().map((h, i) => (
                  <li key={i}><span className="font-medium">{h.actor}</span> — {h.action}{h.note ? `: ${h.note}` : ""} <span className="text-[10px] text-muted-foreground">· {h.at ? new Date(h.at).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span></li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <p className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">Choose a version, or create a new one.</p>
        )}
      </div>
    </div>
  );
}

function SpreadInput({ onSpread }: { onSpread: (annual: number) => void }) {
  const [v, setV] = useState("");
  return (
    <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const n = Number(v); if (n > 0) { onSpread(n); setV(""); } }}>
      <Input className="h-7 w-28 text-[11px]" placeholder="Annual ₦" value={v} onChange={(e) => setV(e.target.value)} />
      <Button size="sm" variant="ghost" className="h-7 text-[11px]" type="submit">Spread</Button>
    </form>
  );
}

function AddLine({ keys, onAdd }: { keys: string[]; onAdd: (k: string) => void }) {
  if (!keys.length) return null;
  return (
    <Select value="" onValueChange={onAdd}>
      <SelectTrigger className="h-8 w-56 text-xs"><SelectValue placeholder="Add a line…" /></SelectTrigger>
      <SelectContent>{keys.map((k) => <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>)}</SelectContent>
    </Select>
  );
}

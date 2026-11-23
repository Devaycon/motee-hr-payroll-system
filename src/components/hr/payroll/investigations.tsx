"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleDot, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { INVESTIGATIONS_HREF, useCurrentActor, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { InvestigationStatus, VarianceInvestigation } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { NotSupported, fmtDate, money } from "./components/shared";

export const INVESTIGATION_STATUS_LABELS: Record<InvestigationStatus, string> = {
  open: "Open",
  investigating: "Under investigation",
  resolved: "Resolved",
};

const STATUS_TONE: Record<InvestigationStatus, string> = {
  open: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  investigating: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  resolved: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
};

export function InvestigationStatusBadge({ inv }: { inv: VarianceInvestigation }) {
  const awaiting = inv.status === "resolved" && inv.signOff?.decision !== "accepted";
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge variant="outline" className={cn("text-[10px] font-medium", STATUS_TONE[inv.status])}>{INVESTIGATION_STATUS_LABELS[inv.status]}</Badge>
      {awaiting && <Badge variant="outline" className="text-[10px]">Awaiting sign-off</Badge>}
      {inv.signOff?.decision === "accepted" && (
        <Badge variant="outline" className="gap-1 text-[10px]"><ShieldCheck className="h-3 w-3" /> Signed off</Badge>
      )}
    </span>
  );
}

export interface InvestigationDraft {
  runId: string;
  previousRunId: string;
  periodLabel: string;
  employeeId?: string;
  employeeName?: string;
  reason?: string;
  amount: number;
  title: string;
  finding: string;
}

/** Raise an investigation on a movement: title, what the system found, owner, due date. */
export function RaiseInvestigationDialog({ draft, onClose }: { draft: InvestigationDraft | null; onClose: () => void }) {
  const actions = usePayrollActions();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [finding, setFinding] = useState("");
  const [owner, setOwner] = useState<{ id: string; name: string } | null>(null);
  const [due, setDue] = useState("");
  const [seed, setSeed] = useState<InvestigationDraft | null>(null);
  // Reset the form whenever a new movement is chosen.
  if (draft && draft !== seed) {
    setSeed(draft);
    setTitle(draft.title);
    setFinding(draft.finding);
    setOwner(null);
    setDue("");
  }
  const submit = () => {
    if (!draft || !owner) return;
    const id = actions.openInvestigation({ ...draft, title: title.trim() || draft.title, finding: finding.trim() || draft.finding, ownerId: owner.id, ownerName: owner.name, dueDate: due || undefined });
    if (!id) return;
    toast.success(`Investigation ${id} opened and assigned to ${owner.name}`, { action: { label: "Open", onClick: () => router.push(`${INVESTIGATIONS_HREF}/${id}`) } });
    onClose();
  };
  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise a variance investigation</DialogTitle>
          <DialogDescription>
            {draft?.periodLabel} · {draft ? money(draft.amount) : ""}. The owner is notified and the case stays open until it is resolved and signed off by a second person.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input className="h-8 text-xs" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">What the system found</Label>
            <Textarea className="min-h-20 text-xs" value={finding} onChange={(e) => setFinding(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
            <div className="space-y-1">
              <Label className="text-xs">Owner</Label>
              <EmployeePicker value={owner?.id} clearable={false} placeholder="Assign to…" onChange={(e) => e && setOwner({ id: e.id, name: e.name })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Due by</Label>
              <Input type="date" className="h-8 text-xs" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!owner} onClick={submit}>Open investigation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Compact list of the investigations for one month (compare page, intelligence tab). */
export function InvestigationsPanel({ runId, className }: { runId: string; className?: string }) {
  const { data } = useTenantPayroll();
  const list = (data?.investigations ?? []).filter((i) => i.runId === runId);
  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Investigations</p>
          <p className="text-[11px] text-muted-foreground">{list.length ? `${list.filter((i) => i.status !== "resolved").length} open of ${list.length}` : "None raised for this month. Use Investigate on any movement."}</p>
        </div>
        <Link href={`${INVESTIGATIONS_HREF}?run=${runId}`} className="text-xs text-primary hover:underline">Register →</Link>
      </div>
      {list.length > 0 && (
        <ul className="divide-y text-xs">
          {list.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
              <Link href={`${INVESTIGATIONS_HREF}/${i.id}`} className="min-w-0 hover:text-primary">
                <span className="font-medium">{i.title}</span>
                <span className="block text-[10px] text-muted-foreground">{i.id} · {i.ownerName}{i.dueDate ? ` · due ${fmtDate(i.dueDate)}` : ""}</span>
              </Link>
              <span className="flex items-center gap-3">
                <span className="tabular-nums">{money(i.amount)}</span>
                <InvestigationStatusBadge inv={i} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const ALL = "__all__";

/**
 * `/time-payroll/payroll/investigations?status=&owner=&run=` — every variance
 * investigation, filterable by status, owner and month.
 */
export function InvestigationsRegisterPage() {
  const { data, bundle, loading, supported } = useTenantPayroll();
  const me = useCurrentActor();
  const router = useRouter();
  const search = useSearchParams();
  const status = search.get("status") ?? ALL;
  const owner = search.get("owner") ?? ALL;
  const run = search.get("run") ?? ALL;
  const [q, setQ] = useState("");
  const all = useMemo(() => data?.investigations ?? [], [data]);
  const runs = useMemo(() => [...new Map(all.map((i) => [i.runId, i.periodLabel])).entries()], [all]);
  const owners = useMemo(() => [...new Map(all.map((i) => [i.ownerId, i.ownerName])).entries()], [all]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data) return <Skeleton className="h-150 w-full rounded-xl" />;

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(search.toString());
    if (v === ALL) p.delete(k);
    else p.set(k, v);
    router.replace(`?${p.toString()}`);
  };
  const needle = q.trim().toLowerCase();
  const shown = all.filter(
    (i) =>
      (status === ALL || (status === "awaiting" ? i.status === "resolved" && i.signOff?.decision !== "accepted" : i.status === status)) &&
      (owner === ALL || (owner === "me" ? i.ownerId === me.employeeId : i.ownerId === owner)) &&
      (run === ALL || i.runId === run) &&
      (!needle || `${i.id} ${i.title} ${i.employeeName ?? ""} ${i.ownerName}`.toLowerCase().includes(needle)),
  );
  const count = (s: InvestigationStatus) => all.filter((i) => i.status === s).length;
  const awaiting = all.filter((i) => i.status === "resolved" && i.signOff?.decision !== "accepted").length;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div>
        <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Payroll</Link>
        <h1 className="mt-1 text-2xl font-semibold">Variance investigations</h1>
        <p className="text-xs text-muted-foreground">Payroll movements being explained: who owns each one, the evidence, the resolution and a second person&apos;s sign-off.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { k: "open", label: "Open", n: count("open"), icon: CircleDot },
          { k: "investigating", label: "Under investigation", n: count("investigating"), icon: Search },
          { k: "awaiting", label: "Awaiting sign-off", n: awaiting, icon: ShieldCheck },
          { k: "resolved", label: "Resolved", n: count("resolved"), icon: CheckCircle2 },
        ].map((t) => (
          <button key={t.k} type="button" onClick={() => setParam("status", status === t.k ? ALL : t.k)} className={cn("rounded-xl bg-card px-4 py-3 text-left ring-1 ring-foreground/10 transition hover:ring-foreground/25", status === t.k && "ring-2 ring-primary")}>
            <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"><t.icon className="h-3.5 w-3.5" /> {t.label}</p>
            <p className="mt-0.5 text-xl font-semibold tabular-nums">{t.n}</p>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <Select value={status} onValueChange={(v) => setParam("status", v)}>
            <SelectTrigger size="sm" className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-xs">All statuses</SelectItem>
              <SelectItem value="open" className="text-xs">Open</SelectItem>
              <SelectItem value="investigating" className="text-xs">Under investigation</SelectItem>
              <SelectItem value="awaiting" className="text-xs">Awaiting sign-off</SelectItem>
              <SelectItem value="resolved" className="text-xs">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={owner} onValueChange={(v) => setParam("owner", v)}>
            <SelectTrigger size="sm" className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-xs">All owners</SelectItem>
              <SelectItem value="me" className="text-xs">Assigned to me</SelectItem>
              {owners.map(([id, name]) => <SelectItem key={id} value={id} className="text-xs">{name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={run} onValueChange={(v) => setParam("run", v)}>
            <SelectTrigger size="sm" className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-xs">All months</SelectItem>
              {runs.map(([id, label]) => <SelectItem key={id} value={id} className="text-xs">{label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input className="ml-auto h-8 w-56 text-xs" placeholder="Search case, employee or owner" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-xs">
            <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Case</th>
                <th className="px-4 py-2 font-medium">Month</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Owner</th>
                <th className="px-4 py-2 font-medium">Due</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No investigations match. Raise one from the payroll comparison.</td></tr>}
              {shown.map((i) => {
                const overdue = i.dueDate && i.status !== "resolved" && i.dueDate < new Date().toISOString().slice(0, 10);
                return (
                  <tr key={i.id} className="border-t align-top">
                    <td className="px-4 py-2">
                      <Link href={`${INVESTIGATIONS_HREF}/${i.id}`} className="font-medium hover:text-primary hover:underline">{i.title}</Link>
                      <p className="text-[10px] text-muted-foreground">{i.id}{i.employeeName ? ` · ${i.employeeName}` : ""} · raised by {i.createdBy} {fmtDate(i.createdAt)}</p>
                    </td>
                    <td className="px-4 py-2">{i.periodLabel}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{money(i.amount)}</td>
                    <td className="px-4 py-2">{i.ownerName}</td>
                    <td className={cn("px-4 py-2", overdue && "font-medium text-rose-600")}>{i.dueDate ? fmtDate(i.dueDate) : "—"}{overdue ? " · overdue" : ""}</td>
                    <td className="px-4 py-2"><InvestigationStatusBadge inv={i} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

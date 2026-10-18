"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Info, Plus, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { useCan } from "@/src/lib/permissions/use-can";
import { enrolOnLeaveScheme, leaveSchemeId, upsertLeaveScheme } from "@/src/lib/stores/leave-schemes-slice";
import { schemeSummary } from "@/src/lib/leave/schemes";
import { LEAVE_TYPE_LABELS } from "@/src/data/leave-demo";
import { cn } from "@/src/lib/utils";
import { Pager, fmtDate, usePaged } from "@/src/components/hr/sickness/ui";
import { LEAVE_SCHEMES_BASE, useLeaveSchemes } from "./hooks";

/** Leave Management → Schemes: entitlement packages and who is on them. */
export function LeaveSchemesTab() {
  const [view, setView] = useState<"schemes" | "enrolments">("schemes");
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
        <span>
          <b className="text-foreground">Policies</b> set the rules of each leave type. <b className="text-foreground">Schemes</b> set how
          much of each type a group of employees gets per leave year — allowance, accrual, carry-over, service extras and
          part-time pro-rating. Sick pay is set separately in Sickness &amp; Absence → Sickness Schemes.
        </span>
      </div>
      <div className="flex w-fit rounded-lg border border-border bg-muted p-0.5 text-xs">
        {(
          [
            ["schemes", "Leave schemes"],
            ["enrolments", "Employee enrolments & entitlements"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" onClick={() => setView(v)} className={cn("rounded-md px-3 py-1.5 font-medium", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {l}
          </button>
        ))}
      </div>
      {view === "schemes" ? <SchemeList /> : <Enrolments />}
    </div>
  );
}

function SchemeList() {
  const ls = useLeaveSchemes();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const canManage = useCan("time-payroll.leave", "edit");
  const count = (id: string) =>
    new Set(ls.enrolments.filter((e) => e.schemeId === id && (!e.effectiveTo || e.effectiveTo >= ls.asOf)).map((e) => e.employeeId)).size;

  function duplicate(id: string) {
    const src = ls.schemes.find((s) => s.id === id);
    if (!src) return;
    const copy = { ...src, id: `${ls.tenantId}-${leaveSchemeId("LVS")}`, name: `${src.name} (Copy)`, kind: "custom" as const, status: "draft" as const };
    dispatch(upsertLeaveScheme({ scheme: copy, actor }));
    toast.success("Scheme duplicated as a draft");
    router.push(`${LEAVE_SCHEMES_BASE}/${copy.id}`);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        {canManage && (
          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-primary" asChild>
            <Link href={`${LEAVE_SCHEMES_BASE}/new`}><Plus className="h-3.5 w-3.5" /> New leave scheme</Link>
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">Each employee is enrolled on one leave scheme at a time</span>
      </div>
      <table className="w-full text-xs">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {["Scheme", "Entitlements", "Leave year", "Employees", "Status", ""].map((h) => (
              <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ls.schemes.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">No leave schemes yet.</td></tr>
          )}
          {ls.schemes.map((s) => (
            <tr key={s.id} className="border-t border-border/60 hover:bg-muted">
              <td className="px-4 py-2.5">
                <Link href={`${LEAVE_SCHEMES_BASE}/${s.id}`} className="font-medium text-primary hover:underline">{s.name}</Link>
                <p className="line-clamp-1 max-w-md text-[11px] text-muted-foreground">{schemeSummary(s)}</p>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {s.entitlements.map((e) => (
                    <span key={e.id} className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px]">
                      {LEAVE_TYPE_LABELS[e.leaveType]} {e.amount}{e.unit === "weeks" ? "w" : "d"}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-2.5">From {new Date(2026, s.leaveYearStartMonth - 1, 1).toLocaleString("en-GB", { month: "long" })}</td>
              <td className="px-4 py-2.5 tabular-nums">{count(s.id)}</td>
              <td className="px-4 py-2.5 capitalize">{s.status}</td>
              <td className="px-4 py-2.5 text-right">
                {canManage && (
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Duplicate" onClick={() => duplicate(s.id)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Enrolments() {
  const ls = useLeaveSchemes();
  const canManage = useCan("time-payroll.leave", "edit");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () =>
      ls.employees
        .filter((e) => e.status !== "terminated")
        .filter((e) => !search.trim() || `${e.fullName} ${e.departmentName}`.toLowerCase().includes(search.trim().toLowerCase()))
        .map((e) => ({ e, ...ls.schemeFor(e.id), result: ls.entitlementFor(e) })),
    [ls, search],
  );
  const pager = usePaged(rows, 12, search);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees…" className="h-8 pl-8 text-xs" />
        </div>
        {canManage && (
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Enrol {selected.length ? `${selected.length} selected` : "employees"} on a scheme
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="w-8 px-3 py-2">
                  <Checkbox checked={selected.length > 0 && selected.length === rows.length} onCheckedChange={(c) => setSelected(c ? rows.map((r) => r.e.id) : [])} />
                </th>
                {["Employee", "Scheme", "Leave year", "Annual leave", "Other entitlements"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pager.slice.map(({ e, scheme, enrolment, result }) => {
                const annual = result?.lines.find((l) => l.leaveType === "annual");
                return (
                  <tr key={e.id} className="border-t border-border/60 align-top">
                    <td className="px-3 py-2">
                      <Checkbox checked={selected.includes(e.id)} onCheckedChange={(c) => setSelected((x) => (c ? [...x, e.id] : x.filter((y) => y !== e.id)))} />
                    </td>
                    <td className="px-3 py-2">
                      <span className="font-medium">{e.fullName}</span>
                      <span className="block text-[10px] text-muted-foreground">{e.departmentName} · {e.workPattern?.daysPerWeek ?? 5} days/week</span>
                    </td>
                    <td className="px-3 py-2">
                      {scheme ? <Link href={`${LEAVE_SCHEMES_BASE}/${scheme.id}`} className="text-primary hover:underline">{scheme.name}</Link> : <span className="text-amber-600">Not enrolled</span>}
                      {enrolment && <span className="block text-[10px] text-muted-foreground">since {fmtDate(enrolment.effectiveFrom)}</span>}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{result ? `${fmtDate(result.yearStart)} – ${fmtDate(result.yearEnd)}` : "—"}</td>
                    <td className="px-3 py-2">
                      {!result ? "—" : !result.eligible ? (
                        <span className="text-amber-600">{result.reason}</span>
                      ) : annual ? (
                        <>
                          <span className="text-sm font-semibold tabular-nums">{annual.remaining}</span>
                          <span className="text-muted-foreground"> of {annual.entitlement} days left</span>
                          <span className="block text-[10px] text-muted-foreground">
                            {annual.base} base{annual.serviceExtra ? ` + ${annual.serviceExtra} service` : ""}{annual.carriedOver ? ` + ${annual.carriedOver} carried` : ""} · {annual.taken} taken · {annual.booked} booked
                            {annual.available !== annual.entitlement ? ` · ${annual.available} accrued so far` : ""}
                          </span>
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {result?.lines.filter((l) => l.leaveType !== "annual").map((l) => (
                          <span key={l.leaveType} className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px]">
                            {LEAVE_TYPE_LABELS[l.leaveType]} {l.remaining}/{l.entitlement}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager pager={pager} noun="employees" />
      </div>
      <EnrolDialog open={open} onOpenChange={setOpen} preselected={selected} onDone={() => setSelected([])} />
    </div>
  );
}

function EnrolDialog({ open, onOpenChange, preselected, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; preselected: string[]; onDone: () => void }) {
  const ls = useLeaveSchemes();
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const [schemeId, setSchemeId] = useState("");
  const [from, setFrom] = useState(ls.asOf);
  const [ids, setIds] = useState<string[]>(preselected);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setIds(preselected);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Enrol employees on a leave scheme</DialogTitle>
          <DialogDescription className="text-xs">Their current enrolment ends the day before; history is kept.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs">Leave scheme</Label>
            <Select value={schemeId} onValueChange={setSchemeId}>
              <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Choose a scheme" /></SelectTrigger>
              <SelectContent>
                {ls.schemes.filter((s) => s.status === "active").map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Effective from</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Employees ({ids.length})</Label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border bg-card p-2">
              {ls.employees.filter((e) => e.status !== "terminated").map((e) => (
                <label key={e.id} className="flex items-center gap-2">
                  <Checkbox checked={ids.includes(e.id)} onCheckedChange={(c) => setIds((x) => (c ? [...x, e.id] : x.filter((y) => y !== e.id)))} className="h-3.5 w-3.5" />
                  {e.fullName}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="sm"
            disabled={!schemeId || !ids.length || !from}
            onClick={() => {
              dispatch(enrolOnLeaveScheme({ tenantId: ls.tenantId, employeeIds: ids, schemeId, effectiveFrom: from, actor }));
              toast.success(`${ids.length} employee${ids.length === 1 ? "" : "s"} enrolled`);
              onDone();
              onOpenChange(false);
            }}
          >
            Enrol
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

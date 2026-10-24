"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Plus, RefreshCw, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Skeleton } from "@/src/components/ui/skeleton";
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
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { enrol, sicknessId, upsertScheme } from "@/src/lib/stores/sickness-slice";
import { entitlementSummary } from "@/src/lib/sickness/sick-pay";
import { cn } from "@/src/lib/utils";
import {
  ENTITLEMENT_PERIOD_LABELS,
  ENTITLEMENT_UNIT_LABELS,
  type SicknessScheme,
} from "@/src/lib/types/sickness";
import { SICKNESS_BASE, payEmployee, useCanManageSickness, useSickness, useSicknessActor } from "./hooks";
import { SicknessShell } from "./shell";
import { Pager, fmtDate, usePaged } from "./ui";

/** Schemes summarised in one line, e.g. "10 days full pay → 5 days half pay". */
export function stepsSummary(s: SicknessScheme): string {
  if (s.period === "length_of_service" && s.serviceBands.length) {
    return `${s.serviceBands.length} service bands, up to ${Math.max(...s.serviceBands.flatMap((b) => b.steps.map((x) => x.amount)))} ${s.unit === "weeks" ? "weeks" : "days"} full pay`;
  }
  if (s.steps.length === 0) return s.applyStatutory ? "Statutory sick pay only" : "Unpaid";
  const unit = s.unit === "weeks" ? "weeks" : s.unit === "hours" ? "hours" : "days";
  return s.steps.map((x) => `${x.amount} ${unit} at ${x.payPercent}%`).join(" → ");
}

export function SchemesPage() {
  const s = useSickness();
  const [tab, setTab] = useState<"schemes" | "enrolments">("schemes");
  if (s.loading) return <SicknessShell><Skeleton className="h-96 w-full" /></SicknessShell>;
  return (
    <SicknessShell>
      <div className="flex w-fit rounded-lg border border-border bg-muted p-0.5 text-xs">
        {(
          [
            ["schemes", "Sickness schemes"],
            ["enrolments", "Employee sickness scheme enrolments"],
          ] as const
        ).map(([v, l]) => (
          <button key={v} type="button" onClick={() => setTab(v)} className={cn("rounded-md px-3 py-1.5 font-medium", tab === v ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
            {l}
          </button>
        ))}
      </div>
      {tab === "schemes" ? <SchemeList /> : <Enrolments />}
    </SicknessShell>
  );
}

function SchemeList() {
  const s = useSickness();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const actor = useSicknessActor();
  const canManage = useCanManageSickness();
  const enrolledCount = (id: string) =>
    new Set(s.enrolments.filter((e) => e.schemeId === id && (!e.effectiveTo || e.effectiveTo >= s.asOf)).map((e) => e.employeeId)).size;

  function duplicate(sc: SicknessScheme) {
    const id = `${s.tenantId}-${sicknessId("SCH")}`;
    dispatch(upsertScheme({ actor, scheme: { ...sc, id, name: `${sc.name} (Copy)`, kind: "custom", status: "draft", createdAt: new Date().toISOString().slice(0, 10) } }));
    toast.success("Scheme duplicated as a draft");
    router.push(`${SICKNESS_BASE}/schemes/${id}`);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        {canManage && (
          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-primary" asChild>
            <Link href={`${SICKNESS_BASE}/schemes/new`}><Plus className="h-3.5 w-3.5" /> Add</Link>
          </Button>
        )}
        <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-primary" onClick={() => router.refresh()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
        <span className="ml-auto text-xs text-muted-foreground">Sick pay rules only — holiday and other leave entitlements are set in Leave Management → Schemes</span>
      </div>
      {s.schemes.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">No records to display</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {["Scheme", "Entitlement", "Measured", "Statutory pay", "Employees", "Status", ""].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.schemes.map((sc) => (
              <tr key={sc.id} className="border-t border-border/60 hover:bg-muted">
                <td className="px-4 py-2.5">
                  <Link href={`${SICKNESS_BASE}/schemes/${sc.id}`} className="font-medium text-primary hover:underline">{sc.name}</Link>
                  <p className="line-clamp-1 max-w-md text-[11px] text-muted-foreground">{sc.description}</p>
                </td>
                <td className="px-4 py-2.5">{stepsSummary(sc)}</td>
                <td className="px-4 py-2.5">
                  {ENTITLEMENT_PERIOD_LABELS[sc.period]}{sc.period === "rolling" ? ` (${sc.rollingMonths} months)` : ""} · {ENTITLEMENT_UNIT_LABELS[sc.unit]}
                </td>
                <td className="px-4 py-2.5">{sc.applyStatutory ? "Yes" : "No"}</td>
                <td className="px-4 py-2.5 tabular-nums">{enrolledCount(sc.id)}</td>
                <td className="px-4 py-2.5 capitalize">{sc.status}</td>
                <td className="px-4 py-2.5 text-right">
                  {canManage && (
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Duplicate" onClick={() => duplicate(sc)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Enrolments() {
  const s = useSickness();
  const canManage = useCanManageSickness();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () =>
      s.employees
        .filter((e) => e.status !== "terminated")
        .filter((e) => !search.trim() || `${e.fullName} ${e.departmentName}`.toLowerCase().includes(search.trim().toLowerCase()))
        .map((e) => {
          const { scheme, enrolment } = s.schemeFor(e.id);
          const summary = scheme
            ? entitlementSummary({ employee: payEmployee(e), scheme, records: s.records, asOf: s.asOf, holidays: s.holidays })
            : null;
          return { e, scheme, enrolment, summary };
        }),
    [s, search],
  );
  const pager = usePaged(rows, 15, search);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees…" className="h-8 pl-8 text-xs" />
        </div>
        {canManage && (
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" /> Enrol {selected.length ? `${selected.length} selected` : "employees"} in a scheme
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-xs">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="w-8 px-3 py-2">
                <Checkbox
                  checked={selected.length > 0 && selected.length === rows.length}
                  onCheckedChange={(c) => setSelected(c ? rows.map((r) => r.e.id) : [])}
                />
              </th>
              {["Employee", "Scheme", "Since", "Remaining entitlement", "Eligibility"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pager.slice.map(({ e, scheme, enrolment, summary }) => (
              <tr key={e.id} className="border-t border-border/60">
                <td className="px-3 py-2">
                  <Checkbox checked={selected.includes(e.id)} onCheckedChange={(c) => setSelected((x) => (c ? [...x, e.id] : x.filter((y) => y !== e.id)))} />
                </td>
                <td className="px-3 py-2">
                  <span className="font-medium">{e.fullName}</span>
                  <span className="block text-[10px] text-muted-foreground">{e.departmentName} · {e.workPattern?.daysPerWeek ?? 5} days/week</span>
                </td>
                <td className="px-3 py-2">{scheme ? <Link className="text-primary hover:underline" href={`${SICKNESS_BASE}/schemes/${scheme.id}`}>{scheme.name}</Link> : <span className="text-amber-600">Not enrolled</span>}</td>
                <td className="px-3 py-2">{fmtDate(enrolment?.effectiveFrom)}</td>
                <td className="px-3 py-2">
                  {summary?.steps.length
                    ? summary.steps.map((st) => `${st.remaining}/${st.entitled} ${st.label.replace(/^Sick at /, "")}`).join(" · ")
                    : scheme?.applyStatutory
                      ? "Statutory sick pay"
                      : "—"}
                </td>
                <td className="px-3 py-2">{summary ? (summary.eligible ? "Eligible" : <span className="text-amber-600">{summary.reason}</span>) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager pager={pager} noun="employees" />
      </div>
      <EnrolDialog open={open} onOpenChange={setOpen} preselected={selected} onDone={() => setSelected([])} />
    </div>
  );
}

function EnrolDialog({ open, onOpenChange, preselected, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; preselected: string[]; onDone: () => void }) {
  const s = useSickness();
  const dispatch = useAppDispatch();
  const actor = useSicknessActor();
  const [schemeId, setSchemeId] = useState("");
  const [from, setFrom] = useState(s.asOf);
  const [ids, setIds] = useState<string[]>(preselected);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setIds(preselected);
  }
  const active = s.schemes.filter((x) => x.status === "active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Enrol employees in a scheme</DialogTitle>
          <DialogDescription className="text-xs">Their current enrolment ends the day before the new one starts; history is kept.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-xs">
          <div className="space-y-1.5">
            <Label className="text-xs">Scheme</Label>
            <Select value={schemeId} onValueChange={setSchemeId}>
              <SelectTrigger className="h-9 w-full text-sm"><SelectValue placeholder="Choose a scheme" /></SelectTrigger>
              <SelectContent>
                {active.map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Effective from</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Employees ({ids.length})</Label>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {s.employees.filter((e) => e.status !== "terminated").map((e) => (
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
            disabled={!schemeId || ids.length === 0 || !from}
            onClick={() => {
              dispatch(enrol({ tenantId: s.tenantId, employeeIds: ids, schemeId, effectiveFrom: from, actor }));
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

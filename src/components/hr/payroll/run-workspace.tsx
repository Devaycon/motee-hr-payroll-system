"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  FilePlus2,
  Lock,
  RefreshCw,
  Send,
  Trash2,
  Upload,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Switch } from "@/src/components/ui/switch";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { Textarea } from "@/src/components/ui/textarea";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { EmployeeLink } from "@/src/components/shared/employee-link";
import { useCan } from "@/src/lib/permissions/use-can";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { PAYROLL_DOCUMENT_TYPE, PAYROLL_HREF, PAYROLL_MODULE, hrPayslipHref } from "@/src/lib/payroll/constants";
import { ELEMENT_GROUP_LABELS, ELEMENT_GROUP_ORDER } from "@/src/lib/payroll/elements-seed";
import { EXCEPTION_RULE_LABELS, blockingExceptions } from "@/src/lib/payroll/validation";
import { previousComputation } from "@/src/lib/payroll/run-builder";
import { inputSourceOf, type PayrollException, type PayrollRun, type PeriodInput, type RunEmployee } from "@/src/lib/payroll/types";
import { useCurrentActor, usePayrollActions, useRun } from "@/src/lib/payroll/use-payroll";
import { cn } from "@/src/lib/utils";
import { NotSupported, PipelineStepper, RunExportsMenu, RunStatusBadge, RunTypeBadge, Stat, fmtDate, money } from "./components/shared";

export function RunWorkspacePage({ runId }: { runId: string }) {
  const router = useRouter();
  const { run, data, bundle, loading, supported } = useRun(runId);
  const actions = usePayrollActions();
  const actor = useCurrentActor();
  const canEdit = useCan(PAYROLL_MODULE, "edit");
  const request = useAppSelector((s) =>
    [...s.approvals.requests].reverse().find((r) => r.documentType === PAYROLL_DOCUMENT_TYPE && r.documentId === runId),
  );
  const [tab, setTab] = useState("employees");
  const [ack, setAck] = useState<PayrollException | null>(null);
  const [addInput, setAddInput] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  const people = useMemo(() => new Map((bundle?.employees ?? []).map((e) => [e.id, e])), [bundle]);
  const profiles = useMemo(() => new Map((data?.profiles ?? []).map((p) => [p.employeeId, p])), [data]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data) return <Skeleton className="h-[600px] w-full rounded-xl" />;
  if (!run) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        This run doesn&apos;t exist. <Link href={PAYROLL_HREF} className="text-primary hover:underline">Back to payroll</Link>
      </div>
    );
  }

  const draft = run.status === "draft";
  const editable = draft && canEdit;
  const blocking = blockingExceptions(run);
  const warnings = run.exceptions.filter((e) => e.severity === "warning");
  const errors = run.exceptions.filter((e) => e.severity === "error");
  const source = inputSourceOf(run);
  const iPrepared = run.preparedBy.employeeId === actor.employeeId;
  const included = run.employees.filter((e) => e.included);
  const currentStep = request?.steps[request.currentStepIndex];

  function submit() {
    const res = actions.submit(run!.id);
    if (res.ok) toast.success("Sent for approval", { description: "Finance reviews first, then the executive authorises payment. You can't approve your own run." });
    else toast.error(res.reason);
  }
  function finalize() {
    const res = actions.finalize(run!.id);
    setConfirmFinalize(false);
    if (res.ok) toast.success("Payroll finalized", { description: "The run is locked, payslips are issued to every employee and loan repayments are posted." });
    else toast.error(res.reason);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href={PAYROLL_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Payroll
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold">{run.title}</h1>
            <RunStatusBadge status={run.status} />
            <RunTypeBadge type={run.type} />
            <Badge variant="outline" className="text-[10px] capitalize">{source === "mixed" ? "Mixed: auto + manual" : `${source} calculation`}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {fmtDate(run.period.start)} – {fmtDate(run.period.end)} · pay day {fmtDate(run.period.payDate)} · prepared by {run.preparedBy.name}
            {run.parentRunId && (
              <>
                {" · corrects "}
                <Link href={`${PAYROLL_HREF}/${run.parentRunId}`} className="text-primary hover:underline">the original run</Link>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RunExportsMenu run={run} people={people} profiles={profiles} onExport={(w) => actions.logExport(run.id, w)} />
          {editable && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { actions.recalculate(run.id); toast.success("Recalculated", { description: "Loans, expenses and attendance re-read; manual inputs kept." }); }}>
                <RefreshCw className="h-3.5 w-3.5" /> Recalculate
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <Link href={`${PAYROLL_HREF}/${run.id}/upload`}><Upload className="h-3.5 w-3.5" /> Upload figures</Link>
              </Button>
              <Button size="sm" className="gap-1.5" onClick={submit} disabled={!included.length}>
                <Send className="h-3.5 w-3.5" /> Submit for approval
              </Button>
            </>
          )}
          {run.status === "approved" && canEdit && (
            <Button size="sm" className="gap-1.5" onClick={() => setConfirmFinalize(true)}>
              <Lock className="h-3.5 w-3.5" /> Finalize &amp; issue payslips
            </Button>
          )}
          {run.status === "finalized" && canEdit && (
            <Button size="sm" className="gap-1.5" onClick={() => { actions.markDisbursed(run.id); toast.success("Marked as paid"); }}>
              <Wallet className="h-3.5 w-3.5" /> Mark as paid
            </Button>
          )}
          {(run.status === "finalized" || run.status === "disbursed") && canEdit && run.type !== "adjustment" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const adj = actions.createAdjustmentRun(run.id);
                if (adj) router.push(`${PAYROLL_HREF}/${adj.id}`);
              }}
            >
              <FilePlus2 className="h-3.5 w-3.5" /> Adjustment run
            </Button>
          )}
          {draft && canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-rose-600 hover:text-rose-600"
              onClick={() => {
                actions.deleteRun(run.id);
                toast.success("Draft run deleted");
                router.push(PAYROLL_HREF);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <PipelineStepper status={run.status} />
      </div>

      {/* Contextual status banner */}
      <StatusBanner run={run} blocking={blocking.length} iPrepared={iPrepared} approverStep={currentStep?.label} approverName={currentStep?.resolvedEmployeeName ?? undefined} requestId={request?.id} onReraise={canEdit ? () => { actions.reraiseApproval(run.id); toast.success("Approval request raised again"); } : undefined} />

      <div className="flex flex-wrap gap-3">
        <Stat label="Employees" value={run.totals.employees} sub={`${run.employees.length - included.length} excluded`} />
        <Stat label="Gross pay" value={money(run.totals.gross)} />
        <Stat label="Deductions" value={money(run.totals.deductions)} sub={`PAYE ${money(run.totals.paye, 0)}`} tone="warn" />
        <Stat label="Net pay" value={money(run.totals.net)} sub="To the bank file" tone="good" />
        <Stat label="Employer cost" value={money(run.totals.employerCost)} sub="Pension, NSITF, ITF" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <PageTabsList
          tabs={[
            { value: "employees", label: `Employees (${run.employees.length})` },
            { value: "exceptions", label: `Exceptions (${errors.length + warnings.length})` },
            { value: "variance", label: "Variance" },
            { value: "inputs", label: `Inputs (${run.inputs.length})` },
            { value: "summary", label: "Summary" },
          ]}
        />
        <TabsContent value="employees" className="mt-4">
          <EmployeesTable run={run} editable={editable} people={people} />
        </TabsContent>
        <TabsContent value="exceptions" className="mt-4">
          <ExceptionsList run={run} people={people} editable={editable} onAck={setAck} />
        </TabsContent>
        <TabsContent value="variance" className="mt-4">
          <VarianceTable run={run} people={people} data={data} threshold={data.settings.varianceThresholdPct} />
        </TabsContent>
        <TabsContent value="inputs" className="mt-4">
          <InputsList run={run} people={people} editable={editable} onAdd={() => setAddInput(true)} onRemove={(id) => actions.removeInput(run.id, id)} />
        </TabsContent>
        <TabsContent value="summary" className="mt-4">
          <Summary run={run} people={people} />
        </TabsContent>
      </Tabs>

      <AckDialog
        exception={ack}
        onClose={() => setAck(null)}
        onConfirm={(reason) => {
          if (ack) actions.acknowledge(run.id, ack.id, reason);
          setAck(null);
          toast.success("Exception acknowledged and logged");
        }}
      />
      <AddInputDialog
        open={addInput}
        onClose={() => setAddInput(false)}
        run={run}
        people={people}
        elements={data.elements.filter((e) => e.active && !e.statutory && data.settings.enabledGroups.includes(e.group) && e.category !== "employer" && e.calculationType !== "formula")}
        onAdd={(input) => {
          actions.addInput(run.id, input);
          toast.success("Input added and run recalculated");
        }}
      />
      <Dialog open={confirmFinalize} onOpenChange={setConfirmFinalize}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize {run.title}?</DialogTitle>
            <DialogDescription>
              This locks every figure in the run. {run.totals.employees} payslips are issued and can be verified; loan repayments are posted to the loan register. Any
              correction after this goes through an adjustment run.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFinalize(false)}>Cancel</Button>
            <Button onClick={finalize} className="gap-1.5"><Lock className="h-3.5 w-3.5" /> Finalize</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBanner({
  run,
  blocking,
  iPrepared,
  approverStep,
  approverName,
  requestId,
  onReraise,
}: {
  run: PayrollRun;
  blocking: number;
  iPrepared: boolean;
  approverStep?: string;
  approverName?: string;
  requestId?: string;
  onReraise?: () => void;
}) {
  const base = "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm";
  if (run.status === "draft")
    return blocking ? (
      <div className={cn(base, "border-rose-500/30 bg-rose-500/5")}>
        <CircleAlert className="mt-0.5 h-4 w-4 text-rose-600" />
        <p><b>{blocking} error{blocking === 1 ? "" : "s"}</b> must be fixed or acknowledged before this run can go for approval. See the Exceptions tab.</p>
      </div>
    ) : (
      <div className={cn(base, "border-emerald-500/30 bg-emerald-500/5")}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
        <p>Validation passed. Review the variance, then submit — approval goes to Finance, then the executive.</p>
      </div>
    );
  if (run.status === "in_review" && !requestId)
    return (
      <div className={cn(base, "border-amber-500/30 bg-amber-500/5")}>
        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
          <p>This run is awaiting approval, but its request is no longer in the approvals queue.</p>
          {onReraise && <Button size="sm" variant="outline" onClick={onReraise}>Raise the approval again</Button>}
        </div>
      </div>
    );
  if (run.status === "in_review")
    return (
      <div className={cn(base, "border-amber-500/30 bg-amber-500/5")}>
        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
        <p>
          Awaiting approval{approverStep ? <> — <b>{approverStep}</b>{approverName ? ` (${approverName})` : ""}</> : ""}. The run is read-only until it&apos;s approved or sent back.
          {iPrepared && " As the preparer, you can't approve it yourself."}{" "}
          {requestId && <Link className="font-medium text-primary hover:underline" href={`/hr-action-center/submissions/${requestId}`}>Open the approval</Link>}
        </p>
      </div>
    );
  if (run.status === "approved")
    return (
      <div className={cn(base, "border-blue-500/30 bg-blue-500/5")}>
        <BadgeCheck className="mt-0.5 h-4 w-4 text-blue-600" />
        <p>Approved by <b>{run.approvedBy?.name}</b> on {fmtDate(run.approvedAt)}. Finalize to lock the figures and issue payslips.</p>
      </div>
    );
  return (
    <div className={cn(base, "border-violet-500/30 bg-violet-500/5")}>
      <Lock className="mt-0.5 h-4 w-4 text-violet-600" />
      <p>
        Finalized on {fmtDate(run.finalizedAt)} — this run is locked. {run.status === "disbursed" ? `Paid on ${fmtDate(run.disbursedAt)}.` : "Download the NIBSS file from Exports, then mark it as paid."} Corrections go through an adjustment run.
      </p>
    </div>
  );
}

// ── Employees ───────────────────────────────────────────────────────────────

interface EmpRow extends RunEmployee {
  name: string;
  department: string;
  gender?: string;
  issues: number;
}

function EmployeesTable({ run, editable, people }: { run: PayrollRun; editable: boolean; people: Map<string, import("@/src/lib/types/locale").LocaleEmployee> }) {
  const router = useRouter();
  const actions = usePayrollActions();
  const rows = useMemo<EmpRow[]>(
    () =>
      run.employees.map((e) => {
        const p = people.get(e.employeeId);
        return {
          ...e,
          name: p?.fullName ?? e.employeeId,
          department: p?.departmentName ?? "",
          gender: p?.gender,
          issues: run.exceptions.filter((x) => x.employeeId === e.employeeId && !x.acknowledged).length,
        };
      }),
    [run, people],
  );
  const amt = (r: EmpRow, code: string) => r.computation?.lines.filter((l) => l.code === code).reduce((s, l) => s + l.amount, 0) ?? 0;
  const finalized = run.status === "finalized" || run.status === "disbursed";

  const columns = useMemo<ColumnDef<EmpRow>[]>(
    () => [
      {
        id: "name",
        accessorFn: (r) => r.name,
        header: sortableHeader("Employee"),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()} className={cn(!row.original.included && "opacity-50")}>
            <EmployeeLink name={row.original.name} employeeId={row.original.employeeId} gender={row.original.gender} />
            <p className="ml-7 text-[10px] text-muted-foreground">{row.original.department}</p>
          </div>
        ),
      },
      {
        id: "mode",
        accessorFn: (r) => r.mode,
        header: sortableHeader("Source"),
        cell: ({ row }) =>
          editable && row.original.included ? (
            <div onClick={(e) => e.stopPropagation()}>
              <Select value={row.original.mode} onValueChange={(v) => actions.setMode(run.id, row.original.employeeId, v as "auto" | "manual")}>
                <SelectTrigger className="h-7 w-24 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Badge variant="outline" className="text-[10px] capitalize">{row.original.mode}</Badge>
          ),
      },
      { id: "gross", accessorFn: (r) => r.computation?.gross ?? 0, header: sortableHeader("Gross"), cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.computation ? money(row.original.computation.gross) : "—"}</span> },
      { id: "paye", accessorFn: (r) => amt(r, "PAYE"), header: sortableHeader("PAYE"), cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.computation ? money(amt(row.original, "PAYE")) : "—"}</span> },
      { id: "pension", accessorFn: (r) => amt(r, "PENSION_EE"), header: sortableHeader("Pension"), cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.computation ? money(amt(row.original, "PENSION_EE")) : "—"}</span> },
      { id: "deductions", accessorFn: (r) => r.computation?.totalDeductions ?? 0, header: sortableHeader("Deductions"), cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.computation ? money(row.original.computation.totalDeductions) : "—"}</span> },
      {
        id: "net",
        accessorFn: (r) => r.computation?.net ?? 0,
        header: sortableHeader("Net pay"),
        cell: ({ row }) => (
          <span className={cn("text-xs font-semibold tabular-nums", (row.original.computation?.net ?? 0) < 0 && "text-rose-600")}>
            {row.original.computation ? money(row.original.computation.net) : "—"}
          </span>
        ),
      },
      {
        id: "issues",
        accessorFn: (r) => r.issues,
        header: sortableHeader("Checks"),
        cell: ({ row }) =>
          row.original.issues ? (
            <span className="flex items-center gap-1 text-[11px] text-amber-600"><AlertTriangle className="h-3 w-3" />{row.original.issues}</span>
          ) : row.original.included ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          ) : null,
      },
      {
        id: "included",
        header: "In run",
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch checked={row.original.included} disabled={!editable} onCheckedChange={(v) => actions.setIncluded(run.id, row.original.employeeId, v)} />
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editable, run.id],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      getRowId={(r) => r.employeeId}
      searchPlaceholder="Search employees…"
      onRowClick={(r) =>
        finalized
          ? router.push(hrPayslipHref(r.employeeId, `${run.id}-${r.employeeId}`))
          : router.push(`${PAYROLL_HREF}/${run.id}/employees/${r.employeeId}`)
      }
      exportTitle={`${run.title} — employees`}
      exportName={`${run.id}-employees`}
    />
  );
}

// ── Exceptions ──────────────────────────────────────────────────────────────

function ExceptionsList({ run, people, editable, onAck }: { run: PayrollRun; people: Map<string, { fullName: string }>; editable: boolean; onAck: (e: PayrollException) => void }) {
  if (!run.exceptions.length)
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-12 text-center">
        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        <p className="text-sm font-medium">No exceptions</p>
        <p className="text-xs text-muted-foreground">Bank details, tax IDs, duplicates, net pay and variance all check out.</p>
      </div>
    );
  const sorted = [...run.exceptions].sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1));
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {sorted.map((e) => (
        <div key={e.id} className="flex items-start justify-between gap-4 border-b px-4 py-3 last:border-0">
          <div className="flex items-start gap-3">
            {e.severity === "error" ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold">
                {EXCEPTION_RULE_LABELS[e.rule]}
                <Badge variant="outline" className={cn("text-[9px]", e.severity === "error" ? "border-rose-500/30 text-rose-600" : "border-amber-500/30 text-amber-600")}>
                  {e.severity === "error" ? "Blocks submission" : "Review"}
                </Badge>
                {e.employeeId && <span className="font-normal text-muted-foreground">· {people.get(e.employeeId)?.fullName}</span>}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{e.message}</p>
              {e.acknowledged && (
                <p className="mt-1 text-[11px] text-emerald-700">
                  Acknowledged by {e.acknowledged.by} · “{e.acknowledged.reason}”
                </p>
              )}
            </div>
          </div>
          {editable && !e.acknowledged && (
            <Button size="sm" variant="outline" className="h-7 shrink-0 text-[11px]" onClick={() => onAck(e)}>
              Acknowledge
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function AckDialog({ exception, onClose, onConfirm }: { exception: PayrollException | null; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Dialog open={!!exception} onOpenChange={(o) => { if (!o) { onClose(); setReason(""); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Acknowledge exception</DialogTitle>
          <DialogDescription>{exception?.message}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label className="text-xs">Reason (kept on the run&apos;s audit trail and shown to approvers)</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Confirmed with the employee — joint account with spouse" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={reason.trim().length < 5} onClick={() => { onConfirm(reason.trim()); setReason(""); }}>Acknowledge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Variance ────────────────────────────────────────────────────────────────

function VarianceTable({ run, people, data, threshold }: { run: PayrollRun; people: Map<string, { fullName: string; departmentName: string }>; data: import("@/src/lib/payroll/run-builder").TenantPayrollData; threshold: number }) {
  const rows = run.employees
    .filter((e) => e.included && e.computation)
    .map((e) => {
      const prev = previousComputation(data, e.employeeId, run.period);
      const now = e.computation!.net;
      const before = prev?.net ?? null;
      const change = before === null ? null : now - before;
      const pctChange = before ? (change! / before) * 100 : null;
      return { id: e.employeeId, name: people.get(e.employeeId)?.fullName ?? e.employeeId, dept: people.get(e.employeeId)?.departmentName ?? "", before, now, change, pctChange };
    })
    .sort((a, b) => Math.abs(b.pctChange ?? 0) - Math.abs(a.pctChange ?? 0));
  const totalBefore = rows.reduce((s, r) => s + (r.before ?? 0), 0);
  const totalNow = rows.reduce((s, r) => s + r.now, 0);
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <p className="text-xs text-muted-foreground">Net pay against each employee&apos;s previous payslip. Changes over {threshold}% are flagged for review.</p>
        <p className="text-xs">Total net {money(totalBefore, 0)} → <b>{money(totalNow, 0)}</b></p>
      </div>
      <table className="w-full text-xs">
        <thead className="bg-muted/40 text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Employee</th>
            <th className="px-4 py-2 text-right font-medium">Last net</th>
            <th className="px-4 py-2 text-right font-medium">This net</th>
            <th className="px-4 py-2 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="px-4 py-2">
                <p className="font-medium">{r.name}</p>
                <p className="text-[10px] text-muted-foreground">{r.dept}</p>
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{r.before === null ? "New" : money(r.before)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{money(r.now)}</td>
              <td className={cn("px-4 py-2 text-right tabular-nums", r.pctChange !== null && Math.abs(r.pctChange) > threshold && "font-semibold text-amber-600")}>
                {r.change === null ? "—" : `${r.change >= 0 ? "+" : "−"}${money(Math.abs(r.change))} (${r.pctChange!.toFixed(1)}%)`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Inputs ──────────────────────────────────────────────────────────────────

const SOURCE_STYLES: Record<PeriodInput["source"], string> = {
  auto: "border-slate-400/30 text-slate-600",
  manual: "border-violet-500/30 text-violet-600",
  attendance: "border-blue-500/30 text-blue-600",
  loan: "border-amber-500/30 text-amber-600",
  expense: "border-emerald-500/30 text-emerald-600",
  adjustment: "border-rose-500/30 text-rose-600",
};

function InputsList({ run, people, editable, onAdd, onRemove }: { run: PayrollRun; people: Map<string, { fullName: string }>; editable: boolean; onAdd: () => void; onRemove: (id: string) => void }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <p className="text-xs text-muted-foreground">
          One-period items on top of salary structures — pulled from Loans, Expenses and Attendance, plus anything added by hand.
        </p>
        {editable && <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={onAdd}><FilePlus2 className="h-3.5 w-3.5" /> Add input</Button>}
      </div>
      {run.inputs.length === 0 ? (
        <p className="p-8 text-center text-sm text-muted-foreground">No period inputs.</p>
      ) : (
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Employee</th>
              <th className="px-4 py-2 font-medium">Element</th>
              <th className="px-4 py-2 font-medium">Detail</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 text-right font-medium">Amount / units</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {run.inputs.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="px-4 py-2 font-medium">{people.get(i.employeeId)?.fullName ?? i.employeeId}</td>
                <td className="px-4 py-2 font-mono text-[11px]">{i.code}</td>
                <td className="max-w-72 truncate px-4 py-2 text-muted-foreground">{i.description ?? "—"}</td>
                <td className="px-4 py-2"><Badge variant="outline" className={cn("text-[10px] capitalize", SOURCE_STYLES[i.source])}>{i.source}</Badge></td>
                <td className="px-4 py-2 text-right tabular-nums">{i.amount !== undefined ? money(i.amount) : `${i.units} ${i.code === "UNPAID_LEAVE" ? "days" : "hrs"}`}</td>
                <td className="px-2 py-2">
                  {editable && (i.source === "manual" || i.source === "adjustment") && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

function AddInputDialog({
  open,
  onClose,
  run,
  people,
  elements,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  run: PayrollRun;
  people: Map<string, { fullName: string }>;
  elements: import("@/src/lib/payroll/types").PayElement[];
  onAdd: (input: Omit<PeriodInput, "id">) => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const el = elements.find((e) => e.code === code);
  const byUnits = el?.calculationType === "rate_x_units";
  const reset = () => { setEmployeeId(""); setCode(""); setValue(""); setNote(""); };
  const grouped = ELEMENT_GROUP_ORDER.map((g) => ({ g, items: elements.filter((e) => e.group === g) })).filter((x) => x.items.length);
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a pay input</DialogTitle>
          <DialogDescription>A one-off for {run.period.label}: a bonus, overtime hours, unpaid days or a deduction. The run recalculates immediately.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Choose an employee" /></SelectTrigger>
              <SelectContent>
                {run.employees.map((e) => <SelectItem key={e.employeeId} value={e.employeeId}>{people.get(e.employeeId)?.fullName ?? e.employeeId}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Pay element</Label>
            <Select value={code} onValueChange={setCode}>
              <SelectTrigger><SelectValue placeholder="Choose an element" /></SelectTrigger>
              <SelectContent className="max-h-80">
                {grouped.map(({ g, items }) => (
                  <SelectGroup key={g}>
                    <SelectLabel className="text-[10px] uppercase tracking-wide">{ELEMENT_GROUP_LABELS[g]}</SelectLabel>
                    {items.map((e) => <SelectItem key={e.code} value={e.code}>{e.name}</SelectItem>)}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{byUnits ? (code === "UNPAID_LEAVE" ? "Days" : "Hours") : "Amount (₦)"}</Label>
            <Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
            {el?.multiplier && <p className="text-[11px] text-muted-foreground">Paid at {el.multiplier}× the employee&apos;s hourly basic rate.</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Note on payslip (optional)</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Q3 sales target achieved" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!employeeId || !code || !(Number(value) > 0)}
            onClick={() => {
              onAdd({ employeeId, code, ...(byUnits ? { units: Number(value) } : { amount: Number(value) }), description: note || undefined, source: "manual" });
              onClose();
              reset();
            }}
          >
            Add &amp; recalculate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Summary ─────────────────────────────────────────────────────────────────

function Summary({ run, people }: { run: PayrollRun; people: Map<string, { departmentName: string }> }) {
  const byCode = new Map<string, { name: string; category: string; amount: number }>();
  const byDept = new Map<string, { gross: number; net: number; count: number }>();
  for (const e of run.employees) {
    if (!e.included || !e.computation) continue;
    for (const l of e.computation.lines) {
      const prev = byCode.get(l.code) ?? { name: l.name, category: l.category, amount: 0 };
      prev.amount += l.amount;
      byCode.set(l.code, prev);
    }
    const d = people.get(e.employeeId)?.departmentName ?? "Other";
    const row = byDept.get(d) ?? { gross: 0, net: 0, count: 0 };
    row.gross += e.computation.gross;
    row.net += e.computation.net;
    row.count += 1;
    byDept.set(d, row);
  }
  const section = (cat: string, title: string) => {
    const items = [...byCode.entries()].filter(([, v]) => v.category === cat).sort((a, b) => b[1].amount - a[1].amount);
    return (
      <div className="rounded-xl border bg-card p-4">
        <p className="mb-2 text-xs font-semibold">{title}</p>
        {items.map(([code, v]) => (
          <div key={code} className="flex justify-between border-t py-1.5 text-xs first:border-0">
            <span className="text-muted-foreground">{v.name}</span>
            <span className="tabular-nums">{money(v.amount)}</span>
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {section("earning", "Earnings")}
      {section("deduction", "Deductions")}
      <div className="flex flex-col gap-4">
        {section("employer", "Employer contributions")}
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-2 text-xs font-semibold">By department</p>
          {[...byDept.entries()].sort((a, b) => b[1].gross - a[1].gross).map(([d, v]) => (
            <div key={d} className="flex justify-between border-t py-1.5 text-xs first:border-0">
              <span className="text-muted-foreground">{d} <span className="text-[10px]">({v.count})</span></span>
              <span className="tabular-nums">{money(v.gross, 0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

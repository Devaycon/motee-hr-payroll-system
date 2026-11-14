"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PayslipDocument, PayslipPrintStyles } from "@/src/components/shared/payslip/payslip-document";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_HREF, PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { EXCEPTION_RULE_LABELS } from "@/src/lib/payroll/validation";
import { structureOn } from "@/src/lib/payroll/run-builder";
import { useDraftPayslip, usePayrollActions, useRun } from "@/src/lib/payroll/use-payroll";
import type { PayslipLine } from "@/src/lib/payroll/types";
import { RunStatusBadge, money } from "./components/shared";

/** One employee inside a draft run: their inputs, structure and a live payslip preview. */
export function RunEmployeePage({ runId, employeeId }: { runId: string; employeeId: string }) {
  const { run, data, bundle, loading } = useRun(runId);
  const actions = usePayrollActions();
  const canEdit = useCan(PAYROLL_MODULE, "edit");
  const preview = useDraftPayslip(runId, employeeId);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("");

  if (loading || !data || !bundle) return <Skeleton className="h-[700px] w-full rounded-xl" />;
  const re = run?.employees.find((e) => e.employeeId === employeeId);
  const emp = bundle.employees.find((e) => e.id === employeeId);
  if (!run || !re || !emp) return <p className="py-20 text-center text-sm text-muted-foreground">Not found.</p>;

  const editable = run.status === "draft" && canEdit;
  const inputs = run.inputs.filter((i) => i.employeeId === employeeId);
  const structure = structureOn(data.structures, employeeId, run.period.end);
  const profile = data.profiles.find((p) => p.employeeId === employeeId);
  const issues = run.exceptions.filter((x) => x.employeeId === employeeId);
  const elements = data.elements.filter((e) => e.active && data.settings.enabledGroups.includes(e.group) && e.category !== "employer" && !(e.statutory && e.calculationType === "formula"));
  const el = elements.find((e) => e.code === code);
  const units = el?.calculationType === "rate_x_units";

  function setManualLines(lines: PayslipLine[]) {
    actions.applyManualUpload(run!.id, [{ employeeId, lines }], re!.manualStatutory ?? "recalculate", "manual edit");
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PayslipPrintStyles />
      <div className="print:hidden">
        <Link href={`${PAYROLL_HREF}/${run.id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> {run.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{emp.fullName}</h1>
          <RunStatusBadge status={run.status} />
          <Badge variant="outline" className="text-[10px] capitalize">{re.mode}</Badge>
          {!re.included && <Badge variant="outline" className="text-[10px]">Excluded from run</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{emp.jobTitle} · {emp.departmentName}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <aside className="flex flex-col gap-4 print:hidden">
          {issues.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="mb-1 text-xs font-semibold">Checks</p>
              {issues.map((i) => (
                <p key={i.id} className="text-[11px] text-muted-foreground"><b className="text-foreground">{EXCEPTION_RULE_LABELS[i.rule]}:</b> {i.message}</p>
              ))}
            </div>
          )}

          <div className="rounded-xl border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold">How this employee is paid</p>
              {editable && (
                <Select value={re.mode} onValueChange={(v) => actions.setMode(run.id, employeeId, v as "auto" | "manual")}>
                  <SelectTrigger className="h-7 w-28 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {re.mode === "auto" ? (
              <>
                <p className="text-[11px] text-muted-foreground">From salary structure {structure?.id ?? "—"} (effective {structure?.effectiveFrom ?? "—"}).</p>
                <div className="mt-2 divide-y text-xs">
                  {structure?.lines.map((l) => (
                    <div key={l.code} className="flex justify-between py-1">
                      <span className="text-muted-foreground">{data.elements.find((e) => e.code === l.code)?.name ?? l.code}</span>
                      <span className="tabular-nums">{money(l.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <ManualLines
                lines={re.manualLines ?? []}
                editable={editable}
                statutory={re.manualStatutory ?? "recalculate"}
                onStatutory={(s) => actions.applyManualUpload(run.id, [{ employeeId, lines: re.manualLines ?? [] }], s, "statutory mode change")}
                onChange={setManualLines}
              />
            )}
          </div>

          <div className="rounded-xl border bg-card p-4">
            <p className="mb-2 text-xs font-semibold">Inputs this period</p>
            {inputs.length === 0 && <p className="text-[11px] text-muted-foreground">None.</p>}
            <div className="divide-y text-xs">
              {inputs.map((i) => (
                <div key={i.id} className="flex items-start justify-between gap-2 py-1.5">
                  <div className="min-w-0">
                    <p className="font-medium">{data.elements.find((e) => e.code === i.code)?.name ?? i.code}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{i.source} · {i.description ?? ""}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="tabular-nums">{i.amount !== undefined ? money(i.amount) : `${i.units}`}</span>
                    {editable && i.source === "manual" && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => actions.removeInput(run.id, i.id)}><Trash2 className="h-3 w-3" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {editable && (
              <div className="mt-3 grid grid-cols-[1fr_90px_auto] gap-1.5">
                <Select value={code} onValueChange={setCode}>
                  <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="Element" /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {elements.map((e) => <SelectItem key={e.code} value={e.code} className="text-xs">{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input className="h-8 text-xs" type="number" placeholder={units ? "Hrs/days" : "₦"} value={value} onChange={(e) => setValue(e.target.value)} />
                <Button
                  size="icon"
                  className="h-8 w-8"
                  disabled={!code || !(Number(value) > 0)}
                  onClick={() => {
                    actions.addInput(run.id, { employeeId, code, ...(units ? { units: Number(value) } : { amount: Number(value) }), source: "manual" });
                    setCode("");
                    setValue("");
                    toast.success("Added — payslip preview updated");
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {profile && (
            <div className="rounded-xl border bg-card p-4 text-xs">
              <p className="mb-2 font-semibold">Tax &amp; statutory profile</p>
              {[
                ["TIN", profile.tin || "Missing"],
                ["Tax state", profile.stateOfResidence],
                ["PFA", profile.pfaName],
                ["RSA PIN", profile.rsaPin || "Missing"],
                ["Annual rent declared", profile.annualRentDeclared ? `${money(profile.annualRentDeclared, 0)} ${profile.rentEvidenceVerified ? "· verified" : "· evidence not verified"}` : "None"],
                ["Bank", `${profile.bankName} · ${profile.accountNumber ? `•••• ${profile.accountNumber.slice(-4)}` : "missing"}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-t py-1 first:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="truncate text-right">{v}</span>
                </div>
              ))}
              <Link href={`${PAYROLL_HREF}/settings?tab=profiles&employee=${employeeId}`} className="mt-2 inline-block text-[11px] text-primary hover:underline">Edit profile</Link>
            </div>
          )}
        </aside>

        <div className="payslip-print-root min-w-0">
          {preview ? <PayslipDocument payslip={preview} /> : <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Include this employee in the run to preview their payslip.</p>}
        </div>
      </div>
    </div>
  );
}

function ManualLines({
  lines,
  editable,
  statutory,
  onStatutory,
  onChange,
}: {
  lines: PayslipLine[];
  editable: boolean;
  statutory: "as_uploaded" | "recalculate";
  onStatutory: (s: "as_uploaded" | "recalculate") => void;
  onChange: (lines: PayslipLine[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Select value={statutory} onValueChange={(v) => onStatutory(v as "as_uploaded" | "recalculate")} disabled={!editable}>
        <SelectTrigger className="h-8 text-[11px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="recalculate" className="text-xs">Recalculate PAYE, pension &amp; NHF from these figures</SelectItem>
          <SelectItem value="as_uploaded" className="text-xs">Use statutory figures exactly as entered</SelectItem>
        </SelectContent>
      </Select>
      <div className="divide-y text-xs">
        {lines.map((l, i) => (
          <div key={`${l.code}-${i}`} className="flex items-center justify-between gap-2 py-1">
            <span className="min-w-0 truncate text-muted-foreground">{l.name}</span>
            {editable ? (
              <Input
                type="number"
                className="h-7 w-28 text-right text-xs"
                defaultValue={l.amount}
                onBlur={(e) => {
                  const v = Number(e.target.value);
                  if (v !== l.amount) onChange(lines.map((x, j) => (j === i ? { ...x, amount: v } : x)));
                }}
              />
            ) : (
              <span className="tabular-nums">{money(l.amount)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

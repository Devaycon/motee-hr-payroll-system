"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Check, Paperclip, ShieldCheck, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { PAYROLL_HREF } from "@/src/lib/payroll/constants";
import { round2 } from "@/src/lib/payroll/ng/engine";
import { FIGURE_LABELS, salaryImpact } from "@/src/lib/payroll/salary-impact";
import { useCurrentActor, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { ConfigChange, SalaryImpact, SalaryStructure } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { fmtDate, money } from "./components/shared";

function Card({ title, description, children, right }: { title: string; description?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// ── Approval framework ──────────────────────────────────────────────────────

/** Who does what in payroll, mapped to the tenant's roles, and the controls that enforce it. */
export function ApprovalFramework() {
  const { bundle } = useTenantPayroll();
  const roleName = (id: string) => bundle?.roles.find((r) => r.id === id)?.name ?? id;
  const holder = (id: string) => {
    const emp = bundle?.employees.find((e) => e.id === bundle?.roles.find((r) => r.id === id)?.linkedEmployeeId);
    return emp?.fullName;
  };
  const rows = [
    { role: "Payroll Processor", who: ["ROLE-HRADMIN"], does: "Prepares payroll, investigates exceptions and submits" },
    { role: "Payroll Reviewer", who: ["ROLE-FIN"], does: "Independently verifies calculations and changes (approval step 1); second approver for configuration changes" },
    { role: "Payroll Approver", who: ["ROLE-EXEC"], does: "Approves the final payroll (approval step 2)" },
    { role: "Finance / Payment Authoriser", who: ["ROLE-FIN", "ROLE-EXEC"], does: "Authorises payment release on the finalized run" },
    { role: "System Administrator", who: ["ROLE-SADMIN", "ROLE-IT"], does: "Manages access — gets no payroll approval or payment rights automatically" },
  ];
  return (
    <Card title="Approval framework" description="Segregation of duties is enforced, not just documented.">
      <table className="w-full text-xs">
        <tbody>
          {rows.map((r) => (
            <tr key={r.role} className="border-t first:border-0">
              <td className="py-1.5 pr-3 align-top font-medium">{r.role}</td>
              <td className="py-1.5 pr-3 align-top text-muted-foreground">
                {r.who.map((w) => roleName(w)).join(" / ")}
                {r.who.map(holder).filter(Boolean).length > 0 && <span className="block text-[10px]">{r.who.map(holder).filter(Boolean).join(", ")}</span>}
              </td>
              <td className="py-1.5 align-top text-muted-foreground">{r.does}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="mt-3 space-y-1 text-[11px] text-muted-foreground">
        <li>• The preparer and submitter can never approve their own run, and nobody approves two steps of the same run.</li>
        <li>• Payment release is refused to anyone who prepared, finalized or approved the run.</li>
        <li>• Approved runs are locked; any change after approval sends the run back to draft for recalculation and re-approval.</li>
        <li>• Delegated approval with start and end dates is set in Submissions &amp; Approvals; every action is in the audit trail.</li>
      </ul>
      <Link href="/hr-action-center/submissions" className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary hover:underline">Approval chains &amp; delegations <ArrowRight className="h-3 w-3" /></Link>
    </Card>
  );
}

// ── Configuration change history ────────────────────────────────────────────

const AREA_LABEL: Record<ConfigChange["area"], string> = { settings: "Settings", element: "Pay element", rate_set: "Statutory rates" };

export function ConfigHistory({ canEdit }: { canEdit: boolean }) {
  const { data } = useTenantPayroll();
  const actions = usePayrollActions();
  const actor = useCurrentActor();
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const changes = (data?.configChanges ?? []).filter((c) => filter === "all" || c.status === "pending");
  const versions = data?.settingsVersions ?? [];
  return (
    <div className="flex flex-col gap-5">
      <Card
        title="Configuration change history"
        description="Every change to how payroll is calculated: who changed it, what changed, when, the date it takes effect and who approved it. Changes that need a second approver wait here."
        right={
          <div className="inline-flex rounded-lg border p-0.5 text-xs">
            {(["all", "pending"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={cn("rounded-md px-3 py-1", filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                {f === "all" ? "All" : "Awaiting approval"}
              </button>
            ))}
          </div>
        }
      >
        {changes.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">{filter === "pending" ? "Nothing is waiting for approval." : "No configuration changes recorded yet."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-xs">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Change</th>
                  <th className="pb-2 font-medium">What changed</th>
                  <th className="pb-2 font-medium">Changed by · when</th>
                  <th className="pb-2 font-medium">Effective</th>
                  <th className="pb-2 font-medium">Approved by</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((c) => {
                  const mine = c.requestedBy === actor.name || (!!c.requestedById && c.requestedById === actor.employeeId);
                  return (
                    <tr key={c.id} className="border-t align-top">
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className="mb-1 text-[9px]">{AREA_LABEL[c.area]}</Badge>
                        <p className="font-medium">{c.summary}</p>
                      </td>
                      <td className="py-2 pr-3">
                        {c.changes.slice(0, 6).map((d) => (
                          <p key={d.field}><span className="text-muted-foreground">{d.field}:</span> {d.before} → <b>{d.after}</b></p>
                        ))}
                        {c.changes.length > 6 && <p className="text-muted-foreground">+ {c.changes.length - 6} more</p>}
                        {!c.changes.length && <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2 pr-3">{c.requestedBy}<span className="block text-[10px] text-muted-foreground">{new Date(c.requestedAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></td>
                      <td className="py-2 pr-3 tabular-nums">{c.effectiveFrom}</td>
                      <td className="py-2">
                        {c.status === "pending" ? (
                          canEdit && !mine ? (
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={() => { const r = actions.decideConfigChange(c.id, true); if (r.ok) toast.success("Approved and applied"); else toast.error(r.reason); }}><Check className="h-3 w-3" /> Approve</Button>
                              <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => { const r = actions.decideConfigChange(c.id, false); if (r.ok) toast.success("Rejected"); else toast.error(r.reason); }}><X className="h-3 w-3" /> Reject</Button>
                            </div>
                          ) : (
                            <span className="text-amber-700">Awaiting a second approver{mine ? " (not you)" : ""}</span>
                          )
                        ) : (
                          <span className={c.status === "rejected" ? "text-rose-600" : ""}>
                            {c.status === "rejected" ? "Rejected by " : ""}{c.approvedBy}
                            <span className="block text-[10px] text-muted-foreground">{c.approvalNote ?? (c.approvedAt ? fmtDate(c.approvedAt) : "")}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {versions.length > 0 && (
        <Card title="Settings versions" description="The calculation settings in force from each date. A pay period is always calculated with the version in force on its last day.">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground"><tr><th className="pb-2 font-medium">In force from</th><th className="pb-2 font-medium">Recorded by</th><th className="pb-2 font-medium">PAYE method</th><th className="pb-2 font-medium">NHF basis</th><th className="pb-2 font-medium">AVC relieved</th></tr></thead>
            <tbody>
              {[...versions].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom)).map((v) => (
                <tr key={v.effectiveFrom + v.changedAt} className="border-t">
                  <td className="py-1.5 tabular-nums">{v.effectiveFrom === "0000-01-01" ? "Original settings" : v.effectiveFrom}</td>
                  <td className="py-1.5">{v.changedBy}</td>
                  <td className="py-1.5">{v.settings.taxMethod}</td>
                  <td className="py-1.5">{v.settings.nhfBasis ?? "gross"}</td>
                  <td className="py-1.5">{v.settings.avcTaxRelieved === false ? "No" : "Yes"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ── Salary change proposal ──────────────────────────────────────────────────

export function ImpactTable({ impact, className }: { impact: SalaryImpact; className?: string }) {
  return (
    <table className={cn("w-full text-[11px]", className)}>
      <thead className="text-left text-muted-foreground"><tr><th className="font-medium">Monthly</th><th className="text-right font-medium">Now</th><th className="text-right font-medium">Proposed</th><th className="text-right font-medium">Change</th></tr></thead>
      <tbody>
        {FIGURE_LABELS.map(({ key, label }) => {
          const d = round2(impact.after[key] - impact.before[key]);
          return (
            <tr key={key} className={cn("border-t", (key === "net" || key === "employerCost") && "font-semibold")}>
              <td className="py-1">{label}</td>
              <td className="py-1 text-right tabular-nums">{money(impact.before[key], 0)}</td>
              <td className="py-1 text-right tabular-nums">{money(impact.after[key], 0)}</td>
              <td className={cn("py-1 text-right tabular-nums", d < 0 && "text-rose-600")}>{d > 0 ? "+" : ""}{money(d, 0)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * The salary management workflow: propose (existing vs proposed), see the
 * financial impact (gross, tax, pension, net, employer cost), attach the
 * evidence, then route it for approval. Approved changes apply in the right
 * payroll period (back-dated ones pay arrears) and stay in the salary history.
 */
export function SalaryProposal({ employeeId, current }: { employeeId: string; current: SalaryStructure }) {
  const { data, bundle } = useTenantPayroll();
  const actions = usePayrollActions();
  const today = new Date().toISOString().slice(0, 10);
  const elements = data?.elements ?? [];
  const base = useMemo(() => Object.fromEntries(current.lines.map((x) => [x.code, x.amount])), [current]);
  const [draft, setDraft] = useState<Record<string, number>>(base);
  const [effective, setEffective] = useState(today.slice(0, 8) + "01");
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState<{ fileName: string; uploadedAt: string } | null>(null);
  const emp = bundle?.employees.find((e) => e.id === employeeId);
  const changed = current.lines.some((l) => (draft[l.code] ?? l.amount) !== l.amount);
  const lines = useMemo(() => current.lines.map((l) => ({ code: l.code, amount: draft[l.code] ?? l.amount })), [current, draft]);
  const impact = useMemo(() => (data && emp && changed ? salaryImpact(data, emp, lines, effective) : null), [data, emp, changed, effective, lines]);
  const total = (xs: { amount: number }[]) => round2(xs.reduce((s, l) => s + l.amount, 0));

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold">1 · Propose a salary change</p>
        <Link href={`${PAYROLL_HREF}/salary-review`} className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"><Users className="h-3 w-3" /> Bulk salary review</Link>
      </div>
      <table className="w-full text-xs">
        <thead className="text-left text-[11px] text-muted-foreground"><tr><th className="pb-1 font-medium">Element</th><th className="pb-1 text-right font-medium">Existing</th><th className="pb-1 text-right font-medium">Proposed</th></tr></thead>
        <tbody>
          {current.lines.map((l) => (
            <tr key={l.code}>
              <td className="py-0.5 text-muted-foreground">{elements.find((e) => e.code === l.code)?.name ?? l.code}</td>
              <td className="py-0.5 text-right tabular-nums text-muted-foreground">{money(l.amount, 0)}</td>
              <td className="py-0.5 text-right">
                <Input type="number" className={cn("ml-auto h-7 w-32 text-right text-xs", draft[l.code] !== l.amount && "border-primary")} value={draft[l.code] ?? l.amount} onChange={(e) => setDraft({ ...draft, [l.code]: Number(e.target.value) })} />
              </td>
            </tr>
          ))}
          <tr className="border-t font-semibold">
            <td className="pt-1.5">Monthly gross</td>
            <td className="pt-1.5 text-right tabular-nums">{money(total(current.lines), 0)}</td>
            <td className="pt-1.5 text-right tabular-nums">{money(total(lines), 0)}</td>
          </tr>
        </tbody>
      </table>

      <p className="mb-1 mt-4 text-xs font-semibold">2 · Financial impact</p>
      {impact ? <ImpactTable impact={impact} /> : <p className="text-[11px] text-muted-foreground">Change an amount to see gross, tax, pension, net pay and employer cost before and after.</p>}
      {impact && <p className="mt-1 text-[10px] text-muted-foreground">Annual cost to the employer: {money(round2((impact.after.employerCost - impact.before.employerCost) * 12), 0)}. A full month under the rules in force on the effective date.</p>}

      <p className="mb-1 mt-4 text-xs font-semibold">3 · Effective date, reason &amp; evidence</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label className="text-[11px]">Effective from</Label><Input type="date" className="h-8 text-xs" value={effective} onChange={(e) => setEffective(e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-[11px]">Reason</Label><Input className="h-8 text-xs" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Promotion to Senior Analyst" /></div>
      </div>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] hover:bg-muted">
        <Paperclip className="h-3 w-3" /> {evidence ? evidence.fileName : "Attach supporting evidence (letter, review form)"}
        <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; setEvidence(f ? { fileName: f.name, uploadedAt: new Date().toISOString() } : null); }} />
      </label>
      {effective < today && <p className="mt-1 text-[10px] text-amber-700">Back-dated: once approved, arrears are paid in the next payroll run.</p>}

      <Button
        size="sm"
        className="mt-3 w-full gap-1.5"
        disabled={!changed || !reason.trim() || effective <= current.effectiveFrom}
        onClick={async () => {
          const res = await actions.requestSalaryChange({ employeeId, effectiveFrom: effective, currency: current.currency, reason: reason.trim(), lines, evidence, impact: impact ?? undefined });
          if (!res.ok) return toast.error(res.reason);
          setDraft(base);
          setReason("");
          setEvidence(null);
          toast.success("4 · Sent for approval", { description: effective < today ? "Back-dated: arrears follow in the next run once approved." : "Payroll applies it from its effective date once approved." });
        }}
      >
        <ShieldCheck className="h-3.5 w-3.5" /> Send for approval
      </Button>
      {effective <= current.effectiveFrom && <p className="mt-1 text-[10px] text-muted-foreground">The effective date must be after {current.effectiveFrom}.</p>}
    </div>
  );
}

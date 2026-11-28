"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Bot, Check, Lock, Paperclip, ShieldCheck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { EmployeePicker } from "@/src/components/shared/employee-picker";
import { PAYROLL_HREF, PAYROLL_MODULE } from "@/src/lib/payroll/constants";
import { compareRuns, KIND_LABELS, REASON_LABELS, SOURCE_LABELS, type VarianceReason } from "@/src/lib/payroll/comparison";
import { INVESTIGATIONS_HREF, comparisonCtxOf, useCurrentActor, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import { NotSupported, fmtDate, money } from "./components/shared";
import { InvestigationStatusBadge } from "./investigations";
import { SourceLine } from "./components/confidence";
import { lifecycleOf } from "@/src/lib/payroll/investigation-lifecycle";

const MAX_INLINE = 400_000;
const at = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** `/time-payroll/payroll/investigations/[caseId]` — one variance investigation, end to end. */
export function InvestigationDetailPage({ caseId }: { caseId: string }) {
  const { data, bundle, loading, supported } = useTenantPayroll();
  const actions = usePayrollActions();
  const me = useCurrentActor();
  const canPayroll = useCan(PAYROLL_MODULE, "create");
  const [comment, setComment] = useState("");
  const [resolution, setResolution] = useState("");
  const [outcome, setOutcome] = useState<"legitimate" | "error">("legitimate");
  const [signNote, setSignNote] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const inv = data?.investigations?.find((i) => i.id === caseId);

  // The evidence: the employee's movements, recomputed from the two runs.
  const evidence = useMemo(() => {
    if (!data || !bundle || !inv) return null;
    const cur = data.runs.find((r) => r.id === inv.runId);
    const prev = data.runs.find((r) => r.id === inv.previousRunId);
    if (!cur || !prev) return null;
    const cmp = compareRuns(cur, prev, comparisonCtxOf(data, bundle));
    const emp = inv.employeeId ? cmp.employees.find((e) => e.employeeId === inv.employeeId) : null;
    const movements = emp ? emp.movements : cmp.employees.flatMap((e) => e.movements.filter((m) => !inv.reason || m.reason === inv.reason).map((m) => ({ ...m, who: e.name })));
    return { cmp, emp, movements: movements as (typeof movements[number] & { who?: string })[] };
  }, [data, bundle, inv]);

  if (!supported && bundle) return <NotSupported />;
  if (loading || !data) return <Skeleton className="h-150 w-full rounded-xl" />;
  if (!inv) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Investigation {caseId} was not found. <Link href={INVESTIGATIONS_HREF} className="text-primary hover:underline">Back to the register</Link>
      </div>
    );
  }

  const life = lifecycleOf(inv);
  const closed = life.closed;
  const isOwner = !!inv.ownerId && inv.ownerId === me.employeeId;
  const canWork = isOwner || canPayroll;
  const resolvedByMe = inv.resolvedBy === me.name || (!!inv.resolvedById && inv.resolvedById === me.employeeId);
  const awaitingSignOff = inv.status === "resolved" && inv.signOff?.decision !== "accepted";

  const upload = (file: File) => {
    const done = (dataUrl?: string) => {
      actions.attachToInvestigation(inv.id, { fileName: file.name, dataUrl });
      toast.success(`${file.name} attached`);
    };
    if (file.size > MAX_INLINE) return done();
    const r = new FileReader();
    r.onload = () => done(String(r.result));
    r.onerror = () => done();
    r.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href={INVESTIGATIONS_HREF} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Investigations</Link>
          <h1 className="mt-1 text-2xl font-semibold">{inv.title}</h1>
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {inv.id} · {inv.periodLabel} · raised by {inv.createdBy} on {fmtDate(inv.createdAt)} <InvestigationStatusBadge inv={inv} />
          </p>
        </div>
        <Link href={`${PAYROLL_HREF}/compare?current=${inv.runId}&previous=${inv.previousRunId}`} className="text-xs text-primary hover:underline">Open the payroll comparison →</Link>
      </div>

      {/* Lifecycle: Detection → Investigation → Assignment → Resolution → Independent sign-off → Closure */}
      <div className="rounded-xl border bg-card p-4">
        <p className="text-sm font-semibold">Investigation lifecycle</p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {life.stages.map((s, i) => (
            <li key={s.key} className={cn("rounded-lg border px-3 py-2", s.state === "current" && "border-primary bg-primary/5", s.state === "todo" && "opacity-60")}>
              <p className="flex items-center gap-1.5 text-xs font-medium">
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]", s.state === "done" ? "bg-emerald-600 text-white" : s.state === "current" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {s.state === "done" ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                {s.label}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{s.state === "done" ? [s.by, s.at && fmtDate(s.at)].filter(Boolean).join(" · ") || "Done" : s.description}</p>
            </li>
          ))}
        </ol>
        {closed && (
          <p className="mt-3 flex items-center gap-1.5 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Closed {fmtDate(inv.closedAt ?? inv.signOff?.at ?? "")} after independent sign-off. This is now a permanent audit record and can&apos;t be changed.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Finding & evidence */}
          <div className="rounded-xl border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Fact label="Amount" value={money(inv.amount)} />
              <Fact label="Employee" value={inv.employeeName ?? "Company-wide"} />
              <Fact label="Reason" value={inv.reason ? REASON_LABELS[inv.reason as VarianceReason] ?? inv.reason : "—"} />
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              What the system found
              {inv.detectedBy === "system" && <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-px text-[9px] normal-case tracking-normal"><Bot className="h-3 w-3" /> Detected automatically</span>}
            </p>
            <p className="mt-1 text-sm">{inv.finding}</p>
            {evidence?.emp && <p className="mt-2 text-xs text-muted-foreground">Current explanation: {evidence.emp.explanation}</p>}
          </div>

          <div className="overflow-hidden rounded-xl border bg-card">
            <p className="border-b px-4 py-3 text-sm font-semibold">Underlying payroll transactions</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-xs">
                <thead className="bg-[color-mix(in_oklab,var(--muted)_40%,var(--card))] text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Pay element</th>
                    <th className="px-4 py-2 font-medium">Movement</th>
                    <th className="px-4 py-2 text-right font-medium">Previous</th>
                    <th className="px-4 py-2 text-right font-medium">Current</th>
                    <th className="px-4 py-2 text-right font-medium">Change</th>
                    <th className="px-4 py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {!evidence?.movements.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No line movements found between the two runs.</td></tr>}
                  {evidence?.movements.map((m, i) => (
                    <tr key={`${m.code}-${i}`} className="border-t align-top">
                      <td className="px-4 py-2">{m.name}{m.who && <span className="block text-[10px] text-muted-foreground">{m.who}</span>}</td>
                      <td className="px-4 py-2">{KIND_LABELS[m.kind]}<span className="block text-[10px] text-muted-foreground">{REASON_LABELS[m.reason]}</span></td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{money(m.previous)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{money(m.current)}</td>
                      <td className={cn("px-4 py-2 text-right tabular-nums", m.change < 0 ? "text-rose-600" : "text-emerald-700")}>{m.change < 0 ? "−" : ""}{money(Math.abs(m.change))}</td>
                      <td className="px-4 py-2">
                        <SourceLine source={m.source} />
                        <span className={cn("block text-[10px]", !m.source.confirmed && "text-amber-700 dark:text-amber-400")}>{SOURCE_LABELS[m.source.type]}</span>
                        <span className="block text-[10px] text-muted-foreground">{m.source.detail}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {[m.source.initiatedBy && `Initiated by ${m.source.initiatedBy}`, m.source.approvedBy && `approved by ${m.source.approvedBy}`, m.source.processedAt && `processed ${fmtDate(m.source.processedAt)}`, m.source.ref && `ref ${m.source.ref}`].filter(Boolean).join(" · ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stage 2: review of the originating transaction */}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">Review of the originating transaction</p>
            {inv.review ? (
              <>
                <p className="mt-2 whitespace-pre-wrap text-xs">{inv.review.note}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Reviewed by {inv.review.by} · {at(inv.review.at)}</p>
              </>
            ) : canWork && !closed && inv.status !== "resolved" ? (
              <div className="mt-2 flex flex-col gap-2">
                <p className="text-[11px] text-muted-foreground">Open the transactions above and record what the source record shows (who entered it, which approval, which document).</p>
                <Textarea className="min-h-16 text-xs" placeholder="e.g. One-off input ONE_OFF entered by Kemi on 3 Nov; matches the approved sales commission schedule (ref SC-114)." value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} />
                <Button size="sm" className="self-end" disabled={!reviewNote.trim()} onClick={() => { const r = actions.reviewInvestigation(inv.id, reviewNote); if (!r.ok) toast.error(r.reason); else { toast.success("Review recorded"); setReviewNote(""); } }}>Record review</Button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">{inv.status !== "open" ? "Reviewed as part of the investigation (recorded before review notes existed)." : "Not reviewed yet."}</p>
            )}
          </div>

          {/* Comments */}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">Manager comments</p>
            <ul className="mt-3 space-y-3">
              {inv.comments.map((c) => (
                <li key={c.id} className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
                  <p className="text-[10px] text-muted-foreground">{c.by} · {at(c.at)}</p>
                  <p className="mt-0.5 whitespace-pre-wrap">{c.text}</p>
                </li>
              ))}
              {!inv.comments.length && <li className="text-xs text-muted-foreground">No comments yet.</li>}
            </ul>
            <div className={cn("mt-3 flex flex-col gap-2", closed && "hidden")}>
              <Textarea className="min-h-16 text-xs" placeholder="Add a comment (the owner and the person who raised it are notified)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <Button size="sm" className="self-end" disabled={!comment.trim()} onClick={() => { actions.commentOnInvestigation(inv.id, comment); setComment(""); }}>Post comment</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Ownership */}
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">Ownership</p>
            <Fact label="Task owner" value={inv.ownerName || "Unassigned"} />
            {!inv.ownerId && !closed && <p className="rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-800 dark:text-amber-300">Assign a responsible person — the case can&apos;t be resolved until someone owns it.</p>}
            <Fact label="Due" value={inv.dueDate ? fmtDate(inv.dueDate) : "No due date"} />
            {canWork && inv.status !== "resolved" && !closed && (
              <>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">{inv.ownerId ? "Reassign" : "Assign to"}</Label>
                  <EmployeePicker value={inv.ownerId} clearable={false} onChange={(e) => e && e.id !== inv.ownerId && (actions.assignInvestigation(inv.id, e.id, e.name), toast.success(`Reassigned to ${e.name}`))} />
                </div>
                {inv.status === "open" ? (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => actions.setInvestigationStatus(inv.id, "investigating")}>Start investigating</Button>
                ) : (
                  <Button size="sm" variant="ghost" className="w-full" onClick={() => actions.setInvestigationStatus(inv.id, "open")}>Move back to Open</Button>
                )}
              </>
            )}
          </div>

          {/* Documents */}
          <div className="space-y-2 rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Supporting documents</p>
              {!closed && <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => fileRef.current?.click()}><Paperclip className="h-3 w-3" /> Attach</Button>}
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            </div>
            <ul className="space-y-1.5 text-xs">
              {inv.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  {d.dataUrl ? <a href={d.dataUrl} download={d.fileName} className="truncate text-primary hover:underline">{d.fileName}</a> : <span className="truncate">{d.fileName}</span>}
                  <span className="shrink-0 text-[10px] text-muted-foreground">{d.uploadedBy} · {fmtDate(d.uploadedAt)}</span>
                </li>
              ))}
              {!inv.documents.length && <li className="text-muted-foreground">None attached.</li>}
            </ul>
          </div>

          {/* Resolution */}
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">Resolution</p>
            {inv.status === "resolved" ? (
              <>
                <p className="text-xs"><span className="font-medium">{inv.outcome === "error" ? "Payroll error — correction needed" : "Movement is legitimate"}</span></p>
                <p className="whitespace-pre-wrap text-xs">{inv.resolutionNote}</p>
                <p className="text-[10px] text-muted-foreground">Resolved by {inv.resolvedBy} · {inv.resolvedAt && at(inv.resolvedAt)}</p>
                {inv.signOff?.decision === "accepted" ? (
                  <p className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-800 dark:text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Signed off by {inv.signOff.by} · {at(inv.signOff.at)}</p>
                ) : awaitingSignOff && resolvedByMe ? (
                  <p className="rounded-md bg-muted px-2 py-1.5 text-[11px] text-muted-foreground">Waiting for a second person to sign off. You resolved it, so you can&apos;t sign it off yourself.</p>
                ) : (
                  <div className="space-y-2">
                    <Textarea className="min-h-14 text-xs" placeholder="Sign-off note (required to reopen)" value={signNote} onChange={(e) => setSignNote(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1" onClick={() => { const r = actions.signOffInvestigation(inv.id, "accepted", signNote); if (!r.ok) toast.error(r.reason); else { toast.success("Resolution signed off"); setSignNote(""); } }}><ShieldCheck className="h-3.5 w-3.5" /> Sign off</Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => { const r = actions.signOffInvestigation(inv.id, "reopened", signNote); if (!r.ok) toast.error(r.reason); else { toast.success("Investigation reopened"); setSignNote(""); } }}><Undo2 className="h-3.5 w-3.5" /> Reopen</Button>
                    </div>
                  </div>
                )}
              </>
            ) : canWork && inv.ownerId ? (
              <>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-0.5 text-[11px]">
                  {(["legitimate", "error"] as const).map((o) => (
                    <button key={o} type="button" onClick={() => setOutcome(o)} className={cn("rounded-md px-2 py-1", outcome === o && "bg-card font-medium shadow-sm")}>{o === "legitimate" ? "Legitimate" : "Payroll error"}</button>
                  ))}
                </div>
                <Textarea className="min-h-20 text-xs" placeholder="Resolution notes: what you found and the evidence" value={resolution} onChange={(e) => setResolution(e.target.value)} />
                <Button size="sm" className="w-full" disabled={!resolution.trim()} onClick={() => { const r = actions.resolveInvestigation(inv.id, resolution, outcome); if (!r.ok) toast.error(r.reason); else { toast.success("Resolved — sent for sign-off"); setResolution(""); } }}>Resolve and send for sign-off</Button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{inv.ownerId ? "The owner records the resolution here." : "Assign the case first; the owner then records the resolution."}</p>
            )}
          </div>

          {/* History */}
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm font-semibold">Approval & activity history</p>
            <ol className="mt-3 space-y-2.5 border-l pl-3">
              {[...inv.history].reverse().map((h, i) => (
                <li key={i} className="relative text-xs">
                  <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-primary/70" />
                  <p><span className="font-medium">{h.actor}</span> — {h.action}</p>
                  {h.note && <p className="text-[11px] text-muted-foreground">{h.note}</p>}
                  <p className="text-[10px] text-muted-foreground">{at(h.at)}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  ClipboardList,
  History,
  Info,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Textarea } from "@/src/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import { TASK_STATUS_LABELS, TASK_STATUS_STYLES } from "@/src/lib/types/workflows";
import { effectiveStatus } from "@/src/lib/types/workflow-runs";
import {
  RISK_KIND_HINTS,
  RISK_OUTCOME_LABELS,
  isRiskOpen,
  type RiskHistoryAction,
  type RiskOutcome,
} from "@/src/lib/types/workforce-risk";
import type { RiskEntry } from "@/src/lib/workforce-risk/register";
import { RISK_MODULE, useRiskActions, useRiskEntry } from "./hooks";
import { ActionPlanDialog } from "./action-plan-dialog";
import { BasisBadge, KindBadge, PriorityBadge, StatusBadge, whereLabel } from "./shared";

const HISTORY_LABELS: Record<RiskHistoryAction, string> = {
  acknowledged: "Acknowledged",
  recommendation_edited: "Recommendation edited",
  recommendation_approved: "Recommendation approved",
  action_plan_created: "Action plan created",
  reminder_sent: "Reminder sent",
  escalated: "Escalated",
  closed: "Closed",
  dismissed: "Dismissed",
  reopened: "Reopened",
};

function Section({
  icon,
  title,
  children,
  aside,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function RiskDetailPage({ id }: { id: string }) {
  const canView = useCan(RISK_MODULE, "view");
  const register = useRiskEntry(id);

  if (!canView) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        You don&apos;t have access to Workforce Risks &amp; Actions.
      </div>
    );
  }
  if (register.loading) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-16 w-96" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  if (!register.entry) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm font-medium">This risk isn&apos;t in the register</p>
        <p className="max-w-md text-xs text-muted-foreground">
          It may have cleared before anyone acted on it, or it concerns people outside your access.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/organization/workforce-lens/risks">Back to the register</Link>
        </Button>
      </div>
    );
  }
  const { entry, ...rest } = register;
  return <Detail entry={entry} {...rest} />;
}

function Detail({
  entry,
  tenantId,
  country,
  employees,
  branches,
}: { entry: RiskEntry } & Omit<ReturnType<typeof useRiskEntry>, "entry">) {
  const actions = useRiskActions(entry, tenantId, country);
  const { risk, record, run, status } = entry;
  const [planOpen, setPlanOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(entry.recommendation);
  const [outcome, setOutcome] = useState<RiskOutcome>("resolved");
  const [evidence, setEvidence] = useState("");
  const [dismissReason, setDismissReason] = useState("");
  const [showDismiss, setShowDismiss] = useState(false);

  const planRunning = status === "in_action";
  // Closing needs the plan finished and verified — or the condition to have
  // cleared on its own, which is itself the evidence the rule now reports.
  const canClose =
    actions.canApprove && (status === "awaiting_closure" || (!entry.detected && isRiskOpen(status) && !planRunning));
  const stillDetectedAfterClose = status === "closed" && entry.detected;

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6">
        <Link
          href="/organization/workforce-lens/risks"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Risk register
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold text-foreground">{risk.title}</h1>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {risk.affected.label} · {whereLabel(entry)} · detected {risk.detectedOn}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <PriorityBadge priority={risk.priority} />
          <KindBadge kind={risk.kind} />
          <BasisBadge basis={risk.basis} />
          {(record?.recurrenceCount ?? 0) > 0 && (
            <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-rose-600">
              Recurred {record!.recurrenceCount}×
            </Badge>
          )}
        </div>
        {!entry.detected && isRiskOpen(status) && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            The rule no longer detects this condition. Record the outcome to close it.
          </p>
        )}
        {stillDetectedAfterClose && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-700 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Closed, but the underlying records still show this condition. It reopens automatically if the evidence
            changes; reopen it now if the fix didn&apos;t hold.
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Section icon={<Info className="size-4 text-sky-500" />} title="What was detected">
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {risk.evidence.map((e, i) => (
                <div key={i} className="min-w-0">
                  <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{e.label}</dt>
                  <dd className="text-sm">{e.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted-foreground">
              {risk.basis === "forecast"
                ? "Forecast: projected from the recent trend. It may not happen, and it is not a finding about anyone."
                : "Actual finding: read directly from the current records."}{" "}
              {RISK_KIND_HINTS[risk.kind]}
            </p>
          </Section>

          <Section icon={<AlertTriangle className="size-4 text-amber-500" />} title="Why it matters">
            <p className="text-sm">{risk.impact}</p>
            <p className="mt-2 text-xs text-muted-foreground">{risk.priorityReason}</p>
          </Section>

          <Section
            icon={<ClipboardList className="size-4 text-violet-500" />}
            title="What should happen next"
            aside={
              record?.recommendationApprovedBy ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  Approved by {record.recommendationApprovedBy}
                </span>
              ) : null
            }
          >
            {editing ? (
              <div className="flex flex-col gap-2">
                <Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      actions.editRecommendation(text);
                      setEditing(false);
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm">{entry.recommendation}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              A recommendation only. MOTEE never makes an employment decision from a risk indicator.
            </p>
            {isRiskOpen(status) && !planRunning && !editing && (
              <div className="mt-3 flex flex-wrap gap-2">
                {actions.canWork && (
                  <Button variant="outline" size="sm" onClick={() => (setText(entry.recommendation), setEditing(true))}>
                    Amend
                  </Button>
                )}
                {actions.canApprove && !record?.recommendationApprovedBy && (
                  <Button variant="outline" size="sm" onClick={() => actions.approveRecommendation()}>
                    Approve recommendation
                  </Button>
                )}
              </div>
            )}
          </Section>

          <Section
            icon={<ClipboardList className="size-4 text-primary" />}
            title="Action plan"
            aside={
              run ? (
                <Link href="/hr-action-center#tasks" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  HR Action Centre <ArrowUpRight className="size-3" />
                </Link>
              ) : null
            }
          >
            {run ? (
              <>
                <ul className="flex flex-col gap-2">
                  {run.tasks.map((t) => {
                    const s = effectiveStatus(t);
                    return (
                      <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{t.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {t.order === 0 ? "Owner" : "Collaborator"}: {t.assigneeName}
                            {t.reviewerName && ` · verified by ${t.reviewerName}`} · due {t.dueDate}
                          </p>
                          {t.note && <p className="mt-1 text-xs italic text-muted-foreground">“{t.note}”</p>}
                        </div>
                        <Badge variant="outline" className={cn("px-1.5 py-0 text-[10px]", TASK_STATUS_STYLES[s])}>
                          {TASK_STATUS_LABELS[s]}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
                {planRunning && actions.canWork && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => (actions.remind(false), toast.success("Reminder sent to the owner"))}
                    >
                      <BellRing className="mr-1 size-3.5" />
                      Remind owner
                    </Button>
                    {entry.overdue && (
                      <Button
                        variant={entry.escalated ? "destructive" : "outline"}
                        size="sm"
                        onClick={() => (actions.remind(true), toast.success("Escalated to the verifier"))}
                      >
                        <AlertTriangle className="mr-1 size-3.5" />
                        Escalate to verifier
                      </Button>
                    )}
                  </div>
                )}
                {entry.escalated && (
                  <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                    Overdue beyond its {run.tasks[0]?.escalateAfterDays}-day escalation window.
                  </p>
                )}
              </>
            ) : isRiskOpen(status) ? (
              <div className="flex flex-col items-start gap-2">
                <p className="text-sm text-muted-foreground">
                  No one is assigned yet. An action plan names an accountable owner, any collaborators, a due date and a
                  verifier, and puts the work in their HR Action Centre.
                </p>
                {actions.canWork && entry.detected && (
                  <Button size="sm" onClick={() => (actions.acknowledge(), setPlanOpen(true))}>
                    Create action plan
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active plan.</p>
            )}
          </Section>

          <Section icon={<ShieldCheck className="size-4 text-emerald-500" />} title="Outcome">
            {record?.closure && !isRiskOpen(status) ? (
              <div className="text-sm">
                <p>
                  <span className="font-medium">{RISK_OUTCOME_LABELS[record.closure.outcome]}</span> · closed by{" "}
                  {record.closure.by} on {record.closure.at.slice(0, 10)}
                </p>
                <p className="mt-1 text-muted-foreground">{record.closure.evidence}</p>
                {risk.metric && record.closure.metricAtClose != null && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {record.snapshot.metric?.label ?? risk.metric.label}: {record.snapshot.metric?.value} at detection →{" "}
                    {record.closure.metricAtClose} at closure
                  </p>
                )}
              </div>
            ) : record?.dismissed && !isRiskOpen(status) ? (
              <p className="text-sm">
                Dismissed by {record.dismissed.by} on {record.dismissed.at.slice(0, 10)}: {record.dismissed.reason}
              </p>
            ) : canClose ? (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                  <div className="space-y-1.5">
                    <Label>Outcome</Label>
                    <Select value={outcome} onValueChange={(v) => setOutcome(v as RiskOutcome)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(RISK_OUTCOME_LABELS) as RiskOutcome[]).map((o) => (
                          <SelectItem key={o} value={o}>
                            {RISK_OUTCOME_LABELS[o]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Evidence</Label>
                    <Textarea
                      rows={2}
                      placeholder="What was done and how you know it worked, e.g. new share code checked and recorded on 3 Nov."
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  &ldquo;Not resolved&rdquo; reopens the risk so a new plan can be made.
                </p>
                <div>
                  <Button
                    size="sm"
                    disabled={!evidence.trim()}
                    onClick={() => {
                      actions.close(outcome, evidence);
                      setEvidence("");
                      toast.success(outcome === "not_resolved" ? "Recorded and reopened" : "Risk closed");
                    }}
                  >
                    Record outcome
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {planRunning
                  ? "Closes once every action is done and verified."
                  : status === "awaiting_closure"
                    ? "Every action is verified. Someone with approval rights records the outcome."
                    : "Create an action plan first; the outcome is recorded once it is verified."}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
              {!isRiskOpen(status) && actions.canWork && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (actions.reopen("Reopened manually: the issue is still present."), toast.success("Risk reopened"))}
                >
                  <RotateCcw className="mr-1 size-3.5" />
                  Reopen
                </Button>
              )}
              {isRiskOpen(status) && !planRunning && actions.canApprove && !showDismiss && (
                <Button variant="ghost" size="sm" onClick={() => setShowDismiss(true)}>
                  <XCircle className="mr-1 size-3.5" />
                  Dismiss as not applicable
                </Button>
              )}
            </div>
            {showDismiss && (
              <div className="mt-2 flex flex-col gap-2">
                <Textarea
                  rows={2}
                  placeholder="Why this doesn't need action (kept in the audit trail)"
                  value={dismissReason}
                  onChange={(e) => setDismissReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowDismiss(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!dismissReason.trim()}
                    onClick={() => {
                      actions.dismiss(dismissReason);
                      setShowDismiss(false);
                      toast.success("Risk dismissed");
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </Section>
        </div>

        <div className="flex flex-col gap-4">
          <Section icon={<Info className="size-4 text-muted-foreground" />} title="Affected">
            <p className="text-sm">
              {risk.affected.label}
              <span className="text-muted-foreground"> · {risk.affected.count} {risk.affected.count === 1 ? "person" : "people"}</span>
            </p>
            {risk.affected.people && (
              <ul className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
                {risk.affected.people.map((p) => (
                  <li key={p.id}>
                    <Link href={`/organization/employees/${p.id}`} className="text-sm text-primary hover:underline">
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link href={risk.sourceHref}>
                Open {risk.sourceLabel}
                <ArrowUpRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </Section>

          <Section icon={<History className="size-4 text-muted-foreground" />} title="History">
            {record && record.history.length > 0 ? (
              <ol className="flex flex-col gap-2.5">
                {[...record.history].reverse().map((h, i) => (
                  <li key={i} className="border-l-2 border-border pl-3">
                    <p className="text-xs font-medium">{HISTORY_LABELS[h.action]}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {h.by} · {new Date(h.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    {h.note && <p className="mt-0.5 text-xs text-muted-foreground">{h.note}</p>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs text-muted-foreground">Detected {risk.detectedOn}. No action recorded yet.</p>
            )}
          </Section>
        </div>
      </div>

      <ActionPlanDialog
        entry={entry}
        open={planOpen}
        onOpenChange={setPlanOpen}
        employees={employees}
        branches={branches}
        onCreate={actions.createPlan}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ChevronRight, Search, Scale, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { cn } from "@/src/lib/utils";
import {
  OH_STAGES,
  OH_FITNESS_LABELS,
  OH_FITNESS_STYLES,
  ohStageIndex,
  ohManagerView,
  type OHReferral,
  type OHStatus,
} from "@/src/lib/types/occupational-health";
import { OH_REFERRALS, OH_REFERRAL_THRESHOLD_DAYS } from "@/src/data/occupational-health-demo";
import { daysSince, fmt, isOverdue, OH_TABS, matchesTab, type OHTabValue, useCanViewConfidentialOH } from "./lib";

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="flex-1 min-w-fit rounded-xl bg-card px-4 py-3 shadow-xs ring-1 ring-foreground/10">
      <p
        className={cn(
          "text-xl font-bold tabular-nums text-foreground",
          warn && value > 0 && "text-amber-600 dark:text-amber-500",
        )}
      >
        {value}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function ReferralCard({ r, confidential }: { r: OHReferral; confidential: boolean }) {
  const stageIdx = ohStageIndex(r.status);
  const progress = ((stageIdx + 1) / OH_STAGES.length) * 100;
  const currentLabel = OH_STAGES[stageIdx]?.label ?? "—";
  const overdue = isOverdue(r.nextAction?.due) && r.status !== "closed";
  const view = confidential ? r : ohManagerView(r);

  return (
    <Card className="transition-shadow hover:shadow-md">
      {/* §10.9 — the whole card is a CTA into the case detail. */}
      <Link href={`/time-payroll/occupational-health/${r.id}`} className="block">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
              {r.employeeInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{r.employeeName}</p>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    OH_FITNESS_STYLES[r.fitnessStatus],
                  )}
                >
                  {OH_FITNESS_LABELS[r.fitnessStatus]}
                </span>
                {r.equalityActConsidered && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                    {/* §10.4 — relabelled from "Equality Act 2010"; underlying
                        field name unchanged. */}
                    <Scale className="size-3" /> Reasonable adjustments consideration
                  </span>
                )}
                {overdue && (
                  <span className="rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-600">
                    Overdue
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {r.department}
                {" · "}
                {r.status === "closed"
                  ? `Returned to work: ${fmt(r.expectedReturnDate)}`
                  : `Absent ${daysSince(r.absenceStartDate)} days (since ${fmt(r.absenceStartDate)})`}
              </p>
            </div>
            <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className="font-medium text-foreground">{currentLabel}</span>
              <span className="text-muted-foreground">
                Stage {stageIdx + 1} of {OH_STAGES.length}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* §10.2 — Next Action block, the single biggest requested change. */}
          {r.nextAction && r.status !== "closed" ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">
                  Next action: {r.nextAction.label}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3" /> {r.nextAction.owner}
                  </span>
                  <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-rose-600")}>
                    <Clock className="size-3" /> Due {fmt(r.nextAction.due)}
                  </span>
                </p>
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-7 shrink-0 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <Link href={`/time-payroll/occupational-health/${r.id}`}>Review referral</Link>
              </Button>
            </div>
          ) : r.status !== "closed" ? (
            <p className="mt-3 text-[11px] text-muted-foreground">No action currently required.</p>
          ) : null}

          {/* §10.8 — a manager-tier viewer only ever sees this restricted set,
              never case notes or history, even before they open the case. */}
          {!confidential && "adjustmentDescriptions" in view && view.adjustmentDescriptions.length > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Recommended adjustments: {view.adjustmentDescriptions.join(", ")}
            </p>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}

const DEPARTMENTS = Array.from(new Set(OH_REFERRALS.map((r) => r.department))).sort();
const OWNERS = Array.from(new Set(OH_REFERRALS.map((r) => r.caseOwner))).sort();

export function OccupationalHealthPage() {
  const referrals = OH_REFERRALS;
  const confidential = useCanViewConfidentialOH();

  const [tab, setTab] = useState<OHTabValue>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OHStatus | "all">("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [adjustmentsOnly, setAdjustmentsOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const open = referrals.filter((r) => r.status !== "closed").length;
  const actionRequired = referrals.filter((r) => r.nextAction && r.status !== "closed").length;
  const awaitingOh = referrals.filter(
    (r) => r.status === "referred" || r.status === "assessment_completed",
  ).length;
  const adjustmentsToImplement = referrals.filter((r) =>
    r.adjustments.some((a) => a.status === "agreed"),
  ).length;
  const reviewsDue = referrals.filter((r) => r.reviewDate && !isOverdue(r.reviewDate) && r.status !== "closed").length;
  const overdue = referrals.filter((r) => isOverdue(r.nextAction?.due) && r.status !== "closed").length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return referrals
      .filter((r) => matchesTab(r, tab))
      .filter((r) => !q || r.employeeName.toLowerCase().includes(q))
      .filter((r) => statusFilter === "all" || r.status === statusFilter)
      .filter((r) => deptFilter === "all" || r.department === deptFilter)
      .filter((r) => ownerFilter === "all" || r.caseOwner === ownerFilter)
      .filter((r) => !adjustmentsOnly || r.adjustments.length > 0)
      .filter((r) => !overdueOnly || (isOverdue(r.nextAction?.due) && r.status !== "closed"));
  }, [referrals, tab, search, statusFilter, deptFilter, ownerFilter, adjustmentsOnly, overdueOnly]);

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6">
        <h1 className="text-4xl font-semibold text-foreground">Occupational Health</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage OH referrals, fitness-for-work recommendations and workplace adjustments. A
          review is automatically triggered after {OH_REFERRAL_THRESHOLD_DAYS} days of
          continuous absence. Occupational Health referrals can also be initiated earlier where
          appropriate.
        </p>
      </div>

      {/* Privacy notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/25 bg-blue-500/5 px-4 py-3">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" />
        <p className="text-xs text-foreground">
          <span className="font-semibold">Confidential by design.</span> Occupational Health
          records store fitness-for-work status and recommended workplace adjustments only.
          Clinical diagnoses are never requested, stored, or shown — managers see adjustments,
          not medical detail.
          {!confidential && (
            <span className="block mt-1 text-muted-foreground">
              You're viewing the manager tier: fitness status, recommended adjustments and review
              dates only. Case notes and history are restricted to HR/OH admins.
            </span>
          )}
        </p>
      </div>

      {/* §10.6 — summary cards rebuilt around action, not just counting. */}
      <div className="flex flex-wrap gap-3">
        <Stat label="Open Cases" value={open} />
        <Stat label="Action Required" value={actionRequired} warn />
        <Stat label="Awaiting OH" value={awaitingOh} />
        <Stat label="Adjustments to Implement" value={adjustmentsToImplement} />
        <Stat label="Reviews Due" value={reviewsDue} />
        <Stat label="Overdue" value={overdue} warn />
      </div>

      {/* §10.3 — tabs + filters, ahead of the caseload growing. */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as OHTabValue)}>
        <PageTabsList tabs={OH_TABS.map((t) => ({ value: t.value, label: t.label }))} />

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OHStatus | "all")}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {OH_STAGES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {OWNERS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={adjustmentsOnly ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAdjustmentsOnly((v) => !v)}
            >
              Adjustments required
            </Button>
            <Button
              type="button"
              variant={overdueOnly ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOverdueOnly((v) => !v)}
            >
              Overdue only
            </Button>
          </div>
        </div>

        {OH_TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <div className="flex flex-col gap-3">
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No cases match your filters.
                </p>
              ) : (
                filtered.map((r) => <ReferralCard key={r.id} r={r} confidential={confidential} />)
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

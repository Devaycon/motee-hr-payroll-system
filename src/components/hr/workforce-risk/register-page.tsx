"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Repeat, Settings2, TrendingUp } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ExportMenu } from "@/src/components/shared/export-menu";
import { PermissionGate } from "@/src/components/shared/permission-gate";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import {
  RISK_KIND_LABELS,
  RISK_KINDS,
  RISK_STATUS_LABELS,
  isRiskOpen,
  type RiskKind,
} from "@/src/lib/types/workforce-risk";
import { TASK_PRIORITY_LABELS } from "@/src/lib/types/workflows";
import type { RiskEntry } from "@/src/lib/workforce-risk/register";
import type { ReportColumn } from "@/src/lib/reports/types";
import { RISK_MODULE, useRiskRegister } from "./hooks";
import { RiskTable } from "./risk-panel";
import { RiskSettingsDialog } from "./settings-dialog";
import { riskHref, whereLabel } from "./shared";

type KindTab = RiskKind | "all";
type StatusFilter = "open" | "closed" | "all";

function Tile({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone ?? ""}`}>{value}</p>
      {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const COLUMNS: ReportColumn<RiskEntry>[] = [
  { key: "priority", header: "Priority", value: (e) => TASK_PRIORITY_LABELS[e.risk.priority] },
  { key: "kind", header: "Type", value: (e) => RISK_KIND_LABELS[e.risk.kind] },
  { key: "basis", header: "Basis", value: (e) => (e.risk.basis === "forecast" ? "Forecast" : "Actual") },
  { key: "issue", header: "Issue", value: (e) => e.risk.title },
  { key: "affected", header: "Affected", value: (e) => e.risk.affected.label },
  { key: "where", header: "Branch / Department", value: whereLabel },
  { key: "impact", header: "Potential impact", value: (e) => e.risk.impact },
  { key: "action", header: "Recommended action", value: (e) => e.recommendation },
  { key: "owner", header: "Owner", value: (e) => e.owner ?? "" },
  { key: "due", header: "Due", value: (e) => e.dueDate ?? "" },
  { key: "status", header: "Status", value: (e) => RISK_STATUS_LABELS[e.status] },
  { key: "outcome", header: "Outcome", value: (e) => e.record?.closure?.outcome.replace("_", " ") ?? "" },
  { key: "recurrences", header: "Recurrences", value: (e) => e.record?.recurrenceCount ?? 0 },
];

export function RiskRegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { loading, entries, report, branches, asOf } = useRiskRegister();
  const [tab, setTab] = useState<KindTab>(() => {
    const k = params.get("kind");
    return RISK_KINDS.includes(k as RiskKind) ? (k as RiskKind) : "all";
  });
  const [status, setStatus] = useState<StatusFilter>("open");
  const [branch, setBranch] = useState(params.get("branch") ?? "all");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const rows = useMemo(
    () =>
      entries.filter(
        (e) =>
          (tab === "all" || e.risk.kind === tab) &&
          (branch === "all" || e.risk.affected.branchId === branch) &&
          (status === "all" || (status === "open" ? isRiskOpen(e.status) : !isRiskOpen(e.status))),
      ),
    [entries, tab, branch, status],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4 py-6">
        <div>
          <Link
            href="/organization/workforce-lens?tab=risks"
            className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Workforce Lens
          </Link>
          <h1 className="text-4xl font-bold text-foreground">Workforce Risks &amp; Actions</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            What was detected, why it matters, who is acting and whether it worked.
            {asOf && ` Data as of ${asOf}.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PermissionGate module={RISK_MODULE} action="administer">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium hover:bg-muted"
            >
              <Settings2 className="size-3.5" />
              Rule settings
            </button>
          </PermissionGate>
          <PermissionGate module={RISK_MODULE} action="export">
            <ExportMenu
              name="workforce-risk-register"
              title="Workforce Risk Register"
              columns={COLUMNS}
              rows={rows}
              label={`Export ${rows.length} risk${rows.length === 1 ? "" : "s"}`}
              buttonLabel="Export"
              variant="outline"
              buttonClassName="h-9 text-xs"
            />
          </PermissionGate>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Tile label="Open risks" value={report.open} hint="needing attention" />
        <Tile label="Existing problems" value={report.openByKind.existing_problem} tone="text-rose-600 dark:text-rose-400" />
        <Tile label="Emerging risks" value={report.openByKind.emerging_risk} tone="text-amber-600 dark:text-amber-400" />
        <Tile label="Opportunities" value={report.openByKind.improvement} tone="text-sky-600 dark:text-sky-400" />
        <Tile
          label="Overdue actions"
          value={report.overdueActions}
          hint={`${report.inAction} in action · ${report.awaitingClosure} to close`}
          tone={report.overdueActions > 0 ? "text-rose-600 dark:text-rose-400" : undefined}
        />
        <Tile
          label="Avg. time to resolve"
          value={report.meanDaysToResolve != null ? `${report.meanDaysToResolve}d` : "—"}
          hint={`${report.closed} closed`}
        />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as KindTab)}>
            <PageTabsList
              tabs={[
                { value: "all", label: "All" },
                ...RISK_KINDS.map((k) => ({ value: k, label: RISK_KIND_LABELS[k] })),
              ]}
            />
          </Tabs>
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="h-9 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed / dismissed</SelectItem>
                <SelectItem value="all">All statuses</SelectItem>
              </SelectContent>
            </Select>
            {branches.length > 1 && (
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="h-9 w-[160px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <div className="overflow-x-auto p-4">
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No risks match these filters.</p>
          ) : (
            <RiskTable entries={rows} onOpen={(e) => router.push(riskHref(e))} />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportList
          icon={<Repeat className="size-4 text-rose-500" />}
          title="Recurring issues"
          empty="Nothing has come back after being closed."
          items={report.recurring.map((e) => ({
            key: e.key,
            href: riskHref(e),
            title: e.risk.title,
            sub: e.risk.affected.label,
            right: `${e.record!.recurrenceCount}× reopened`,
          }))}
        />
        <ReportList
          icon={<TrendingUp className="size-4 text-emerald-500" />}
          title="Improvements achieved"
          empty="Closed risks with a measured improvement show here."
          items={report.improvements.map(({ entry, before, after }) => ({
            key: entry.key,
            href: riskHref(entry),
            title: entry.risk.title,
            sub: `${entry.risk.affected.label} · ${entry.record!.snapshot.metric!.label}`,
            right: `${before} → ${after}`,
          }))}
        />
      </div>

      <RiskSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function ReportList({
  icon,
  title,
  empty,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  items: { key: string; href: string; title: string; sub: string; right: string }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.key}>
              <Link href={i.href} className="flex items-center justify-between gap-3 rounded-lg border p-2.5 hover:bg-muted/40">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{i.sub}</p>
                </div>
                <span className="shrink-0 text-xs font-medium tabular-nums">{i.right}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

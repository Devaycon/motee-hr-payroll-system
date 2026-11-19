"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowRight,
  Banknote,
  CalendarClock,
  ChevronDown,
  Eye,
  FileSpreadsheet,
  FlaskConical,
  GitCompareArrows,
  Landmark,
  MoreHorizontal,
  Plus,
  Settings2,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { HrStatCardsGrid, type HrStatCardItem } from "@/src/components/shared/hr-stat-card";
import { DataTable, sortableHeader } from "@/src/components/shared/data-table";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import { APPROVAL_CHAIN_TAB_ITEM, useHasApprovalChainTab } from "@/src/components/hr/approvals/use-chain-tab";
import { useCan } from "@/src/lib/permissions/use-can";
import { PAYROLL_DOCUMENT_TYPE, PAYROLL_HREF, PAYROLL_MODULE, PAYROLL_SETTINGS_MODULE } from "@/src/lib/payroll/constants";
import { downloadFormH1 } from "@/src/lib/payroll/exports";
import { companySnapshot } from "@/src/lib/payroll/run-builder";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import { nextPeriod, openRegularRunBefore, useOnboardingHandover, usePayrollActions, useTenantPayroll } from "@/src/lib/payroll/use-payroll";
import type { PayrollRun } from "@/src/lib/payroll/types";
import { cn } from "@/src/lib/utils";
import { PayrollControlCentre } from "./control-centre";
import { PayrollIntelligence } from "./intelligence";
import { RemittanceCentre, useRemittanceReminders } from "./remittance-centre";
import { NotSupported, PipelineStepper, RunStatusBadge, RunTypeBadge, compact, fmtDate, money } from "./components/shared";

/**
 * Time & Payroll → Payroll. Runs list, the run in progress, remittance
 * calendar and the payroll audit trail. Everything that changes figures
 * happens inside a run (`[runId]`); everything that changes HOW pay is
 * calculated lives in Settings, behind its own permission.
 */
export function PayrollPage() {
  const router = useRouter();
  const { data, loading, supported, bundle } = useTenantPayroll();
  const actions = usePayrollActions();
  const canCreate = useCan(PAYROLL_MODULE, "create");
  // New hires from HR onboarding still to be set up in payroll.
  const awaitingSetup = useOnboardingHandover({ enabled: canCreate }).queue.length;
  const canSettings = useCan(PAYROLL_SETTINGS_MODULE, "view");
  const hasChainTab = useHasApprovalChainTab(PAYROLL_DOCUMENT_TYPE);
  const search = useSearchParams();
  const [tab, setTab] = useState(() => (["control", "runs", "intelligence", "remittances", "activity"].includes(search.get("tab") ?? "") ? search.get("tab")! : "control"));
  useRemittanceReminders();
  const [now] = useState(() => Date.now());

  const runs = useMemo(
    () => [...(data?.runs ?? [])].sort((a, b) => b.period.year * 100 + b.period.month - (a.period.year * 100 + a.period.month) || b.createdAt.localeCompare(a.createdAt)),
    [data],
  );
  // The run in progress is the EARLIEST open month — months are paid and closed in order.
  const current = [...runs].reverse().find((r) => r.status !== "disbursed" && r.status !== "finalized") ?? null;
  const lastPaid = runs.find((r) => r.status === "disbursed" || r.status === "finalized") ?? null;
  const year = current?.period.year ?? lastPaid?.period.year ?? new Date().getFullYear();

  // Gross pay + employer pension for the year: opening balances plus every final payslip.
  const ytdCost = !data
    ? 0
    : Object.values(data.openingYtd).filter((y) => y.year === year).reduce((s, y) => s + y.gross + y.pensionEmployer, 0) +
      data.payslips
        .filter((p) => p.status === "final" && p.period.year === year && p.computation.period)
        .reduce((s, p) => s + p.computation.period.gross + p.computation.period.pensionEmployer, 0);

  if (!supported && bundle) return <Shell><NotSupported /></Shell>;
  if (loading || !data) {
    return (
      <Shell>
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </Shell>
    );
  }

  const upcoming = current ?? null;
  const daysToPay = upcoming ? Math.ceil((new Date(`${upcoming.period.payDate}T00:00:00Z`).getTime() - now) / 86_400_000) : null;

  const cards: HrStatCardItem[] = [
    {
      label: "Current Run",
      value: upcoming ? compact(upcoming.totals.net) : "—",
      sub: upcoming ? `${upcoming.period.label} · net pay · ${upcoming.totals.employees} employees` : "No run in progress",
      icon: Banknote,
      tone: "violet",
      link: upcoming ? `${PAYROLL_HREF}/${upcoming.id}/breakdown?view=net` : undefined,
    },
    {
      label: "Payroll Cost YTD",
      value: compact(ytdCost),
      sub: `Gross pay + employer pension, ${year}`,
      icon: Landmark,
      tone: "blue",
      link: "?tab=intelligence",
    },
    {
      label: "On Payroll",
      value: upcoming?.totals.employees ?? lastPaid?.totals.employees ?? 0,
      sub: lastPaid ? `Last paid ${fmtDate(lastPaid.disbursedAt ?? lastPaid.period.payDate)}` : "Employees in the current run",
      icon: Users,
      tone: "emerald",
      link: upcoming ? `${PAYROLL_HREF}/${upcoming.id}/breakdown?view=gross` : undefined,
    },
    {
      label: "Next Pay Day",
      value: upcoming ? fmtDate(upcoming.period.payDate) : "—",
      sub:
        (daysToPay === null ? "Create the next run" : daysToPay > 0 ? `In ${daysToPay} day${daysToPay === 1 ? "" : "s"}` : daysToPay === 0 ? "Today" : `${-daysToPay} days overdue`) +
        (upcoming?.period.scheduledPayDate ? ` · moved from ${fmtDate(upcoming.period.scheduledPayDate)} (${upcoming.period.payDateNote ?? "non-working day"})` : ""),
      icon: CalendarClock,
      tone: "amber",
      link: upcoming ? `${PAYROLL_HREF}/${upcoming.id}` : undefined,
    },
  ];

  function create(type: PayrollRun["type"]) {
    const period = type === "regular" ? nextPeriod(data, data!.settings.payDay) : (current ?? lastPaid)?.period ?? nextPeriod(data, data!.settings.payDay);
    const { run, reason } = actions.createRun(type, period);
    if (!run) {
      toast.error(reason ?? "Couldn't create the run");
      return;
    }
    toast.success(`${run.title} created`, {
      description:
        type === "regular"
          ? "Calculated from salary structures, loans, expenses and attendance."
          : "Add the employees to pay, then their one-off payments or a final settlement.",
    });
    router.push(`${PAYROLL_HREF}/${run.id}`);
  }

  const next = nextPeriod(data, data.settings.payDay);
  const blocking = openRegularRunBefore(data, next);
  const lastRegular = runs.find((r) => r.type === "regular" && r.status !== "draft") ?? null;

  const trend = runs.filter((r) => r.type === "regular").slice(0, 6).reverse();
  const trendMax = Math.max(1, ...trend.map((r) => r.totals.gross + r.totals.employerCost));

  return (
    <Shell
      actions={
        <div className="flex items-center gap-2">
          {lastRegular && (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`${PAYROLL_HREF}/compare?current=${lastRegular.id}`}><GitCompareArrows className="h-4 w-4" /> Compare months</Link>
            </Button>
          )}
          {canCreate && (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`${PAYROLL_HREF}/simulate`}><FlaskConical className="h-4 w-4" /> Simulate</Link>
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              downloadFormH1(year, data.payslips, bundle ? companySnapshot(bundle).taxId : "");
              actions.logExport("", `Form H1 ${year}`);
              toast.success(`Form H1 for ${year} downloaded`, { description: "Annual PAYE return per employee, grouped by State IRS. File by 31 January." });
            }}
          >
            <FileSpreadsheet className="h-4 w-4" /> Form H1 {year}
          </Button>
          {canCreate && (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`${PAYROLL_HREF}/import`}>
                <UserPlus className="h-4 w-4" /> Import starters
                {awaitingSetup > 0 && (
                  <span title={`${awaitingSetup} new hire${awaitingSetup === 1 ? "" : "s"} from onboarding awaiting payroll setup`} className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                    {awaitingSetup}
                  </span>
                )}
              </Link>
            </Button>
          )}
          {canSettings && (
            <Button variant="outline" className="gap-2" asChild>
              <Link href={`${PAYROLL_HREF}/settings`}><Settings2 className="h-4 w-4" /> Settings</Link>
            </Button>
          )}
          {canCreate && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> New run <ChevronDown className="h-3.5 w-3.5 opacity-70" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="text-xs">Create a payroll run</DropdownMenuLabel>
                <DropdownMenuItem disabled={!!blocking} onClick={() => create("regular")} className="flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">Regular — {next.label}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {blocking ? `Finish ${blocking.period.label} first` : "Everyone on payroll, auto-calculated"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => create("off_cycle")} className="flex-col items-start gap-0.5">
                  <span className="text-sm font-medium">Off-cycle</span>
                  <span className="text-[11px] text-muted-foreground">A bonus, a final settlement or a missed payment</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      }
    >
      <HrStatCardsGrid stats={cards} columns={4} />

      {upcoming && (
        <div className="rounded-xl border bg-card p-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{upcoming.title}</h2>
                <RunStatusBadge status={upcoming.status} />
                <RunTypeBadge type={upcoming.type} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {fmtDate(upcoming.period.start)} – {fmtDate(upcoming.period.end)} · prepared by {upcoming.preparedBy.name}
                {upcoming.calculatedAt && ` · calculated ${new Date(upcoming.calculatedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
              </p>
            </div>
            <Button className="gap-2" onClick={() => router.push(`${PAYROLL_HREF}/${upcoming.id}`)}>
              Open run <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4">
            <PipelineStepper status={upcoming.status} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Gross pay", money(upcoming.totals.gross), "breakdown?view=gross"],
              ["Deductions", money(upcoming.totals.deductions), "breakdown?view=deductions"],
              ["Net pay", money(upcoming.totals.net), "breakdown?view=net"],
              ["PAYE", money(upcoming.totals.paye), "breakdown?view=paye"],
              ["Exceptions", `${upcoming.exceptions.filter((e) => e.severity === "error" && !e.acknowledged).length} errors · ${upcoming.exceptions.filter((e) => e.severity === "warning").length} warnings`, "?tab=exceptions"],
            ].map(([k, v, to]) => (
              <Link
                key={k}
                href={`${PAYROLL_HREF}/${upcoming.id}${to.startsWith("?") ? to : `/${to}`}`}
                className="group rounded-lg bg-[color-mix(in_oklab,var(--muted)_50%,var(--card))] px-3 py-2 ring-primary/40 transition hover:bg-[color-mix(in_oklab,var(--primary)_8%,var(--card))] hover:ring-1 focus-visible:outline-none focus-visible:ring-2"
              >
                <p className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                  {k} <ArrowRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                </p>
                <p className="text-sm font-semibold tabular-nums">{v}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <PageTabsList
          tabs={[
            { value: "control", label: "Control Centre" },
            { value: "runs", label: `Payroll Runs (${runs.length})` },
            { value: "intelligence", label: "Payroll Intelligence" },
            { value: "remittances", label: "Statutory Remittances" },
            { value: "activity", label: "Activity Log" },
            ...(hasChainTab ? [APPROVAL_CHAIN_TAB_ITEM] : []),
          ]}
        />
        <TabsContent value="control" className="mt-4">
          <PayrollControlCentre current={current} runs={runs} />
        </TabsContent>
        <TabsContent value="intelligence" className="mt-4">
          <PayrollIntelligence />
        </TabsContent>
        <TabsContent value="runs" className="mt-4 flex flex-col gap-4">
          {trend.length > 1 && (
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs font-semibold">Payroll cost by month</p>
              <p className="text-[11px] text-muted-foreground">Gross pay plus employer contributions</p>
              <div className="mt-3 flex h-28 items-end gap-3">
                {trend.map((r) => {
                  const total = r.totals.gross + r.totals.employerCost;
                  return (
                    <div key={r.id} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] tabular-nums text-muted-foreground">{compact(total)}</span>
                      <div className="flex w-full max-w-14 flex-col overflow-hidden rounded-t-md" style={{ height: `${(total / trendMax) * 80}px` }}>
                        <div className="bg-primary/25" style={{ height: `${(r.totals.employerCost / total) * 100}%` }} />
                        <div className={cn("flex-1", r.status === "draft" || r.status === "in_review" ? "bg-[color-mix(in_oklab,var(--primary)_50%,var(--card))]" : "bg-primary")} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{r.period.label.split(" ")[0].slice(0, 3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <RunsTable runs={runs} />
        </TabsContent>
        <TabsContent value="remittances" className="mt-4">
          <RemittanceCentre />
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <div className="overflow-hidden rounded-xl border bg-card">
            {data.audit.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No payroll activity recorded yet in this browser.</p>
            ) : (
              data.audit.slice(0, 100).map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-4 border-b px-4 py-2.5 text-xs last:border-0">
                  <div>
                    <p className="font-medium">{a.action}</p>
                    <p className="text-muted-foreground">
                      {a.actor}
                      {a.detail && ` · ${a.detail}`}
                      {a.runId && (
                        <>
                          {" · "}
                          <Link className="text-primary hover:underline" href={`${PAYROLL_HREF}/${a.runId}`}>open run</Link>
                        </>
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted-foreground">{new Date(a.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        {hasChainTab && (
          <TabsContent value="approval_chain" className="mt-4">
            <ApprovalChainTab documentType={PAYROLL_DOCUMENT_TYPE} />
          </TabsContent>
        )}
      </Tabs>
    </Shell>
  );
}

function Shell({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Payroll</h1>
          <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
            Monthly payroll for Nigeria — PAYE under the Nigeria Tax Act 2025, pension, NHF and employer contributions. Auto-calculated from salary
            structures, or uploaded; every run is validated, approved by someone other than its preparer, then locked and paid.
          </p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function RunsTable({ runs }: { runs: PayrollRun[] }) {
  const canEdit = useCan(PAYROLL_MODULE, "edit");
  const actions = usePayrollActions();
  const [toDelete, setToDelete] = useState<PayrollRun | null>(null);
  const columns = useMemo<ColumnDef<PayrollRun>[]>(
    () => [
      {
        id: "title",
        accessorFn: (r) => r.period.year * 100 + r.period.month,
        header: sortableHeader("Run"),
        cell: ({ row }) => (
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium">{row.original.title} <RunTypeBadge type={row.original.type} /></p>
            <p className="text-[10px] text-muted-foreground" title={row.original.period.scheduledPayDate ? `Moved from ${fmtDate(row.original.period.scheduledPayDate)} (${row.original.period.payDateNote})` : undefined}>
              Pay day {fmtDate(row.original.period.payDate)}
              {row.original.period.scheduledPayDate && " · moved back"}
            </p>
          </div>
        ),
      },
      { id: "status", accessorFn: (r) => r.status, header: sortableHeader("Status"), cell: ({ row }) => <RunStatusBadge status={row.original.status} /> },
      { id: "employees", accessorFn: (r) => r.totals.employees, header: sortableHeader("Employees"), cell: ({ row }) => <span className="text-xs tabular-nums">{row.original.totals.employees}</span> },
      { id: "gross", accessorFn: (r) => r.totals.gross, header: sortableHeader("Gross"), cell: ({ row }) => <span className="text-xs tabular-nums">{money(row.original.totals.gross)}</span> },
      { id: "paye", accessorFn: (r) => r.totals.paye, header: sortableHeader("PAYE"), cell: ({ row }) => <span className="text-xs tabular-nums">{money(row.original.totals.paye)}</span> },
      { id: "net", accessorFn: (r) => r.totals.net, header: sortableHeader("Net pay"), cell: ({ row }) => <span className="text-xs font-semibold tabular-nums">{money(row.original.totals.net)}</span> },
      {
        id: "approvedBy",
        accessorFn: (r) => r.approvedBy?.name ?? "",
        header: sortableHeader("Approved by"),
        cell: ({ row }) =>
          row.original.approvedBy ? (
            <span className="flex items-center gap-1 text-xs"><ShieldCheck className="h-3 w-3 text-emerald-600" />{row.original.approvedBy.name}</span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const draft = r.status === "draft";
          return (
            <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Actions for ${r.title}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild className="gap-2 text-xs">
                    <Link href={`${PAYROLL_HREF}/${r.id}`}>
                      <Eye className="h-3.5 w-3.5" /> View details
                    </Link>
                  </DropdownMenuItem>
                  {canEdit && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-2 text-xs text-rose-600 focus:text-rose-600"
                        disabled={!draft}
                        onClick={() => setToDelete(r)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                        {!draft && <span className="ml-auto text-[10px] text-muted-foreground">Drafts only</span>}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [canEdit],
  );
  return (
    <>
      <DataTable
        columns={columns}
        data={runs}
        getRowId={(r) => r.id}
        exportTitle="Payroll Runs"
        exportName="payroll-runs"
        emptyMessage="No payroll runs yet."
        enablePagination
        pageSize={12}
      />
      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {toDelete?.title}?</DialogTitle>
            <DialogDescription>
              The draft run and its inputs are removed, and any open approval request for it is withdrawn. Finalized runs are never deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (toDelete) actions.deleteRun(toDelete.id);
                setToDelete(null);
                toast.success("Draft run deleted");
              }}
            >
              Delete draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

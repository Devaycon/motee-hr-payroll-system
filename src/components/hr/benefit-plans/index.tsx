"use client";

import { useMemo, useState } from "react";
import { Plus, LayoutGrid, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { cn } from "@/src/lib/utils";
import { useCan } from "@/src/lib/permissions/use-can";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  BENEFIT_CATEGORY_DOT,
  BENEFIT_CATEGORY_LABELS,
  BENEFIT_CATEGORY_OPTIONS,
  type BenefitCategory,
  type BenefitPlan,
  type BenefitPlanStatus,
  type NewBenefitPlan,
} from "./types";
import { useBenefitPlanActions, useBenefitPlans, useBenefitsEmployeeContext } from "./hooks";
import { BenefitPlanModal } from "./components/benefit-plan-modal";
import { BenefitPlanRow } from "./components/benefit-plan-card";
import { countEligibleEmployees } from "@/src/lib/benefits/eligibility";

type StatusFilter = "all" | BenefitPlanStatus;
type CategoryFilter = "all" | BenefitCategory;

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const PAGE_SIZE = 5;

function matchesSearch(plan: BenefitPlan, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [plan.name, plan.description, plan.provider, plan.coverageDetails]
    .filter(Boolean)
    .some((v) => v!.toLowerCase().includes(q));
}

export function BenefitPlansPage() {
  const plans = useBenefitPlans();
  const actions = useBenefitPlanActions();
  const canManage = useCan("organization.benefit-plans", "edit");
  const employeeCtx = useBenefitsEmployeeContext();
  const country = useAppSelector((s) => s.locale.country);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<BenefitPlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BenefitPlan | null>(null);

  // Reset to page 1 wherever a filter actually changes, rather than watching
  // for the change in an effect — same result, without an extra render pass.
  function selectStatus(v: StatusFilter) {
    setStatusFilter(v);
    setPage(1);
  }
  function selectCategory(v: CategoryFilter) {
    setCategoryFilter(v);
    setPage(1);
  }
  function updateSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  const activeCount = plans.filter((p) => p.status === "active").length;
  const activePlans = useMemo(() => plans.filter((p) => p.status === "active"), [plans]);
  const coreCount = activePlans.filter((p) => (p.enrollment ?? "core") === "core").length;
  const optionalCount = activePlans.length - coreCount;
  /** Benefits Analytics — how the catalogue reaches the workforce. */
  const analytics = useMemo(() => {
    if (!employeeCtx || employeeCtx.employees.length === 0) return null;
    const perEmployee = employeeCtx.employees.map(
      (e) => activePlans.filter((p) => countEligibleEmployees(p, [e], employeeCtx) > 0).length,
    );
    const avg = perEmployee.reduce((s, n) => s + n, 0) / perEmployee.length;
    const noCore = employeeCtx.employees.filter(
      (e) =>
        !activePlans.some(
          (p) => (p.enrollment ?? "core") === "core" && countEligibleEmployees(p, [e], employeeCtx) > 0,
        ),
    ).length;
    return { avg: Math.round(avg * 10) / 10, noCore };
  }, [employeeCtx, activePlans]);
  const coveredEmployees = useMemo(() => {
    if (!employeeCtx) return 0;
    const activePlans = plans.filter((p) => p.status === "active");
    return employeeCtx.employees.filter((e) =>
      activePlans.some((p) => countEligibleEmployees(p, [e], employeeCtx) > 0),
    ).length;
  }, [employeeCtx, plans]);

  // Status + search filtered set drives both the category rail's counts and
  // the distribution bar, so switching tabs or typing a query keeps the rail
  // honest about what's actually available to page through below it.
  const searched = useMemo(
    () =>
      plans
        .filter((p) => statusFilter === "all" || p.status === statusFilter)
        .filter((p) => matchesSearch(p, search)),
    [plans, statusFilter, search],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<BenefitCategory, number>();
    for (const p of searched) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    return counts;
  }, [searched]);

  const distribution = useMemo(() => {
    const total = searched.length || 1;
    return BENEFIT_CATEGORY_OPTIONS.filter((c) => (categoryCounts.get(c) ?? 0) > 0).map(
      (c) => ({ category: c, pct: ((categoryCounts.get(c) ?? 0) / total) * 100 }),
    );
  }, [searched.length, categoryCounts]);

  const filtered = useMemo(
    () => searched.filter((p) => categoryFilter === "all" || p.category === categoryFilter),
    [searched, categoryFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage],
  );

  const groups = useMemo(() => {
    if (categoryFilter !== "all") return [{ category: categoryFilter, plans: pageItems }];
    const byCategory = new Map<BenefitCategory, BenefitPlan[]>();
    for (const p of pageItems) {
      const list = byCategory.get(p.category) ?? [];
      list.push(p);
      byCategory.set(p.category, list);
    }
    return BENEFIT_CATEGORY_OPTIONS.filter((c) => byCategory.has(c)).map((c) => ({
      category: c,
      plans: byCategory.get(c)!,
    }));
  }, [pageItems, categoryFilter]);

  function handleSave(data: NewBenefitPlan) {
    if (editingPlan) {
      actions.update(editingPlan.id, data);
      toast.success("Benefit plan updated");
    } else {
      actions.create(data);
      toast.success("Benefit plan created");
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Benefits</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            The {country === "ng" ? "Nigerian" : "UK"} benefits catalogue — core benefits
            every eligible employee receives, and optional ones they opt into — company-wide
            or restricted to specific employment types.
          </p>
        </div>
        {canManage && (
          <Button
            className="gap-2"
            onClick={() => {
              setEditingPlan(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> New Benefit Plan
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-stretch">
        {/* Rail: overview stats, distribution, status + category filters */}
        <aside className="flex flex-col gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold leading-none text-foreground tabular-nums">
                  {plans.length}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">Plans</p>
              </div>
              <div>
                <p className="text-2xl font-bold leading-none text-emerald-600 tabular-nums">
                  {activeCount}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold leading-none text-foreground tabular-nums">
                  {coveredEmployees}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">Covered</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Core benefits</span>
                <span className="font-medium tabular-nums">{coreCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Optional benefits</span>
                <span className="font-medium tabular-nums">{optionalCount}</span>
              </div>
              {analytics && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avg. per employee</span>
                    <span className="font-medium tabular-nums">{analytics.avg}</span>
                  </div>
                  <div className="flex items-center justify-between" title="Employees whose employment type receives no core benefit">
                    <span className="text-muted-foreground">No core cover</span>
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        analytics.noCore > 0 && "text-amber-600",
                      )}
                    >
                      {analytics.noCore}
                    </span>
                  </div>
                </>
              )}
            </div>

            {distribution.length > 0 && (
              <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full bg-muted">
                {distribution.map((d) => (
                  <div
                    key={d.category}
                    title={`${BENEFIT_CATEGORY_LABELS[d.category]}: ${Math.round(d.pct)}%`}
                    className={cn("h-full", BENEFIT_CATEGORY_DOT[d.category])}
                    style={{ width: `${d.pct}%` }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => selectStatus(tab.value)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 font-medium transition-colors",
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <nav className="flex flex-col gap-0.5 rounded-xl border border-border bg-card p-2">
            <button
              type="button"
              onClick={() => selectCategory("all")}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                categoryFilter === "all" ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">All categories</span>
              <span className="tabular-nums text-xs">{searched.length}</span>
            </button>
            {BENEFIT_CATEGORY_OPTIONS.filter((c) => (categoryCounts.get(c) ?? 0) > 0).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => selectCategory(c)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  categoryFilter === c ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", BENEFIT_CATEGORY_DOT[c])} />
                <span className="flex-1 truncate text-left">{BENEFIT_CATEGORY_LABELS[c]}</span>
                <span className="tabular-nums text-xs">{categoryCounts.get(c)}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Dense, edge-to-edge plan list — stretched (items-stretch above) to
            match the rail's height so the panel never looks short next to it. */}
        <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          <div className="relative shrink-0 border-b border-border/60 p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => updateSearch(e.target.value)}
              placeholder="Search benefit plans by name, provider or coverage..."
              className="h-8 border-none bg-muted/40 pl-9 text-xs shadow-none focus-visible:ring-1"
            />
          </div>
          <div className="flex-1">
            {groups.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 py-10 text-center text-sm text-muted-foreground">
                No benefit plans match this view.
              </div>
            ) : (
              groups.map(({ category, plans: categoryPlans }) => (
                <div key={category}>
                  {categoryFilter === "all" && (
                    <div className="flex items-center gap-1.5 border-b border-border/60 bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <span className={cn("h-1.5 w-1.5 rounded-full", BENEFIT_CATEGORY_DOT[category])} />
                      {BENEFIT_CATEGORY_LABELS[category]}
                      <span className="font-normal normal-case tracking-normal">
                        · {categoryPlans.length}
                      </span>
                    </div>
                  )}
                  {categoryPlans.map((plan) => (
                    <BenefitPlanRow
                      key={plan.id}
                      plan={plan}
                      canManage={canManage}
                      onEdit={(p) => {
                        setEditingPlan(p);
                        setModalOpen(true);
                      }}
                      onDuplicate={(p) => {
                        actions.duplicate(p.id);
                        toast.success("Benefit plan duplicated as a draft");
                      }}
                      onToggleStatus={(p) => {
                        const next = p.status === "archived" ? "active" : "archived";
                        actions.setStatus(p.id, next);
                        toast.success(
                          next === "archived" ? "Benefit plan archived" : "Benefit plan activated",
                        );
                      }}
                      onDelete={(p) => setDeleteTarget(p)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>

          {filtered.length > 0 && (
            <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BenefitPlanModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPlan(null);
        }}
        editingPlan={editingPlan}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Benefit Plan</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.name}&quot;. Employees
              currently eligible will lose it from their profile. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  actions.remove(deleteTarget.id);
                  toast.success("Benefit plan deleted");
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

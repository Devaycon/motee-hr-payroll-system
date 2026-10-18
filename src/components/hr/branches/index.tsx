"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { PerformanceDashboard } from "./performance/performance-dashboard";
import { CompareBranches } from "./performance/compare-branches";
import { ReportsPanel } from "./performance/reports-panel";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { setActiveBranch } from "@/src/lib/stores/branch-slice";
import {
  StatCards,
  matchesBranchCardFilter,
  BRANCH_CARD_FILTER_LABELS,
  type BranchCardFilter,
} from "./components/stat-cards";
import { BranchesToolbar } from "./components/branches-toolbar";
import { BranchesTable } from "./components/branches-table";
import { BranchFormModal } from "./components/branch-form-modal";
import { useBranches, useBranchMutations, useNextBranchId } from "./hooks";
import type { Branch } from "./types";

const BRANCH_TABS = [
  { value: "overview", label: "Overview" },
  { value: "performance", label: "Performance" },
  { value: "compare", label: "Compare Branches" },
  { value: "reports", label: "Reports" },
];

export function BranchesPage() {
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = BRANCH_TABS.some((t) => t.value === searchParams.get("tab"))
    ? (searchParams.get("tab") as string)
    : "overview";
  function selectTab(next: string) {
    router.replace(next === "overview" ? pathname : `${pathname}?tab=${next}`, {
      scroll: false,
    });
  }
  const { data: branches, loading } = useBranches();
  const { create, update, remove } = useBranchMutations();
  const nextId = useNextBranchId();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [cardFilter, setCardFilter] = useState<BranchCardFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const rows = useMemo(() => branches ?? [], [branches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((b) => {
      const matchesSearch =
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        (b.managerName ?? "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      const matchesKind = kindFilter === "all" || b.kind === kindFilter;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesKind &&
        matchesBranchCardFilter(b, cardFilter)
      );
    });
  }, [rows, search, statusFilter, kindFilter, cardFilter]);

  function handleAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function handleEdit(branch: Branch) {
    setEditing(branch);
    setFormOpen(true);
  }

  function handleDelete(branch: Branch) {
    remove(branch.id);
    toast.success(`${branch.name} deleted`);
  }

  function handleScopeTo(id: string) {
    dispatch(setActiveBranch(id));
    const name = rows.find((b) => b.id === id)?.name ?? "branch";
    toast.success(`Now showing ${name} only`, {
      description:
        "Change this any time from the branch switcher in the header.",
    });
  }

  if (loading && rows.length === 0) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Branches</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Every site your company operates from. Assign people to a branch on
          their employee record, then scope the app to one from the header.
        </p>
      </div>

      <Tabs value={tab} onValueChange={selectTab} className="gap-4">
        <PageTabsList tabs={BRANCH_TABS} />
        <TabsContent value="performance">
          <PerformanceDashboard />
        </TabsContent>
        <TabsContent value="compare">
          <CompareBranches />
        </TabsContent>
        <TabsContent value="reports">
          <ReportsPanel />
        </TabsContent>
        <TabsContent value="overview" className="flex flex-col gap-6">
          <StatCards
            branches={rows}
            cardFilter={cardFilter}
            onFilterChange={setCardFilter}
          />

          {cardFilter !== "all" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground">
                {BRANCH_CARD_FILTER_LABELS[cardFilter]}{" "}
                <span className="text-muted-foreground">
                  ({filtered.length})
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setCardFilter("all")}
              >
                ← All branches
              </Button>
            </div>
          )}

          <BranchesToolbar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            kindFilter={kindFilter}
            onKindFilterChange={setKindFilter}
            onAdd={handleAdd}
          />

          <BranchesTable
            branches={filtered}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onScopeTo={handleScopeTo}
          />

          <BranchFormModal
            open={formOpen}
            onClose={() => setFormOpen(false)}
            editing={editing}
            takenCodes={rows.map((b) => b.code)}
            onCreate={create}
            onUpdate={update}
            nextId={nextId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

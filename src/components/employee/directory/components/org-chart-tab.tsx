"use client";

import { useState, useMemo } from "react";
import { StructureToolbar } from "@/src/components/hr/structure/components/structure-toolbar";
import { HierarchyTree } from "@/src/components/hr/structure/components/hierarchy-tree";
import { ReportingTable } from "@/src/components/hr/structure/components/reporting-table";
import { useHierarchy } from "@/src/components/hr/structure/hooks";
import { recomputeNodes } from "@/src/data/structure-demo";
import type { ViewMode } from "@/src/lib/types/structure";

export function OrgChartTab() {
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const { data } = useHierarchy();
  const treeNodes = useMemo(() => recomputeNodes(data ?? []), [data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return treeNodes;
    const q = search.toLowerCase();
    return treeNodes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.jobTitle.toLowerCase().includes(q) ||
        n.department.toLowerCase().includes(q) ||
        (n.managerName ?? "").toLowerCase().includes(q),
    );
  }, [search, treeNodes]);

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <StructureToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
      />

      {viewMode === "tree" ? (
        <HierarchyTree nodes={treeNodes} deptFilter={deptFilter} />
      ) : (
        <ReportingTable nodes={filtered} onEdit={() => {}} />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import { recomputeNodes } from "./data";
import type { HierarchyNode, ViewMode } from "./types";
import { useHierarchy } from "./hooks";
import {
  StatCards,
  matchesStructureCardFilter,
  STRUCTURE_CARD_FILTER_LABELS,
  type StructureCardFilter,
} from "./components/stat-cards";
import { Button } from "@/src/components/ui/button";
import { StructureToolbar } from "./components/structure-toolbar";
import { HierarchyTree } from "./components/hierarchy-tree";
import { ReportingTable } from "./components/reporting-table";
import { EditReportingModal } from "./components/edit-reporting-modal";

export function StructurePage() {
  const { data } = useHierarchy();
  const [rawNodes, setRawNodes] = useState<HierarchyNode[]>([]);
  useEffect(() => {
    if (data) setRawNodes(data);
  }, [data]);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  /** Drill-down set by the KPI cards; "all" shows everyone. */
  const [cardFilter, setCardFilter] = useState<StructureCardFilter>("all");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<HierarchyNode | null>(null);

  const nodes = useMemo(() => recomputeNodes(rawNodes), [rawNodes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return nodes.filter((n) => {
      const matchSearch =
        !q ||
        n.name.toLowerCase().includes(q) ||
        n.jobTitle.toLowerCase().includes(q) ||
        n.department.toLowerCase().includes(q) ||
        (n.managerName ?? "").toLowerCase().includes(q);
      // The card drill-down composes with the toolbar search.
      return matchSearch && matchesStructureCardFilter(n, cardFilter);
    });
  }, [nodes, search, cardFilter]);

  function handleEdit(node: HierarchyNode) {
    setEditingNode(node);
    setEditModalOpen(true);
  }

  function handleChangeManager(nodeId: string, newManagerId: string | null) {
    setRawNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, managerId: newManagerId } : n,
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">
          Structure & Hierarchy
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View and manage reporting lines and the organisational hierarchy.
        </p>
      </div>

      <StatCards
        nodes={nodes}
        viewMode={viewMode}
        cardFilter={cardFilter}
        onDrillDown={(view, filter) => {
          setViewMode(view);
          setCardFilter(filter);
        }}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {STRUCTURE_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">({filtered.length})</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← Everyone
          </Button>
        </div>
      )}

      <StructureToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
      />

      {viewMode === "tree" ? (
        <HierarchyTree nodes={nodes} deptFilter={deptFilter} />
      ) : (
        <ReportingTable nodes={filtered} onEdit={handleEdit} />
      )}

      <EditReportingModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        node={editingNode}
        allNodes={nodes}
        onSave={handleChangeManager}
      />
    </div>
  );
}

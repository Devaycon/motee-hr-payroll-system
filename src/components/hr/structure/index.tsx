"use client";

import { useState, useMemo } from "react";
import { HIERARCHY_NODES, recomputeNodes } from "./data";
import type { HierarchyNode, ViewMode } from "./types";
import { StatCards } from "./components/stat-cards";
import { StructureToolbar } from "./components/structure-toolbar";
import { HierarchyTree } from "./components/hierarchy-tree";
import { ReportingTable } from "./components/reporting-table";
import { EditReportingModal } from "./components/edit-reporting-modal";

export function StructurePage() {
  const [rawNodes, setRawNodes] = useState<HierarchyNode[]>(HIERARCHY_NODES);
  const [viewMode, setViewMode] = useState<ViewMode>("tree");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<HierarchyNode | null>(null);

  const nodes = useMemo(() => recomputeNodes(rawNodes), [rawNodes]);

  const filtered = useMemo(() => {
    if (!search.trim()) return nodes;
    const q = search.toLowerCase();
    return nodes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.jobTitle.toLowerCase().includes(q) ||
        n.department.toLowerCase().includes(q) ||
        (n.managerName ?? "").toLowerCase().includes(q),
    );
  }, [nodes, search]);

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

      <StatCards nodes={nodes} />

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

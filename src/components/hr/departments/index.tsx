"use client";

import { useState, useMemo } from "react";
import type { Department } from "./types";
import {
  StatCards,
  matchesDepartmentCardFilter,
  DEPARTMENT_CARD_FILTER_LABELS,
  type DepartmentCardFilter,
} from "./components/stat-cards";
import { Button } from "@/src/components/ui/button";
import { DepartmentsToolbar } from "./components/departments-toolbar";
import { DepartmentsTable } from "./components/departments-table";
import { DepartmentCreateModal } from "./components/department-create-modal";
import { DepartmentEditModal } from "./components/department-edit-modal";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useDepartmentActions, useDepartments } from "./hooks";
import { BusinessUnitsCard } from "./components/business-units-card";

export function DepartmentsPage() {
  const { data, loading } = useDepartments();
  const departments = useMemo(() => data ?? [], [data]);
  const { save, bulkSave, remove } = useDepartmentActions(departments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  /** Drill-down set by the KPI cards; "all" shows every department. */
  const [cardFilter, setCardFilter] = useState<DepartmentCardFilter>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const filtered = useMemo(() => {
    return departments.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase()) ||
        (d.head ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      // The card drill-down composes with search and the status dropdown.
      const matchesCard = matchesDepartmentCardFilter(d, cardFilter);
      return matchesSearch && matchesStatus && matchesCard;
    });
  }, [departments, search, statusFilter, cardFilter]);

  function handleAdd() {
    setAddModalOpen(true);
  }

  function handleEdit(dept: Department) {
    setEditingDept(dept);
    setEditSheetOpen(true);
  }

  function handleDelete(id: string) {
    void remove(id);
  }

  function handleSave(dept: Department) {
    void save(dept);
  }

  function handleBulkSave(depts: Department[]) {
    void bulkSave(depts);
  }

  if (loading && !departments.length) {
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
        <h1 className="text-4xl font-bold text-foreground">Departments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your organisation&apos;s departments, budgets, and team leads.
        </p>
      </div>

      <StatCards
        departments={departments}
        cardFilter={cardFilter}
        onFilterChange={setCardFilter}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {DEPARTMENT_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">({filtered.length})</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All departments
          </Button>
        </div>
      )}

      <DepartmentsToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAdd={handleAdd}
      />

      <DepartmentsTable
        departments={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <BusinessUnitsCard />

      <DepartmentCreateModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleSave}
        onBulkSave={handleBulkSave}
      />

      <DepartmentEditModal
        open={editSheetOpen}
        onClose={() => setEditSheetOpen(false)}
        editingDept={editingDept}
        onSave={handleSave}
      />
    </div>
  );
}

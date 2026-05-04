"use client";

import { useState, useMemo } from "react";
import { DEPARTMENTS } from "./data";
import type { Department } from "./types";
import { StatCards } from "./components/stat-cards";
import { DepartmentsToolbar } from "./components/departments-toolbar";
import { DepartmentsTable } from "./components/departments-table";
import { DepartmentCreateModal } from "./components/department-create-modal";
import { DepartmentEditModal } from "./components/department-edit-modal";

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>(DEPARTMENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
      return matchesSearch && matchesStatus;
    });
  }, [departments, search, statusFilter]);

  function handleAdd() {
    setAddModalOpen(true);
  }

  function handleEdit(dept: Department) {
    setEditingDept(dept);
    setEditSheetOpen(true);
  }

  function handleDelete(id: string) {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSave(dept: Department) {
    setDepartments((prev) => {
      const exists = prev.find((d) => d.id === dept.id);
      if (exists) return prev.map((d) => (d.id === dept.id ? dept : d));
      return [...prev, dept];
    });
  }

  function handleBulkSave(depts: Department[]) {
    setDepartments((prev) => [...prev, ...depts]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Departments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your organisation&apos;s departments, budgets, and team leads.
        </p>
      </div>

      <StatCards departments={departments} />

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

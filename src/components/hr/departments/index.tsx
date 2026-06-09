"use client";

import { useEffect, useState, useMemo } from "react";
import type { Department } from "./types";
import { StatCards } from "./components/stat-cards";
import { DepartmentsToolbar } from "./components/departments-toolbar";
import { DepartmentsTable } from "./components/departments-table";
import { DepartmentCreateModal } from "./components/department-create-modal";
import { DepartmentEditModal } from "./components/department-edit-modal";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useDepartments } from "./hooks";

export function DepartmentsPage() {
  const { data, loading } = useDepartments();
  const [departments, setDepartments] = useState<Department[]>([]);
  useEffect(() => {
    if (data) setDepartments(data);
  }, [data]);
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

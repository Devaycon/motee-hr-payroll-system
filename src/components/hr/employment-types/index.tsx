"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { EMPLOYMENT_TYPES } from "./data";
import type { EmploymentTypeRow, NewEmploymentType } from "./types";
import { EmploymentTypeTable } from "./components/employment-type-table";
import { EmploymentTypeModal } from "./components/employment-type-modal";

export function EmploymentTypesPage() {
  const [types, setTypes] = useState<EmploymentTypeRow[]>(EMPLOYMENT_TYPES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<EmploymentTypeRow | null>(
    null,
  );

  function handleEdit(type: EmploymentTypeRow) {
    setEditingType(type);
    setModalOpen(true);
  }

  function handleToggleStatus(id: string) {
    setTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t)),
    );
  }

  function handleSave(data: NewEmploymentType | EmploymentTypeRow) {
    if ("id" in data) {
      setTypes((prev) =>
        prev.map((t) =>
          t.id === (data as EmploymentTypeRow).id
            ? (data as EmploymentTypeRow)
            : t,
        ),
      );
    } else {
      const newType: EmploymentTypeRow = {
        ...(data as NewEmploymentType),
        id: `et-${Date.now()}`,
        employeeCount: 0,
        isActive: true,
        createdAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
      setTypes((prev) => [...prev, newType]);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="py-6 w-fit">
          <h1 className="text-4xl font-bold text-foreground">
            Employment Types
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define and manage contract types used across the organisation.
          </p>
        </div>
        <div className="pt-6">
          <Button
            className="gap-2"
            onClick={() => {
              setEditingType(null);
              setModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> New Employment Type
          </Button>
        </div>
      </div>

      <EmploymentTypeTable
        types={types}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />

      <EmploymentTypeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingType(null);
        }}
        editingType={editingType}
        onSave={handleSave}
      />
    </div>
  );
}

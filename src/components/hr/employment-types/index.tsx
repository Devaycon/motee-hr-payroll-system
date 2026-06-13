"use client";

import { useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { BulkCsvUploadModal } from "@/src/components/shared/bulk-csv-upload-modal";
import type {
  EmploymentTypeRow,
  NewEmploymentType,
  PayFrequency,
  ContractDuration,
} from "./types";
import { EmploymentTypeTable } from "./components/employment-type-table";
import { EmploymentTypeModal } from "./components/employment-type-modal";
import { useEmploymentTypes } from "./hooks";

export function EmploymentTypesPage() {
  const { data } = useEmploymentTypes();
  const [types, setTypes] = useState<EmploymentTypeRow[]>([]);
  useEffect(() => {
    if (data) setTypes(data);
  }, [data]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<EmploymentTypeRow | null>(
    null,
  );
  const [bulkOpen, setBulkOpen] = useState(false);

  function handleBulkImport(imported: EmploymentTypeRow[]) {
    setTypes((prev) => [...prev, ...imported]);
    toast.success(
      `Imported ${imported.length} employment type${imported.length === 1 ? "" : "s"}`,
    );
  }

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
        createdAt: new Date().toLocaleDateString("en-GB", {
          month: "long",
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
        <div className="pt-6 flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setBulkOpen(true)}
          >
            <Upload className="w-4 h-4" /> Bulk Upload
          </Button>
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

      <BulkCsvUploadModal<EmploymentTypeRow>
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Upload Employment Types"
        description="Download the CSV template, fill it in, then upload to import multiple employment types."
        templateFileName="employment_types_template.csv"
        headers={[
          "name",
          "description",
          "payFrequency",
          "contractDuration",
          "leaveEntitlement",
          "payrollInclusion",
        ]}
        sampleRows={[
          [
            "Full Time",
            "Standard permanent full-time contract",
            "monthly",
            "permanent",
            "25 days",
            "true",
          ],
          [
            "Fixed Term",
            "Fixed-term 12 month contract",
            "monthly",
            "fixed_1y",
            "20 days",
            "true",
          ],
        ]}
        parseRow={(o) => ({
          id: `et-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: o.name ?? "",
          description: o.description ?? "",
          payFrequency: (o.payFrequency || "monthly") as PayFrequency,
          contractDuration: (o.contractDuration ||
            "permanent") as ContractDuration,
          leaveEntitlement: o.leaveEntitlement ?? "",
          payrollInclusion: o.payrollInclusion?.toLowerCase() !== "false",
          workingHours: { enabled: true, hoursPerWeek: 40, flexibleHours: false },
          probationPeriod: {
            enabled: false,
            durationMonths: 0,
            reviewRequired: false,
          },
          pensionContribution: {
            enabled: false,
            employeePercentage: 0,
            employerPercentage: 0,
          },
          benefits: { enabled: false, available: [] },
          statutoryDeductions: [],
          isActive: true,
          employeeCount: 0,
          createdAt: new Date().toLocaleDateString("en-GB", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
        })}
        isRowValid={(r) => !!r.name}
        columns={[
          { label: "Name", get: (r) => r.name, required: true },
          { label: "Pay Frequency", get: (r) => r.payFrequency },
          { label: "Contract", get: (r) => r.contractDuration },
          { label: "Leave", get: (r) => r.leaveEntitlement },
        ]}
        onImport={handleBulkImport}
        entityNoun="employment type"
      />
    </div>
  );
}

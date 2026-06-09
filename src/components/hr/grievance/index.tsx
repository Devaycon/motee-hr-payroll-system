"use client";

import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCasesData } from "./hooks";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { GrievanceStatCards } from "./components/stat-cards";
import { CasesTable } from "./components/cases-table";
import { CaseFormModal } from "./components/case-form-modal";
import { CaseDetailModal } from "./components/case-detail-modal";
import type { ERCase, CaseNote, NewERCase } from "./types";

export function GrievancePage() {
  const { data, loading } = useCasesData();
  const [cases, setCases] = useState<ERCase[]>([]);
  // Seed (and re-seed on country switch) from locale data without an effect,
  // using the "adjust state during render" pattern.
  const [seededData, setSeededData] = useState<ERCase[] | null>(null);
  if (data && data !== seededData) {
    setSeededData(data);
    setCases(data);
  }

  const [formOpen, setFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<ERCase | null>(null);
  const [detailCase, setDetailCase] = useState<ERCase | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function generateCaseNumber() {
    return `ERC-${String(cases.length + 1).padStart(3, "0")}`;
  }

  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function handleCreate(d: NewERCase) {
    const today = new Date().toISOString().split("T")[0];
    const newCase: ERCase = {
      id: generateId(),
      caseNumber: generateCaseNumber(),
      complaintType: d.complaintType,
      employeeName: d.employeeName,
      employeeInitials: d.employeeName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      employeeDept: d.employeeDept,
      dateRaised: today,
      incidentDate: d.incidentDate,
      description: d.description,
      stage: "raised",
      priority: d.priority,
      confidentialityLevel: d.confidentialityLevel,
      assignedTo: d.assignedTo,
      assignedInitials: d.assignedTo
        ? d.assignedTo
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : undefined,
      witnesses: d.witnesses ?? [],
      evidence: d.evidence ?? [],
      hearingPanel: [],
      hasAppeal: false,
      notes: [],
      createdAt: today,
      updatedAt: today,
    };
    setCases((prev) => [newCase, ...prev]);
  }

  function handleUpdateCase(id: string, patch: Partial<ERCase>) {
    const today = new Date().toISOString().split("T")[0];
    setCases((prev) =>
      prev.map((c) =>
        c.id === id ? ({ ...c, ...patch, updatedAt: today } as ERCase) : c,
      ),
    );
    setDetailCase((prev) =>
      prev && prev.id === id
        ? ({ ...prev, ...patch, updatedAt: today } as ERCase)
        : prev,
    );
  }

  function handleDelete(id: string) {
    setCases((prev) => prev.filter((c) => c.id !== id));
    toast.success("Case deleted.");
    if (detailCase?.id === id) {
      setDetailOpen(false);
      setDetailCase(null);
    }
  }

  function handleAddNote(id: string, note: Omit<CaseNote, "id">) {
    const newNote: CaseNote = { id: generateId(), ...note };
    const today = new Date().toISOString().split("T")[0];
    setCases((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, notes: [...c.notes, newNote], updatedAt: today }
          : c,
      ),
    );
    setDetailCase((prev) =>
      prev && prev.id === id
        ? { ...prev, notes: [...prev.notes, newNote], updatedAt: today }
        : prev,
    );
  }

  function handleView(c: ERCase) {
    setDetailCase(c);
    setDetailOpen(true);
  }

  function handleEdit(c: ERCase) {
    setEditingCase(c);
    setFormOpen(true);
  }

  const sorted = [...cases].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const openCases = sorted.filter((c) => c.stage !== "closed");
  const closedCases = sorted.filter((c) => c.stage === "closed");

  if (loading && cases.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-semibold text-foreground">
              Employee Relations Cases
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage grievances, disciplinary and all employee relations cases
              through a single workflow.
            </p>
          </div>
        </div>
        <Button
          size="lg"
          className="gap-2 shrink-0"
          onClick={() => {
            setEditingCase(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Case
        </Button>
      </div>

      <GrievanceStatCards cases={cases} />

      <Tabs defaultValue="all">
        <PageTabsList
          tabs={[
            { value: "all", label: `All Cases (${sorted.length})` },
            { value: "open", label: `Open (${openCases.length})` },
            { value: "closed", label: `Closed (${closedCases.length})` },
          ]}
        />

        <TabsContent value="all" className="mt-4">
          <CasesTable
            cases={sorted}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
        <TabsContent value="open" className="mt-4">
          <CasesTable
            cases={openCases}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
        <TabsContent value="closed" className="mt-4">
          <CasesTable
            cases={closedCases}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      <CaseFormModal
        open={formOpen}
        editing={editingCase}
        onClose={() => {
          setFormOpen(false);
          setEditingCase(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdateCase}
      />

      <CaseDetailModal
        open={detailOpen}
        caseData={detailCase}
        onClose={() => {
          setDetailOpen(false);
          setDetailCase(null);
        }}
        onAddNote={handleAddNote}
        onUpdateCase={handleUpdateCase}
      />
    </div>
  );
}

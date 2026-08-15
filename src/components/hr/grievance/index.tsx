"use client";

import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCasesData } from "./hooks";
import { toast } from "sonner";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import {
  caseAssigned,
  caseOutcomeIssued,
  caseOverdue,
  caseRaised,
  caseStageChanged,
} from "@/src/lib/notifications/er-cases";
import { slaState } from "@/src/lib/types/grievance";
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
  const dispatch = useAppDispatch();
  const { data, loading } = useCasesData();
  const [cases, setCases] = useState<ERCase[]>([]);
  // Seed (and re-seed on country switch) from locale data without an effect,
  // using the "adjust state during render" pattern.
  const [seededData, setSeededData] = useState<ERCase[] | null>(null);
  if (data && data !== seededData) {
    setSeededData(data);
    setCases(data);
  }

  // Controlled so the KPI cards can drill into a tab (client feedback §5.x).
  const [activeTab, setActiveTab] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<ERCase | null>(null);
  const [detailCase, setDetailCase] = useState<ERCase | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  /**
   * §5.9 — cases already notified as overdue. Without this the SLA sweep below
   * would re-raise the same warning on every render, which trains people to
   * ignore the notification centre entirely.
   */
  const overdueNotified = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const c of cases) {
      if (c.stage === "closed") continue;
      if (slaState(c) !== "overdue") continue;
      if (overdueNotified.current.has(c.id)) continue;
      overdueNotified.current.add(c.id);
      dispatch(pushNotification(caseOverdue(c)));
    }
  }, [cases, dispatch]);

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

    // §5.9 — a case that nobody is told about sits untouched until its SLA
    // expires, which is the exact failure the client described.
    dispatch(pushNotification(caseRaised(newCase)));
    if (newCase.assignedTo) {
      dispatch(pushNotification(caseAssigned(newCase, newCase.assignedTo)));
    }
  }

  function handleUpdateCase(id: string, patch: Partial<ERCase>) {
    const today = new Date().toISOString().split("T")[0];
    const before = cases.find((c) => c.id === id);
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

    // §5.9 — notify on the three transitions people actually need to know
    // about, comparing against the pre-update case so an unchanged field
    // doesn't fire.
    if (!before) return;
    const after = { ...before, ...patch, updatedAt: today } as ERCase;

    if (patch.assignedTo && patch.assignedTo !== before.assignedTo) {
      dispatch(pushNotification(caseAssigned(after, patch.assignedTo)));
    }
    if (patch.stage && patch.stage !== before.stage) {
      dispatch(pushNotification(caseStageChanged(after, before.stage)));
      // Reopening a case clears its overdue flag so a later breach is heard.
      if (patch.stage !== "closed") overdueNotified.current.delete(id);
    }
    if (patch.outcome && patch.outcome !== before.outcome) {
      dispatch(pushNotification(caseOutcomeIssued(after)));
    }
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
  // Own tabs so the "Under Investigation" and "Hearings" KPI cards have
  // somewhere to drill into.
  const investigationCases = sorted.filter((c) => c.stage === "investigation");
  const hearingCases = sorted.filter((c) => c.stage === "hearing");

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

      <GrievanceStatCards
        cases={cases}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "all", label: `All Cases (${sorted.length})` },
            { value: "open", label: `Open (${openCases.length})` },
            {
              value: "investigation",
              label: `Under Investigation (${investigationCases.length})`,
            },
            { value: "hearing", label: `Hearings (${hearingCases.length})` },
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
        <TabsContent value="investigation" className="mt-4">
          <CasesTable
            cases={investigationCases}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
        <TabsContent value="hearing" className="mt-4">
          <CasesTable
            cases={hearingCases}
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

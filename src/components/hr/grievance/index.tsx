"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { GrievanceStatCards } from "./components/stat-cards";
import { CasesTable } from "./components/cases-table";
import { CaseFormModal } from "./components/case-form-modal";
import { CaseDetailModal } from "./components/case-detail-modal";
import type {
  AnyCase,
  GrievanceCase,
  DisciplinaryCase,
  CaseType,
  CaseNote,
  GrievanceStatus,
  DisciplinaryStatus,
  NewGrievanceCase,
  NewDisciplinaryCase,
} from "./types";
import { GRIEVANCES, DISCIPLINARY_CASES } from "./data";

export function GrievancePage() {
  const [grievances, setGrievances] = useState<GrievanceCase[]>(GRIEVANCES);
  const [disciplinary, setDisciplinary] =
    useState<DisciplinaryCase[]>(DISCIPLINARY_CASES);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<AnyCase | null>(null);
  const [detailCase, setDetailCase] = useState<AnyCase | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function generateCaseNumber(type: CaseType) {
    const prefix = type === "grievance" ? "GRV" : "DISC";
    const count =
      type === "grievance" ? grievances.length + 1 : disciplinary.length + 1;
    return `${prefix}-${String(count).padStart(3, "0")}`;
  }

  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function handleCreate(
    type: CaseType,
    data: NewGrievanceCase | NewDisciplinaryCase,
  ) {
    const today = new Date().toISOString().split("T")[0];
    if (type === "grievance") {
      const d = data as NewGrievanceCase;
      const newCase: GrievanceCase = {
        id: generateId(),
        type: "grievance",
        caseNumber: generateCaseNumber("grievance"),
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
        category: d.category as GrievanceCase["category"],
        status: "raised",
        priority: d.priority as GrievanceCase["priority"],
        assignedTo: d.assignedTo,
        assignedInitials: d.assignedTo
          ? d.assignedTo
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          : undefined,
        hasAppeal: false,
        notes: [],
        createdAt: today,
        updatedAt: today,
      };
      setGrievances((prev) => [newCase, ...prev]);
    } else {
      const d = data as NewDisciplinaryCase;
      const newCase: DisciplinaryCase = {
        id: generateId(),
        type: "disciplinary",
        caseNumber: generateCaseNumber("disciplinary"),
        employeeName: d.employeeName,
        employeeInitials: d.employeeName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        employeeDept: d.employeeDept,
        incidentDate: d.incidentDate,
        dateRaised: today,
        description: d.description,
        category: d.category as DisciplinaryCase["category"],
        status: "reported",
        priority: d.priority as DisciplinaryCase["priority"],
        assignedTo: d.assignedTo,
        assignedInitials: d.assignedTo
          ? d.assignedTo
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          : undefined,
        hasAppeal: false,
        notes: [],
        createdAt: today,
        updatedAt: today,
      };
      setDisciplinary((prev) => [newCase, ...prev]);
    }
  }

  function handleUpdate(id: string, data: Partial<AnyCase>) {
    const today = new Date().toISOString().split("T")[0];
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === id
          ? ({ ...g, ...data, updatedAt: today } as GrievanceCase)
          : g,
      ),
    );
    setDisciplinary((prev) =>
      prev.map((d) =>
        d.id === id
          ? ({ ...d, ...data, updatedAt: today } as DisciplinaryCase)
          : d,
      ),
    );
  }

  function handleDelete(id: string) {
    setGrievances((prev) => prev.filter((g) => g.id !== id));
    setDisciplinary((prev) => prev.filter((d) => d.id !== id));
    toast.success("Case deleted.");
    if (detailCase?.id === id) {
      setDetailOpen(false);
      setDetailCase(null);
    }
  }

  function handleAddNote(id: string, note: Omit<CaseNote, "id">) {
    const newNote: CaseNote = { id: generateId(), ...note };
    const today = new Date().toISOString().split("T")[0];
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, notes: [...g.notes, newNote], updatedAt: today }
          : g,
      ),
    );
    setDisciplinary((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, notes: [...d.notes, newNote], updatedAt: today }
          : d,
      ),
    );
    setDetailCase((prev) => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, notes: [...prev.notes, newNote], updatedAt: today };
    });
  }

  function handleUpdateStatus(
    id: string,
    status: GrievanceStatus | DisciplinaryStatus,
  ) {
    const today = new Date().toISOString().split("T")[0];
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, status: status as GrievanceStatus, updatedAt: today }
          : g,
      ),
    );
    setDisciplinary((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, status: status as DisciplinaryStatus, updatedAt: today }
          : d,
      ),
    );
    setDetailCase((prev) => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, status, updatedAt: today } as AnyCase;
    });
    toast.success("Status updated.");
  }

  function handleRecordOutcome(
    id: string,
    outcome: string,
    outcomeDate: string,
    suspensionDays?: number,
  ) {
    const today = new Date().toISOString().split("T")[0];
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              outcome,
              outcomeDate,
              status: "resolved" as GrievanceStatus,
              updatedAt: today,
            }
          : g,
      ),
    );
    setDisciplinary((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              outcome: outcome as DisciplinaryCase["outcome"],
              outcomeDate,
              suspensionDays,
              status: "outcome_issued" as DisciplinaryStatus,
              updatedAt: today,
            }
          : d,
      ),
    );
    setDetailCase((prev) => {
      if (!prev || prev.id !== id) return prev;
      if (prev.type === "grievance") {
        return {
          ...prev,
          outcome,
          outcomeDate,
          status: "resolved",
          updatedAt: today,
        } as AnyCase;
      }
      return {
        ...prev,
        outcome: outcome as DisciplinaryCase["outcome"],
        outcomeDate,
        suspensionDays,
        status: "outcome_issued",
        updatedAt: today,
      } as AnyCase;
    });
  }

  function handleRaiseAppeal(id: string) {
    const today = new Date().toISOString().split("T")[0];
    const appealId = `APPEAL-${id.slice(0, 6).toUpperCase()}`;
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === id
          ? { ...g, hasAppeal: true, appealCaseId: appealId, updatedAt: today }
          : g,
      ),
    );
    setDisciplinary((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              hasAppeal: true,
              appealCaseId: appealId,
              status: "appealed" as DisciplinaryStatus,
              updatedAt: today,
            }
          : d,
      ),
    );
    setDetailCase((prev) => {
      if (!prev || prev.id !== id) return prev;
      return {
        ...prev,
        hasAppeal: true,
        appealCaseId: appealId,
        updatedAt: today,
      } as AnyCase;
    });
  }

  function handleScheduleHearing(id: string, date: string) {
    const today = new Date().toISOString().split("T")[0];
    setGrievances((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              hearingDate: date,
              status: "hearing_scheduled" as GrievanceStatus,
              updatedAt: today,
            }
          : g,
      ),
    );
    setDisciplinary((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              hearingDate: date,
              status: "hearing_scheduled" as DisciplinaryStatus,
              updatedAt: today,
            }
          : d,
      ),
    );
    setDetailCase((prev) => {
      if (!prev || prev.id !== id) return prev;
      return { ...prev, hearingDate: date, updatedAt: today } as AnyCase;
    });
  }

  function handleView(c: AnyCase) {
    setDetailCase(c);
    setDetailOpen(true);
  }

  function handleEdit(c: AnyCase) {
    setEditingCase(c);
    setFormOpen(true);
  }

  const allCases: AnyCase[] = [
    ...grievances.map((g) => g as AnyCase),
    ...disciplinary.map((d) => d as AnyCase),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-semibold text-foreground">
              Grievance &amp; Disciplinary
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage employee grievance and disciplinary cases.
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

      <GrievanceStatCards grievances={grievances} disciplinary={disciplinary} />

      <Tabs defaultValue="all">
        <PageTabsList
          tabs={[
            { value: "all", label: `All Cases (${allCases.length})` },
            { value: "grievances", label: `Grievances (${grievances.length})` },
            {
              value: "disciplinary",
              label: `Disciplinary (${disciplinary.length})`,
            },
          ]}
        />

        <TabsContent value="all" className="mt-4">
          <CasesTable
            cases={allCases}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
        <TabsContent value="grievances" className="mt-4">
          <CasesTable
            cases={grievances}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </TabsContent>
        <TabsContent value="disciplinary" className="mt-4">
          <CasesTable
            cases={disciplinary}
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
        onUpdate={handleUpdate}
      />

      <CaseDetailModal
        open={detailOpen}
        caseData={detailCase}
        onClose={() => {
          setDetailOpen(false);
          setDetailCase(null);
        }}
        onAddNote={handleAddNote}
        onUpdateStatus={handleUpdateStatus}
        onRecordOutcome={handleRecordOutcome}
        onRaiseAppeal={handleRaiseAppeal}
        onScheduleHearing={handleScheduleHearing}
      />
    </div>
  );
}

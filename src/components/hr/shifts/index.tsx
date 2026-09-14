"use client";

import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { weekStartOf, isoDateOf } from "@/src/lib/types/attendance";
import { StatCards } from "./components/stat-cards";
import { RosterGrid } from "./components/roster-grid";
import { TemplatesTable } from "./components/templates-table";
import { TemplateModal } from "./components/template-modal";
import {
  useRosterEmployees,
  useShiftTemplates,
  useShiftAssignments,
  useShiftTemplateWriter,
  useShiftAssignmentWriter,
} from "./hooks";
import type { NewShiftTemplate, ShiftTemplate } from "@/src/lib/types/shifts";

export function ShiftsPage() {
  const { data: employees, loading } = useRosterEmployees();
  const templates = useShiftTemplates();
  const assignments = useShiftAssignments();
  const { addTemplate, updateTemplate, deleteTemplate } =
    useShiftTemplateWriter();
  const { setAssignment, clearAssignment } = useShiftAssignmentWriter();

  const [activeTab, setActiveTab] = useState("roster");
  const [weekStart, setWeekStart] = useState(() => weekStartOf(isoDateOf(new Date())));

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(
    null,
  );

  function handleAddTemplate() {
    setEditingTemplate(null);
    setTemplateModalOpen(true);
  }

  function handleEditTemplate(template: ShiftTemplate) {
    setEditingTemplate(template);
    setTemplateModalOpen(true);
  }

  function handleSaveTemplate(data: NewShiftTemplate) {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, data);
    } else {
      addTemplate(data);
    }
  }

  if (loading && !employees) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const employeeList = employees ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-semibold">Shift Scheduling</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Build shift templates and manage the employee roster
        </p>
      </div>

      <StatCards
        employees={employeeList}
        templates={templates}
        assignments={assignments}
        weekStart={weekStart}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "roster", label: "Roster" },
            {
              value: "templates",
              label: `Shift Templates (${templates.length})`,
            },
          ]}
        />

        <TabsContent value="roster" className="mt-4 space-y-4">
          <RosterGrid
            employees={employeeList}
            templates={templates}
            assignments={assignments}
            weekStart={weekStart}
            onWeekChange={setWeekStart}
            onAssign={setAssignment}
            onClear={clearAssignment}
          />
        </TabsContent>

        <TabsContent value="templates" className="mt-4 space-y-4">
          <TemplatesTable
            templates={templates}
            onEdit={handleEditTemplate}
            onDelete={deleteTemplate}
            onAddTemplate={handleAddTemplate}
          />
        </TabsContent>
      </Tabs>

      <TemplateModal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        editingTemplate={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}

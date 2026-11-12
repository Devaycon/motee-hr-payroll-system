"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useChecklistActions, useEmployeeChecklist } from "./hooks";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import type { ChecklistItem, NewChecklistItem } from "./types";
import { ChecklistTable } from "./components/checklist-table";
import { NewHiresTable } from "./components/new-hires-table";
import { ChecklistItemModal } from "./components/checklist-item-modal";

export function EmployeeChecklistPage() {
  const { data, loading } = useEmployeeChecklist();
  const items = useMemo(() => data?.items ?? [], [data]);
  const hires = useMemo(() => data?.hires ?? [], [data]);
  const { save, remove, move } = useChecklistActions(items);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);

  function handleEdit(item: ChecklistItem) {
    setEditingItem(item);
    setModalOpen(true);
  }

  function handleDelete(id: string) {
    void remove(id);
  }

  function handleMoveUp(id: string) {
    void move(id, true);
  }

  function handleMoveDown(id: string) {
    void move(id, false);
  }

  function handleSave(data: NewChecklistItem | ChecklistItem) {
    void save(data);
  }

  if (loading && !items.length) {
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
        <h1 className="text-4xl font-bold text-foreground">
          Employee Checklist
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage the onboarding task template and track new hire progress.
        </p>
      </div>

      <Tabs defaultValue="template">
        <PageTabsList
          tabs={[
            { value: "template", label: "Onboarding Template" },
            { value: "hires", label: "New Hire Status" },
          ]}
        />

        <TabsContent value="template" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              {items.length} task{items.length !== 1 ? "s" : ""} ·{" "}
              {items.filter((i) => i.isRequired).length} required
            </p>
            <Button
              className="gap-2"
              onClick={() => {
                setEditingItem(null);
                setModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </div>
          <ChecklistTable
            items={items}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        </TabsContent>

        <TabsContent value="hires" className="mt-6">
          <div className="mb-4">
            <p className="text-xs text-muted-foreground">
              {hires.length} new hire{hires.length !== 1 ? "s" : ""} currently
              onboarding
            </p>
          </div>
          <NewHiresTable hires={hires} />
        </TabsContent>
      </Tabs>

      <ChecklistItemModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        nextOrder={items.length + 1}
        onSave={handleSave}
      />
    </div>
  );
}

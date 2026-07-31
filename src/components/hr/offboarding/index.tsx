"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { useOffboardingRecords } from "./hooks";
import { StatCards } from "./components/stat-cards";
import { PipelineToolbar } from "./components/pipeline-toolbar";
import { PipelineTable } from "./components/pipeline-table";
import { OffboardingModal } from "./components/offboarding-modal";
import {
  DisapproveDialog,
  ScheduleInterviewDialog,
} from "./components/decision-dialogs";
import { OFFBOARDING_TABS } from "./actions";
import type { OffboardingRecord, NewOffboardingRecord } from "./types";
import { buildClearanceItems } from "./instantiate";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  addRecord,
  approveRecord,
  disapproveRecord,
  generateExitDocuments,
  reactivateRecord,
  removeRecord,
  revokeSystemAccess,
  scheduleExitInterview,
  toggleClearanceItem,
  updateExitInterview,
  updateRecord,
} from "@/src/lib/stores/offboarding-slice";
import { setEmployeeStatus } from "@/src/lib/stores/employees-slice";

export function OffboardingPage() {
  const { data, loading } = useOffboardingRecords();
  const dispatch = useAppDispatch();
  const actor = useAppSelector((s) => s.auth.user?.name ?? "HR Admin");
  const records = useMemo(() => data ?? [], [data]);

  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<OffboardingRecord | null>(
    null,
  );
  const [editingRecord, setEditingRecord] = useState<OffboardingRecord | null>(
    null,
  );
  const [disapproving, setDisapproving] = useState<OffboardingRecord | null>(
    null,
  );
  const [scheduling, setScheduling] = useState<OffboardingRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return records.filter((r) => {
      const matchSearch =
        !q ||
        r.employeeName.toLowerCase().includes(q) ||
        r.jobTitle.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q);
      const matchDept = deptFilter === "all" || r.department === deptFilter;
      const matchReason =
        reasonFilter === "all" || r.exitReason === reasonFilter;
      return matchSearch && matchDept && matchReason;
    });
  }, [records, search, deptFilter, reasonFilter]);

  const rowsByTab = useMemo(
    () =>
      OFFBOARDING_TABS.map((tab) => ({
        ...tab,
        rows: tab.statuses
          ? filtered.filter((r) => tab.statuses!.includes(r.status))
          : filtered,
      })),
    [filtered],
  );

  /** Keeps the employee record in step with the exit decision (§2.3/§3.5). */
  const syncEmployee = useCallback(
    (record: OffboardingRecord, status: "offboarding" | "inactive" | "active") => {
      if (!record.employeeId) return;
      dispatch(setEmployeeStatus({ employeeId: record.employeeId, status }));
    },
    [dispatch],
  );

  const handleInitiate = () => {
    setViewingRecord(null);
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleViewDetails = useCallback((record: OffboardingRecord) => {
    setEditingRecord(null);
    setViewingRecord(record);
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((record: OffboardingRecord) => {
    setViewingRecord(null);
    setEditingRecord(record);
    setModalOpen(true);
  }, []);

  const closeModal = () => {
    setModalOpen(false);
    setViewingRecord(null);
    setEditingRecord(null);
  };

  const handleSave = (data: NewOffboardingRecord) => {
    if (editingRecord) {
      dispatch(updateRecord({ id: editingRecord.id, changes: data }));
      toast.success(`Offboarding details updated for ${data.employeeName}`);
      closeModal();
      return;
    }
    const id = `off-${Date.now()}`;
    const record: OffboardingRecord = {
      ...data,
      id,
      exitInterviewCompleted: false,
      clearanceItems: buildClearanceItems(id),
      status: "pending",
      initiatedAt: new Date().toISOString().slice(0, 10),
    };
    dispatch(addRecord(record));
    syncEmployee(record, "offboarding");
    toast.success(`Offboarding initiated for ${data.employeeName}`);
    closeModal();
  };

  const handleApprove = useCallback(
    (record: OffboardingRecord) => {
      dispatch(approveRecord({ id: record.id, actor }));
      syncEmployee(record, "offboarding");
      toast.success(`Offboarding approved for ${record.employeeName}`);
    },
    [dispatch, actor, syncEmployee],
  );

  const handleDisapprove = useCallback(
    (record: OffboardingRecord, reason: string) => {
      dispatch(disapproveRecord({ id: record.id, actor, reason }));
      // Turning the exit down puts them back on the workforce.
      syncEmployee(record, "active");
      setDisapproving(null);
      toast.success(`Offboarding disapproved for ${record.employeeName}`);
    },
    [dispatch, actor, syncEmployee],
  );

  const handleReactivate = useCallback(
    (record: OffboardingRecord) => {
      dispatch(reactivateRecord({ id: record.id, actor }));
      syncEmployee(record, "active");
      toast.success(`${record.employeeName} reactivated`, {
        description: "They are back on the Active Employees tab.",
      });
    },
    [dispatch, actor, syncEmployee],
  );

  const handleRevokeAccess = useCallback(
    (record: OffboardingRecord) => {
      dispatch(revokeSystemAccess(record.id));
      toast.success(`System access revoked for ${record.employeeName}`);
    },
    [dispatch],
  );

  const handleScheduleInterview = useCallback(
    (record: OffboardingRecord, date: string) => {
      dispatch(scheduleExitInterview({ id: record.id, date }));
      setScheduling(null);
      toast.success(`Exit interview scheduled for ${date}`);
    },
    [dispatch],
  );

  const handleGenerateDocuments = useCallback(
    (record: OffboardingRecord) => {
      dispatch(generateExitDocuments(record.id));
      toast.success(`Exit documents generated for ${record.employeeName}`, {
        description: "Clearance letter and final statement are ready.",
      });
    },
    [dispatch],
  );

  const handleToggleClearance = useCallback(
    (recordId: string, itemId: string) => {
      dispatch(toggleClearanceItem({ id: recordId, itemId }));

      const record = records.find((r) => r.id === recordId);
      if (record) {
        // Mirror the slice's completion rule so the employee is marked
        // inactive the moment the exit finishes (§3.5).
        const nextItems = record.clearanceItems.map((c) =>
          c.id === itemId ? { ...c, completed: !c.completed } : c,
        );
        if (
          nextItems.every((c) => c.completed) &&
          record.exitInterviewCompleted
        ) {
          syncEmployee(record, "inactive");
        }
      }

      setViewingRecord((prev) => {
        if (!prev || prev.id !== recordId) return prev;
        return {
          ...prev,
          clearanceItems: prev.clearanceItems.map((c) =>
            c.id === itemId ? { ...c, completed: !c.completed } : c,
          ),
        };
      });
    },
    [dispatch, records, syncEmployee],
  );

  const handleUpdateExitInterview = useCallback(
    (recordId: string, notes: string, completed: boolean) => {
      dispatch(updateExitInterview({ id: recordId, notes, completed }));
      setViewingRecord((prev) =>
        prev && prev.id === recordId
          ? { ...prev, exitInterviewNotes: notes, exitInterviewCompleted: completed }
          : prev,
      );
      toast.success("Exit interview saved");
    },
    [dispatch],
  );

  const handleDelete = useCallback(
    (id: string) => {
      dispatch(removeRecord(id));
      toast.success("Offboarding record removed");
    },
    [dispatch],
  );

  if (loading && !records.length) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Offboarding</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage employee exit pipelines, clearance checklists, and exit
          interviews.
        </p>
      </div>

      <StatCards records={records} />

      <PipelineToolbar
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        reasonFilter={reasonFilter}
        onReasonFilterChange={setReasonFilter}
        onInitiate={handleInitiate}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <PageTabsList
          tabs={rowsByTab.map((t) => ({
            value: t.value,
            label: `${t.label} (${t.rows.length})`,
          }))}
        />
        {rowsByTab.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <PipelineTable
              records={t.rows}
              emptyMessage={`No records in ${t.label}.`}
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onApprove={handleApprove}
              onDisapprove={setDisapproving}
              onReactivate={handleReactivate}
              onRevokeAccess={handleRevokeAccess}
              onScheduleInterview={setScheduling}
              onGenerateDocuments={handleGenerateDocuments}
              onDelete={handleDelete}
            />
          </TabsContent>
        ))}
      </Tabs>

      <OffboardingModal
        open={modalOpen}
        onClose={closeModal}
        viewingRecord={viewingRecord}
        editingRecord={editingRecord}
        onSave={handleSave}
        onToggleClearance={handleToggleClearance}
        onUpdateExitInterview={handleUpdateExitInterview}
      />

      <DisapproveDialog
        record={disapproving}
        onClose={() => setDisapproving(null)}
        onConfirm={handleDisapprove}
      />

      <ScheduleInterviewDialog
        record={scheduling}
        onClose={() => setScheduling(null)}
        onConfirm={handleScheduleInterview}
      />
    </div>
  );
}

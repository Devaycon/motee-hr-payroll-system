"use client";

import { useEffect, useState, useMemo } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useOffboardingRecords } from "./hooks";
import { toast } from "sonner";
import { StatCards } from "./components/stat-cards";
import { PipelineToolbar } from "./components/pipeline-toolbar";
import { PipelineTable } from "./components/pipeline-table";
import { OffboardingModal } from "./components/offboarding-modal";
import type { OffboardingRecord, NewOffboardingRecord } from "./types";
import { buildClearanceItems } from "./instantiate";

export function OffboardingPage() {
  const { data, loading } = useOffboardingRecords();
  const [records, setRecords] = useState<OffboardingRecord[]>([]);
  useEffect(() => {
    if (data) setRecords(data);
  }, [data]);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<OffboardingRecord | null>(
    null,
  );

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        !search ||
        r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        r.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || r.department === deptFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchReason =
        reasonFilter === "all" || r.exitReason === reasonFilter;
      return matchSearch && matchDept && matchStatus && matchReason;
    });
  }, [records, search, deptFilter, statusFilter, reasonFilter]);

  const handleInitiate = () => {
    setViewingRecord(null);
    setModalOpen(true);
  };

  const handleViewDetails = (record: OffboardingRecord) => {
    setViewingRecord(record);
    setModalOpen(true);
  };

  const handleSave = (data: NewOffboardingRecord) => {
    const id = `off-${Date.now()}`;
    const clearanceItems = buildClearanceItems(id);
    const newRecord: OffboardingRecord = {
      ...data,
      id,
      exitInterviewCompleted: false,
      clearanceItems,
      status: "pending",
      initiatedAt: new Date().toISOString().slice(0, 10),
    };
    setRecords((prev) => [newRecord, ...prev]);
    toast.success(`Offboarding initiated for ${data.employeeName}`);
    setModalOpen(false);
  };

  const handleToggleClearance = (recordId: string, itemId: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const updatedItems = r.clearanceItems.map((c) =>
          c.id === itemId ? { ...c, completed: !c.completed } : c,
        );
        const allDone = updatedItems.every((c) => c.completed);
        return {
          ...r,
          clearanceItems: updatedItems,
          status:
            allDone && r.exitInterviewCompleted
              ? "completed"
              : r.status === "pending"
                ? "in_progress"
                : r.status,
        };
      }),
    );
    setViewingRecord((prev) => {
      if (!prev || prev.id !== recordId) return prev;
      const updatedItems = prev.clearanceItems.map((c) =>
        c.id === itemId ? { ...c, completed: !c.completed } : c,
      );
      return { ...prev, clearanceItems: updatedItems };
    });
  };

  const handleUpdateExitInterview = (
    recordId: string,
    notes: string,
    completed: boolean,
  ) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? {
              ...r,
              exitInterviewNotes: notes,
              exitInterviewCompleted: completed,
            }
          : r,
      ),
    );
    setViewingRecord((prev) =>
      prev && prev.id === recordId
        ? {
            ...prev,
            exitInterviewNotes: notes,
            exitInterviewCompleted: completed,
          }
        : prev,
    );
    toast.success("Exit interview saved");
  };

  const handleComplete = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "completed" } : r)),
    );
    toast.success(
      "Offboarding marked as complete. Access revocation triggered.",
    );
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast.success("Offboarding record removed");
  };

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
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        reasonFilter={reasonFilter}
        onReasonFilterChange={setReasonFilter}
        onInitiate={handleInitiate}
      />

      <PipelineTable
        records={filtered}
        onViewDetails={handleViewDetails}
        onComplete={handleComplete}
        onDelete={handleDelete}
      />

      <OffboardingModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setViewingRecord(null);
        }}
        viewingRecord={viewingRecord}
        onSave={handleSave}
        onToggleClearance={handleToggleClearance}
        onUpdateExitInterview={handleUpdateExitInterview}
      />
    </div>
  );
}

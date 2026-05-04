"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatCards } from "./components/stat-cards";
import { PipelineToolbar } from "./components/pipeline-toolbar";
import { PipelineTable } from "./components/pipeline-table";
import { OnboardingModal } from "./components/onboarding-modal";
import { MethodSelector } from "./components/method-selector";
import { InviteOnboardingModal } from "./components/invite-onboarding-modal";
import { BulkOnboardingModal } from "./components/bulk-onboarding-modal";
import { ONBOARDING_RECORDS, STAGE_ORDER } from "./data";
import { consumePendingRecords } from "@/src/lib/demo/pending-onboarding";
import type {
  OnboardingRecord,
  InviteOnboardingData,
  BulkOnboardingRow,
} from "./types";
import type { OnboardingMethod } from "./components/method-selector";

const DEFAULT_TASKS = [
  {
    taskName: "Send offer letter",
    assignee: "hr" as const,
    dueDay: -5,
    isRequired: true,
  },
  {
    taskName: "Collect ID documents",
    assignee: "hr" as const,
    dueDay: -3,
    isRequired: true,
  },
  {
    taskName: "Complete employment contract",
    assignee: "employee" as const,
    dueDay: -2,
    isRequired: true,
  },
  {
    taskName: "Set up laptop",
    assignee: "it" as const,
    dueDay: -1,
    isRequired: true,
  },
  {
    taskName: "Create company email",
    assignee: "it" as const,
    dueDay: -1,
    isRequired: true,
  },
  {
    taskName: "Prepare workspace",
    assignee: "manager" as const,
    dueDay: 0,
    isRequired: false,
  },
  {
    taskName: "Benefits enrollment",
    assignee: "hr" as const,
    dueDay: 1,
    isRequired: true,
  },
  {
    taskName: "Orientation session",
    assignee: "hr" as const,
    dueDay: 1,
    isRequired: true,
  },
  {
    taskName: "Meet key stakeholders",
    assignee: "manager" as const,
    dueDay: 5,
    isRequired: false,
  },
  {
    taskName: "Complete compliance training",
    assignee: "employee" as const,
    dueDay: 7,
    isRequired: true,
  },
];

export function OnboardingPage() {
  const router = useRouter();
  const [records, setRecords] =
    useState<OnboardingRecord[]>(ONBOARDING_RECORDS);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<OnboardingRecord | null>(
    null,
  );
  const [methodSelectorOpen, setMethodSelectorOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  useEffect(() => {
    const pending = consumePendingRecords();
    if (pending.length > 0) {
      setRecords((prev) => [...pending, ...prev]);
      toast.success(
        `${pending.length} employee${pending.length !== 1 ? "s" : ""} added to onboarding`,
      );
    }
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        !search ||
        r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        r.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        r.department.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === "all" || r.department === deptFilter;
      const matchStage = stageFilter === "all" || r.stage === stageFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchSearch && matchDept && matchStage && matchStatus;
    });
  }, [records, search, deptFilter, stageFilter, statusFilter]);

  const handleViewTasks = (record: OnboardingRecord) => {
    setViewingRecord(record);
    setTaskModalOpen(true);
  };

  const handleSelectMethod = (method: OnboardingMethod) => {
    setMethodSelectorOpen(false);
    if (method === "manual") router.push("/talent/onboarding/new");
    else if (method === "invite") setInviteModalOpen(true);
    else setBulkModalOpen(true);
  };

  const buildTasks = (id: string) =>
    DEFAULT_TASKS.map((t, i) => ({
      id: `${id}-t${i + 1}`,
      taskName: t.taskName,
      assignee: t.assignee,
      dueDay: t.dueDay,
      status: "pending" as const,
      isRequired: t.isRequired,
    }));

  const handleInviteSend = (data: InviteOnboardingData) => {
    const id = `onb-${Date.now()}`;
    const tasks = buildTasks(id);
    const fullName = `${data.firstName} ${data.lastName}`;
    const initials = `${data.firstName[0]}${data.lastName[0]}`.toUpperCase();
    const newRecord: OnboardingRecord = {
      id,
      employeeName: fullName,
      employeeInitials: initials,
      email: data.email,
      jobTitle: data.jobTitle,
      department: data.department,
      startDate: data.startDate,
      stage: "pre_boarding",
      status: "not_started",
      tasks,
      completedTasks: 0,
      totalTasks: tasks.length,
      welcomeEmailSent: true,
      initiatedAt: new Date().toISOString().slice(0, 10),
      mode: "invited",
    };
    setRecords((prev) => [newRecord, ...prev]);
    toast.success(`Invite sent to ${data.email}`);
    setInviteModalOpen(false);
  };

  const handleBulkImport = (rows: BulkOnboardingRow[]) => {
    const newRecords: OnboardingRecord[] = rows.map((row, idx) => {
      const id = `onb-bulk-${Date.now()}-${idx}`;
      const tasks = buildTasks(id);
      const fullName = `${row.firstName} ${row.lastName}`;
      const initials = `${row.firstName[0]}${row.lastName[0]}`.toUpperCase();
      return {
        id,
        employeeName: fullName,
        employeeInitials: initials,
        email: row.email,
        jobTitle: row.jobTitle,
        department: row.department,
        startDate: row.startDate,
        stage: "pre_boarding" as const,
        status: "not_started" as const,
        tasks,
        completedTasks: 0,
        totalTasks: tasks.length,
        welcomeEmailSent: false,
        initiatedAt: new Date().toISOString().slice(0, 10),
        mode: "bulk" as const,
      };
    });
    setRecords((prev) => [...newRecords, ...prev]);
    toast.success(
      `${rows.length} employee${rows.length !== 1 ? "s" : ""} onboarded`,
    );
    setBulkModalOpen(false);
  };

  const handleToggleTask = (recordId: string, taskId: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const updatedTasks = r.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status:
                  t.status === "completed"
                    ? ("pending" as const)
                    : ("completed" as const),
              }
            : t,
        );
        const completedTasks = updatedTasks.filter(
          (t) => t.status === "completed",
        ).length;
        return { ...r, tasks: updatedTasks, completedTasks };
      }),
    );
    setViewingRecord((prev) => {
      if (!prev || prev.id !== recordId) return prev;
      const updatedTasks = prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status:
                t.status === "completed"
                  ? ("pending" as const)
                  : ("completed" as const),
            }
          : t,
      );
      const completedTasks = updatedTasks.filter(
        (t) => t.status === "completed",
      ).length;
      return { ...prev, tasks: updatedTasks, completedTasks };
    });
  };

  const handleAdvanceStage = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const idx = STAGE_ORDER.indexOf(r.stage);
        if (idx < 0 || idx >= STAGE_ORDER.length - 1) return r;
        const nextStage = STAGE_ORDER[idx + 1];
        return {
          ...r,
          stage: nextStage,
          status: nextStage === "completed" ? "completed" : "in_progress",
        };
      }),
    );
    toast.success("Stage advanced");
  };

  const handleSendWelcomeEmail = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, welcomeEmailSent: true } : r)),
    );
    toast.success("Welcome email sent");
  };

  const handleDelete = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    toast.success("Onboarding record removed");
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-4xl font-semibold text-foreground">Onboarding</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage new hire onboarding pipelines and track task completion through
          each stage.
        </p>
      </div>

      <StatCards records={records} />

      <PipelineToolbar
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onOpenMethodSelector={() => setMethodSelectorOpen(true)}
      />

      <PipelineTable
        records={filtered}
        onViewTasks={handleViewTasks}
        onAdvanceStage={handleAdvanceStage}
        onSendWelcomeEmail={handleSendWelcomeEmail}
        onDelete={handleDelete}
      />

      <OnboardingModal
        open={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setViewingRecord(null);
        }}
        viewingRecord={viewingRecord}
        onToggleTask={handleToggleTask}
      />

      <MethodSelector
        open={methodSelectorOpen}
        onClose={() => setMethodSelectorOpen(false)}
        onSelect={handleSelectMethod}
      />

      <InviteOnboardingModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSend={handleInviteSend}
      />

      <BulkOnboardingModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onImport={handleBulkImport}
      />
    </div>
  );
}

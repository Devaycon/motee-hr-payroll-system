"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatCards } from "./components/stat-cards";
import { PipelineToolbar } from "./components/pipeline-toolbar";
import { PipelineTable } from "./components/pipeline-table";
import { MethodSelector } from "./components/method-selector";
import { InviteOnboardingModal } from "./components/invite-onboarding-modal";
import { BulkOnboardingModal } from "./components/bulk-onboarding-modal";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  addRecord,
  addRecords,
  removeRecord,
  sendWelcomeEmail,
} from "@/src/lib/stores/onboarding-records-slice";
import { consumePendingRecords } from "@/src/lib/demo/pending-onboarding";
import { buildTasksForSelection } from "./instantiate";
import type {
  OnboardingRecord,
  InviteOnboardingData,
  BulkOnboardingRow,
} from "./types";
import type { OnboardingMethod } from "./components/method-selector";

export function OnboardingPage({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const records = useAppSelector((s) => s.onboardingRecords.records);
  const templates = useAppSelector((s) => s.approvals.templates);
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodSelectorOpen, setMethodSelectorOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Consume any records handed over from the recruitment "send to onboarding"
  // bridge (runs once on mount).
  const consumedRef = useRef(false);
  useEffect(() => {
    if (consumedRef.current) return;
    consumedRef.current = true;
    const pending = consumePendingRecords();
    if (pending.length > 0) {
      dispatch(addRecords(pending));
      toast.success(
        `${pending.length} employee${pending.length !== 1 ? "s" : ""} added to onboarding`,
      );
    }
  }, [dispatch]);

  // Completed records have moved on to Employees — keep them out of the pipeline.
  const active = useMemo(
    () => records.filter((r) => r.status !== "completed"),
    [records],
  );

  const filtered = useMemo(() => {
    return active.filter((r) => {
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
  }, [active, search, deptFilter, stageFilter, statusFilter]);

  const handleViewTasks = (record: OnboardingRecord) => {
    router.push(`/talent/onboarding/${record.id}`);
  };

  const handleSelectMethod = (method: OnboardingMethod) => {
    setMethodSelectorOpen(false);
    if (method === "manual") router.push("/talent/onboarding/new");
    else if (method === "invite") setInviteModalOpen(true);
    else setBulkModalOpen(true);
  };

  const handleInviteSend = (data: InviteOnboardingData) => {
    const id = `onb-${Date.now()}`;
    const { tasks, template } = buildTasksForSelection(
      id,
      templates,
      roles,
      data.workflowTemplateId,
    );
    const fullName = `${data.firstName} ${data.lastName}`;
    const initials = `${data.firstName[0]}${data.lastName[0]}`.toUpperCase();
    dispatch(
      addRecord({
        id,
        employeeName: fullName,
        employeeInitials: initials,
        email: data.email,
        jobTitle: data.jobTitle,
        department: data.department,
        startDate: data.startDate,
        stage: "pre_boarding",
        status: "not_started",
        workflowTemplateId: template?.id,
        workflowName: template?.name,
        tasks,
        completedTasks: 0,
        totalTasks: tasks.length,
        welcomeEmailSent: true,
        initiatedAt: new Date().toISOString().slice(0, 10),
        mode: "invited",
      }),
    );
    toast.success(`Invite sent to ${data.email}`);
    setInviteModalOpen(false);
    // Simulate the joiner clicking the "Launch onboarding wizard" link in their
    // invite email — open their self-service wizard.
    const qs = new URLSearchParams({
      name: fullName,
      email: data.email,
      jobTitle: data.jobTitle,
      department: data.department,
      startDate: data.startDate,
    }).toString();
    router.push(`/join/${id}?${qs}`);
  };

  const handleBulkImport = (rows: BulkOnboardingRow[]) => {
    const newRecords: OnboardingRecord[] = rows.map((row, idx) => {
      const id = `onb-bulk-${Date.now()}-${idx}`;
      const { tasks, template } = buildTasksForSelection(
        id,
        templates,
        roles,
        row.workflowTemplateId,
      );
      const fullName = `${row.firstName} ${row.lastName}`;
      const initials = `${row.firstName[0]}${row.lastName[0]}`.toUpperCase();
      return {
        id,
        referenceId: row.employeeId || undefined,
        employeeName: fullName,
        employeeInitials: initials,
        email: row.email,
        jobTitle: row.jobTitle,
        department: row.department,
        startDate: row.startDate,
        stage: "pre_boarding" as const,
        status: "not_started" as const,
        workflowTemplateId: template?.id,
        workflowName: template?.name,
        tasks,
        completedTasks: 0,
        totalTasks: tasks.length,
        welcomeEmailSent: false,
        initiatedAt: new Date().toISOString().slice(0, 10),
        mode: "bulk" as const,
      };
    });
    dispatch(addRecords(newRecords));
    toast.success(
      `${rows.length} employee${rows.length !== 1 ? "s" : ""} onboarded`,
    );
    setBulkModalOpen(false);
  };

  const handleSendWelcomeEmail = (id: string) => {
    dispatch(sendWelcomeEmail(id));
    toast.success("Welcome email sent");
  };

  const handleDelete = (id: string) => {
    dispatch(removeRecord(id));
    toast.success("Onboarding record removed");
  };

  return (
    <div className="flex flex-col gap-5">
      {!embedded && (
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pick a workflow when initiating a hire — its tasks &amp; reviewers
            drive each stage, and once every task is approved the hire is cleared
            into Employees.
          </p>
        </div>
      )}

      <StatCards records={active} />

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
        onSendWelcomeEmail={handleSendWelcomeEmail}
        onDelete={handleDelete}
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

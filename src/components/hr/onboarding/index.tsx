"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatCards } from "./components/stat-cards";
import { PipelineToolbar } from "./components/pipeline-toolbar";
import { PipelineTable } from "./components/pipeline-table";
import { MethodSelector } from "./components/method-selector";
import { InviteOnboardingModal } from "./components/invite-onboarding-modal";
import { BulkOnboardingModal } from "./components/bulk-onboarding-modal";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useOnboardingActions, useOnboardingRecords } from "./hooks";
import {
  ImportTemplateCard,
  PendingInvitations,
} from "./components/invitations-panel";
import {
  addRecord,
  addRecords,
  removeRecord,
  sendWelcomeEmail,
  resendInvitation,
} from "@/src/lib/stores/onboarding-records-slice";
import type {
  OnboardingRecord,
  InviteOnboardingData,
  BulkOnboardingRow,
} from "./types";
import type { OnboardingMethod } from "./components/method-selector";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import {
  APPROVAL_CHAIN_TAB_ITEM,
  useHasApprovalChainTab,
} from "@/src/components/hr/approvals/use-chain-tab";
import { WorkflowTab } from "@/src/components/hr/workflows/components/workflow-tab";
import {
  WORKFLOW_TAB_ITEM,
  useHasWorkflowTab,
} from "@/src/components/hr/workflows/use-workflow-tab";

/**
 * The workflows this page starts — preboarding runs from the hire, onboarding
 * from day one, and both move a record through this pipeline.
 */
const ONBOARDING_WORKFLOW_EVENTS = [
  "preboarding_initiated",
  "onboarding_initiated",
] as const;

export function OnboardingPage({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  useOnboardingRecords();
  const { invite, importRows, resendInvite, cancelInvite } =
    useOnboardingActions();
  const records = useAppSelector((s) => s.onboardingRecords.records);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodSelectorOpen, setMethodSelectorOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pipeline");
  const hasWorkflowTab = useHasWorkflowTab(ONBOARDING_WORKFLOW_EVENTS);
  const hasChainTab = useHasApprovalChainTab("onboarding");

  // Records handed over by the recruitment "send to onboarding" action are
  // dispatched straight into this slice at invite time, so there is nothing to
  // drain here — they are already in the store (and persisted) on arrival.

  // Completed records have moved on to Employees — keep them out of the pipeline.
  const active = useMemo(
    () => records.filter((r) => r.status !== "completed"),
    [records],
  );

  const filtered = useMemo(() => {
    // Completed records stay out of the default pipeline view, but the
    // Completed KPI card can pull them back up on demand (feedback §2.20).
    const source = statusFilter === "completed" ? records : active;
    return source.filter((r) => {
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
  }, [records, active, search, deptFilter, stageFilter, statusFilter]);

  const handleViewTasks = (record: OnboardingRecord) => {
    router.push(`/talent/onboarding/${record.id}`);
  };

  const handleSelectMethod = (method: OnboardingMethod) => {
    setMethodSelectorOpen(false);
    if (method === "manual") router.push("/talent/onboarding/new");
    else if (method === "invite") setInviteModalOpen(true);
    else setBulkModalOpen(true);
  };

  const handleInviteSend = async (data: InviteOnboardingData) => {
    if (await invite(data)) setInviteModalOpen(false);
  };

  const handleBulkImport = async (rows: BulkOnboardingRow[]) => {
    if (await importRows(rows)) setBulkModalOpen(false);
  };

  const recordById = (id: string) => records.find((r) => r.id === id);

  const handleSendWelcomeEmail = (id: string) => {
    const record = recordById(id);
    if (record) void resendInvite(record);
  };

  const handleResendInvitation = handleSendWelcomeEmail;

  const handleDelete = (id: string) => {
    const record = recordById(id);
    if (record) void cancelInvite(record);
  };

  return (
    <div className="flex flex-col gap-5">
      {!embedded && (
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Select an onboarding workflow when initiating a new hire. Tasks and
            approvals will guide each stage until onboarding is complete and the
            employee is added to the employee directory.
          </p>
        </div>
      )}

      <PendingInvitations />

      <ImportTemplateCard />

      <StatCards
        records={records}
        statusFilter={statusFilter}
        // A card filters the pipeline, so bring it into view.
        onFilterChange={(v) => {
          setStatusFilter(v);
          setActiveTab("pipeline");
        }}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <PageTabsList
          tabs={[
            { value: "pipeline", label: `Pipeline (${filtered.length})` },
            ...(hasWorkflowTab ? [WORKFLOW_TAB_ITEM] : []),
            ...(hasChainTab ? [APPROVAL_CHAIN_TAB_ITEM] : []),
          ]}
        />

        <TabsContent value="pipeline" className="mt-4 flex flex-col gap-5">
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
            onResendInvitation={handleResendInvitation}
            onDelete={handleDelete}
          />
        </TabsContent>

        {hasWorkflowTab && (
          <TabsContent value="workflow" className="mt-4">
            <WorkflowTab events={ONBOARDING_WORKFLOW_EVENTS} />
          </TabsContent>
        )}

        {hasChainTab && (
          <TabsContent value="approval_chain" className="mt-4">
            <ApprovalChainTab documentType="onboarding" />
          </TabsContent>
        )}
      </Tabs>

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

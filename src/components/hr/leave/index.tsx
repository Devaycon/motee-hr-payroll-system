"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { BulkCsvUploadModal } from "@/src/components/shared/bulk-csv-upload-modal";
import { useLeaveData, useLeaveStages } from "./hooks";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { submitApproval } from "@/src/lib/stores/approvals-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import {
  addRequest,
  addRequests,
  updateRequest,
  advanceRequest,
  rejectRequest as rejectRequestAction,
  cancelRequest as cancelRequestAction,
  addPolicy,
  updatePolicy,
  deletePolicy,
  adjustBalance,
} from "@/src/lib/stores/leave-slice";
import { nextStatus, currentStage } from "@/src/lib/leave/stages";
import {
  detectConflicts,
  departmentSizesFrom,
} from "@/src/lib/leave/conflicts";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import { StatCards } from "./components/stat-cards";
import { RequestsTable } from "./components/requests-table";
import { BalancesTable } from "./components/balances-table";
import { PoliciesTable } from "./components/policies-table";
import { RequestModal } from "./components/request-modal";
import { ReviewModal } from "./components/review-modal";
import { PolicyModal } from "./components/policy-modal";
import { OnLeavePanel } from "./components/on-leave-panel";
import { LeaveCalendarTab } from "./components/calendar-tab";
import { LEAVE_TYPE_LABELS } from "./data";
import { isOpenLeaveStatus } from "@/src/lib/types/leave";
import type {
  LeaveRequest,
  NewLeaveRequest,
  LeavePolicy,
  NewLeavePolicy,
} from "./types";

export function LeaveManagementPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const actor = user?.name ?? "HR Manager";
  const { data, loading } = useLeaveData();
  const stages = useLeaveStages();

  const requests = useMemo(() => data?.requests ?? [], [data]);
  const balances = useMemo(() => data?.balances ?? [], [data]);
  const policies = useMemo(() => data?.policies ?? [], [data]);

  // Real department headcount drives the coverage warnings (§F8).
  const { data: departmentSizes } = useLocaleSection((b) =>
    departmentSizesFrom(b.employees),
  );

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [onLeaveOpen, setOnLeaveOpen] = useState(false);

  // `?request=` opens a specific request straight into review, so the People's
  // time off page can hand a decision back to the flow that owns it.
  const requestParam = useSearchParams().get("request");
  const [openedParam, setOpenedParam] = useState<string | null>(null);
  if (requestParam && requestParam !== openedParam && requests.length) {
    const match = requests.find((r) => r.id === requestParam);
    setOpenedParam(requestParam);
    if (match) {
      setViewingRequest(match);
      setReviewModalOpen(true);
    }
  }

  // Keep the open detail panel in sync as the underlying request advances.
  const viewing = useMemo(
    () =>
      viewingRequest
        ? (requests.find((r) => r.id === viewingRequest.id) ?? viewingRequest)
        : null,
    [requests, viewingRequest],
  );

  const conflicts = useMemo(
    () =>
      viewing && departmentSizes
        ? detectConflicts({
            request: viewing,
            allRequests: requests,
            departmentSizes,
          })
        : [],
    [viewing, requests, departmentSizes],
  );

  function notify(
    title: string,
    description: string,
    type: "success" | "info" | "warning" = "info",
  ) {
    dispatch(pushNotification({ title, description, type }));
  }

  function handleBulkImport(imported: LeaveRequest[]) {
    dispatch(addRequests({ requests: imported, actor, source: "CSV upload" }));
    // Imported rows must enter the approval hub like any other request —
    // previously they bypassed it entirely.
    for (const r of imported) {
      submitToApprovalHub(r);
    }
    toast.success(
      `Imported ${imported.length} leave request${imported.length === 1 ? "" : "s"}`,
    );
    notify(
      "Leave requests imported",
      `${imported.length} request${imported.length === 1 ? "" : "s"} imported and sent for approval.`,
      "success",
    );
  }

  function submitToApprovalHub(req: LeaveRequest) {
    if (!user) return;
    void dispatch(
      submitApproval({
        documentType: "leave_request",
        documentId: req.id,
        documentTitle: `${LEAVE_TYPE_LABELS[req.leaveType] ?? req.leaveType} leave – ${req.totalDays} day${req.totalDays === 1 ? "" : "s"}`,
        documentSummary: `${req.employeeName} · ${req.startDate} → ${req.endDate}`,
        payloadSnapshot: {
          leaveType: req.leaveType,
          startDate: req.startDate,
          endDate: req.endDate,
          totalDays: req.totalDays,
          department: req.department,
          jobTitle: req.jobTitle,
          reason: req.reason ?? "",
          notes: req.notes ?? "",
          reliefEmployee: req.reliefEmployeeName ?? "",
        },
        submitter: {
          employeeId: user.employeeId,
          name: user.name,
          initials: user.initials,
          departmentName: user.departmentName,
        },
      }),
    );
  }

  function handleNewRequest() {
    setEditingRequest(null);
    setRequestModalOpen(true);
  }

  function handleSaveRequest(form: NewLeaveRequest) {
    if (editingRequest) {
      dispatch(
        updateRequest({ id: editingRequest.id, changes: form, actor }),
      );
      toast.success("Leave request updated");
      return;
    }
    // New requests enter at the first stage of the active chain (§F4).
    const firstStatus = stages[0]?.status ?? "pending";
    const newRequest: LeaveRequest = {
      ...form,
      id: `LR-${Date.now()}`,
      status: firstStatus,
      submittedAt: new Date().toISOString().slice(0, 10),
      submittedBy: actor,
    };
    dispatch(addRequest({ request: newRequest, actor }));
    submitToApprovalHub(newRequest);
    toast.success("Leave submitted to the central approval hub");
    notify(
      "Leave request submitted",
      `${newRequest.employeeName} requested ${newRequest.totalDays} day${newRequest.totalDays === 1 ? "" : "s"} of ${LEAVE_TYPE_LABELS[newRequest.leaveType]} leave.`,
    );
  }

  function handleViewRequest(request: LeaveRequest) {
    setViewingRequest(request);
    setReviewModalOpen(true);
  }

  /** Advances one stage; only the final stage results in "approved". */
  function handleApproveRequest(id: string, comment?: string) {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    const stage = currentStage(req.status, stages);
    const to = nextStatus(req.status, stages);
    dispatch(
      advanceRequest({
        id,
        toStatus: to,
        actor,
        stageLabel: stage?.label,
        comment,
      }),
    );
    if (to === "approved") {
      toast.success(`${req.employeeName}'s leave approved`);
      notify(
        "Leave approved",
        `${req.employeeName}'s ${LEAVE_TYPE_LABELS[req.leaveType]} leave for ${req.startDate} → ${req.endDate} was approved.`,
        "success",
      );
    } else {
      const nextStage = currentStage(to, stages);
      toast.success(
        `Moved to ${nextStage?.label ?? "the next stage"}${nextStage?.approverLabel ? ` — ${nextStage.approverLabel}` : ""}`,
      );
      notify(
        "Leave request advanced",
        `${req.employeeName}'s request now awaits ${nextStage?.approverLabel ?? "the next approver"}.`,
      );
    }
  }

  function handleRejectRequest(id: string, reason: string) {
    const req = requests.find((r) => r.id === id);
    dispatch(rejectRequestAction({ id, actor, reason }));
    toast.success("Leave request rejected");
    if (req) {
      notify(
        "Leave rejected",
        `${req.employeeName}'s ${LEAVE_TYPE_LABELS[req.leaveType]} leave was rejected: ${reason}`,
        "warning",
      );
    }
  }

  function handleCancelRequest(id: string) {
    const req = requests.find((r) => r.id === id);
    dispatch(cancelRequestAction({ id, actor }));
    toast.success("Leave request cancelled");
    if (req) {
      notify(
        "Leave cancelled",
        `${req.employeeName}'s ${LEAVE_TYPE_LABELS[req.leaveType]} leave was cancelled.`,
        "warning",
      );
    }
  }

  function handleBulkApprove(ids: string[]) {
    for (const id of ids) handleApproveRequestSilently(id);
    toast.success(`${ids.length} request${ids.length === 1 ? "" : "s"} advanced`);
  }

  function handleApproveRequestSilently(id: string) {
    const req = requests.find((r) => r.id === id);
    if (!req || !isOpenLeaveStatus(req.status)) return;
    const stage = currentStage(req.status, stages);
    dispatch(
      advanceRequest({
        id,
        toStatus: nextStatus(req.status, stages),
        actor,
        stageLabel: stage?.label,
      }),
    );
  }

  function handleBulkReject(ids: string[]) {
    for (const id of ids) {
      dispatch(
        rejectRequestAction({ id, actor, reason: "Rejected in bulk review" }),
      );
    }
    toast.success(`${ids.length} request${ids.length === 1 ? "" : "s"} rejected`);
  }

  function handleAddPolicy() {
    setEditingPolicy(null);
    setPolicyModalOpen(true);
  }

  function handleEditPolicy(policy: LeavePolicy) {
    setEditingPolicy(policy);
    setPolicyModalOpen(true);
  }

  function handleSavePolicy(form: NewLeavePolicy) {
    if (editingPolicy) {
      dispatch(updatePolicy({ id: editingPolicy.id, changes: form }));
      toast.success("Policy updated");
    } else {
      dispatch(
        addPolicy({
          ...form,
          id: `LP-${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 10),
        }),
      );
      toast.success("Policy created");
    }
  }

  function handleDeletePolicy(id: string) {
    dispatch(deletePolicy(id));
    toast.success("Policy deleted");
  }

  if (loading && requests.length === 0) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Leave Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage leave requests, employee balances, and leave policies
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => setBulkOpen(true)}
        >
          <Upload className="w-4 h-4" /> Bulk Upload
        </Button>
      </div>

      <StatCards requests={requests} onShowOnLeave={() => setOnLeaveOpen(true)} />

      <Tabs defaultValue="requests">
        <PageTabsList
          tabs={[
            { value: "requests", label: "Requests" },
            { value: "calendar", label: "Calendar" },
            { value: "balances", label: "Balances" },
            { value: "policies", label: "Policies" },
            { value: "approval_chain", label: "Approval Chain" },
          ]}
        />

        <TabsContent value="requests" className="mt-4 space-y-4">
          <RequestsTable
            requests={requests}
            onView={handleViewRequest}
            onApprove={handleApproveRequest}
            onRejectClick={handleViewRequest}
            onNewRequest={handleNewRequest}
            onEdit={(r) => {
              setEditingRequest(r);
              setRequestModalOpen(true);
            }}
            onCancel={(r) => handleCancelRequest(r.id)}
            onBulkApprove={handleBulkApprove}
            onBulkReject={handleBulkReject}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4 space-y-4">
          <LeaveCalendarTab requests={requests} onSelectRequest={handleViewRequest} />
        </TabsContent>

        <TabsContent value="balances" className="mt-4 space-y-4">
          <BalancesTable
            balances={balances}
            onAdjust={(id, delta) => {
              dispatch(adjustBalance({ id, delta }));
              toast.success(
                `Entitlement adjusted by ${delta > 0 ? "+" : ""}${delta} day${Math.abs(delta) === 1 ? "" : "s"}`,
              );
            }}
          />
        </TabsContent>

        <TabsContent value="policies" className="mt-4 space-y-4">
          <PoliciesTable
            policies={policies}
            onEdit={handleEditPolicy}
            onDelete={handleDeletePolicy}
            onAddPolicy={handleAddPolicy}
          />
        </TabsContent>

        <TabsContent value="approval_chain" className="mt-4 space-y-4">
          <ApprovalChainTab documentType="leave_request" />
        </TabsContent>
      </Tabs>

      <RequestModal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        editingRequest={editingRequest}
        onSave={handleSaveRequest}
      />

      <ReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        viewingRequest={viewing}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
        onCancel={handleCancelRequest}
        stages={stages}
        conflicts={conflicts}
        canApprove
      />

      <PolicyModal
        open={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        editingPolicy={editingPolicy}
        onSave={handleSavePolicy}
      />

      <OnLeavePanel
        open={onLeaveOpen}
        onClose={() => setOnLeaveOpen(false)}
        requests={requests}
        balances={balances}
      />

      <BulkCsvUploadModal<LeaveRequest>
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Upload Leave Requests"
        description="Download the CSV template, fill it in, then upload to import multiple leave requests."
        templateFileName="leave_requests_template.csv"
        headers={[
          "employeeName",
          "employeeInitials",
          "department",
          "jobTitle",
          "leaveType",
          "startDate",
          "endDate",
          "totalDays",
          "reason",
          "notes",
          "reliefEmployeeName",
        ]}
        sampleRows={[
          [
            "Chidi Okonkwo",
            "CO",
            "Engineering",
            "Software Engineer",
            "annual",
            "2026-07-01",
            "2026-07-05",
            "5",
            "Family holiday",
            "Handover to Amara",
            "Amara Nwosu",
          ],
          [
            "Amara Nwosu",
            "AN",
            "Product",
            "Product Manager",
            "sick",
            "2026-07-10",
            "2026-07-11",
            "2",
            "Flu",
            "",
            "",
          ],
        ]}
        parseRow={(o) => ({
          id: `LR-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          employeeName: o.employeeName ?? "",
          employeeInitials: (
            o.employeeInitials ||
            o.employeeName
              ?.split(" ")
              .map((p) => p[0])
              .join("") ||
            ""
          )
            .slice(0, 3)
            .toUpperCase(),
          department: o.department ?? "",
          jobTitle: o.jobTitle ?? "",
          leaveType: (o.leaveType || "annual") as LeaveRequest["leaveType"],
          startDate: o.startDate ?? "",
          endDate: o.endDate ?? "",
          totalDays: Number(o.totalDays) || 0,
          isHalfDay: false,
          status: stages[0]?.status ?? "pending",
          reason: o.reason || undefined,
          notes: o.notes || undefined,
          reliefEmployeeName: o.reliefEmployeeName || undefined,
          submittedAt: new Date().toISOString().slice(0, 10),
          submittedBy: actor,
        })}
        isRowValid={(r) =>
          !!(r.employeeName && r.startDate && r.endDate && r.totalDays > 0)
        }
        validateRow={(r) => {
          const errors: string[] = [];
          if (!r.employeeName) errors.push("Employee name is required");
          if (!r.startDate) errors.push("Start date is required");
          if (!r.endDate) errors.push("End date is required");
          if (r.startDate && r.endDate && r.endDate < r.startDate)
            errors.push("End date is before the start date");
          if (!(r.totalDays > 0)) errors.push("Days must be greater than zero");
          return errors;
        }}
        columns={[
          { label: "Employee", get: (r) => r.employeeName, required: true },
          { label: "Type", get: (r) => r.leaveType },
          { label: "Start", get: (r) => r.startDate, required: true },
          { label: "End", get: (r) => r.endDate, required: true },
          { label: "Days", get: (r) => String(r.totalDays || "") },
        ]}
        onImport={handleBulkImport}
        entityNoun="leave request"
      />
    </div>
  );
}

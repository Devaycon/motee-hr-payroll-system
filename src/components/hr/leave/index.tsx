"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { BulkCsvUploadModal } from "@/src/components/shared/bulk-csv-upload-modal";
import { useLeaveData } from "./hooks";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { submitApproval } from "@/src/lib/stores/approvals-slice";
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
import type {
  LeaveRequest,
  NewLeaveRequest,
  LeaveBalance,
  LeavePolicy,
  NewLeavePolicy,
} from "./types";

export function LeaveManagementPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { data, loading } = useLeaveData();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  useEffect(() => {
    if (data) {
      setRequests(data.requests);
      setBalances(data.balances);
      setPolicies(data.policies);
    }
  }, [data]);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(
    null,
  );

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(
    null,
  );

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<LeavePolicy | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);

  function handleBulkImport(imported: LeaveRequest[]) {
    setRequests((prev) => [...imported, ...prev]);
    toast.success(
      `Imported ${imported.length} leave request${imported.length === 1 ? "" : "s"}`,
    );
  }

  function handleNewRequest() {
    setEditingRequest(null);
    setRequestModalOpen(true);
  }

  function handleSaveRequest(data: NewLeaveRequest) {
    if (editingRequest) {
      setRequests((prev) =>
        prev.map((r) => (r.id === editingRequest.id ? { ...r, ...data } : r)),
      );
    } else {
      const newRequest: LeaveRequest = {
        ...data,
        id: `LR-${Date.now()}`,
        status: "pending",
        submittedAt: new Date().toISOString().slice(0, 10),
      };
      setRequests((prev) => [newRequest, ...prev]);
      if (user) {
        void dispatch(
          submitApproval({
            documentType: "leave_request",
            documentId: newRequest.id,
            documentTitle: `${data.leaveType} leave – ${data.totalDays} day${data.totalDays === 1 ? "" : "s"}`,
            documentSummary: `${data.employeeName} · ${data.startDate} → ${data.endDate}`,
            payloadSnapshot: {
              leaveType: data.leaveType,
              startDate: data.startDate,
              endDate: data.endDate,
              totalDays: data.totalDays,
              department: data.department,
              jobTitle: data.jobTitle,
              notes: data.notes ?? "",
            },
            submitter: {
              employeeId: user.employeeId,
              name: user.name,
              initials: user.initials,
              departmentName: user.departmentName,
            },
          }),
        );
        toast.success("Leave submitted to the central approval hub");
      }
    }
  }

  function handleViewRequest(request: LeaveRequest) {
    setViewingRequest(request);
    setReviewModalOpen(true);
  }

  function handleApproveRequest(id: string) {
    const now = new Date().toISOString().slice(0, 10);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "approved" as const,
              approvedAt: now,
              approvedBy: "HR Manager",
            }
          : r,
      ),
    );
  }

  function handleRejectRequest(id: string, reason: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "rejected" as const,
              rejectionReason: reason,
            }
          : r,
      ),
    );
  }

  function handleRejectClick(request: LeaveRequest) {
    setViewingRequest(request);
    setReviewModalOpen(true);
  }

  function handleAddPolicy() {
    setEditingPolicy(null);
    setPolicyModalOpen(true);
  }

  function handleEditPolicy(policy: LeavePolicy) {
    setEditingPolicy(policy);
    setPolicyModalOpen(true);
  }

  function handleSavePolicy(data: NewLeavePolicy) {
    if (editingPolicy) {
      setPolicies((prev) =>
        prev.map((p) => (p.id === editingPolicy.id ? { ...p, ...data } : p)),
      );
    } else {
      const newPolicy: LeavePolicy = {
        ...data,
        id: `LP-${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setPolicies((prev) => [...prev, newPolicy]);
    }
  }

  function handleDeletePolicy(id: string) {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading && !requests.length) {
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

      <StatCards requests={requests} />

      <Tabs defaultValue="requests">
        <PageTabsList
          tabs={[
            { value: "requests", label: "Requests" },
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
            onRejectClick={handleRejectClick}
            onNewRequest={handleNewRequest}
          />
        </TabsContent>

        <TabsContent value="balances" className="mt-4 space-y-4">
          <BalancesTable balances={balances} />
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
        viewingRequest={viewingRequest}
        onApprove={handleApproveRequest}
        onReject={handleRejectRequest}
      />

      <PolicyModal
        open={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        editingPolicy={editingPolicy}
        onSave={handleSavePolicy}
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
          "notes",
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
          status: "pending",
          notes: o.notes || undefined,
          submittedAt: new Date().toISOString().slice(0, 10),
        })}
        isRowValid={(r) =>
          !!(r.employeeName && r.startDate && r.endDate && r.totalDays > 0)
        }
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

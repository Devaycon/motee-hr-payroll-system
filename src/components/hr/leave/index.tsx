"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { StatCards } from "./components/stat-cards";
import { RequestsTable } from "./components/requests-table";
import { BalancesTable } from "./components/balances-table";
import { PoliciesTable } from "./components/policies-table";
import { RequestModal } from "./components/request-modal";
import { ReviewModal } from "./components/review-modal";
import { PolicyModal } from "./components/policy-modal";
import { LEAVE_REQUESTS, LEAVE_BALANCES, LEAVE_POLICIES } from "./data";
import type {
  LeaveRequest,
  NewLeaveRequest,
  LeaveBalance,
  LeavePolicy,
  NewLeavePolicy,
} from "./types";

export function LeaveManagementPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>(LEAVE_REQUESTS);
  const [balances] = useState<LeaveBalance[]>(LEAVE_BALANCES);
  const [policies, setPolicies] = useState<LeavePolicy[]>(LEAVE_POLICIES);

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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-4xl font-semibold">Leave Management</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage leave requests, employee balances, and leave policies
        </p>
      </div>

      <StatCards requests={requests} />

      <Tabs defaultValue="requests">
        <PageTabsList
          tabs={[
            { value: "requests", label: "Requests" },
            { value: "balances", label: "Balances" },
            { value: "policies", label: "Policies" },
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
    </div>
  );
}

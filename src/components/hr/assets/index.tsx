"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAssets } from "./hooks";
import { Package2 } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { StatCards } from "./components/stat-cards";
import { AssetsTable } from "./components/assets-table";
import { PendingReturnsTable } from "./components/pending-returns-table";
import { DetailModal } from "./components/detail-modal";
import { AssetFormModal } from "./components/asset-form-modal";
import { AssignModal } from "./components/assign-modal";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import type { Asset, AssetCondition, NewAsset } from "./types";

export function AssetsPage() {
  const { data, loading } = useAssets();
  const [assets, setAssets] = useState<Asset[]>([]);
  useEffect(() => {
    if (data) setAssets(data);
  }, [data]);
  const [activeTab, setActiveTab] = useState("all");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);
  const [assignMode, setAssignMode] = useState<"assign" | "return">("assign");

  const pendingReturns = assets.filter((a) => a.pendingReturn === true);

  function generateId() {
    const max = assets.reduce((acc, a) => {
      const num = parseInt(a.id.replace("AST-", ""), 10);
      return num > acc ? num : acc;
    }, 0);
    return `AST-${String(max + 1).padStart(3, "0")}`;
  }

  function handleAddAsset() {
    setEditingAsset(null);
    setFormModalOpen(true);
  }

  function handleEditAsset(asset: Asset) {
    setEditingAsset(asset);
    setFormModalOpen(true);
  }

  function handleViewAsset(asset: Asset) {
    setViewingAsset(asset);
    setDetailModalOpen(true);
  }

  function handleSaveAsset(data: NewAsset) {
    if (editingAsset) {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === editingAsset.id
            ? {
                ...a,
                ...data,
                history: [
                  ...a.history,
                  {
                    id: `H-${a.id}-${Date.now()}`,
                    action: "condition_updated" as const,
                    date: new Date().toISOString().split("T")[0],
                    description: "Asset details updated.",
                    performedBy: "HR Admin",
                  },
                ],
              }
            : a,
        ),
      );
    } else {
      const newId = generateId();
      const newAsset: Asset = {
        ...data,
        id: newId,
        purchaseValue: data.purchaseValue,
        history: [
          {
            id: `H-${newId}-1`,
            action: "created",
            date: new Date().toISOString().split("T")[0],
            description: "Asset added to inventory.",
            performedBy: "HR Admin",
          },
        ],
      };
      setAssets((prev) => [newAsset, ...prev]);
    }
    setFormModalOpen(false);
    setEditingAsset(null);
  }

  function handleAssign(asset: Asset) {
    setAssigningAsset(asset);
    setAssignMode("assign");
    setAssignModalOpen(true);
  }

  function handleReturn(asset: Asset) {
    setAssigningAsset(asset);
    setAssignMode("return");
    setAssignModalOpen(true);
  }

  function handleSaveAssign(
    id: string,
    data: {
      employeeName: string;
      employeeInitials: string;
      department: string;
      assignedDate: string;
    },
  ) {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "assigned" as const,
              assignedTo: data.employeeName,
              assignedToInitials: data.employeeInitials,
              assignedToDepartment: data.department,
              assignedDate: data.assignedDate,
              pendingReturn: false,
              history: [
                ...a.history,
                {
                  id: `H-${a.id}-${Date.now()}`,
                  action: "assigned" as const,
                  date: data.assignedDate,
                  description: `Assigned to ${data.employeeName} (${data.department}).`,
                  performedBy: "HR Admin",
                },
              ],
            }
          : a,
      ),
    );
    setAssignModalOpen(false);
    setAssigningAsset(null);
  }

  function handleSaveReturn(
    id: string,
    condition: AssetCondition,
    notes?: string,
  ) {
    const today = new Date().toISOString().split("T")[0];
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "available" as const,
              condition,
              conditionNotes: notes || a.conditionNotes,
              assignedTo: undefined,
              assignedToInitials: undefined,
              assignedToDepartment: undefined,
              assignedDate: undefined,
              pendingReturn: false,
              history: [
                ...a.history,
                {
                  id: `H-${a.id}-${Date.now()}`,
                  action: "returned" as const,
                  date: today,
                  description: notes
                    ? `Returned. Notes: ${notes}`
                    : "Asset returned and marked available.",
                  performedBy: "HR Admin",
                },
              ],
            }
          : a,
      ),
    );
    setAssignModalOpen(false);
    setAssigningAsset(null);
  }

  function handleMarkReturned(id: string) {
    const today = new Date().toISOString().split("T")[0];
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "available" as const,
              assignedTo: undefined,
              assignedToInitials: undefined,
              assignedToDepartment: undefined,
              assignedDate: undefined,
              pendingReturn: false,
              history: [
                ...a.history,
                {
                  id: `H-${a.id}-${Date.now()}`,
                  action: "returned" as const,
                  date: today,
                  description: "Asset returned from offboarded employee.",
                  performedBy: "HR Admin",
                },
              ],
            }
          : a,
      ),
    );
  }

  function handleSendToMaintenance(id: string) {
    const today = new Date().toISOString().split("T")[0];
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "under_maintenance" as const,
              assignedTo: undefined,
              assignedToInitials: undefined,
              assignedToDepartment: undefined,
              assignedDate: undefined,
              history: [
                ...a.history,
                {
                  id: `H-${a.id}-${Date.now()}`,
                  action: "maintenance_scheduled" as const,
                  date: today,
                  description: "Asset sent for maintenance.",
                  performedBy: "HR Admin",
                },
              ],
            }
          : a,
      ),
    );
  }

  function handleDecommission(id: string) {
    const today = new Date().toISOString().split("T")[0];
    setAssets((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "decommissioned" as const,
              condition: "decommissioned" as const,
              assignedTo: undefined,
              assignedToInitials: undefined,
              assignedToDepartment: undefined,
              assignedDate: undefined,
              history: [
                ...a.history,
                {
                  id: `H-${a.id}-${Date.now()}`,
                  action: "decommissioned" as const,
                  date: today,
                  description: "Asset formally decommissioned.",
                  performedBy: "HR Admin",
                },
              ],
            }
          : a,
      ),
    );
  }

  if (loading && !assets.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-4xl font-semibold">Assets</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage all company assets and equipment.
          </p>
        </div>
      </div>

      <StatCards assets={assets} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "all", label: "All Assets" },
            {
              value: "pending_returns",
              label:
                pendingReturns.length > 0
                  ? `Pending Returns (${pendingReturns.length})`
                  : "Pending Returns",
            },
            { value: "approval_chain", label: "Approval Chain" },
          ]}
        />

        <TabsContent value="all" className="mt-5">
          <AssetsTable
            assets={assets}
            onView={handleViewAsset}
            onEdit={handleEditAsset}
            onAssign={handleAssign}
            onReturn={handleReturn}
            onSendToMaintenance={handleSendToMaintenance}
            onDecommission={handleDecommission}
            onAddAsset={handleAddAsset}
          />
        </TabsContent>

        <TabsContent value="pending_returns" className="mt-5">
          <PendingReturnsTable
            assets={assets}
            onMarkReturned={handleMarkReturned}
            onView={handleViewAsset}
          />
        </TabsContent>

        <TabsContent value="approval_chain" className="mt-5">
          <ApprovalChainTab documentType="asset_request" />
        </TabsContent>
      </Tabs>

      <DetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setViewingAsset(null);
        }}
        asset={viewingAsset}
      />

      <AssetFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingAsset(null);
        }}
        editingAsset={editingAsset}
        onSave={handleSaveAsset}
      />

      <AssignModal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false);
          setAssigningAsset(null);
        }}
        asset={assigningAsset}
        mode={assignMode}
        onAssign={handleSaveAssign}
        onReturn={handleSaveReturn}
      />
    </div>
  );
}

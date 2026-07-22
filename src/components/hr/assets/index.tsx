"use client";

import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAssets } from "./hooks";
import { UserPlus, Upload } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { BulkCsvUploadModal } from "@/src/components/shared/bulk-csv-upload-modal";
import { StatCards } from "./components/stat-cards";
import { AssetsTable } from "./components/assets-table";
import { PendingReturnsTable } from "./components/pending-returns-table";
import { DetailModal } from "./components/detail-modal";
import { AssetFormModal } from "./components/asset-form-modal";
import { AssignModal } from "./components/assign-modal";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import type { Asset, AssetCondition, AssetType, NewAsset } from "./types";

export function AssetsPage() {
  const { data, loading } = useAssets();
  const [assets, setAssets] = useState<Asset[]>([]);
  // Seed/refresh local working copy when the async source data changes, without
  // a setState-in-effect (React render-phase sync pattern).
  const [syncedData, setSyncedData] = useState<Asset[] | null>(null);
  if (data && data !== syncedData) {
    setSyncedData(data);
    setAssets(data);
  }
  const [activeTab, setActiveTab] = useState("all");

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);
  const [assignMode, setAssignMode] = useState<"assign" | "return">("assign");

  const [bulkOpen, setBulkOpen] = useState(false);

  const pendingReturns = assets.filter((a) => a.pendingReturn === true);
  const unassignedAssets = assets.filter(
    (a) => a.status === "available" && !a.assignedTo,
  );

  function handleAssignNew() {
    setAssigningAsset(null);
    setAssignMode("assign");
    setAssignModalOpen(true);
  }

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

  function handleBulkImport(newAssets: NewAsset[]) {
    const today = new Date().toISOString().split("T")[0];
    setAssets((prev) => {
      let max = prev.reduce((acc, a) => {
        const num = parseInt(a.id.replace("AST-", ""), 10);
        return Number.isFinite(num) && num > acc ? num : acc;
      }, 0);
      const created = newAssets.map((data) => {
        max += 1;
        const newId = `AST-${String(max).padStart(3, "0")}`;
        return {
          ...data,
          id: newId,
          history: [
            {
              id: `H-${newId}-1`,
              action: "created" as const,
              date: today,
              description: "Asset added to inventory via bulk upload.",
              performedBy: "HR Admin",
            },
          ],
        } satisfies Asset;
      });
      return [...created, ...prev];
    });
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-semibold">Assets</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage all company assets and equipment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button onClick={handleAssignNew} className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Assign Asset
          </Button>
        </div>
      </div>

      <StatCards assets={assets} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "all", label: "All Assets" },
            {
              value: "unassigned",
              label:
                unassignedAssets.length > 0
                  ? `Unassigned Assets (${unassignedAssets.length})`
                  : "Unassigned Assets",
            },
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

        <TabsContent value="unassigned" className="mt-5">
          <AssetsTable
            assets={unassignedAssets}
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
        availableAssets={unassignedAssets}
        onAssign={handleSaveAssign}
        onReturn={handleSaveReturn}
      />

      <BulkCsvUploadModal<NewAsset>
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Upload Assets"
        description="Download the CSV template, fill it in, then upload to add multiple assets to inventory."
        templateFileName="assets_template.csv"
        headers={[
          "name",
          "assetType",
          "serialNumber",
          "condition",
          "purchaseDate",
          "purchaseValue",
        ]}
        sampleRows={[
          ["MacBook Pro 14\"", "laptop", "C02XL0ABJGH5", "new", "2026-01-15", "2400"],
          ["Dell UltraSharp 27\"", "monitor", "CN0P2VX8", "good", "2025-11-02", "450"],
        ]}
        parseRow={(o) => ({
          name: o.name ?? "",
          assetType: (o.assetType || "other").toLowerCase() as AssetType,
          serialNumber: o.serialNumber ?? "",
          condition: (o.condition || "good").toLowerCase() as AssetCondition,
          status: "available",
          purchaseDate: o.purchaseDate || undefined,
          purchaseValue: o.purchaseValue ? Number(o.purchaseValue) : undefined,
        })}
        isRowValid={(r) => !!(r.name && r.serialNumber)}
        columns={[
          { label: "Name", get: (r) => r.name, required: true },
          { label: "Type", get: (r) => r.assetType },
          { label: "Serial", get: (r) => r.serialNumber, required: true },
          { label: "Condition", get: (r) => r.condition },
          { label: "Purchased", get: (r) => r.purchaseDate ?? "" },
          {
            label: "Value",
            get: (r) => (r.purchaseValue ? String(r.purchaseValue) : ""),
          },
        ]}
        onImport={handleBulkImport}
        entityNoun="asset"
      />
    </div>
  );
}

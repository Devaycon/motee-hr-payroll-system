"use client";

import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAssetActions, useAssets, useAssetWithHistory } from "./hooks";
import { UserPlus, Upload } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { BulkCsvUploadModal } from "@/src/components/shared/bulk-csv-upload-modal";
import {
  StatCards,
  ASSET_CARD_FILTER_LABELS,
  type AssetCardFilter,
} from "./components/stat-cards";
import { AssetsTable } from "./components/assets-table";
import { PendingReturnsTable } from "./components/pending-returns-table";
import { DetailModal } from "./components/detail-modal";
import { AssetFormModal } from "./components/asset-form-modal";
import { AssignModal } from "./components/assign-modal";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import {
  APPROVAL_CHAIN_TAB_ITEM,
  useHasApprovalChainTab,
} from "@/src/components/hr/approvals/use-chain-tab";
import type { Asset, AssetCondition, AssetType, NewAsset } from "./types";

export function AssetsPage() {
  const { data, records, loading } = useAssets();
  const { save, assign, giveBack, setStatus } = useAssetActions(records);
  const [assets, setAssets] = useState<Asset[]>([]);
  // Seed/refresh local working copy when the async source data changes, without
  // a setState-in-effect (React render-phase sync pattern).
  const [syncedData, setSyncedData] = useState<Asset[] | null>(null);
  if (data && data !== syncedData) {
    setSyncedData(data);
    setAssets(data);
  }
  const [activeTab, setActiveTab] = useState("all");
  const hasChainTab = useHasApprovalChainTab("asset_request");
  /** Drill-down set by the KPI cards; "all" shows every asset. */
  const [statusFilter, setStatusFilter] = useState<AssetCardFilter>("all");

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
  /** The "All Assets" rows, narrowed to whichever KPI card is selected. */
  const visibleAssets =
    statusFilter === "all"
      ? assets
      : assets.filter((a) => a.status === statusFilter);

  function handleAssignNew() {
    setAssigningAsset(null);
    setAssignMode("assign");
    setAssignModalOpen(true);
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

  async function handleSaveAsset(data: NewAsset) {
    const saved = await save(data, editingAsset?.id);
    if (!saved) return;
    setFormModalOpen(false);
    setEditingAsset(null);
  }

  async function handleBulkImport(newAssets: NewAsset[]) {
    for (const asset of newAssets) await save(asset);
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

  async function handleSaveAssign(
    id: string,
    data: {
      employeeName: string;
      employeeInitials: string;
      department: string;
      assignedDate: string;
    },
  ) {
    const done = await assign(id, data.employeeName, data.assignedDate);
    if (!done) return;
    setAssignModalOpen(false);
    setAssigningAsset(null);
  }

  async function handleSaveReturn(
    id: string,
    condition: AssetCondition,
    notes?: string,
  ) {
    const done = await giveBack(id, condition, notes);
    if (!done) return;
    setAssignModalOpen(false);
    setAssigningAsset(null);
  }

  function handleMarkReturned(id: string) {
    void giveBack(id);
  }

  /** The API has no maintenance state; this records the asset as lost. */
  function handleSendToMaintenance(id: string) {
    void setStatus(id, "lost", "Asset marked as lost");
  }

  function handleDecommission(id: string) {
    void setStatus(id, "retired", "Asset decommissioned");
  }

  const viewedAsset = useAssetWithHistory(viewingAsset);

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
          <h1 className="text-4xl font-semibold">Asset Management</h1>
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

      <StatCards
        assets={assets}
        activeTab={activeTab}
        statusFilter={statusFilter}
        onDrillDown={(tab, status) => {
          setActiveTab(tab);
          setStatusFilter(status);
        }}
      />

      {statusFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {ASSET_CARD_FILTER_LABELS[statusFilter]}{" "}
            <span className="text-muted-foreground">
              ({visibleAssets.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setStatusFilter("all")}
          >
            ← All assets
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "all", label: `All Assets (${visibleAssets.length})` },
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
            ...(hasChainTab ? [APPROVAL_CHAIN_TAB_ITEM] : []),
          ]}
        />

        <TabsContent value="all" className="mt-5">
          <AssetsTable
            assets={visibleAssets}
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

        {hasChainTab && (
          <TabsContent value="approval_chain" className="mt-5">
            <ApprovalChainTab documentType="asset_request" />
          </TabsContent>
        )}
      </Tabs>

      <DetailModal
        open={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setViewingAsset(null);
        }}
        asset={viewedAsset}
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

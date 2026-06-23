"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useContracts } from "./hooks";
import { PenLine } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { StatCards } from "./components/stat-cards";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import { ContractsTable } from "./components/contracts-table";
import { ContractFormModal } from "./components/contract-form-modal";
import { ContractDetailModal } from "./components/contract-detail-modal";
import { ContractLetterModal } from "./components/contract-letter-modal";
import { HRSignatureModal } from "./components/hr-signature-modal";
import type { Contract, NewContract } from "./types";

export function ContractsPage() {
  const router = useRouter();
  const { data, loading } = useContracts();
  const [contracts, setContracts] = useState<Contract[]>(() => data ?? []);
  const [activeTab, setActiveTab] = useState("all");

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);

  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [letterContract, setLetterContract] = useState<Contract | null>(null);

  const [hrSigModalOpen, setHrSigModalOpen] = useState(false);
  const [hrSignature, setHrSignature] = useState<string | undefined>(undefined);

  const expiringSoon = contracts.filter(
    (c) => c.status === "expiring_soon" && !c.isArchived,
  );
  const drafts = contracts.filter((c) => c.status === "draft" && !c.isArchived);
  const activeContracts = contracts.filter((c) => !c.isArchived);

  function generateId() {
    const max = contracts.reduce((acc, c) => {
      const num = parseInt(c.id.replace("CON-", ""), 10);
      return num > acc ? num : acc;
    }, 0);
    return `CON-${String(max + 1).padStart(3, "0")}`;
  }

  function handleAdd() {
    setEditingContract(null);
    setFormModalOpen(true);
  }

  function handleEdit(contract: Contract) {
    setEditingContract(contract);
    setFormModalOpen(true);
  }

  function handleView(contract: Contract) {
    setViewingContract(contract);
    setDetailModalOpen(true);
  }

  function handleSign(contract: Contract) {
    const params = new URLSearchParams({
      name: contract.title,
      fileType: "pdf",
      back: "/operations/contracts",
    });
    router.push(`/sign?${params.toString()}`);
  }

  function handleDelete(contract: Contract) {
    setContracts((prev) => prev.filter((c) => c.id !== contract.id));
  }

  function handleSave(data: NewContract) {
    const now = new Date().toISOString().split("T")[0];
    if (editingContract) {
      setContracts((prev) =>
        prev.map((c) =>
          c.id === editingContract.id
            ? { ...c, ...data, lastModifiedAt: now }
            : c,
        ),
      );
    } else {
      const newContract: Contract = {
        ...data,
        id: generateId(),
        signatureStatus: "unsigned",
        signatories: [
          {
            name: data.employeeName,
            initials: data.employeeInitials,
            role: data.contractType === "internship" ? "Intern" : "Employee",
          },
          {
            name: "HR Admin",
            initials: "HA",
            role: "HR Manager",
          },
        ],
        notes: [],
        createdAt: now,
        createdBy: "HR Admin",
        lastModifiedAt: now,
        isArchived: false,
      };
      setContracts((prev) => [newContract, ...prev]);
    }
    setFormModalOpen(false);
  }

  function handleDetailEdit(contract: Contract) {
    setDetailModalOpen(false);
    setEditingContract(contract);
    setFormModalOpen(true);
  }

  function handleDetailSign(contract: Contract) {
    setDetailModalOpen(false);
    const params = new URLSearchParams({
      name: contract.title,
      fileType: "pdf",
      back: "/operations/contracts",
    });
    router.push(`/sign?${params.toString()}`);
  }

  function handlePreview(contract: Contract) {
    setLetterContract(contract);
    setLetterModalOpen(true);
  }

  function handleMoveToDocuments(contract: Contract) {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contract.id ? { ...c, movedToDocuments: true } : c,
      ),
    );
    if (viewingContract?.id === contract.id) {
      setViewingContract((prev) =>
        prev ? { ...prev, movedToDocuments: true } : prev,
      );
    }
  }

  if (loading && !contracts.length) {
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
          <h1 className="text-4xl font-semibold tracking-tight">Contracts</h1>
          <p className="text-sm text-muted-foreground">
            Manage employment contracts, NDAs, and agreements.
          </p>
        </div>
        <div className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHrSigModalOpen(true)}
          >
            <PenLine className="mr-2 size-4" />
            Set New HR Signature
          </Button>
        </div>
      </div>

      <StatCards contracts={contracts} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            {
              value: "all",
              label: `All Contracts (${activeContracts.length})`,
            },
            {
              value: "expiring",
              label:
                expiringSoon.length > 0
                  ? `Expiring Soon (${expiringSoon.length})`
                  : "Expiring Soon",
            },
            {
              value: "drafts",
              label: drafts.length > 0 ? `Drafts (${drafts.length})` : "Drafts",
            },
            { value: "approval_chain", label: "Approval Chain" },
          ]}
        />

        <TabsContent value="all" className="mt-4">
          <ContractsTable
            contracts={activeContracts}
            onAdd={handleAdd}
            onView={handleView}
            onEdit={handleEdit}
            onSign={handleSign}
            onDelete={handleDelete}
            onPreview={handlePreview}
            onMoveToDocuments={handleMoveToDocuments}
          />
        </TabsContent>

        <TabsContent value="expiring" className="mt-4">
          <ContractsTable
            contracts={expiringSoon}
            onAdd={handleAdd}
            onView={handleView}
            onEdit={handleEdit}
            onSign={handleSign}
            onDelete={handleDelete}
            onPreview={handlePreview}
            onMoveToDocuments={handleMoveToDocuments}
          />
        </TabsContent>

        <TabsContent value="drafts" className="mt-4">
          <ContractsTable
            contracts={drafts}
            onAdd={handleAdd}
            onView={handleView}
            onEdit={handleEdit}
            onSign={handleSign}
            onDelete={handleDelete}
            onPreview={handlePreview}
            onMoveToDocuments={handleMoveToDocuments}
          />
        </TabsContent>

        <TabsContent value="approval_chain" className="mt-4">
          <ApprovalChainTab documentType="contract" />
        </TabsContent>
      </Tabs>

      <ContractFormModal
        open={formModalOpen}
        contract={editingContract}
        onClose={() => setFormModalOpen(false)}
        onSave={handleSave}
      />

      <ContractDetailModal
        open={detailModalOpen}
        contract={viewingContract}
        onClose={() => setDetailModalOpen(false)}
        onEdit={handleDetailEdit}
        onSign={handleDetailSign}
        onPreview={handlePreview}
        onMoveToDocuments={handleMoveToDocuments}
        hrSignature={hrSignature}
      />

      <ContractLetterModal
        open={letterModalOpen}
        contract={letterContract}
        hrSignature={hrSignature}
        onClose={() => setLetterModalOpen(false)}
      />

      <HRSignatureModal
        open={hrSigModalOpen}
        currentSignature={hrSignature}
        onClose={() => setHrSigModalOpen(false)}
        onSave={(sig) => {
          setHrSignature(sig);
          setHrSigModalOpen(false);
        }}
      />
    </div>
  );
}

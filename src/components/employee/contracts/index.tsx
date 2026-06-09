"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ContractDetailModal } from "@/src/components/hr/contracts/components/contract-detail-modal";
import { ContractLetterModal } from "@/src/components/hr/contracts/components/contract-letter-modal";
import { EmployeeSignModal } from "./components/employee-sign-modal";
import { ContractStats } from "./components/contract-stats";
import { ContractsTable } from "./components/contracts-table";
import { UnsignedContractsTable } from "./components/unsigned-contracts-table";
import { CONTRACTS } from "@/src/data/contracts-demo";
import type { Contract } from "@/src/lib/types/contracts";
import { useContracts } from "@/src/components/hr/contracts/hooks";
import { useAppSelector } from "@/src/lib/stores/hooks";

export default function MyContractsPage() {
  const { data: localeContracts } = useContracts();
  const employeeName = useAppSelector((s) => s.auth.user?.name);
  const FALLBACK_EMPLOYEE = "Adaeze Okonkwo";
  const baseContracts =
    localeContracts && employeeName
      ? localeContracts.filter(
          (c) => c.employeeName === employeeName && !c.isArchived,
        )
      : null;
  const [contracts, setContracts] = useState(
    baseContracts && baseContracts.length
      ? baseContracts
      : CONTRACTS.filter(
          (c) => c.employeeName === FALLBACK_EMPLOYEE && !c.isArchived,
        ),
  );

  const myContracts = contracts;

  const [activeTab, setActiveTab] = useState("all");
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [letterContract, setLetterContract] = useState<Contract | null>(null);
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signingContract, setSigningContract] = useState<Contract | null>(null);

  const active = myContracts.filter((c) => c.status === "active");
  const expiring = myContracts.filter((c) => c.status === "expiring_soon");
  const unsigned = myContracts.filter((c) => c.signatureStatus === "unsigned");
  const pending = myContracts.filter(
    (c) => c.signatureStatus !== "fully_signed",
  );

  function handleView(contract: Contract) {
    setViewingContract(contract);
    setDetailOpen(true);
  }

  function handlePreview(contract: Contract) {
    setLetterContract(contract);
    setLetterModalOpen(true);
  }

  function handleSign(contract: Contract) {
    setSigningContract(contract);
    setSignModalOpen(true);
  }

  function handleSignConfirm(contractId: string) {
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              signatureStatus: "employee_signed" as const,
              signatories: c.signatories.map((s) =>
                s.role.toLowerCase().includes("employee")
                  ? { ...s, signedAt: new Date().toISOString().split("T")[0] }
                  : s,
              ),
            }
          : c,
      ),
    );
    setSignModalOpen(false);
    setSigningContract(null);
  }

  const tabContracts =
    activeTab === "active"
      ? active
      : activeTab === "expiring"
        ? expiring
        : myContracts;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-4xl font-semibold">My Contracts</h1>
          <p className="text-sm text-muted-foreground">
            View and track your employment contracts and agreements.
          </p>
        </div>
      </div>

      <ContractStats
        total={myContracts.length}
        active={active.length}
        expiring={expiring.length}
        pending={pending.length}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "all", label: `All (${myContracts.length})` },
            {
              value: "active",
              label: active.length > 0 ? `Active (${active.length})` : "Active",
            },
            {
              value: "expiring",
              label:
                expiring.length > 0
                  ? `Expiring Soon (${expiring.length})`
                  : "Expiring Soon",
            },
            {
              value: "unsigned",
              label:
                unsigned.length > 0
                  ? `Unsigned (${unsigned.length})`
                  : "Unsigned",
            },
          ]}
        />

        {(["all", "active", "expiring"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <ContractsTable
              contracts={tabContracts}
              onView={handleView}
              onSign={handleSign}
            />
          </TabsContent>
        ))}

        <TabsContent value="unsigned" className="mt-4">
          <UnsignedContractsTable contracts={unsigned} onSign={handleSign} />
        </TabsContent>
      </Tabs>

      <ContractDetailModal
        open={detailOpen}
        contract={viewingContract}
        onClose={() => setDetailOpen(false)}
        onEdit={() => {}}
        onSign={() => {}}
        onPreview={handlePreview}
        readOnly
      />

      <ContractLetterModal
        open={letterModalOpen}
        contract={letterContract}
        onClose={() => setLetterModalOpen(false)}
      />

      <EmployeeSignModal
        open={signModalOpen}
        contract={signingContract}
        onClose={() => {
          setSignModalOpen(false);
          setSigningContract(null);
        }}
        onConfirm={handleSignConfirm}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ContractStats } from "@/src/components/employee/contracts/components/contract-stats";
import { ContractsTable } from "@/src/components/employee/contracts/components/contracts-table";
import { UnsignedContractsTable } from "@/src/components/employee/contracts/components/unsigned-contracts-table";
import { ContractDetailModal } from "@/src/components/hr/contracts/components/contract-detail-modal";
import { ContractLetterModal } from "@/src/components/hr/contracts/components/contract-letter-modal";
import { useContracts } from "@/src/components/hr/contracts/hooks";
import type { Contract } from "@/src/lib/types/contracts";
import type { ModuleProps } from "./modules";
import { Section, Empty } from "./ui";

/**
 * Employment contracts for one employee — reused on both the self My Profile
 * page and the HR employee-details page (scoped by the employee's name).
 */
export function ContractsModule({ employee }: ModuleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: localeContracts } = useContracts();
  const [signed, setSigned] = useState<Record<string, Contract>>({});

  const source = useMemo(
    () =>
      (localeContracts ?? [])
        .filter((c) => c.employeeName === employee.fullName && !c.isArchived)
        .map((c) => signed[c.id] ?? c),
    [localeContracts, employee.fullName, signed],
  );

  const [activeTab, setActiveTab] = useState("all");
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [letterContract, setLetterContract] = useState<Contract | null>(null);

  const active = source.filter((c) => c.status === "active");
  const expiring = source.filter((c) => c.status === "expiring_soon");
  const unsigned = source.filter((c) => c.signatureStatus === "unsigned");
  const pending = source.filter((c) => c.signatureStatus !== "fully_signed");

  function handleView(contract: Contract) {
    setViewingContract(contract);
    setDetailOpen(true);
  }

  function handlePreview(contract: Contract) {
    setLetterContract(contract);
    setLetterModalOpen(true);
  }

  function handleSign(contract: Contract) {
    const params = new URLSearchParams({
      name: contract.title,
      fileType: "pdf",
      back: pathname,
    });
    router.push(`/sign?${params.toString()}`);
  }

  const tabContracts =
    activeTab === "active"
      ? active
      : activeTab === "expiring"
        ? expiring
        : source;

  return (
    <Section
      title="Contracts"
      description="Employment contracts and agreements."
    >
      {source.length === 0 ? (
        <Empty label="No contracts on file." />
      ) : (
        <>
          <ContractStats
            total={source.length}
            active={active.length}
            expiring={expiring.length}
            pending={pending.length}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <PageTabsList
              tabs={[
                { value: "all", label: `All (${source.length})` },
                {
                  value: "active",
                  label:
                    active.length > 0 ? `Active (${active.length})` : "Active",
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
              <UnsignedContractsTable
                contracts={unsigned}
                onSign={handleSign}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

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
    </Section>
  );
}

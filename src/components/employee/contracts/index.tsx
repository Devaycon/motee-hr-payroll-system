"use client";

import { useState } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { ContractDetailModal } from "@/src/components/hr/contracts/components/contract-detail-modal";
import { ContractLetterModal } from "@/src/components/hr/contracts/components/contract-letter-modal";
import {
  CONTRACTS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_STYLES,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_STYLES,
  SIGNATURE_STATUS_LABELS,
  SIGNATURE_STATUS_STYLES,
} from "@/src/data/contracts-demo";
import type { Contract } from "@/src/lib/types/contracts";

const MY_EMPLOYEE = "Adaeze Okonkwo";

function formatDate(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatSalary(amount?: number, currency?: string) {
  if (!amount) return "—";
  if (currency === "NGN") return `₦${amount.toLocaleString("en-NG")}`;
  return `${currency} ${amount.toLocaleString()}`;
}

export default function MyContractsPage() {
  const myContracts = CONTRACTS.filter(
    (c) => c.employeeName === MY_EMPLOYEE && !c.isArchived,
  );

  const [activeTab, setActiveTab] = useState("all");
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const [letterContract, setLetterContract] = useState<Contract | null>(null);

  const active = myContracts.filter((c) => c.status === "active");
  const expiring = myContracts.filter((c) => c.status === "expiring_soon");
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

  const tabContracts =
    activeTab === "active"
      ? active
      : activeTab === "expiring"
        ? expiring
        : myContracts;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
          <FileText className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">My Contracts</h1>
          <p className="text-sm text-muted-foreground">
            View and track your employment contracts and agreements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total Contracts",
            value: myContracts.length,
            sub: "All agreements",
            icon: FileText,
            iconClass: "text-slate-500 dark:text-slate-400",
            iconBg: "bg-slate-500/10",
          },
          {
            label: "Active",
            value: active.length,
            sub: "Currently in effect",
            icon: CheckCircle2,
            iconClass: "text-emerald-500",
            iconBg: "bg-emerald-500/10",
          },
          {
            label: "Expiring Soon",
            value: expiring.length,
            sub: "Needs attention",
            icon: AlertTriangle,
            iconClass: "text-orange-500",
            iconBg: "bg-orange-500/10",
          },
          {
            label: "Pending Signature",
            value: pending.length,
            sub: "Awaiting sign-off",
            icon: Clock,
            iconClass: "text-amber-500",
            iconBg: "bg-amber-500/10",
          },
        ].map((card) => (
          <Card key={card.label} className="border-border/60">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
                <div
                  className={`flex size-9 items-center justify-center rounded-lg ${card.iconBg}`}
                >
                  <card.icon className={`size-4 ${card.iconClass}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
          ]}
        />

        {(["all", "active", "expiring"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {tabContracts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="size-6 text-muted-foreground opacity-40" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No contracts found.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Contract</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Signature</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Salary / Rate</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tabContracts.map((contract, i) => (
                      <TableRow key={contract.id} className="group">
                        <TableCell className="text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{contract.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {contract.id}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${CONTRACT_TYPE_STYLES[contract.contractType]}`}
                          >
                            {CONTRACT_TYPE_LABELS[contract.contractType]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${CONTRACT_STATUS_STYLES[contract.status]}`}
                          >
                            {CONTRACT_STATUS_LABELS[contract.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${SIGNATURE_STATUS_STYLES[contract.signatureStatus]}`}
                          >
                            {SIGNATURE_STATUS_LABELS[contract.signatureStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(contract.startDate)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(contract.endDate)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatSalary(
                            contract.salary,
                            contract.contractCurrency,
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-0 group-hover:opacity-100"
                            onClick={() => handleView(contract)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        ))}
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
    </div>
  );
}

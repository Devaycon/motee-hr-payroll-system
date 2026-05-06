"use client";

import { FileText, Eye, PenLine } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_STYLES,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_STYLES,
  SIGNATURE_STATUS_LABELS,
  SIGNATURE_STATUS_STYLES,
} from "@/src/data/contracts-demo";
import type { Contract } from "@/src/lib/types/contracts";

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

interface ContractsTableProps {
  contracts: Contract[];
  onView: (contract: Contract) => void;
  onSign: (contract: Contract) => void;
}

export function ContractsTable({
  contracts,
  onView,
  onSign,
}: ContractsTableProps) {
  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <FileText className="size-6 text-muted-foreground opacity-40" />
        </div>
        <p className="text-sm text-muted-foreground">No contracts found.</p>
      </div>
    );
  }

  return (
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
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract, i) => (
            <TableRow key={contract.id} className="group">
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{contract.title}</p>
                  <p className="text-xs text-muted-foreground">{contract.id}</p>
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
                {formatSalary(contract.salary, contract.contractCurrency)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  {contract.signatureStatus === "unsigned" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => onSign(contract)}
                    >
                      <PenLine className="size-3" />
                      Sign
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onView(contract)}
                  >
                    <Eye className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

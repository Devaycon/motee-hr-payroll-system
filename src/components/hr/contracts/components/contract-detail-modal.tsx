"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  FileText,
  FolderInput,
  PenLine,
  Printer,
} from "lucide-react";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_STYLES,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_STYLES,
  SIGNATURE_STATUS_LABELS,
  SIGNATURE_STATUS_STYLES,
} from "../data";
import type { Contract } from "../types";

interface ContractDetailModalProps {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onEdit: (contract: Contract) => void;
  onSign: (contract: Contract) => void;
  onPreview?: (contract: Contract) => void;
  onMoveToDocuments?: (contract: Contract) => void;
  hrSignature?: string;
  readOnly?: boolean;
}

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

export function ContractDetailModal({
  open,
  contract,
  onClose,
  onEdit,
  onSign,
  onPreview,
  onMoveToDocuments,
  hrSignature,
  readOnly = false,
}: ContractDetailModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevContract, setPrevContract] = useState<Contract | null>(null);
  const [tab, setTab] = useState("details");

  if (open !== prevOpen || contract !== prevContract) {
    setPrevOpen(open);
    setPrevContract(contract);
    if (open) setTab("details");
  }

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs ${CONTRACT_TYPE_STYLES[contract.contractType]}`}
              >
                {CONTRACT_TYPE_LABELS[contract.contractType]}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${CONTRACT_STATUS_STYLES[contract.status]}`}
              >
                {CONTRACT_STATUS_LABELS[contract.status]}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${SIGNATURE_STATUS_STYLES[contract.signatureStatus]}`}
              >
                {SIGNATURE_STATUS_LABELS[contract.signatureStatus]}
              </Badge>
            </div>
            <DialogTitle className="text-base leading-snug">
              {contract.title}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">{contract.id}</p>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">
              Details
            </TabsTrigger>
            <TabsTrigger value="signatories" className="flex-1">
              Signatories
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex-1">
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <ScrollArea className="max-h-80 pr-1">
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Employee</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {contract.employeeInitials}
                      </div>
                      <p className="text-sm font-medium">
                        {contract.employeeName}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="mt-1 text-sm font-medium">
                      {contract.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(contract.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">End Date</p>
                    <p className="mt-1 text-sm font-medium">
                      {formatDate(contract.endDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Salary / Rate
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {formatSalary(contract.salary, contract.contractCurrency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Notice Period
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {contract.noticePeriodDays > 0
                        ? `${contract.noticePeriodDays} days`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Auto-Renew</p>
                    <p className="mt-1 text-sm font-medium">
                      {contract.autoRenew ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Currency</p>
                    <p className="mt-1 text-sm font-medium">
                      {contract.contractCurrency}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Created By</p>
                    <p className="mt-1 text-sm">{contract.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created On</p>
                    <p className="mt-1 text-sm">
                      {formatDate(contract.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Last Modified
                    </p>
                    <p className="mt-1 text-sm">
                      {formatDate(contract.lastModifiedAt)}
                    </p>
                  </div>
                </div>

                {contract.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-1.5 text-xs text-muted-foreground">
                        Description
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {contract.description}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="signatories">
            <ScrollArea className="max-h-80 pr-1">
              <div className="space-y-3 py-2">
                {contract.signatories.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No signatories defined.
                  </p>
                ) : (
                  contract.signatories.map((sig, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {sig.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{sig.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sig.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sig.signedAt ? (
                          <>
                            <CheckCircle2 className="size-4 text-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400">
                              Signed {formatDate(sig.signedAt)}
                            </span>
                          </>
                        ) : (
                          <>
                            <Clock className="size-4 text-amber-500" />
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              Pending
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notes">
            <ScrollArea className="max-h-80 pr-1">
              <div className="space-y-3 py-2">
                {contract.notes.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No notes on this contract.
                  </p>
                ) : (
                  [...contract.notes]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    )
                    .map((note) => (
                      <div
                        key={note.id}
                        className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
                      >
                        <p className="text-sm leading-relaxed">
                          {note.content}
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {note.createdBy} · {formatDate(note.createdAt)}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <div className="mr-auto flex items-center gap-2">
            {onPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPreview(contract)}
              >
                <FileText className="mr-1.5 size-4" />
                Preview Letter
              </Button>
            )}
            {!readOnly && onMoveToDocuments && (
              <Button
                variant="outline"
                size="sm"
                disabled={!!contract.movedToDocuments}
                onClick={() => onMoveToDocuments(contract)}
              >
                <FolderInput className="mr-1.5 size-4" />
                {contract.movedToDocuments ? "Moved to Docs" : "Move to Docs"}
              </Button>
            )}
          </div>
          {!readOnly && contract.signatureStatus !== "fully_signed" && (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onSign(contract);
              }}
            >
              <PenLine className="mr-2 size-4" />
              Record Signature
            </Button>
          )}
          {!readOnly && (
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                onEdit(contract);
              }}
            >
              Edit
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

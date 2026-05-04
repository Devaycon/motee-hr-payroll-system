"use client";

import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type SignatureCanvasType from "react-signature-canvas";
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
import { CheckCircle2, UserCheck, Users } from "lucide-react";
import {
  CONTRACT_STATUS_STYLES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_STYLES,
} from "../data";
import type { Contract, SignatureStatus } from "../types";

const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
}) as unknown as typeof SignatureCanvasType;

interface SignModalProps {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onConfirm: (contractId: string, newStatus: SignatureStatus) => void;
}

export function SignModal({
  open,
  contract,
  onClose,
  onConfirm,
}: SignModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevContract, setPrevContract] = useState<Contract | null>(null);
  const [selected, setSelected] = useState<SignatureStatus | null>(null);
  const sigPadRef = useRef<SignatureCanvasType>(null);

  if (open !== prevOpen || contract !== prevContract) {
    setPrevOpen(open);
    setPrevContract(contract);
    if (open) {
      setSelected(null);
    }
  }

  if (!contract) return null;

  const canEmployeeSign = contract.signatureStatus === "unsigned";
  const canFullySign =
    contract.signatureStatus === "unsigned" ||
    contract.signatureStatus === "employee_signed";

  function handleClear() {
    sigPadRef.current?.clear();
  }

  function handleConfirm() {
    if (!selected || !contract) return;
    onConfirm(contract.id, selected);
  }

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Signature</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
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
            </div>
            <p className="mt-2 text-sm font-medium leading-snug">
              {contract.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {contract.employeeName} · {contract.department}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Select signature action
            </p>

            <button
              type="button"
              disabled={!canEmployeeSign}
              onClick={() => canEmployeeSign && setSelected("employee_signed")}
              className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                selected === "employee_signed"
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-border/60 hover:bg-muted/40"
              } ${!canEmployeeSign ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-500/10 p-2">
                  <UserCheck className="size-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Mark Employee Signed</p>
                  <p className="text-xs text-muted-foreground">
                    Employee has signed the contract
                  </p>
                </div>
                {selected === "employee_signed" && (
                  <CheckCircle2 className="ml-auto size-4 text-amber-500" />
                )}
              </div>
            </button>

            <button
              type="button"
              disabled={!canFullySign}
              onClick={() => canFullySign && setSelected("fully_signed")}
              className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                selected === "fully_signed"
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-border/60 hover:bg-muted/40"
              } ${!canFullySign ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2">
                  <Users className="size-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Mark Fully Signed (Countersigned)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Both parties have signed the contract
                  </p>
                </div>
                {selected === "fully_signed" && (
                  <CheckCircle2 className="ml-auto size-4 text-emerald-500" />
                )}
              </div>
            </button>
          </div>

          {selected && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Draw your signature</p>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="overflow-hidden rounded-lg border border-border/60 bg-white">
                  <SignatureCanvas
                    ref={sigPadRef}
                    penColor="#111"
                    canvasProps={{
                      width: 380,
                      height: 120,
                      className: "w-full",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Signature will be recorded as of today, {today}.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!selected} onClick={handleConfirm}>
            Confirm Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

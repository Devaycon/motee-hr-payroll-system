"use client";

import React, { useEffect, useRef, useState } from "react";
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
import {
  CONTRACT_STATUS_STYLES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACT_TYPE_STYLES,
} from "@/src/components/hr/contracts/data";
import type { Contract } from "@/src/lib/types/contracts";

const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
}) as unknown as typeof SignatureCanvasType;

interface EmployeeSignModalProps {
  open: boolean;
  contract: Contract | null;
  onClose: () => void;
  onConfirm: (contractId: string) => void;
}

export function EmployeeSignModal({
  open,
  contract,
  onClose,
  onConfirm,
}: EmployeeSignModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [prevContract, setPrevContract] = useState<Contract | null>(null);
  const sigPadRef = useRef<SignatureCanvasType>(null);

  if (open !== prevOpen || contract !== prevContract) {
    setPrevOpen(open);
    setPrevContract(contract);
  }

  useEffect(() => {
    if (open) sigPadRef.current?.clear();
  }, [open]);

  if (!contract) return null;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  function handleClear() {
    sigPadRef.current?.clear();
  }

  function handleConfirm() {
    if (!contract) return;
    onConfirm(contract.id);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sign Contract</DialogTitle>
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
              By signing, you confirm your agreement to the terms of this
              contract. Signature recorded as of today, {today}.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Sign Contract</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

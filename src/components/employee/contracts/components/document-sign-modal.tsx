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
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_CATEGORY_STYLES,
} from "@/src/data/documents-demo";
import type { DocumentCategory } from "@/src/lib/types/documents";

const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
}) as unknown as typeof SignatureCanvasType;

export interface PendingDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  sentDate: string;
  signed: boolean;
  signedDate?: string;
}

interface DocumentSignModalProps {
  open: boolean;
  document: PendingDocument | null;
  onClose: () => void;
  onConfirm: (documentId: string) => void;
}

export function DocumentSignModal({
  open,
  document,
  onClose,
  onConfirm,
}: DocumentSignModalProps) {
  const sigPadRef = useRef<SignatureCanvasType>(null);
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) setPrevOpen(open);

  useEffect(() => {
    if (open) sigPadRef.current?.clear();
  }, [open]);

  if (!document) return null;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  function handleClear() {
    sigPadRef.current?.clear();
  }

  function handleConfirm() {
    onConfirm(document!.id);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sign Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
            <Badge
              variant="outline"
              className={`text-xs ${DOCUMENT_CATEGORY_STYLES[document.category]}`}
            >
              {DOCUMENT_CATEGORY_LABELS[document.category]}
            </Badge>
            <p className="mt-2 text-sm font-medium leading-snug">
              {document.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sent on{" "}
              {new Date(document.sentDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
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
              By signing, you acknowledge and agree to this document. Signature
              recorded as of today, {today}.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Sign Document</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

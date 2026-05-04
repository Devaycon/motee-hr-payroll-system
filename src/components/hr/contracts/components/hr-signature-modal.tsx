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
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
}) as unknown as typeof SignatureCanvasType;

interface HRSignatureModalProps {
  open: boolean;
  currentSignature?: string;
  onClose: () => void;
  onSave: (signature: string) => void;
}

export function HRSignatureModal({
  open,
  currentSignature,
  onClose,
  onSave,
}: HRSignatureModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const sigPadRef = useRef<SignatureCanvasType>(null);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setMode("draw");
      setTypedName(currentSignature ?? "");
    }
  }

  function handleClear() {
    sigPadRef.current?.clear();
  }

  function handleSave() {
    if (mode === "draw") {
      if (!sigPadRef.current || sigPadRef.current.isEmpty()) return;
      onSave(sigPadRef.current.toDataURL("image/png"));
    } else {
      if (!typedName.trim()) return;
      onSave(typedName.trim());
    }
  }

  const canSave = mode === "type" ? !!typedName.trim() : true;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>HR Signature</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            This signature will appear on all generated contract letters.
          </p>

          <div className="flex rounded-lg border border-border/60 p-1">
            <button
              type="button"
              onClick={() => setMode("draw")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "draw"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Draw
            </button>
            <button
              type="button"
              onClick={() => setMode("type")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "type"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Type
            </button>
          </div>

          {mode === "draw" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Draw your signature below
                </Label>
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
                    width: 400,
                    height: 140,
                    className: "w-full",
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use your mouse or trackpad to draw your signature.
              </p>
            </div>
          )}

          {mode === "type" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Signatory Name</Label>
                <Input
                  placeholder="e.g. Chioma Adesanya"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                />
              </div>

              {typedName.trim() && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Preview
                  </Label>
                  <div className="rounded-lg border border-border/60 bg-muted/20 px-5 py-4">
                    <p className="font-serif text-2xl italic text-foreground">
                      {typedName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={handleSave}>
            Save Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Badge } from "@/src/components/ui/badge";
import { SignaturePad } from "@/src/components/shared/signature-pad";
import type {
  ApprovalAttachment,
  ApprovalSignaturePlacement,
} from "@/src/lib/types/approvals";

export interface ApproveSignaturePayload {
  dataUrl: string;
  placement: ApprovalSignaturePlacement | null;
  note?: string;
}

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  attachments: ApprovalAttachment[];
  placeOnDocument: boolean;
  /** Confirmed callback. */
  onConfirm: (payload: ApproveSignaturePayload) => void;
}

function isImage(att: ApprovalAttachment): boolean {
  return att.mimeType.startsWith("image/");
}

export function SignatureDialog({
  open,
  onOpenChange,
  attachments,
  placeOnDocument,
  onConfirm,
}: SignatureDialogProps) {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(
    null,
  );
  const [placement, setPlacement] =
    useState<ApprovalSignaturePlacement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const imageAttachments = attachments.filter(isImage);
  const canPlace = placeOnDocument && imageAttachments.length > 0;

  useEffect(() => {
    if (!open) {
      setSignatureDataUrl(null);
      setNote("");
      setPlacement(null);
      setSelectedAttachmentId(null);
      return;
    }
    if (canPlace && !selectedAttachmentId) {
      setSelectedAttachmentId(imageAttachments[0].id);
    }
  }, [open, canPlace, imageAttachments, selectedAttachmentId]);

  function handleImageClick(e: React.MouseEvent<HTMLImageElement>) {
    if (!signatureDataUrl || !selectedAttachmentId) return;
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPlacement({
      attachmentId: selectedAttachmentId,
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      width: 0.18,
    });
  }

  function handleConfirm() {
    if (!signatureDataUrl) {
      toast.error("Please draw your signature first.");
      return;
    }
    if (canPlace && !placement) {
      toast.error("Click on the document to place your signature.");
      return;
    }
    onConfirm({
      dataUrl: signatureDataUrl,
      placement,
      note: note.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 flex flex-col max-h-[92vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border pr-14">
          <DialogTitle>Sign to approve</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Draw your signature to confirm this approval
            {canPlace && " — then click on the document to place it"}.
          </p>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              1. Your signature
            </p>
            <SignaturePad onChange={setSignatureDataUrl} />
          </div>

          {canPlace && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  2. Click on the document to place it
                </p>
                {imageAttachments.length > 1 && (
                  <div className="flex items-center gap-1">
                    {imageAttachments.map((a) => (
                      <Button
                        key={a.id}
                        size="sm"
                        variant={
                          selectedAttachmentId === a.id ? "default" : "outline"
                        }
                        className="h-7 text-[11px]"
                        onClick={() => {
                          setSelectedAttachmentId(a.id);
                          setPlacement(null);
                        }}
                      >
                        {a.name.slice(0, 20)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              {selectedAttachmentId && (
                <div className="relative rounded-md overflow-hidden border border-border">
                  <img
                    ref={imgRef}
                    src={
                      imageAttachments.find((a) => a.id === selectedAttachmentId)
                        ?.dataUrl
                    }
                    alt="Document to sign"
                    className="block w-full select-none cursor-crosshair"
                    draggable={false}
                    onClick={handleImageClick}
                  />
                  {placement &&
                    placement.attachmentId === selectedAttachmentId &&
                    signatureDataUrl && (
                      <img
                        src={signatureDataUrl}
                        alt="Signature"
                        className="absolute pointer-events-none"
                        style={{
                          left: `${placement.x * 100}%`,
                          top: `${placement.y * 100}%`,
                          width: `${placement.width * 100}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      />
                    )}
                </div>
              )}
              {placement ? (
                <Badge
                  variant="outline"
                  className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                >
                  Signature placed
                </Badge>
              ) : signatureDataUrl ? (
                <Badge
                  variant="outline"
                  className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10"
                >
                  Click on the document above to place
                </Badge>
              ) : null}
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Note (optional)
            </p>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for the next person / submitter"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Approve with signature</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

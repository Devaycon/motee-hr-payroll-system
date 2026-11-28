"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";

export interface PromptRequest {
  title: string;
  description?: string;
  /** When set, the dialog asks for a value; otherwise it only confirms. */
  inputLabel?: string;
  initialValue?: string;
  placeholder?: string;
  multiline?: boolean;
  /** The value may be left empty. */
  optional?: boolean;
  confirmLabel?: string;
  destructive?: boolean;
  /** Resolves true when done; the dialog stays open on false. */
  onConfirm: (value: string) => Promise<boolean> | boolean;
}

/**
 * One small dialog for "rename this", "why?" and "are you sure?" — so a row
 * action that needs a word from the user doesn't need its own modal.
 * Render it once and set `request` to open it.
 */
export function PromptDialog({
  request,
  onClose,
}: {
  request: PromptRequest | null;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState<PromptRequest | null>(null);
  if (request !== seen) {
    setSeen(request);
    setValue(request?.initialValue ?? "");
  }

  const asks = !!request?.inputLabel;
  const canConfirm = !busy && (!asks || request?.optional || value.trim().length > 0);

  async function confirm() {
    if (!request || !canConfirm) return;
    setBusy(true);
    const ok = await request.onConfirm(value.trim());
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <Dialog open={!!request} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{request?.title}</DialogTitle>
          {request?.description && <DialogDescription>{request.description}</DialogDescription>}
        </DialogHeader>
        {asks && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium">{request?.inputLabel}</p>
            {request?.multiline ? (
              <Textarea
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={request?.placeholder}
                className="min-h-20 resize-none text-sm"
              />
            ) : (
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={request?.placeholder}
                onKeyDown={(e) => e.key === "Enter" && void confirm()}
              />
            )}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={request?.destructive ? "destructive" : "default"}
            disabled={!canConfirm}
            onClick={() => void confirm()}
          >
            {busy ? "Working…" : (request?.confirmLabel ?? "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { MessageSquareHeart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { Colleague } from "../hooks";

/** What the dialog is answering: a colleague's request, or nothing (unprompted). */
export interface GiveFeedbackTarget {
  requestId?: string;
  aboutEmployeeId?: string;
  aboutName?: string;
  context?: string;
}

interface GiveFeedbackModalProps {
  target: GiveFeedbackTarget | null;
  colleagues: Colleague[];
  onClose: () => void;
  onSend: (aboutEmployeeId: string, message: string, requestId?: string) => Promise<boolean> | void;
}

/**
 * Give a colleague feedback — answering their request, or unprompted.
 * Signed in it goes to POST /performance/feedback.
 */
export function GiveFeedbackModal({ target, colleagues, onClose, onSend }: GiveFeedbackModalProps) {
  const [aboutId, setAboutId] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [seen, setSeen] = useState<GiveFeedbackTarget | null>(null);
  if (target !== seen) {
    setSeen(target);
    setAboutId(target?.aboutEmployeeId ?? "");
    setMessage("");
  }

  const fixed = !!target?.aboutEmployeeId;
  const canSend = !!aboutId && message.trim().length >= 3 && !sending;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    const ok = await onSend(aboutId, message.trim(), target?.requestId);
    setSending(false);
    if (ok !== false) onClose();
  }

  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquareHeart className="size-4 text-[#7F77DD]" />
            {fixed ? `Feedback for ${target?.aboutName}` : "Give Feedback"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          {target?.context && (
            <p className="rounded-lg border border-border bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
              They asked: &ldquo;{target.context}&rdquo;
            </p>
          )}
          {!fixed && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">Colleague</p>
              <Select value={aboutId} onValueChange={setAboutId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Choose a colleague" />
                </SelectTrigger>
                <SelectContent>
                  {colleagues.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium">Your feedback</p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What went well, and what could be even better?"
              className="min-h-24 resize-none text-xs"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="h-8 text-xs" disabled={!canSend} onClick={() => void handleSend()}>
            {sending ? "Sending…" : "Send Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

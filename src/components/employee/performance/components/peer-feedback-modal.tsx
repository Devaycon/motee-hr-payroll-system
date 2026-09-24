"use client";

import { useState } from "react";
import { MessageSquare, Send, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

interface PeerFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  colleagues: Colleague[];
  onSend: (fromEmployeeId: string, context: string) => void;
}

export function PeerFeedbackModal({
  open,
  onClose,
  colleagues,
  onSend,
}: PeerFeedbackModalProps) {
  const [peerId, setPeerId] = useState("");
  const [peerContext, setPeerContext] = useState("");
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!peerId) return;
    onSend(peerId, peerContext);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setPeerId("");
      setPeerContext("");
      onClose();
    }, 1500);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#4361ee]/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-[#4361ee]" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              Request Peer Feedback
            </DialogTitle>
          </div>
        </DialogHeader>
        {sent ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-[#1D9E75] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#1D9E75]">
              Feedback request sent
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">Select colleague</p>
              <Select value={peerId} onValueChange={setPeerId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Choose a colleague" />
                </SelectTrigger>
                <SelectContent>
                  {colleagues.length === 0 && (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">
                      No colleagues found.
                    </p>
                  )}
                  {colleagues.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <span className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#4361ee]/20 text-[#4361ee] text-[9px] font-bold flex items-center justify-center">
                          {p.initials}
                        </span>
                        {p.name} · {p.title}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">
                Context for reviewer{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </p>
              <Textarea
                value={peerContext}
                onChange={(e) => setPeerContext(e.target.value)}
                placeholder="e.g. We worked together on the API Gateway project — your feedback on my technical communication would be most helpful."
                className="text-xs min-h-16 resize-none"
              />
            </div>
          </div>
        )}
        {!sent && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-[#4361ee] hover:bg-[#3451d1] text-white gap-1.5"
              onClick={handleSend}
              disabled={!peerId}
            >
              <Send className="w-3.5 h-3.5" /> Send Request
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}


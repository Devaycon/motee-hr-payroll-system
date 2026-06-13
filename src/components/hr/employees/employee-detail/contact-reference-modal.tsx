"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
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
import { Textarea } from "@/src/components/ui/textarea";
import { openMailto } from "@/src/components/hr/recruitment/components/mailto";

/**
 * Compose a reference-check email to a referee/company. Mirrors the onboarding
 * "Send Invite" modal; sending opens the user's mail client (mailto).
 */
export function ContactReferenceModal({
  open,
  onClose,
  employeeName,
  referenceName,
}: {
  open: boolean;
  onClose: () => void;
  employeeName: string;
  referenceName?: string;
}) {
  const defaultSubject = `Reference request for ${employeeName}`;
  const defaultBody =
    `Hello${referenceName ? ` ${referenceName}` : ""},\n\n` +
    `${employeeName} has listed you as a reference. We would be grateful if you ` +
    `could confirm your reference for them at your earliest convenience.\n\n` +
    `Kind regards,\nHR Team`;

  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [prevOpen, setPrevOpen] = useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setEmail("");
      setSubject(defaultSubject);
      setBody(defaultBody);
    }
  }

  function handleSend() {
    if (!/.+@.+\..+/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    openMailto({ to: [email], subject, body });
    toast.success("Reference email drafted in your mail client");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/10 shrink-0">
              <Mail className="w-4 h-4 text-violet-500" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Contact Reference
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send a reference-check request to the referee or company.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">
              Referee / Company Email
            </Label>
            <Input
              type="email"
              placeholder="referee@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Title</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Message</Label>
            <Textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSend}>
            <Mail className="w-3.5 h-3.5" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

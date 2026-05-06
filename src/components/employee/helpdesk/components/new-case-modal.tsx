"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  TICKET_CATEGORY_CONFIG,
  TICKET_CATEGORY_OPTIONS,
  TICKET_PRIORITY_CONFIG,
  TICKET_PRIORITY_OPTIONS,
  CATEGORY_ICON_MAP,
  MY_NAME,
  MY_INITIALS,
  MY_DEPT,
} from "./data";
import type { HelpDeskTicket, TicketCategory, TicketPriority } from "./data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketCount: number;
  onCreated: (ticket: HelpDeskTicket) => void;
}

export function NewCaseModal({
  open,
  onOpenChange,
  ticketCount,
  onCreated,
}: Props) {
  const [newSubject, setNewSubject] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<TicketCategory>("leave");
  const [newPriority, setNewPriority] = useState<TicketPriority>("medium");

  function submit() {
    if (!newSubject.trim() || !newDesc.trim()) return;
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(4, "0")}`;
    const newTicket: HelpDeskTicket = {
      id: `t-new-${Date.now()}`,
      ticketNumber,
      subject: newSubject,
      description: newDesc,
      category: newCategory,
      priority: newPriority,
      status: "open",
      submitterName: MY_NAME,
      submitterInitials: MY_INITIALS,
      submitterDept: MY_DEPT,
      messages: [
        {
          id: `m-new-${Date.now()}`,
          authorName: MY_NAME,
          authorInitials: MY_INITIALS,
          authorDept: MY_DEPT,
          isHR: false,
          content: newDesc,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOverdue: false,
    };
    onCreated(newTicket);
    onOpenChange(false);
    setNewSubject("");
    setNewDesc("");
    setNewCategory("leave");
    setNewPriority("medium");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit a New Case</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Subject
            </label>
            <Input
              placeholder="Brief description of your issue"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Category
              </label>
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as TicketCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORY_OPTIONS.map((c) => {
                    const I = CATEGORY_ICON_MAP[c];
                    return (
                      <SelectItem key={c} value={c}>
                        <div className="flex items-center gap-1.5">
                          <I
                            className={`h-3.5 w-3.5 ${TICKET_CATEGORY_CONFIG[c].color}`}
                          />
                          {TICKET_CATEGORY_CONFIG[c].label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Priority
              </label>
              <Select
                value={newPriority}
                onValueChange={(v) => setNewPriority(v as TicketPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TICKET_PRIORITY_CONFIG[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">
              Description
            </label>
            <Textarea
              placeholder="Describe your issue in detail…"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!newSubject.trim() || !newDesc.trim()}
              className="bg-[#4361ee] hover:bg-[#3451d1] text-white"
            >
              Submit Case
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

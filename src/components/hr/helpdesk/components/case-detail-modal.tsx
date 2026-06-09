"use client";
import { formatDate } from "@/src/lib/utils/format-date";

import { useState } from "react";
import { AlertTriangle, Check, Lock, Send, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Separator } from "@/src/components/ui/separator";
import {
  TICKET_STATUS_CONFIG,
  TICKET_CATEGORY_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY_OPTIONS,
  HR_AGENTS,
} from "../data";
import type { HelpDeskTicket, TicketStatus, TicketPriority } from "../types";

const STATUS_STEPS: TicketStatus[] = [
  "open",
  "in_progress",
  "pending_response",
  "resolved",
  "closed",
];

interface CaseDetailModalProps {
  ticket: HelpDeskTicket | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: TicketStatus) => void;
  onUpdatePriority: (id: string, priority: TicketPriority) => void;
  onAssign: (id: string, agentName: string, agentInitials: string) => void;
  onReply: (id: string, content: string, isInternalNote: boolean) => void;
}

export function CaseDetailModal({
  ticket,
  open,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onAssign,
  onReply,
}: CaseDetailModalProps) {
  const [prevTicketId, setPrevTicketId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);

  if (ticket && ticket.id !== prevTicketId) {
    setPrevTicketId(ticket.id);
    setReplyContent("");
    setIsInternalNote(false);
  }

  if (!ticket) return null;

  const catConfig = TICKET_CATEGORY_CONFIG[ticket.category];
  const statusConfig = TICKET_STATUS_CONFIG[ticket.status];
  const priorityConfig = TICKET_PRIORITY_CONFIG[ticket.priority];
  const currentStep = STATUS_STEPS.indexOf(ticket.status);
  const publicMessages = ticket.messages.filter((m) => !m.isInternalNote);
  const internalNotes = ticket.messages.filter((m) => m.isInternalNote);

  function handleStatusChange(status: TicketStatus) {
    onUpdateStatus(ticket!.id, status);
    toast.success(`Status updated to ${TICKET_STATUS_CONFIG[status].label}`);
  }

  function handlePriorityChange(priority: TicketPriority) {
    onUpdatePriority(ticket!.id, priority);
    toast.success(
      `Priority updated to ${TICKET_PRIORITY_CONFIG[priority].label}`,
    );
  }

  function handleAgentChange(agentName: string) {
    const agent = HR_AGENTS.find((a) => a.name === agentName);
    if (!agent) return;
    onAssign(ticket!.id, agent.name, agent.initials);
    toast.success(`Case assigned to ${agent.name}`);
  }

  function handleSendReply() {
    if (!replyContent.trim()) return;
    onReply(ticket!.id, replyContent.trim(), isInternalNote);
    toast.success(isInternalNote ? "Internal note added" : "Reply sent");
    setReplyContent("");
    setIsInternalNote(false);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 border-b border-border pr-14">
          <DialogHeader>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-medium text-muted-foreground">
                  {ticket.id}
                </span>
                {ticket.isOverdue && (
                  <Badge
                    variant="outline"
                    className="text-xs text-red-600 bg-red-500/10 border-red-500/30 gap-1"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    SLA Overdue
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={`text-xs ${catConfig.color} ${catConfig.bg} ${catConfig.border}`}
                >
                  {catConfig.icon} {catConfig.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
                >
                  {statusConfig.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${priorityConfig.color} ${priorityConfig.bg} ${priorityConfig.border}`}
                >
                  {priorityConfig.label}
                </Badge>
              </div>
              <DialogTitle className="text-base font-semibold leading-snug">
                {ticket.subject}
              </DialogTitle>
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          <div className="relative flex items-center">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border" />
            <div className="relative flex items-center justify-between w-full">
              {STATUS_STEPS.map((step, i) => {
                const stepConfig = TICKET_STATUS_CONFIG[step];
                const isDone = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <div
                    key={step}
                    className="flex flex-col items-center gap-1.5 z-10"
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isDone
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground"
                      } ${isCurrent ? "ring-2 ring-primary/30 ring-offset-1 ring-offset-background" : ""}`}
                    >
                      {isDone && !isCurrent ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <span className="text-[9px] font-bold">{i + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-medium whitespace-nowrap ${
                        isCurrent
                          ? "text-primary"
                          : isDone
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {stepConfig.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select
                value={ticket.status}
                onValueChange={(v) => handleStatusChange(v as TicketStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TICKET_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TICKET_STATUS_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Priority</Label>
              <Select
                value={ticket.priority}
                onValueChange={(v) => handlePriorityChange(v as TicketPriority)}
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
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Assigned To</Label>
              <Select
                value={ticket.assignedTo ?? ""}
                onValueChange={handleAgentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {HR_AGENTS.map((a) => (
                    <SelectItem key={a.name} value={a.name}>
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-3 h-3" />
                        {a.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Opened {formatDate(ticket.createdAt)}</span>
            <span>SLA due {ticket.slaDueAt}</span>
            {ticket.firstResponseAt && (
              <span>First response {ticket.firstResponseAt}</span>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Conversation ({publicMessages.length})
            </p>
            <div className="space-y-3">
              {publicMessages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${m.isHR ? "flex-row-reverse" : ""}`}
                >
                  <PersonAvatar
                    name={m.authorName}
                    initials={m.authorInitials}
                    className="w-7 h-7 shrink-0"
                    fallbackClassName={`text-xs ${
                      m.isHR
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  />
                  <div
                    className={`flex-1 space-y-1 ${m.isHR ? "items-end" : "items-start"} flex flex-col`}
                  >
                    <div
                      className={`flex items-center gap-2 ${m.isHR ? "flex-row-reverse" : ""}`}
                    >
                      <span className="text-xs font-medium text-foreground">
                        {m.authorName}
                      </span>
                      {m.isHR && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-primary bg-primary/10 border-primary/30 py-0 px-1"
                        >
                          HR
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(m.createdAt)}
                      </span>
                    </div>
                    <div
                      className={`rounded-xl px-3 py-2 text-xs max-w-sm ${
                        m.isHR
                          ? "bg-primary/10 text-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {internalNotes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-amber-500" />
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    Internal Notes ({internalNotes.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {internalNotes.map((n) => (
                    <div
                      key={n.id}
                      className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {n.authorName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {n.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />
        </div>

        <div className="px-6 py-4 border-t border-border flex-col flex gap-3">
          <div className="flex gap-2 shrink-0">
            <Label className="text-xs text-muted-foreground">
              Internal Note
            </Label>
            <Switch
              checked={isInternalNote}
              onCheckedChange={setIsInternalNote}
            />
          </div>
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={
              isInternalNote
                ? "Add an internal note visible only to HR staff..."
                : "Type your reply to the employee..."
            }
            rows={2}
            className={`flex-1 resize-none text-sm ${
              isInternalNote ? "border-amber-500/40 bg-amber-500/5" : ""
            }`}
          />
          <Button
            size="sm"
            onClick={handleSendReply}
            disabled={!replyContent.trim()}
            variant={isInternalNote ? "outline" : "default"}
            className="self-end"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            {isInternalNote ? "Add Note" : "Send Reply"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

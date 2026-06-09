"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Send, RotateCcw } from "lucide-react";
import {
  TICKET_CATEGORY_CONFIG,
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  CATEGORY_ICON_MAP,
  MY_NAME,
  MY_INITIALS,
  MY_DEPT,
  timeAgo,
  formatDate,
} from "./data";
import type { HelpDeskTicket, TicketMessage } from "./data";

interface Props {
  ticket: HelpDeskTicket | null;
  onClose: () => void;
  onReply: (ticketId: string, message: TicketMessage) => void;
  onReopen: (ticketId: string) => void;
}

export function TicketDetailModal({
  ticket,
  onClose,
  onReply,
  onReopen,
}: Props) {
  const [replyText, setReplyText] = useState("");

  function submitReply() {
    if (!ticket || !replyText.trim()) return;
    const newMsg: TicketMessage = {
      id: `m-reply-${Date.now()}`,
      authorName: MY_NAME,
      authorInitials: MY_INITIALS,
      authorDept: MY_DEPT,
      isHR: false,
      content: replyText.trim(),
      createdAt: new Date().toISOString(),
    };
    onReply(ticket.id, newMsg);
    setReplyText("");
  }

  function handleClose() {
    setReplyText("");
    onClose();
  }

  if (!ticket) return null;

  const catCfg = TICKET_CATEGORY_CONFIG[ticket.category];
  const statusCfg = TICKET_STATUS_CONFIG[ticket.status];
  const priorityCfg = TICKET_PRIORITY_CONFIG[ticket.priority];
  const isClosed = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <Dialog open={!!ticket} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">
            {ticket.subject}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">
            {ticket.ticketNumber}
          </span>
          <Badge
            variant="outline"
            className={`text-xs ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}
          >
            {statusCfg.label}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${priorityCfg.color} ${priorityCfg.bg} ${priorityCfg.border}`}
          >
            {priorityCfg.label}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs ${catCfg.color} ${catCfg.bg} ${catCfg.border} inline-flex items-center gap-1`}
          >
            {(() => {
              const I = CATEGORY_ICON_MAP[ticket.category];
              return <I className="h-3 w-3" />;
            })()}
            {catCfg.label}
          </Badge>
          {ticket.assignedTo && (
            <span className="text-xs text-muted-foreground ml-auto">
              Assigned to {ticket.assignedTo}
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground flex gap-4">
          <span>Opened: {formatDate(ticket.createdAt)}</span>
          {ticket.slaDueAt && (
            <span
              className={ticket.isOverdue ? "text-red-500 font-medium" : ""}
            >
              SLA Due: {formatDate(ticket.slaDueAt)}
              {ticket.isOverdue && " · Overdue"}
            </span>
          )}
          {ticket.resolvedAt && (
            <span className="text-emerald-600 dark:text-emerald-400">
              Resolved: {formatDate(ticket.resolvedAt)}
            </span>
          )}
        </div>

        <Separator />

        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {ticket.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.isHR ? "" : "flex-row-reverse"}`}
            >
              <PersonAvatar
                name={msg.authorName}
                initials={msg.authorInitials}
                className="h-7 w-7 shrink-0"
                fallbackClassName={`text-xs font-semibold ${
                  msg.isHR
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                    : "bg-[#4361ee]/10 text-[#4361ee]"
                }`}
              />
              <div
                className={`max-w-[75%] ${msg.isHR ? "" : "items-end"} flex flex-col gap-0.5`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {msg.authorName}
                  </span>
                  {msg.isHR && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700"
                    >
                      HR
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo(msg.createdAt)}
                  </span>
                </div>
                <div
                  className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    msg.isHR
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-foreground"
                      : "bg-[#4361ee]/10 border border-[#4361ee]/20 text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {isClosed ? (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-muted-foreground">
              This case is {ticket.status}. Reopen to send a reply.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReopen(ticket.id)}
              className="gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reopen Case
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 pt-1">
            <Textarea
              placeholder="Write a reply…"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              className="flex-1 resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitReply();
                }
              }}
            />
            <Button
              size="sm"
              onClick={submitReply}
              disabled={!replyText.trim()}
              className="bg-[#4361ee] hover:bg-[#3451d1] text-white self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

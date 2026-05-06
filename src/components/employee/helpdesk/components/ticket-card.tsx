"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { AlertTriangle, ChevronRight, MessageCircle } from "lucide-react";
import {
  TICKET_CATEGORY_CONFIG,
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  CATEGORY_ICON_MAP,
  timeAgo,
} from "./data";
import type { HelpDeskTicket } from "./data";

interface Props {
  ticket: HelpDeskTicket;
  onClick: (ticket: HelpDeskTicket) => void;
}

export function TicketCard({ ticket, onClick }: Props) {
  const catCfg = TICKET_CATEGORY_CONFIG[ticket.category];
  const statusCfg = TICKET_STATUS_CONFIG[ticket.status];
  const priorityCfg = TICKET_PRIORITY_CONFIG[ticket.priority];

  return (
    <Card
      className="cursor-pointer hover:border-[#4361ee]/40 transition-colors"
      onClick={() => onClick(ticket)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${catCfg.bg} ${catCfg.border} border shrink-0`}
          >
            {(() => {
              const I = CATEGORY_ICON_MAP[ticket.category];
              return <I className={`h-4 w-4 ${catCfg.color}`} />;
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm text-foreground">
                {ticket.subject}
              </span>
              {ticket.isOverdue && (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground font-mono ml-auto">
                {ticket.ticketNumber}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {ticket.description}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
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
                className={`text-xs ${catCfg.color} ${catCfg.bg} ${catCfg.border}`}
              >
                {catCfg.label}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {ticket.messages.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {timeAgo(ticket.updatedAt)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

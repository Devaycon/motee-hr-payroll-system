"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { TICKET_STATUS_CONFIG, TICKET_STATUS_OPTIONS } from "./data";
import type { HelpDeskTicket, TicketStatus } from "./data";
import { TicketCard } from "./ticket-card";

interface Props {
  tickets: HelpDeskTicket[];
  statusFilter: TicketStatus | "all";
  onStatusFilter: (v: TicketStatus | "all") => void;
  onSelectTicket: (ticket: HelpDeskTicket) => void;
}

export function TicketList({
  tickets,
  statusFilter,
  onStatusFilter,
  onSelectTicket,
}: Props) {
  const filtered = tickets.filter(
    (t) => statusFilter === "all" || t.status === statusFilter,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => onStatusFilter(v as TicketStatus | "all")}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {TICKET_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {TICKET_STATUS_CONFIG[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {filtered.length} case{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No cases found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={onSelectTicket}
            />
          ))}
        </div>
      )}
    </div>
  );
}

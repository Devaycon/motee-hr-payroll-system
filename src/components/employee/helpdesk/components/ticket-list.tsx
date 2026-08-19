"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Button } from "@/src/components/ui/button";
import { TICKET_STATUS_CONFIG, TICKET_STATUS_OPTIONS } from "./data";
import type { HelpDeskTicket, TicketStatus } from "./data";
import { TicketCard } from "./ticket-card";
import {
  matchesHelpdeskCardFilter,
  HELPDESK_CARD_FILTER_LABELS,
  type HelpdeskCardFilter,
} from "./stat-cards";

interface Props {
  tickets: HelpDeskTicket[];
  statusFilter: TicketStatus | "all";
  onStatusFilter: (v: TicketStatus | "all") => void;
  /** Drill-down set by the KPI cards; composes with the status dropdown. */
  cardFilter: HelpdeskCardFilter;
  onClearCardFilter: () => void;
  onSelectTicket: (ticket: HelpDeskTicket) => void;
}

export function TicketList({
  tickets,
  statusFilter,
  onStatusFilter,
  cardFilter,
  onClearCardFilter,
  onSelectTicket,
}: Props) {
  const filtered = tickets.filter(
    (t) =>
      (statusFilter === "all" || t.status === statusFilter) &&
      matchesHelpdeskCardFilter(t, cardFilter),
  );

  return (
    <div className="space-y-4">
      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {HELPDESK_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">({filtered.length})</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={onClearCardFilter}
          >
            ← All cases
          </Button>
        </div>
      )}

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

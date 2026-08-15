"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { Plus } from "lucide-react";
import { TICKETS as SEED_TICKETS, computeHelpdeskStats, MY_INITIALS as DEMO_INITIALS } from "./components/data";
import { useHelpdeskTickets } from "@/src/components/hr/helpdesk/hooks";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type {
  HelpDeskTicket,
  TicketStatus,
  TicketMessage,
} from "./components/data";
import {
  HelpdeskStatCards,
  type HelpdeskCardFilter,
} from "./components/stat-cards";
import { FaqPanel } from "./components/faq-panel";
import { TicketList } from "./components/ticket-list";
import { TicketDetailModal } from "./components/ticket-detail-modal";
import { NewCaseModal } from "./components/new-case-modal";

export function EmployeeHelpdeskPage() {
  const { data: localeTickets } = useHelpdeskTickets();
  const myInitials =
    useAppSelector((s) => s.auth.user?.initials) ?? DEMO_INITIALS;
  const [activeTab, setActiveTab] = useState<"faq" | "my-cases">("faq");
  const [tickets, setTickets] = useState<HelpDeskTicket[]>(
    (localeTickets && localeTickets.length
      ? localeTickets
      : SEED_TICKETS) as unknown as HelpDeskTicket[],
  );
  const [selectedTicket, setSelectedTicket] = useState<HelpDeskTicket | null>(
    null,
  );
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  /** Drill-down set by the KPI cards; "all" shows every case. */
  const [cardFilter, setCardFilter] = useState<HelpdeskCardFilter>("all");

  const myTickets = tickets.filter((t) => t.submitterInitials === myInitials);
  const stats = computeHelpdeskStats(myTickets);

  function handleCreated(ticket: HelpDeskTicket) {
    setTickets((prev) => [ticket, ...prev]);
    setActiveTab("my-cases");
  }

  function handleReply(ticketId: string, message: TicketMessage) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              messages: [...t.messages, message],
              updatedAt: new Date().toISOString(),
              status:
                t.status === "resolved" || t.status === "closed"
                  ? "open"
                  : t.status,
            }
          : t,
      ),
    );
    setSelectedTicket((prev) =>
      prev?.id === ticketId
        ? {
            ...prev,
            messages: [...prev.messages, message],
            status:
              prev.status === "resolved" || prev.status === "closed"
                ? "open"
                : prev.status,
          }
        : prev,
    );
  }

  function handleReopen(ticketId: string) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: "open",
              resolvedAt: undefined,
              closedAt: undefined,
              updatedAt: new Date().toISOString(),
            }
          : t,
      ),
    );
    setSelectedTicket((prev) =>
      prev?.id === ticketId
        ? {
            ...prev,
            status: "open",
            resolvedAt: undefined,
            closedAt: undefined,
          }
        : prev,
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-bold text-foreground">HR Help Desk</h1>
            <p className="text-sm text-muted-foreground">
              Get answers, submit queries, and track your cases
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowNewCaseModal(true)}
          className="bg-[#4361ee] hover:bg-[#3451d1] text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" /> New Case
        </Button>
      </div>

      <HelpdeskStatCards
        total={stats.total}
        open={stats.open}
        resolved={stats.resolved}
        overdue={stats.overdue}
        cardFilter={cardFilter}
        onDrillDown={(filter) => {
          setCardFilter(filter);
          // The numbers are all about cases, so drilling always lands there.
          setActiveTab("my-cases");
          setStatusFilter("all");
        }}
      />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "faq" | "my-cases")}
      >
        <PageTabsList
          tabs={[
            { value: "faq", label: "FAQ & Knowledge" },
            { value: "my-cases", label: "My Cases" },
          ]}
        />
        <TabsContent value="faq" className="mt-6">
          <FaqPanel onSubmitCase={() => setShowNewCaseModal(true)} />
        </TabsContent>
        <TabsContent value="my-cases" className="mt-6">
          <TicketList
            tickets={myTickets}
            statusFilter={statusFilter}
            onStatusFilter={setStatusFilter}
            cardFilter={cardFilter}
            onClearCardFilter={() => setCardFilter("all")}
            onSelectTicket={(ticket) => setSelectedTicket(ticket)}
          />
        </TabsContent>
      </Tabs>

      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onReply={handleReply}
        onReopen={handleReopen}
      />

      <NewCaseModal
        open={showNewCaseModal}
        onOpenChange={setShowNewCaseModal}
        ticketCount={tickets.length}
        onCreated={handleCreated}
      />
    </div>
  );
}

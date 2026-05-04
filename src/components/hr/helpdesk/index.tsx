"use client";

import { useState } from "react";
import { HeadphonesIcon, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { StatCards } from "./components/stat-cards";
import { CasesTable } from "./components/cases-table";
import { CaseDetailModal } from "./components/case-detail-modal";
import { NewCaseModal } from "./components/new-case-modal";
import { FAQPanel } from "./components/faq-panel";
import {
  TICKETS,
  FAQ_ARTICLES,
  TICKET_CATEGORY_CONFIG,
  TICKET_CATEGORY_OPTIONS,
  TICKET_STATUS_CONFIG,
  TICKET_STATUS_OPTIONS,
  getCategoryBreakdown,
  getStatusBreakdown,
  computeHelpdeskStats,
} from "./data";
import type {
  HelpDeskTicket,
  FAQArticle,
  NewTicket,
  TicketStatus,
  TicketPriority,
  TicketMessage,
} from "./types";

export function HelpdeskPage() {
  const [tickets, setTickets] = useState<HelpDeskTicket[]>(TICKETS);
  const [faqArticles, setFaqArticles] = useState<FAQArticle[]>(FAQ_ARTICLES);
  const [newCaseOpen, setNewCaseOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState<HelpDeskTicket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function handleCreate(data: NewTicket) {
    const now = "2026-04-04";
    const id = `HD-${String(tickets.length + 1).padStart(3, "0")}`;
    const slaMap: Record<string, string> = {
      critical: "2026-04-05",
      high: "2026-04-06",
      normal: "2026-04-11",
      low: "2026-04-18",
    };
    const newTicket: HelpDeskTicket = {
      id,
      ticketNumber: `TKT-${String(tickets.length + 1).padStart(4, "0")}`,
      subject: data.subject,
      description: data.description,
      category: data.category,
      status: "open",
      priority: data.priority,
      submitterName: data.submitterName,
      submitterInitials: data.submitterInitials,
      submitterDept: data.submitterDept,
      messages: [
        {
          id: "m1",
          authorName: data.submitterName,
          authorInitials: data.submitterInitials,
          authorDept: data.submitterDept,
          content: data.description,
          createdAt: now,
          isHR: false,
          isInternalNote: false,
        },
      ],
      createdAt: now,
      updatedAt: now,
      slaDueAt: slaMap[data.priority] ?? "2026-04-11",
      isOverdue: false,
    };
    setTickets((prev) => [newTicket, ...prev]);
  }

  function handleUpdateStatus(id: string, status: TicketStatus) {
    const now = "2026-04-04";
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          status,
          updatedAt: now,
          resolvedAt: status === "resolved" ? now : t.resolvedAt,
          closedAt: status === "closed" ? now : t.closedAt,
        };
      }),
    );
    setDetailTicket((prev) => (prev?.id === id ? { ...prev, status } : prev));
  }

  function handleUpdatePriority(id: string, priority: TicketPriority) {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, priority } : t)),
    );
    setDetailTicket((prev) => (prev?.id === id ? { ...prev, priority } : prev));
  }

  function handleAssign(id: string, agentName: string, agentInitials: string) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, assignedTo: agentName, assignedInitials: agentInitials }
          : t,
      ),
    );
    setDetailTicket((prev) =>
      prev?.id === id
        ? { ...prev, assignedTo: agentName, assignedInitials: agentInitials }
        : prev,
    );
    toast.success(`Case assigned to ${agentName}`);
  }

  function handleReply(id: string, content: string, isInternalNote: boolean) {
    const now = "2026-04-04";
    const newMessage: TicketMessage = {
      id: `m-${Date.now()}`,
      authorName: "HR Admin",
      authorInitials: "HA",
      authorDept: "Human Resources",
      content,
      createdAt: now,
      isHR: true,
      isInternalNote,
    };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              messages: [...t.messages, newMessage],
              updatedAt: now,
              firstResponseAt: t.firstResponseAt ?? now,
            }
          : t,
      ),
    );
    setDetailTicket((prev) =>
      prev?.id === id
        ? {
            ...prev,
            messages: [...prev.messages, newMessage],
            firstResponseAt: prev.firstResponseAt ?? now,
          }
        : prev,
    );
  }

  function handleDelete(id: string) {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (detailOpen && detailTicket?.id === id) {
      setDetailOpen(false);
      setDetailTicket(null);
    }
    toast.error("Case deleted.");
  }

  function handleMarkFaqHelpful(id: string) {
    setFaqArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, helpful: a.helpful + 1 } : a)),
    );
  }

  function openDetail(ticket: HelpDeskTicket) {
    setDetailTicket(ticket);
    setDetailOpen(true);
  }

  const openTickets = tickets.filter(
    (t) =>
      t.status === "open" ||
      t.status === "in_progress" ||
      t.status === "pending_response",
  );

  const stats = computeHelpdeskStats(tickets);
  const categoryBreakdown = getCategoryBreakdown(tickets);
  const statusBreakdown = getStatusBreakdown(tickets);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 rounded-xl p-2.5">
            <HeadphonesIcon className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              HR Help Desk
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage employee queries, track cases, and maintain SLA compliance
            </p>
          </div>
        </div>
        <Button
          onClick={() => setNewCaseOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Case
        </Button>
      </div>

      <StatCards tickets={tickets} />

      <Tabs defaultValue="open">
        <PageTabsList
          tabs={[
            {
              value: "open",
              label:
                openTickets.length > 0
                  ? `Open Cases (${openTickets.length})`
                  : "Open Cases",
            },
            { value: "all", label: "All Cases" },
            { value: "faq", label: "FAQ Library" },
            { value: "analytics", label: "Analytics" },
          ]}
        />

        <TabsContent value="open" className="mt-4">
          <CasesTable
            tickets={openTickets}
            onView={openDetail}
            onUpdateStatus={handleUpdateStatus}
            onAssign={handleAssign}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <CasesTable
            tickets={tickets}
            onView={openDetail}
            onUpdateStatus={handleUpdateStatus}
            onAssign={handleAssign}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="faq" className="mt-4">
          <FAQPanel
            articles={faqArticles}
            onMarkHelpful={handleMarkFaqHelpful}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cases by Category</CardTitle>
                <CardDescription className="text-xs">
                  Distribution of support cases across all topic areas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {TICKET_CATEGORY_OPTIONS.map((cat) => {
                  const count = categoryBreakdown[cat] ?? 0;
                  const pct =
                    stats.total > 0
                      ? Math.round((count / stats.total) * 100)
                      : 0;
                  const config = TICKET_CATEGORY_CONFIG[cat];
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          {config.icon} {config.label}
                        </span>
                        <span className="text-muted-foreground">
                          {count} &bull; {pct}%
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">SLA Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress
                        value={
                          stats.total > 0
                            ? Math.round(
                                ((stats.total - stats.overdue) / stats.total) *
                                  100,
                              )
                            : 100
                        }
                        className="h-2"
                      />
                    </div>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      {stats.total > 0
                        ? Math.round(
                            ((stats.total - stats.overdue) / stats.total) * 100,
                          )
                        : 100}
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.overdue} case
                    {stats.overdue !== 1 ? "s" : ""} overdue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {TICKET_STATUS_OPTIONS.map((st) => {
                    const count = statusBreakdown[st] ?? 0;
                    if (count === 0) return null;
                    const config = TICKET_STATUS_CONFIG[st];
                    return (
                      <div
                        key={st}
                        className="flex items-center justify-between"
                      >
                        <Badge
                          variant="outline"
                          className={`text-xs ${config.color} ${config.bg} ${config.border}`}
                        >
                          {config.label}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <Card className="lg:col-span-3">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">
                    Overdue Cases Requiring Attention
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {tickets.filter((t) => t.isOverdue).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No overdue cases — great SLA compliance!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tickets
                      .filter((t) => t.isOverdue)
                      .map((t) => {
                        const catConfig = TICKET_CATEGORY_CONFIG[t.category];
                        const priorityConfig = TICKET_STATUS_CONFIG[t.status];
                        return (
                          <div
                            key={t.id}
                            className="flex items-center gap-3 border border-red-500/30 rounded-lg px-3 py-2 bg-red-50 dark:bg-red-950/20"
                          >
                            <span className="text-xs font-mono font-medium text-muted-foreground shrink-0">
                              {t.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => openDetail(t)}
                              className="flex-1 text-left text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                            >
                              {t.subject}
                            </button>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge
                                variant="outline"
                                className={`text-xs ${catConfig.color} ${catConfig.bg} ${catConfig.border}`}
                              >
                                {catConfig.icon}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${priorityConfig.color} ${priorityConfig.bg} ${priorityConfig.border}`}
                              >
                                {priorityConfig.label}
                              </Badge>
                            </div>
                            <span className="text-xs text-red-500 font-medium shrink-0">
                              Due {t.slaDueAt}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <NewCaseModal
        open={newCaseOpen}
        onClose={() => setNewCaseOpen(false)}
        onSubmit={handleCreate}
      />

      <CaseDetailModal
        ticket={detailTicket}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePriority={handleUpdatePriority}
        onAssign={handleAssign}
        onReply={handleReply}
      />
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Send,
  Lock,
  MessageCircle,
  Building2,
  CreditCard,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  DEMO_TICKETS,
  DEMO_CANNED_RESPONSES,
  DEMO_TENANTS,
  DEMO_INVOICES,
} from "@/src/data/motee-demo";
import type { SupportTicket } from "@/src/lib/types/motee.types";

type TicketStatus = "open" | "in_progress" | "awaiting" | "resolved" | "closed";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-500",
  medium: "bg-amber-500/10 text-amber-500",
  high: "bg-orange-500/10 text-orange-500",
  critical: "bg-red-500/10 text-red-500",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-500",
  in_progress: "bg-amber-500/10 text-amber-500",
  awaiting: "bg-purple-500/10 text-purple-500",
  resolved: "bg-[#4ED251]/10 text-[#4ED251]",
  closed: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  awaiting: "Awaiting Tenant",
  resolved: "Resolved",
  closed: "Closed",
};

const TICKET_MESSAGES: Record<
  string,
  { from: string; role: "tenant" | "support"; body: string; ts: string }[]
> = {
  "tkt-001": [
    {
      from: "admin@interswitch.com",
      role: "tenant",
      body: "Our payroll run for March 2026 is showing incorrect net pay for several employees. The deductions for pension and tax appear to have been doubled for employees on the growth plan. This is affecting about 45 employees. Please advise urgently.",
      ts: "2026-03-12T09:10:00",
    },
    {
      from: "C. Mensah (Support)",
      role: "support",
      body: "Thank you for reporting this. We have escalated this to our payroll engineering team immediately. Could you share the employee IDs of 2-3 affected records so we can reproduce the issue on our end?",
      ts: "2026-03-12T10:30:00",
    },
    {
      from: "admin@interswitch.com",
      role: "tenant",
      body: "Affected employee IDs: EMP-0112, EMP-0134, EMP-0198. The deductions look correct in the previous month but doubled this month.",
      ts: "2026-03-12T11:00:00",
    },
  ],
  "tkt-002": [
    {
      from: "hr@brighttech.ng",
      role: "tenant",
      body: "When I click Export to Excel on the employee reports page, nothing happens. There is no download and no error message either. I have tried on Chrome and Edge. This started happening yesterday.",
      ts: "2026-03-11T14:20:00",
    },
    {
      from: "A. Taiwo (Support)",
      role: "support",
      body: "Thank you for reporting this. We have reproduced the issue and it appears to be related to a recent update to the export service. Our team is working on a fix. In the meantime, you can use the CSV export option which is working correctly.",
      ts: "2026-03-11T15:45:00",
    },
  ],
  "tkt-003": [
    {
      from: "ops@konga.com",
      role: "tenant",
      body: "Our leave approval emails are not being sent to employees when their leave is approved or rejected. We checked our email settings and everything looks correct. This has been happening for 3 days now.",
      ts: "2026-03-10T08:30:00",
    },
    {
      from: "B. Okonkwo (Support)",
      role: "support",
      body: "We are looking into this. Could you confirm your email delivery settings in Settings > Notifications? Also, are in-app notifications working correctly for the same leave events?",
      ts: "2026-03-10T09:15:00",
    },
  ],
  "tkt-004": [
    {
      from: "admin@andela.com",
      role: "tenant",
      body: "Trying to bulk upload employees via CSV and getting a 500 internal server error after clicking Upload. The file is 24 rows and follows the template exactly. The error happens every time.",
      ts: "2026-03-09T10:00:00",
    },
    {
      from: "C. Mensah (Support)",
      role: "support",
      body: "Thanks for the detail. We have identified a bug in the bulk upload parser affecting files with more than 20 rows. A fix is being deployed today. We will confirm once it is live.",
      ts: "2026-03-09T11:30:00",
    },
  ],
  "tkt-005": [
    {
      from: "cto@techadvance.ng",
      role: "tenant",
      body: "After requesting a password reset, I received the email and clicked the link, but after setting the new password the login page just shows a blank screen. I cannot log in at all now.",
      ts: "2026-03-08T09:00:00",
    },
  ],
  "tkt-006": [
    {
      from: "ops@flutterwave.com",
      role: "tenant",
      body: "The department name on payslip PDFs is showing the old department name for 3 employees who were recently transferred. Their profiles show the correct department but the payslip PDF still shows the old one.",
      ts: "2026-03-06T10:00:00",
    },
    {
      from: "A. Taiwo (Support)",
      role: "support",
      body: "We have identified the cause. The payslip PDF was caching the department name at the time of payroll processing. We have regenerated the affected payslips. Please check if they are now correct.",
      ts: "2026-03-06T14:00:00",
    },
    {
      from: "ops@flutterwave.com",
      role: "tenant",
      body: "Yes, the PDFs are now showing the correct department. Thank you for the quick resolution!",
      ts: "2026-03-06T15:30:00",
    },
  ],
  "tkt-007": [
    {
      from: "hr@zenithbank.com",
      role: "tenant",
      body: "We are approaching our current employee seat limit of 2400 and we anticipate adding 200 more employees by end of Q2. Can our limit be increased to 3000? We are on the Enterprise plan.",
      ts: "2026-03-05T11:00:00",
    },
    {
      from: "B. Okonkwo (Support)",
      role: "support",
      body: "Thank you for the heads up. I have noted this request. For Enterprise plan limit increases, our account management team will reach out to you directly to discuss the updated terms and pricing.",
      ts: "2026-03-05T13:00:00",
    },
  ],
  "tkt-008": [
    {
      from: "admin@novafinance.ng",
      role: "tenant",
      body: "We just registered and are on the setup wizard. On step 3 (Organisation Structure), we are unable to add departments. The Add Department button is greyed out.",
      ts: "2026-03-04T10:00:00",
    },
    {
      from: "C. Mensah (Support)",
      role: "support",
      body: "Welcome to Motee! This is a known issue on the org structure step when no company profile country has been set yet. Please go to Company Profile first, set your country, and then return to the org structure step.",
      ts: "2026-03-04T10:45:00",
    },
  ],
};

const TICKET_CATEGORIES: Record<string, string> = {
  "tkt-001": "Payroll",
  "tkt-002": "Reports",
  "tkt-003": "Leave",
  "tkt-004": "Reports",
  "tkt-005": "Login / Access",
  "tkt-006": "Payroll",
  "tkt-007": "Billing",
  "tkt-008": "Onboarding",
};

const ASSIGNED_TO: Record<string, string> = {
  "tkt-001": "C. Mensah",
  "tkt-002": "A. Taiwo",
  "tkt-003": "B. Okonkwo",
  "tkt-004": "C. Mensah",
  "tkt-005": "Unassigned",
  "tkt-006": "A. Taiwo",
  "tkt-007": "B. Okonkwo",
  "tkt-008": "C. Mensah",
};

export function TicketsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | TicketStatus>("all");
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [ticketStatuses, setTicketStatuses] = useState<
    Record<string, TicketStatus>
  >({});
  const [detailTab, setDetailTab] = useState<"thread" | "notes">("thread");
  const [reply, setReply] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [showCanned, setShowCanned] = useState(false);
  const [cannedSearch, setCannedSearch] = useState("");

  function getStatus(t: SupportTicket): TicketStatus {
    return (ticketStatuses[t.id] as TicketStatus) ?? (t.status as TicketStatus);
  }

  const filtered = useMemo(() => {
    return DEMO_TICKETS.filter((t) => {
      const currentStatus =
        (ticketStatuses[t.id] as TicketStatus) ?? (t.status as TicketStatus);
      const matchSearch =
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.tenantName.toLowerCase().includes(search.toLowerCase());
      const matchTab = activeTab === "all" || currentStatus === activeTab;
      return matchSearch && matchTab;
    });
  }, [search, activeTab, ticketStatuses]);

  const statCards = [
    {
      label: "Total Tickets",
      value: DEMO_TICKETS.length,
      color: "text-foreground",
    },
    {
      label: "Open",
      value: DEMO_TICKETS.filter((t) => getStatus(t) === "open").length,
      color: "text-blue-500",
    },
    {
      label: "In Progress",
      value: DEMO_TICKETS.filter((t) => getStatus(t) === "in_progress").length,
      color: "text-amber-500",
    },
    {
      label: "Critical",
      value: DEMO_TICKETS.filter((t) => t.priority === "critical").length,
      color: "text-red-500",
    },
  ];

  const tenantContext = selected
    ? DEMO_TENANTS.find((ten) => ten.name === selected.tenantName)
    : null;

  const openInvoices = selected
    ? DEMO_INVOICES.filter(
        (inv) =>
          inv.tenantName === selected.tenantName && inv.status !== "paid",
      ).length
    : 0;

  const filteredCanned = DEMO_CANNED_RESPONSES.filter(
    (c) =>
      c.title.toLowerCase().includes(cannedSearch.toLowerCase()) ||
      c.body.toLowerCase().includes(cannedSearch.toLowerCase()),
  );

  const TABS: { key: "all" | TicketStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "in_progress", label: "In Progress" },
    { key: "awaiting", label: "Awaiting Tenant" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Support Tickets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage all tenant support requests, priorities, and resolutions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject or tenant…"
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-[#ff8b2d] text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Opened
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-muted-foreground"
                  >
                    No tickets match your current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelected(ticket);
                      setDetailTab("thread");
                      setReply("");
                    }}
                  >
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-medium text-foreground line-clamp-1 max-w-70">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ticket.id}
                      </p>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">
                      {ticket.tenantName}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs text-muted-foreground">
                        {TICKET_CATEGORIES[ticket.id] ?? "General"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        className={`text-xs border-0 capitalize ${PRIORITY_STYLES[ticket.priority]}`}
                      >
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge
                        className={`text-xs border-0 ${STATUS_STYLES[getStatus(ticket)]}`}
                      >
                        {STATUS_LABELS[getStatus(ticket)]}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground">
                      {ASSIGNED_TO[ticket.id] ?? "Unassigned"}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground">
                      {ticket.createdAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {selected && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-base font-semibold text-foreground line-clamp-2">
                      {selected.subject}
                    </DialogTitle>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {selected.id}
                      </span>
                      <Badge
                        className={`text-xs border-0 capitalize ${PRIORITY_STYLES[selected.priority]}`}
                      >
                        {selected.priority}
                      </Badge>
                      <Badge
                        className={`text-xs border-0 ${STATUS_STYLES[getStatus(selected)]}`}
                      >
                        {STATUS_LABELS[getStatus(selected)]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Category: {TICKET_CATEGORIES[selected.id] ?? "General"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Assigned: {ASSIGNED_TO[selected.id] ?? "Unassigned"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap shrink-0">
                    {(
                      [
                        "open",
                        "in_progress",
                        "awaiting",
                        "resolved",
                        "closed",
                      ] as TicketStatus[]
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          setTicketStatuses((p) => ({ ...p, [selected.id]: s }))
                        }
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                          getStatus(selected) === s
                            ? "border-[#ff8b2d] bg-[#ff8b2d]/10 text-[#ff8b2d]"
                            : "border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </DialogHeader>

              <div className="flex flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                  <div className="flex border-b border-border px-6 gap-4 shrink-0">
                    {[
                      {
                        key: "thread" as const,
                        label: "Thread",
                        icon: MessageCircle,
                      },
                      {
                        key: "notes" as const,
                        label: "Internal Notes",
                        icon: Lock,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setDetailTab(tab.key)}
                        className={`flex items-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-colors ${
                          detailTab === tab.key
                            ? "border-[#ff8b2d] text-[#ff8b2d]"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {detailTab === "thread" && (
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                        {(TICKET_MESSAGES[selected.id] ?? []).map((msg, i) => (
                          <div
                            key={i}
                            className={`flex flex-col gap-1 ${msg.role === "support" ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === "support"
                                  ? "bg-[#ff8b2d]/10 text-foreground rounded-tr-none"
                                  : "bg-muted text-foreground rounded-tl-none"
                              }`}
                            >
                              <p
                                className={`text-xs font-medium mb-1 ${msg.role === "support" ? "text-[#ff8b2d]" : "text-muted-foreground"}`}
                              >
                                {msg.from}
                              </p>
                              <p className="whitespace-pre-wrap">{msg.body}</p>
                            </div>
                            <span className="text-[10px] text-muted-foreground px-1">
                              {msg.ts.replace("T", " ").slice(0, 16)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="px-6 pb-5 pt-3 border-t border-border shrink-0">
                        <div className="relative">
                          <Textarea
                            rows={3}
                            placeholder="Type your reply…"
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            className="resize-none pr-24"
                          />
                          <div className="absolute right-2 bottom-2 flex gap-1.5">
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs gap-1 text-muted-foreground"
                                onClick={() => setShowCanned((p) => !p)}
                              >
                                Canned <ChevronDown className="h-3 w-3" />
                              </Button>
                              {showCanned && (
                                <div className="absolute bottom-8 right-0 z-50 w-72 rounded-lg border border-border bg-background shadow-lg">
                                  <div className="p-2 border-b border-border">
                                    <Input
                                      placeholder="Search responses…"
                                      className="h-7 text-xs"
                                      value={cannedSearch}
                                      onChange={(e) =>
                                        setCannedSearch(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {filteredCanned.map((c) => (
                                      <button
                                        key={c.id}
                                        className="w-full text-left px-3 py-2.5 hover:bg-muted transition-colors"
                                        onClick={() => {
                                          setReply(c.body);
                                          setShowCanned(false);
                                          setCannedSearch("");
                                        }}
                                      >
                                        <p className="text-xs font-medium text-foreground">
                                          {c.title}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                          {c.category}
                                        </p>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              disabled={!reply.trim()}
                              className="h-7 px-2 bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white gap-1"
                              onClick={() => setReply("")}
                            >
                              <Send className="h-3.5 w-3.5" />
                              Send
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {detailTab === "notes" && (
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                      <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-4">
                          <p className="text-xs text-amber-600 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" />
                            Internal notes are only visible to the support team
                            and are never shown to tenant users.
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground text-center mt-8">
                          No internal notes yet.
                        </p>
                      </div>
                      <div className="px-6 pb-5 pt-3 border-t border-border shrink-0">
                        <Textarea
                          rows={3}
                          placeholder="Add an internal note…"
                          value={internalNote}
                          onChange={(e) => setInternalNote(e.target.value)}
                          className="resize-none"
                        />
                        <Button
                          size="sm"
                          disabled={!internalNote.trim()}
                          className="mt-2 bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
                          onClick={() => setInternalNote("")}
                        >
                          Add Note
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-64 border-l border-border bg-muted/30 flex flex-col gap-0 shrink-0 overflow-y-auto">
                  <div className="px-4 py-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Tenant Context
                    </p>
                    {tenantContext ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ff8b2d]/10">
                            <Building2 className="h-4 w-4 text-[#ff8b2d]" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {tenantContext.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground capitalize">
                              {tenantContext.status}
                            </p>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Plan</span>
                            <Badge className="text-[10px] border-0 capitalize bg-[#ff8b2d]/10 text-[#ff8b2d] h-4">
                              {tenantContext.plan}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Employees
                            </span>
                            <span className="font-medium text-foreground">
                              {tenantContext.employeeCount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">MRR</span>
                            <span className="font-medium text-foreground">
                              ₦{tenantContext.mrr.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Open Invoices
                            </span>
                            <span
                              className={`font-medium ${openInvoices > 0 ? "text-red-500" : "text-foreground"}`}
                            >
                              {openInvoices}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Since</span>
                            <span className="font-medium text-foreground">
                              {tenantContext.createdAt}
                            </span>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">
                            {tenantContext.billingEmail}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Tenant not found in directory.
                      </p>
                    )}
                  </div>
                  <Separator />
                  <div className="px-4 py-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Ticket Info
                    </p>
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Opened</span>
                        <span className="font-medium text-foreground">
                          {selected.createdAt}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Replies</span>
                        <span className="font-medium text-foreground">
                          {(TICKET_MESSAGES[selected.id] ?? []).length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          SLA: Normal priority
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

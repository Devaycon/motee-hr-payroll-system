"use client";

import { useState, useMemo, useRef } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
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
  LifeBuoy,
  Plus,
  Search,
  Send,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  MessageCircle,
  BookOpen,
  ThumbsUp,
} from "lucide-react";
import {
  TICKETS,
  FAQ_ARTICLES,
  TICKET_CATEGORY_CONFIG,
  TICKET_CATEGORY_OPTIONS,
  TICKET_STATUS_CONFIG,
  TICKET_STATUS_OPTIONS,
  TICKET_PRIORITY_CONFIG,
  TICKET_PRIORITY_OPTIONS,
  computeHelpdeskStats,
} from "@/src/data/helpdesk-demo";
import type {
  HelpDeskTicket,
  TicketCategory,
  TicketStatus,
  TicketPriority,
  TicketMessage,
} from "@/src/lib/types/helpdesk";

const MY_NAME = "Emeka Nwosu";
const MY_INITIALS = "EN";
const MY_DEPT = "Engineering";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EmployeeHelpdeskPage() {
  const idRef = useRef(0);
  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  const [activeTab, setActiveTab] = useState<"faq" | "my-cases">("faq");
  const [tickets, setTickets] = useState<HelpDeskTicket[]>(TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<HelpDeskTicket | null>(
    null,
  );
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState<TicketCategory | "all">("all");
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [replyText, setReplyText] = useState("");

  const [newSubject, setNewSubject] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<TicketCategory>("leave");
  const [newPriority, setNewPriority] = useState<TicketPriority>("medium");

  const myTickets = tickets.filter((t) => t.submitterInitials === MY_INITIALS);
  const stats = computeHelpdeskStats(myTickets);

  const filteredFaqs = useMemo(() => {
    return FAQ_ARTICLES.filter((f) => {
      const matchCat = faqCategory === "all" || f.category === faqCategory;
      const matchSearch =
        !faqSearch ||
        f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        f.answer.toLowerCase().includes(faqSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [faqSearch, faqCategory]);

  const filteredTickets = myTickets.filter(
    (t) => statusFilter === "all" || t.status === statusFilter,
  );

  function submitNewCase() {
    if (!newSubject.trim() || !newDesc.trim()) return;
    const ticketNumber = `TKT-${String(tickets.length + 1).padStart(4, "0")}`;
    const newTicket: HelpDeskTicket = {
      id: `t-new-${nextId()}`,
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
          id: `m-new-${nextId()}`,
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
    setTickets((prev) => [newTicket, ...prev]);
    setShowNewCaseModal(false);
    setNewSubject("");
    setNewDesc("");
    setNewCategory("leave");
    setNewPriority("medium");
    setActiveTab("my-cases");
  }

  function submitReply(ticketId: string) {
    const msg = replyText.trim();
    if (!msg) return;
    const newMsg: TicketMessage = {
      id: `m-reply-${nextId()}`,
      authorName: MY_NAME,
      authorInitials: MY_INITIALS,
      authorDept: MY_DEPT,
      isHR: false,
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              messages: [...t.messages, newMsg],
              updatedAt: new Date().toISOString(),
              status:
                t.status === "resolved" || t.status === "closed"
                  ? "open"
                  : t.status,
            }
          : t,
      ),
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, newMsg],
              status:
                prev.status === "resolved" || prev.status === "closed"
                  ? "open"
                  : prev.status,
            }
          : prev,
      );
    }
    setReplyText("");
  }

  function reopenTicket(ticketId: string) {
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
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              status: "open",
              resolvedAt: undefined,
              closedAt: undefined,
            }
          : prev,
      );
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">HR Help Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get answers, submit queries, and track your cases
          </p>
        </div>
        <Button
          onClick={() => setShowNewCaseModal(true)}
          className="bg-[#7F77DD] hover:bg-[#6b63c4] text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" /> New Case
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Cases",
            value: stats.total,
            icon: LifeBuoy,
            color: "text-[#7F77DD]",
            bg: "bg-[#7F77DD]/10",
          },
          {
            label: "Open / In Progress",
            value: stats.open,
            icon: Clock,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Resolved",
            value: stats.resolved,
            icon: CheckCircle,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            icon: AlertTriangle,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-500/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["faq", "my-cases"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-[#7F77DD] text-[#7F77DD]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "faq" ? "FAQ & Knowledge" : "My Cases"}
          </button>
        ))}
      </div>

      {activeTab === "faq" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search FAQs…"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={faqCategory}
              onValueChange={(v) => setFaqCategory(v as TicketCategory | "all")}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TICKET_CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {TICKET_CATEGORY_CONFIG[c].icon}{" "}
                    {TICKET_CATEGORY_CONFIG[c].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {faqSearch && (
            <div className="p-3 rounded-lg bg-[#7F77DD]/5 border border-[#7F77DD]/20 text-xs text-[#7F77DD]">
              {filteredFaqs.length} result{filteredFaqs.length !== 1 ? "s" : ""}{" "}
              for &ldquo;{faqSearch}&rdquo;
              {filteredFaqs.length === 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  — can&apos;t find what you&apos;re looking for?{" "}
                  <button
                    onClick={() => setShowNewCaseModal(true)}
                    className="text-[#7F77DD] underline font-medium"
                  >
                    Submit a case
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="space-y-3">
            {filteredFaqs.map((faq) => {
              const catCfg = TICKET_CATEGORY_CONFIG[faq.category];
              const isHelpful = helpfulVotes.has(faq.id);
              return (
                <Card key={faq.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${catCfg.bg} ${catCfg.border} border shrink-0`}
                      >
                        <span className="text-base">{catCfg.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-foreground leading-snug">
                            {faq.question}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${catCfg.color} ${catCfg.bg} ${catCfg.border}`}
                          >
                            {catCfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                          {faq.answer}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" /> {faq.views} views
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />{" "}
                            {faq.helpful + (isHelpful ? 1 : 0)} helpful
                          </span>
                          <button
                            onClick={() =>
                              setHelpfulVotes((prev) => {
                                const next = new Set(prev);
                                if (next.has(faq.id)) next.delete(faq.id);
                                else next.add(faq.id);
                                return next;
                              })
                            }
                            className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
                              isHelpful
                                ? "bg-[#7F77DD]/10 border-[#7F77DD]/40 text-[#7F77DD]"
                                : "border-border hover:border-[#7F77DD]/40 hover:text-[#7F77DD]"
                            }`}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            {isHelpful ? "Helpful" : "Mark helpful"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredFaqs.length === 0 && !faqSearch && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No FAQs in this category yet.
            </div>
          )}

          <Card className="border-dashed border-[#7F77DD]/30 bg-[#7F77DD]/5">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Can&apos;t find your answer?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submit a case and our HR team will get back to you.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowNewCaseModal(true)}
                className="bg-[#7F77DD] hover:bg-[#6b63c4] text-white"
              >
                <Plus className="h-4 w-4 mr-1" /> Submit a Case
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "my-cases" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as TicketStatus | "all")}
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
              {filteredTickets.length} case
              {filteredTickets.length !== 1 ? "s" : ""}
            </span>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No cases found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => {
                const catCfg = TICKET_CATEGORY_CONFIG[ticket.category];
                const statusCfg = TICKET_STATUS_CONFIG[ticket.status];
                const priorityCfg = TICKET_PRIORITY_CONFIG[ticket.priority];
                return (
                  <Card
                    key={ticket.id}
                    className="cursor-pointer hover:border-[#7F77DD]/40 transition-colors"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setReplyText("");
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${catCfg.bg} ${catCfg.border} border shrink-0`}
                        >
                          <span className="text-base">{catCfg.icon}</span>
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
              })}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={!!selectedTicket}
        onOpenChange={() => {
          setSelectedTicket(null);
          setReplyText("");
        }}
      >
        {selectedTicket &&
          (() => {
            const catCfg = TICKET_CATEGORY_CONFIG[selectedTicket.category];
            const statusCfg = TICKET_STATUS_CONFIG[selectedTicket.status];
            const priorityCfg = TICKET_PRIORITY_CONFIG[selectedTicket.priority];
            const isClosed =
              selectedTicket.status === "resolved" ||
              selectedTicket.status === "closed";
            return (
              <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-base leading-snug pr-6">
                    {selectedTicket.subject}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">
                    {selectedTicket.ticketNumber}
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
                    className={`text-xs ${catCfg.color} ${catCfg.bg} ${catCfg.border}`}
                  >
                    {catCfg.icon} {catCfg.label}
                  </Badge>
                  {selectedTicket.assignedTo && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Assigned to {selectedTicket.assignedTo}
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground flex gap-4">
                  <span>Opened: {formatDate(selectedTicket.createdAt)}</span>
                  {selectedTicket.slaDueAt && (
                    <span
                      className={
                        selectedTicket.isOverdue
                          ? "text-red-500 font-medium"
                          : ""
                      }
                    >
                      SLA Due: {formatDate(selectedTicket.slaDueAt)}
                      {selectedTicket.isOverdue && " · Overdue"}
                    </span>
                  )}
                  {selectedTicket.resolvedAt && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Resolved: {formatDate(selectedTicket.resolvedAt)}
                    </span>
                  )}
                </div>

                <Separator />

                <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
                  {selectedTicket.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.isHR ? "" : "flex-row-reverse"}`}
                    >
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback
                          className={`text-xs font-semibold ${
                            msg.isHR
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                              : "bg-[#7F77DD]/10 text-[#7F77DD]"
                          }`}
                        >
                          {msg.authorInitials}
                        </AvatarFallback>
                      </Avatar>
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
                              : "bg-[#7F77DD]/10 border border-[#7F77DD]/20 text-foreground"
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
                      This case is {selectedTicket.status}. Reopen to send a
                      reply.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reopenTicket(selectedTicket.id)}
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
                          submitReply(selectedTicket.id);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={() => submitReply(selectedTicket.id)}
                      disabled={!replyText.trim()}
                      className="bg-[#7F77DD] hover:bg-[#6b63c4] text-white self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </DialogContent>
            );
          })()}
      </Dialog>

      <Dialog open={showNewCaseModal} onOpenChange={setShowNewCaseModal}>
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
                    {TICKET_CATEGORY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {TICKET_CATEGORY_CONFIG[c].icon}{" "}
                        {TICKET_CATEGORY_CONFIG[c].label}
                      </SelectItem>
                    ))}
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
              <Button
                variant="outline"
                onClick={() => setShowNewCaseModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitNewCase}
                disabled={!newSubject.trim() || !newDesc.trim()}
                className="bg-[#7F77DD] hover:bg-[#6b63c4] text-white"
              >
                Submit Case
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
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
  Heart,
  Send,
  Trophy,
  Users,
  TrendingUp,
  Star,
  Search,
  Megaphone,
  Pin,
} from "lucide-react";
import type {
  KudosPost,
  KudosType,
  CompanyValue,
  ReactionType,
} from "@/src/lib/types/kudos";
import {
  KUDOS_POSTS,
  LEADERBOARD,
  KUDOS_TYPE_CONFIG,
  KUDOS_TYPE_OPTIONS,
  REACTION_ICONS,
  EMPLOYEE_ROSTER,
  COMPANY_VALUE_CONFIG,
  MY_INITIALS,
  MY_NAME,
  MY_DEPT,
  timeAgo,
} from "./data";

export function KudosTab() {
  const [kudosPosts, setKudosPosts] = useState<KudosPost[]>(KUDOS_POSTS);
  const [showSendModal, setShowSendModal] = useState(false);
  const [myReactions, setMyReactions] = useState<
    Record<string, ReactionType | null>
  >({});
  const [kudosTypeFilter, setKudosTypeFilter] = useState<KudosType | "all">(
    "all",
  );
  const [leaderboardView, setLeaderboardView] = useState<"received" | "sent">(
    "received",
  );
  const [search, setSearch] = useState("");
  const [sendRecipient, setSendRecipient] = useState("");
  const [sendType, setSendType] = useState<KudosType>("excellence");
  const [sendValues, setSendValues] = useState<CompanyValue[]>([]);
  const [sendMessage, setSendMessage] = useState("");
  const [sendPublic, setSendPublic] = useState(true);

  const filtered = kudosPosts.filter((k) => {
    if (kudosTypeFilter !== "all" && k.kudosType !== kudosTypeFilter)
      return false;
    if (
      search &&
      !k.senderName.toLowerCase().includes(search.toLowerCase()) &&
      !k.recipientName.toLowerCase().includes(search.toLowerCase()) &&
      !k.message.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  function toggleReaction(postId: string, type: ReactionType) {
    const prev = myReactions[postId] ?? null;
    const isSame = prev === type;
    const next = isSame ? null : type;
    setMyReactions((m) => ({ ...m, [postId]: next }));
    setKudosPosts((posts) =>
      posts.map((k) => {
        if (k.id !== postId) return k;
        return {
          ...k,
          reactions: k.reactions.map((r) => {
            if (r.type === prev && prev !== null) {
              return {
                ...r,
                count: Math.max(0, r.count - 1),
                reactedBy: r.reactedBy.filter((x) => x !== MY_INITIALS),
              };
            }
            if (r.type === type && !isSame) {
              return {
                ...r,
                count: r.count + 1,
                reactedBy: [...r.reactedBy, MY_INITIALS],
              };
            }
            return r;
          }),
        };
      }),
    );
  }

  function toggleSendValue(v: CompanyValue) {
    setSendValues((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  function submitKudos() {
    const recipient = EMPLOYEE_ROSTER.find((e) => e.name === sendRecipient);
    if (!recipient || !sendMessage.trim()) return;
    const newKudos: KudosPost = {
      id: `kp-new-${Date.now()}`,
      senderName: MY_NAME,
      senderInitials: MY_INITIALS,
      senderDept: MY_DEPT,
      recipientName: recipient.name,
      recipientInitials: recipient.initials,
      recipientDept: recipient.department,
      kudosType: sendType,
      companyValue: sendValues[0] ?? "integrity",
      message: sendMessage,
      reactions: [],
      comments: [],
      createdAt: new Date().toISOString(),
      isPublic: sendPublic,
    };
    setKudosPosts((prev) => [newKudos, ...prev]);
    setShowSendModal(false);
    setSendRecipient("");
    setSendMessage("");
    setSendValues([]);
  }

  const topList = [...LEADERBOARD]
    .sort((a, b) =>
      leaderboardView === "received"
        ? b.kudosReceived - a.kudosReceived
        : b.kudosSent - a.kudosSent,
    )
    .slice(0, 5);

  const statCards = [
    {
      label: "Total Kudos",
      value: kudosPosts.length,
      icon: Trophy,
      sub: "in the feed",
    },
    {
      label: "My Kudos Received",
      value: kudosPosts.filter((k) => k.recipientInitials === MY_INITIALS)
        .length,
      icon: Heart,
      sub: "recognitions",
    },
    {
      label: "My Kudos Sent",
      value: kudosPosts.filter((k) => k.senderInitials === MY_INITIALS).length,
      icon: Send,
      sub: "given",
    },
    {
      label: "Team Members",
      value: EMPLOYEE_ROSTER.length,
      icon: Users,
      sub: "in roster",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, sub }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or message..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={kudosTypeFilter}
              onValueChange={(v) => setKudosTypeFilter(v as KudosType | "all")}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Kudos type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {KUDOS_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const I = KUDOS_TYPE_CONFIG[t].icon;
                        return <I className="size-3.5" />;
                      })()}
                      {KUDOS_TYPE_CONFIG[t].label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex-1" />
            <Button
              size="sm"
              onClick={() => setShowSendModal(true)}
              className="bg-[#4361ee] hover:bg-[#3451d1] text-white"
            >
              <Star className="h-4 w-4 mr-1" /> Send Kudos
            </Button>
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="bg-amber-500/10 rounded-full p-4 mb-4">
                <Star className="w-6 h-6 text-amber-500" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No kudos found
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try a different filter or search term
              </p>
            </div>
          )}

          {filtered.map((post) => {
            const cfg = KUDOS_TYPE_CONFIG[post.kudosType];
            const valueCfg = COMPANY_VALUE_CONFIG[post.companyValue];
            const myRxns = myReactions[post.id] ?? null;
            const isBroadcast = post.isBroadcast;

            return (
              <div
                key={post.id}
                className={`rounded-2xl border overflow-hidden ${
                  isBroadcast
                    ? "border-amber-400/40 bg-linear-to-br from-amber-500/5 to-background"
                    : "border-border bg-card"
                }`}
              >
                {isBroadcast && (
                  <div className="flex items-center gap-2 px-5 py-2 bg-amber-500/10 border-b border-amber-400/20">
                    <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      Team Broadcast
                    </span>
                  </div>
                )}
                <div
                  className={`h-1.5 w-full bg-linear-to-r ${cfg.gradient}`}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-1 shrink-0 relative">
                      <PersonAvatar
                        name={post.senderName}
                        initials={post.senderInitials}
                        className="size-10 ring-2 ring-background"
                        fallbackClassName={`text-xs font-bold ${cfg.bg} ${cfg.color}`}
                      />
                      <div
                        className={`-ml-1 z-10 flex items-center justify-center size-6 rounded-full ${cfg.bg} border border-background`}
                      >
                        <cfg.icon className={`size-3.5 ${cfg.color}`} />
                      </div>
                      <PersonAvatar
                        name={post.recipientName}
                        initials={post.recipientInitials}
                        className="size-10 ring-2 ring-background -ml-1"
                        fallbackClassName="text-xs font-bold bg-primary/10 text-primary"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {post.senderName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          recognised
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {post.recipientName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${cfg.bg} ${cfg.color} ${cfg.border}`}
                        >
                          <cfg.icon className="size-3 mr-1" />
                          {post.customTypeName ?? cfg.label}
                        </Badge>
                        {valueCfg && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${valueCfg.color} ${valueCfg.bg}`}
                          >
                            {valueCfg.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!post.isPublic && (
                      <Pin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />
                    )}
                  </div>

                  <blockquote className="bg-muted/40 rounded-xl px-4 py-3 border-l-2 border-primary/30 mb-4">
                    <p className="text-sm text-foreground leading-relaxed italic">
                      &ldquo;{post.message}&rdquo;
                    </p>
                  </blockquote>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {post.reactions.map((r) =>
                      r.count > 0 ? (
                        <button
                          key={r.type}
                          onClick={() => toggleReaction(post.id, r.type)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            myRxns === r.type
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-muted/60 hover:bg-muted border-border hover:border-primary/30"
                          }`}
                        >
                          {(() => {
                            const I = REACTION_ICONS[r.type];
                            return <I className="size-3.5" />;
                          })()}
                          <span className="font-medium text-foreground">
                            {r.count}
                          </span>
                        </button>
                      ) : null,
                    )}
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      {timeAgo(post.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" /> Leaderboard
                </p>
                <div className="flex gap-1">
                  {(["received", "sent"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setLeaderboardView(v)}
                      className={`px-2 py-0.5 rounded text-xs capitalize transition-colors ${
                        leaderboardView === v
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                {topList.map((entry, i) => (
                  <div key={entry.id} className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black w-5 text-center ${
                        i === 0
                          ? "text-yellow-500"
                          : i === 1
                            ? "text-slate-400"
                            : i === 2
                              ? "text-amber-600"
                              : "text-muted-foreground"
                      }`}
                    >
                      #{i + 1}
                    </span>
                    <PersonAvatar
                      name={entry.name}
                      initials={entry.initials}
                      className="h-6 w-6"
                      fallbackClassName="bg-primary/10 text-primary text-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {entry.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {entry.dept}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-primary">
                      {leaderboardView === "received"
                        ? entry.kudosReceived
                        : entry.kudosSent}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              Send Kudos
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh]">
            <div className="space-y-4 pt-2 pb-1">
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">
                  Recipient
                </label>
                <Select value={sendRecipient} onValueChange={setSendRecipient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select colleague" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_ROSTER.filter(
                      (e) => e.initials !== MY_INITIALS,
                    ).map((e) => (
                      <SelectItem key={e.initials} value={e.name}>
                        {e.name} · {e.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">
                  Recognition Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {KUDOS_TYPE_OPTIONS.filter((t) => t !== "custom").map(
                    (type) => {
                      const cfg = KUDOS_TYPE_CONFIG[type];
                      const selected = sendType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSendType(type)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                            selected
                              ? `${cfg.bg} ${cfg.border} border-2 shadow-sm`
                              : "bg-background border-border hover:border-primary/40 hover:bg-muted/40"
                          }`}
                        >
                          <cfg.icon
                            className={`size-5 ${
                              selected ? cfg.color : "text-muted-foreground"
                            }`}
                          />
                          <span
                            className={`text-[10px] font-semibold text-center leading-tight ${
                              selected ? cfg.color : "text-muted-foreground"
                            }`}
                          >
                            {cfg.label}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">
                  Company Values{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(COMPANY_VALUE_CONFIG) as CompanyValue[]).map(
                    (v) => {
                      const vcfg = COMPANY_VALUE_CONFIG[v];
                      const active = sendValues.includes(v);
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => toggleSendValue(v)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                            active
                              ? `${vcfg.bg} ${vcfg.color} border-current`
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {vcfg.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 flex items-center justify-between">
                  Message
                  <span className="text-muted-foreground font-normal">
                    {sendMessage.length}/500
                  </span>
                </label>
                <Textarea
                  placeholder="Write your recognition message…"
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value.slice(0, 500))}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Share Publicly
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Visible to everyone on the feed
                  </p>
                </div>
                <Switch checked={sendPublic} onCheckedChange={setSendPublic} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setShowSendModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitKudos}
              disabled={!sendRecipient || !sendMessage.trim()}
              className="flex items-center gap-2 bg-[#4361ee] hover:bg-[#3451d1] text-white"
            >
              <Star className="w-4 h-4" />
              Send Kudos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

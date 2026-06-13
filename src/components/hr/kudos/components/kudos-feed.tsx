"use client";

import { useState } from "react";
import { MessageCircle, Search, Megaphone, Pin, Star, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  KUDOS_TYPE_CONFIG,
  COMPANY_VALUE_CONFIG,
  REACTION_ICONS,
  KUDOS_TYPE_OPTIONS,
} from "../data";
import type { KudosPost, KudosType, ReactionType } from "../types";

interface KudosFeedProps {
  posts: KudosPost[];
  myReactions: Record<string, ReactionType | null>;
  onReact: (postId: string, reaction: ReactionType) => void;
  onAddComment: (postId: string, message: string) => void;
  /** When true, an admin delete control is shown on each post. */
  canDelete?: boolean;
  onDelete?: (postId: string) => void;
}

const DEPT_OPTIONS = [
  "Engineering",
  "Product",
  "Design",
  "Finance",
  "Sales",
  "HR",
  "Operations",
  "Marketing",
  "Customer Success",
  "Legal",
];

export function KudosFeed({
  posts,
  myReactions,
  onReact,
  onAddComment,
  canDelete = false,
  onDelete,
}: KudosFeedProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<KudosType | "all">("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );

  function toggleComments(postId: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  const filtered = posts.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      p.recipientName.toLowerCase().includes(q) ||
      p.senderName.toLowerCase().includes(q) ||
      p.message.toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || p.kudosType === typeFilter;
    const matchesDept =
      deptFilter === "all" ||
      p.recipientDept === deptFilter ||
      p.senderDept === deptFilter;
    return matchesSearch && matchesType && matchesDept;
  });

  const broadcasts = filtered.filter((p) => p.isBroadcast || p.isPinned);
  const regular = filtered.filter((p) => !p.isBroadcast && !p.isPinned);
  const ordered = [...broadcasts, ...regular];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 shrink-0 items-center">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as KudosType | "all")}
          >
            <SelectTrigger size="lg" className="w-44">
              <SelectValue placeholder="Kudos Type" />
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
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger size="lg" className="w-40">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPT_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {ordered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-amber-500/10 rounded-full p-4 mb-4">
            <Star className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-foreground">No kudos found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Be the first to recognise a colleague!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {ordered.map((post) => {
          const cfg = KUDOS_TYPE_CONFIG[post.kudosType];
          const isBroadcast = post.isBroadcast || post.isPinned;
          const commentsOpen = expandedComments.has(post.id);
          const totalReactions = post.reactions.reduce(
            (s, r) => s + r.count,
            0,
          );

          return (
            <div
              key={post.id}
              className={`rounded-2xl border overflow-hidden transition-shadow hover:shadow-md ${
                isBroadcast
                  ? "border-amber-400/40 bg-linear-to-br from-amber-500/5 to-background"
                  : "border-border bg-card"
              }`}
            >
              {isBroadcast && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-400/20">
                  <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    Team Broadcast
                  </span>
                  {post.isPinned && (
                    <Pin className="w-3 h-3 text-amber-600 ml-auto fill-amber-500" />
                  )}
                </div>
              )}

              <div className={`h-1.5 w-full bg-linear-to-r ${cfg.gradient}`} />

              <div className="p-5">
                <div className="flex items-start gap-3 mb-4">
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
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      <span>{post.senderName}</span>
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        gave kudos to{" "}
                      </span>
                      <span className="text-primary">{post.recipientName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {post.senderDept} → {post.recipientDept}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-xs ${cfg.bg} ${cfg.color} ${cfg.border}`}
                    >
                      <cfg.icon className="size-3 mr-1" />
                      {post.customTypeName ?? cfg.label}
                    </Badge>
                    {post.companyValue && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${COMPANY_VALUE_CONFIG[post.companyValue].bg} ${COMPANY_VALUE_CONFIG[post.companyValue].color} border-transparent`}
                      >
                        {COMPANY_VALUE_CONFIG[post.companyValue].label}
                      </Badge>
                    )}
                    {canDelete && onDelete && (
                      <button
                        type="button"
                        title="Delete kudos"
                        onClick={() => onDelete(post.id)}
                        className="mt-0.5 flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <blockquote className="text-sm text-foreground leading-relaxed bg-muted/40 rounded-xl px-4 py-3 border-l-2 border-primary/30 italic mb-4">
                  &ldquo;{post.message}&rdquo;
                </blockquote>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1 flex-wrap">
                    {post.reactions.map((r) =>
                      r.count > 0 ? (
                        <button
                          key={r.type}
                          onClick={() => onReact(post.id, r.type)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            myReactions[post.id] === r.type
                              ? "bg-primary/10 border-primary/40 text-primary"
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
                    {totalReactions === 0 && (
                      <span className="text-xs text-muted-foreground">
                        No reactions yet
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>
                        {post.comments.length}{" "}
                        {post.comments.length === 1 ? "comment" : "comments"}
                      </span>
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {commentsOpen && (
                  <>
                    <Separator className="my-3" />
                    <div className="space-y-3">
                      {post.comments.map((c) => (
                        <div key={c.id} className="flex gap-2.5">
                          <PersonAvatar
                            name={c.authorName}
                            initials={c.authorInitials}
                            className="size-7 shrink-0"
                            fallbackClassName="text-[10px] font-bold bg-muted text-muted-foreground"
                          />
                          <div className="flex-1 bg-muted/40 rounded-xl px-3 py-2">
                            <p className="text-xs font-semibold text-foreground">
                              {c.authorName}
                              <span className="font-normal text-muted-foreground">
                                {" "}
                                · {c.authorDept}
                              </span>
                            </p>
                            <p className="text-xs text-foreground mt-0.5">
                              {c.message}
                            </p>
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <Avatar className="size-7 shrink-0">
                          <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                            HA
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            className="text-xs h-8"
                            placeholder="Add a comment..."
                            value={commentInputs[post.id] ?? ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                commentInputs[post.id]?.trim()
                              ) {
                                onAddComment(
                                  post.id,
                                  commentInputs[post.id].trim(),
                                );
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [post.id]: "",
                                }));
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs shrink-0"
                            disabled={!commentInputs[post.id]?.trim()}
                            onClick={() => {
                              if (commentInputs[post.id]?.trim()) {
                                onAddComment(
                                  post.id,
                                  commentInputs[post.id].trim(),
                                );
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [post.id]: "",
                                }));
                              }
                            }}
                          >
                            Post
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

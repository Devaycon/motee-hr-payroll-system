"use client";

import { useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
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
  Heart,
  MessageCircle,
  Pin,
  Send,
  ThumbsUp,
  Plus,
  PartyPopper,
} from "lucide-react";
import type { CommunityPost, PostType } from "@/src/lib/types/community";
import {
  POSTS,
  CELEBRATIONS,
  POST_TYPE_CONFIG,
  POST_TYPE_OPTIONS,
  CELEBRATION_KIND_CONFIG,
  DEPARTMENT_CONFIG,
  computeFeedStats,
  MY_INITIALS,
  MY_NAME,
  MY_DEPT,
  timeAgo,
  formatDate,
} from "./data";

export function CommunityTab() {
  const [posts, setPosts] = useState<CommunityPost[]>(POSTS);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [typeFilter, setTypeFilter] = useState<PostType | "all">("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPostType, setNewPostType] = useState<PostType>("update");
  const [newPostContent, setNewPostContent] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollOptions, setNewPollOptions] = useState(["", ""]);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});

  const stats = computeFeedStats(posts);

  const filtered = posts.filter((p) => {
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (deptFilter !== "all" && p.authorDept !== deptFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  function toggleLike(postId: string) {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const liked = likedPosts.has(postId);
        return {
          ...p,
          likes: liked
            ? p.likes.filter((l) => l !== MY_INITIALS)
            : [...p.likes, MY_INITIALS],
        };
      }),
    );
  }

  function submitComment(postId: string) {
    const msg = (commentInputs[postId] ?? "").trim();
    if (!msg) return;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `c-new-${Date.now()}`,
              authorName: MY_NAME,
              authorInitials: MY_INITIALS,
              authorDept: MY_DEPT,
              message: msg,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      }),
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  }

  function votePoll(postId: string, optionId: string) {
    if (votedPolls[postId]) return;
    setVotedPolls((prev) => ({ ...prev, [postId]: optionId }));
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || !p.pollOptions) return p;
        return {
          ...p,
          pollOptions: p.pollOptions.map((o) =>
            o.id === optionId ? { ...o, votes: [...o.votes, MY_INITIALS] } : o,
          ),
        };
      }),
    );
  }

  function submitPost() {
    if (!newPostContent.trim()) return;
    const newPost: CommunityPost = {
      id: `post-new-${Date.now()}`,
      type: newPostType,
      authorName: MY_NAME,
      authorInitials: MY_INITIALS,
      authorDept: MY_DEPT,
      content: newPostContent,
      isPinned: false,
      likes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      ...(newPostType === "event" && {
        eventDate: newEventDate,
        eventLocation: newEventLocation,
      }),
      ...(newPostType === "poll" && {
        pollQuestion: newPollQuestion,
        pollOptions: newPollOptions
          .filter((o) => o.trim())
          .map((o, i) => ({ id: `po-new-${i}`, label: o, votes: [] })),
      }),
    };
    setPosts((prev) => [newPost, ...prev]);
    setShowPostForm(false);
    setNewPostContent("");
    setNewEventDate("");
    setNewEventLocation("");
    setNewPollQuestion("");
    setNewPollOptions(["", ""]);
    setNewPostType("update");
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Total Posts",
              value: stats.totalPosts,
              icon: MessageCircle,
            },
            { label: "Total Likes", value: stats.totalLikes, icon: Heart },
            {
              label: "Poll Votes",
              value: stats.totalPollVotes,
              icon: ThumbsUp,
            },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#4361ee]/10">
                  <Icon className="h-4 w-4 text-[#4361ee]" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as PostType | "all")}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Post type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {POST_TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {Object.entries(DEPARTMENT_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={() => setShowPostForm(true)}
            className="bg-[#4361ee] hover:bg-[#3451d1] text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> New Post
          </Button>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted py-16 text-center">
            <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No posts found</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {sorted.map((post) => {
              const typeCfg = POST_TYPE_CONFIG[post.type];
              const isLiked =
                likedPosts.has(post.id) || post.likes.includes(MY_INITIALS);
              const showComments = expandedComments.has(post.id);
              const myVote = votedPolls[post.id];
              const totalVotes =
                post.pollOptions?.reduce((s, o) => s + o.votes.length, 0) ?? 0;

              return (
                <div
                  key={post.id}
                  className={post.isPinned ? "bg-[#4361ee]/5" : "bg-card"}
                >
                  <div className="flex gap-3 px-5 pt-4 pb-3">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarFallback className="bg-[#4361ee]/10 text-[#4361ee] text-sm font-bold">
                        {post.authorInitials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span className="text-sm font-bold text-foreground leading-tight">
                          {post.authorName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {post.authorDept}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          · {timeAgo(post.createdAt)}
                        </span>
                        {post.isPinned && (
                          <span className="flex items-center gap-0.5 text-xs text-[#4361ee]">
                            <Pin className="h-3 w-3" /> Pinned
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium ${typeCfg.color} ${typeCfg.bg} ${typeCfg.border}`}
                        >
                          {typeCfg.label}
                        </span>
                      </div>

                      <p className="text-sm text-foreground mt-1.5 leading-relaxed">
                        {post.content}
                      </p>

                      {post.type === "event" && post.eventDate && (
                        <div className="mt-3 flex flex-wrap gap-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs dark:border-violet-800/60 dark:bg-violet-950/20">
                          <span className="flex items-center gap-1.5 font-medium text-violet-700 dark:text-violet-400">
                            📅 {formatDate(post.eventDate)}
                          </span>
                          {post.eventLocation && (
                            <span className="flex items-center gap-1.5 font-medium text-violet-700 dark:text-violet-400">
                              📍 {post.eventLocation}
                            </span>
                          )}
                        </div>
                      )}

                      {post.type === "poll" && post.pollOptions && (
                        <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/10">
                          {post.pollQuestion && (
                            <p className="text-xs font-semibold text-foreground mb-2">
                              {post.pollQuestion}
                            </p>
                          )}
                          {post.pollOptions.map((opt) => {
                            const pct =
                              totalVotes > 0
                                ? Math.round(
                                    (opt.votes.length / totalVotes) * 100,
                                  )
                                : 0;
                            const isMyVote = myVote === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => votePoll(post.id, opt.id)}
                                disabled={!!myVote}
                                className={`relative w-full overflow-hidden rounded-lg border text-left transition-all ${
                                  isMyVote
                                    ? "border-[#4361ee]"
                                    : "border-amber-200 dark:border-amber-800/60"
                                } ${!myVote ? "hover:border-[#4361ee]/50 cursor-pointer" : "cursor-default"}`}
                              >
                                {myVote && (
                                  <div
                                    className="absolute inset-y-0 left-0 bg-amber-100 dark:bg-amber-900/30"
                                    style={{ width: `${pct}%` }}
                                  />
                                )}
                                <div className="relative flex items-center justify-between px-3 py-2.5">
                                  <span className="text-sm text-foreground">
                                    {opt.label}
                                  </span>
                                  {myVote && (
                                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                                      {pct}%
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                          <p className="text-xs text-muted-foreground pt-1">
                            {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
                            {!myVote && " · Click to vote"}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-5 mt-3">
                        <button
                          onClick={() => toggleLike(post.id)}
                          className={`group flex items-center gap-1.5 text-xs transition-colors ${isLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"}`}
                        >
                          <Heart
                            className={`h-4 w-4 transition-transform group-hover:scale-110 ${isLiked ? "fill-rose-500" : ""}`}
                          />
                          <span>
                            {post.likes.length +
                              (isLiked && !post.likes.includes(MY_INITIALS)
                                ? 1
                                : 0)}{" "}
                            Like
                          </span>
                        </button>
                        <button
                          onClick={() =>
                            setExpandedComments((prev) => {
                              const next = new Set(prev);
                              if (next.has(post.id)) next.delete(post.id);
                              else next.add(post.id);
                              return next;
                            })
                          }
                          className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#4361ee] transition-colors"
                        >
                          <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span>{post.comments.length} Comment</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {showComments && (
                    <div className="border-t border-border px-5 pb-4 pt-3 space-y-3 bg-muted/30">
                      {post.comments.map((c) => (
                        <div key={c.id} className="flex gap-2.5">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="bg-muted text-xs font-semibold">
                              {c.authorInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="rounded-lg bg-card border border-border px-3 py-2">
                              <p className="text-xs font-semibold text-foreground">
                                {c.authorName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {c.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex gap-2.5 pt-1">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-[#4361ee]/10 text-[#4361ee] text-xs font-bold">
                            {MY_INITIALS}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Write a comment…"
                            value={commentInputs[post.id] ?? ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitComment(post.id);
                            }}
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            className="h-8 px-2 bg-[#4361ee] hover:bg-[#3451d1]"
                            onClick={() => submitComment(post.id)}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Feed Stats</p>
          <div className="space-y-2.5">
            {[
              {
                label: "Total Posts",
                value: stats.totalPosts,
                icon: MessageCircle,
                color: "text-[#4361ee]",
                bg: "bg-[#4361ee]/10",
              },
              {
                label: "Reactions",
                value: stats.totalLikes,
                icon: Heart,
                color: "text-rose-500",
                bg: "bg-rose-500/10",
              },
              {
                label: "Poll Votes",
                value: stats.totalPollVotes,
                icon: ThumbsUp,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                </div>
                <span className="text-sm text-muted-foreground flex-1">
                  {label}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {CELEBRATIONS.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-amber-500" />
              Celebrations
            </p>
            <div className="space-y-2">
              {CELEBRATIONS.slice(0, 4).map((c) => {
                const cfg = CELEBRATION_KIND_CONFIG[c.kind];
                return (
                  <div key={c.id} className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                      {c.personInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {c.personName}
                      </p>
                      <p className={`text-[10px] truncate ${cfg.color}`}>
                        {cfg.emoji} {c.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      <Dialog open={showPostForm} onOpenChange={setShowPostForm}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border pr-14">
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Post Type
              </label>
              <Select
                value={newPostType}
                onValueChange={(v) => setNewPostType(v as PostType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Content
              </label>
              <Textarea
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                rows={3}
              />
            </div>
            {newPostType === "event" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Event Date
                  </label>
                  <Input
                    type="date"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Location
                  </label>
                  <Input
                    placeholder="e.g. Conference Room A"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                  />
                </div>
              </>
            )}
            {newPostType === "poll" && (
              <>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">
                    Poll Question
                  </label>
                  <Input
                    placeholder="Ask a question…"
                    value={newPollQuestion}
                    onChange={(e) => setNewPollQuestion(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground block">
                    Options
                  </label>
                  {newPollOptions.map((opt, i) => (
                    <Input
                      key={i}
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const updated = [...newPollOptions];
                        updated[i] = e.target.value;
                        setNewPollOptions(updated);
                      }}
                    />
                  ))}
                  {newPollOptions.length < 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setNewPollOptions((p) => [...p, ""])}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Option
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPostForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitPost}
              disabled={!newPostContent.trim()}
              className="bg-[#4361ee] hover:bg-[#3451d1] text-white"
            >
              Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { Separator } from "@/src/components/ui/separator";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
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
  Trophy,
  Lightbulb,
  ChevronUp,
  Plus,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Flame,
  Star,
  Rocket,
  PartyPopper,
  Search,
  Megaphone,
} from "lucide-react";
import {
  POSTS,
  CELEBRATIONS,
  POST_TYPE_CONFIG,
  POST_TYPE_OPTIONS,
  CELEBRATION_KIND_CONFIG,
  DEPARTMENT_CONFIG,
  computeFeedStats,
} from "@/src/data/community-demo";
import {
  KUDOS_POSTS,
  LEADERBOARD,
  KUDOS_TYPE_CONFIG,
  KUDOS_TYPE_OPTIONS,
  REACTION_ICONS,
  EMPLOYEE_ROSTER,
  COMPANY_VALUE_CONFIG,
} from "@/src/data/kudos-demo";
import {
  SUGGESTIONS,
  SUGGESTION_CATEGORY_CONFIG,
  SUGGESTION_STATUS_CONFIG,
  SUGGESTION_CATEGORY_OPTIONS,
  SUGGESTION_STATUS_OPTIONS,
  computeSuggestionStats,
} from "@/src/data/suggestions-demo";
import type { CommunityPost, PostType } from "@/src/lib/types/community";
import type {
  KudosPost,
  KudosType,
  CompanyValue,
  ReactionType,
} from "@/src/lib/types/kudos";
import type {
  Suggestion,
  SuggestionCategory,
  SuggestionStatus,
} from "@/src/lib/types/suggestions";

const MY_INITIALS = "EN";
const MY_NAME = "Emeka Nwosu";
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

export function EmployeeCommunityPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#7F77DD]/10">
          <Users className="h-5 w-5 text-[#7F77DD]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Community</h1>
          <p className="text-sm text-muted-foreground">
            Connect, recognise, and share ideas with your team
          </p>
        </div>
      </div>

      <Tabs defaultValue="community">
        <PageTabsList
          tabs={[
            { value: "community", label: "Community Feed" },
            { value: "kudos", label: "Kudos" },
            { value: "suggestions", label: "Suggestions" },
          ]}
        />
        <TabsContent value="community" className="mt-6">
          <CommunityTab />
        </TabsContent>
        <TabsContent value="kudos" className="mt-6">
          <KudosTab />
        </TabsContent>
        <TabsContent value="suggestions" className="mt-6">
          <SuggestionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CommunityTab() {
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
                <div className="p-2 rounded-lg bg-[#7F77DD]/10">
                  <Icon className="h-4 w-4 text-[#7F77DD]" />
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
            className="bg-[#7F77DD] hover:bg-[#6b63c4] text-white"
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
                  className={post.isPinned ? "bg-[#7F77DD]/5" : "bg-card"}
                >
                  <div className="flex gap-3 px-5 pt-4 pb-3">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarFallback className="bg-[#7F77DD]/10 text-[#7F77DD] text-sm font-bold">
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
                          <span className="flex items-center gap-0.5 text-xs text-[#7F77DD]">
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
                                    ? "border-[#7F77DD]"
                                    : "border-amber-200 dark:border-amber-800/60"
                                } ${!myVote ? "hover:border-[#7F77DD]/50 cursor-pointer" : "cursor-default"}`}
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
                          className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#7F77DD] transition-colors"
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
                          <AvatarFallback className="bg-[#7F77DD]/10 text-[#7F77DD] text-xs font-bold">
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
                            className="h-8 px-2 bg-[#7F77DD] hover:bg-[#6b63c4]"
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
                color: "text-[#7F77DD]",
                bg: "bg-[#7F77DD]/10",
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
              className="bg-[#7F77DD] hover:bg-[#6b63c4] text-white"
            >
              Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KudosTab() {
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
            <Button size="sm" onClick={() => setShowSendModal(true)}>
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
                      <Avatar className="size-10 ring-2 ring-background">
                        <AvatarFallback
                          className={`text-xs font-bold ${cfg.bg} ${cfg.color}`}
                        >
                          {post.senderInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`-ml-1 z-10 flex items-center justify-center size-6 rounded-full ${cfg.bg} border border-background`}
                      >
                        <cfg.icon className={`size-3.5 ${cfg.color}`} />
                      </div>
                      <Avatar className="size-10 ring-2 ring-background -ml-1">
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {post.recipientInitials}
                        </AvatarFallback>
                      </Avatar>
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
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {entry.initials}
                      </AvatarFallback>
                    </Avatar>
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
              className="flex items-center gap-2"
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

function SuggestionsTab() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(SUGGESTIONS);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [catFilter, setCatFilter] = useState<SuggestionCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus | "all">(
    "all",
  );
  const [sortBy, setSortBy] = useState<"upvotes" | "recent">("upvotes");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<Suggestion | null>(null);
  const [myTab, setMyTab] = useState<"all" | "mine">("all");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<SuggestionCategory>("culture");
  const [newAnon, setNewAnon] = useState(false);

  const stats = computeSuggestionStats(suggestions);

  function toggleUpvote(id: string) {
    setUpvoted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSuggestions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const has = upvoted.has(id);
        return { ...s, upvotes: has ? s.upvotes - 1 : s.upvotes + 1 };
      }),
    );
  }

  function submitSuggestion() {
    if (!newTitle.trim() || !newDesc.trim()) return;
    const ns: Suggestion = {
      id: `SUG-NEW-${Date.now()}`,
      title: newTitle,
      description: newDesc,
      category: newCat,
      status: "submitted",
      priority: "medium",
      isAnonymous: newAnon,
      submitterName: newAnon ? undefined : MY_NAME,
      submitterInitials: newAnon ? undefined : MY_INITIALS,
      submitterDept: newAnon ? undefined : MY_DEPT,
      upvotes: 0,
      upvotedBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFeatured: false,
      isTrending: false,
    };
    setSuggestions((prev) => [ns, ...prev]);
    setShowSubmitModal(false);
    setNewTitle("");
    setNewDesc("");
    setNewCat("culture");
    setNewAnon(false);
  }

  let list = suggestions.filter((s) => {
    if (catFilter !== "all" && s.category !== catFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (myTab === "mine" && s.submitterInitials !== MY_INITIALS) return false;
    return true;
  });

  list = [...list].sort((a, b) =>
    sortBy === "upvotes"
      ? b.upvotes - a.upvotes
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Suggestions", value: stats.total, icon: Lightbulb },
          { label: "Implemented", value: stats.implemented, icon: CheckCircle },
          { label: "Under Review", value: stats.underReview, icon: Clock },
          { label: "Avg Upvotes", value: stats.avgUpvotes, icon: ChevronUp },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#7F77DD]/10">
                <Icon className="h-4 w-4 text-[#7F77DD]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 border border-border rounded-lg p-0.5">
          {(["all", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMyTab(t)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                myTab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t === "all" ? "All Suggestions" : "My Submissions"}
            </button>
          ))}
        </div>
        <Select
          value={catFilter}
          onValueChange={(v) => setCatFilter(v as SuggestionCategory | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {SUGGESTION_CATEGORY_OPTIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {SUGGESTION_CATEGORY_CONFIG[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as SuggestionStatus | "all")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {SUGGESTION_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {SUGGESTION_STATUS_CONFIG[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as "upvotes" | "recent")}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="upvotes">Most Upvoted</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() => setShowSubmitModal(true)}
          className="bg-[#7F77DD] hover:bg-[#6b63c4] text-white"
        >
          <Plus className="h-4 w-4 mr-1" /> Submit Suggestion
        </Button>
      </div>

      <div className="space-y-3">
        {list.map((s) => {
          const catCfg = SUGGESTION_CATEGORY_CONFIG[s.category];
          const statusCfg = SUGGESTION_STATUS_CONFIG[s.status];
          const hasUpvoted = upvoted.has(s.id);
          const isTrending = s.isTrending;
          const isFeatured = s.isFeatured;

          return (
            <Card
              key={s.id}
              className="cursor-pointer bg-card border-border hover:border-primary/40 transition-colors"
              onClick={() => setSelectedSuggestion(s)}
            >
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUpvote(s.id);
                    }}
                    className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg border transition-colors shrink-0 ${
                      hasUpvoted
                        ? "bg-[#7F77DD]/10 border-[#7F77DD]/40 text-[#7F77DD]"
                        : "border-border text-muted-foreground hover:border-[#7F77DD]/40"
                    }`}
                  >
                    <ChevronUp
                      className={`h-4 w-4 ${hasUpvoted ? "fill-[#7F77DD]" : ""}`}
                    />
                    <span className="text-xs font-bold">
                      {s.upvotes +
                        (hasUpvoted && !s.upvotedBy.includes("current")
                          ? 1
                          : 0)}
                    </span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-foreground">
                        {s.title}
                      </span>
                      {isFeatured && (
                        <Flame className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      {isTrending && (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {s.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs ${catCfg.color} ${catCfg.bg} ${catCfg.border}`}
                      >
                        {catCfg.label}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </Badge>
                      {s.isAnonymous ? (
                        <span className="text-xs text-muted-foreground">
                          Anonymous
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {s.submitterName}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(s.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {list.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No suggestions match your filters.
          </div>
        )}
      </div>

      <Dialog
        open={!!selectedSuggestion}
        onOpenChange={() => setSelectedSuggestion(null)}
      >
        {selectedSuggestion && (
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base leading-snug">
                {selectedSuggestion.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="flex gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-xs ${SUGGESTION_CATEGORY_CONFIG[selectedSuggestion.category].color} ${SUGGESTION_CATEGORY_CONFIG[selectedSuggestion.category].bg} ${SUGGESTION_CATEGORY_CONFIG[selectedSuggestion.category].border}`}
                >
                  {
                    SUGGESTION_CATEGORY_CONFIG[selectedSuggestion.category]
                      .label
                  }
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs ${SUGGESTION_STATUS_CONFIG[selectedSuggestion.status].color} ${SUGGESTION_STATUS_CONFIG[selectedSuggestion.status].bg} ${SUGGESTION_STATUS_CONFIG[selectedSuggestion.status].border}`}
                >
                  {SUGGESTION_STATUS_CONFIG[selectedSuggestion.status].label}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {selectedSuggestion.upvotes} upvotes
                </span>
              </div>

              <p className="text-sm text-foreground leading-relaxed">
                {selectedSuggestion.description}
              </p>

              <div className="text-xs text-muted-foreground flex gap-4">
                <span>
                  By:{" "}
                  {selectedSuggestion.isAnonymous
                    ? "Anonymous"
                    : selectedSuggestion.submitterName}
                </span>
                <span>
                  Submitted: {formatDate(selectedSuggestion.createdAt)}
                </span>
              </div>

              {selectedSuggestion.adminResponse && (
                <>
                  <Separator />
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">
                      HR Response
                    </p>
                    <p className="text-xs text-foreground">
                      {selectedSuggestion.adminResponse}
                    </p>
                  </div>
                </>
              )}

              {selectedSuggestion.comments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">
                      Comments
                    </p>
                    {selectedSuggestion.comments.map((c) => (
                      <div
                        key={c.id}
                        className={`p-2 rounded-lg text-xs ${c.isAdmin ? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800" : "bg-muted/40"}`}
                      >
                        <p className="font-medium text-foreground">
                          {c.authorName}{" "}
                          {c.isAdmin && (
                            <span className="text-blue-600 dark:text-blue-400">
                              (HR)
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground mt-0.5">
                          {c.message}
                        </p>
                        <p className="text-muted-foreground mt-0.5">
                          {formatDate(c.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit a Suggestion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Title
              </label>
              <Input
                placeholder="Brief title for your suggestion"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Description
              </label>
              <Textarea
                placeholder="Describe your idea in detail…"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">
                Category
              </label>
              <Select
                value={newCat}
                onValueChange={(v) => setNewCat(v as SuggestionCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUGGESTION_CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {SUGGESTION_CATEGORY_CONFIG[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anon-toggle"
                checked={newAnon}
                onChange={(e) => setNewAnon(e.target.checked)}
                className="rounded"
              />
              <label
                htmlFor="anon-toggle"
                className="text-xs text-muted-foreground"
              >
                Submit anonymously
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowSubmitModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitSuggestion}
                disabled={!newTitle.trim() || !newDesc.trim()}
                className="bg-[#7F77DD] hover:bg-[#6b63c4] text-white"
              >
                Submit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

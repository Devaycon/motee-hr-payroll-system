"use client";

import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Pin,
  PinOff,
  Trash2,
  MoreHorizontal,
  Search,
  CalendarDays,
  MapPin,
  BarChart3,
  SlidersHorizontal,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { POST_TYPE_CONFIG, POST_TYPE_OPTIONS } from "../data";
import type { CommunityPost, PostComment } from "../types";

interface CommunityFeedProps {
  posts: CommunityPost[];
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onLike: (id: string) => void;
  onComment: (id: string, message: string) => void;
  onPollVote: (postId: string, optionId: string) => void;
}

const CURRENT_USER = "You";

export function CommunityFeed({
  posts,
  onDelete,
  onTogglePin,
  onLike,
  onComment,
  onPollVote,
}: CommunityFeedProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set(),
  );
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>(
    {},
  );
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});

  const pinned = posts.filter((p) => p.isPinned);
  const regular = posts
    .filter((p) => !p.isPinned)
    .filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || p.content.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || p.type === typeFilter;
      return matchSearch && matchType;
    });

  const filteredPinned = pinned.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.content.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  function toggleComments(id: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCommentSubmit(postId: string) {
    const msg = (commentInputs[postId] ?? "").trim();
    if (!msg) return;
    onComment(postId, msg);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    toast.success("Comment posted.");
  }

  function handleVote(postId: string, optionId: string) {
    if (votedPolls[postId]) return;
    setVotedPolls((prev) => ({ ...prev, [postId]: optionId }));
    onPollVote(postId, optionId);
    toast.success("Vote recorded!");
  }

  function handleDeleteConfirm() {
    if (!deleteId) return;
    onDelete(deleteId);
    toast.success("Post deleted.");
    setDeleteId(null);
  }

  const allFiltered = [...filteredPinned, ...regular];

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44">
              <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {POST_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {allFiltered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted py-16 text-center">
            <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No posts found</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {allFiltered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isCommentExpanded={expandedComments.has(post.id)}
                commentInput={commentInputs[post.id] ?? ""}
                votedOption={votedPolls[post.id]}
                currentUser={CURRENT_USER}
                onToggleComments={() => toggleComments(post.id)}
                onCommentChange={(v) =>
                  setCommentInputs((prev) => ({ ...prev, [post.id]: v }))
                }
                onCommentSubmit={() => handleCommentSubmit(post.id)}
                onLike={() => onLike(post.id)}
                onVote={(optId) => handleVote(post.id, optId)}
                onPin={() => {
                  onTogglePin(post.id);
                  toast.success(
                    post.isPinned ? "Post unpinned." : "Post pinned.",
                  );
                }}
                onDelete={() => setDeleteId(post.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently removed
              from the feed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface PostCardProps {
  post: CommunityPost;
  isCommentExpanded: boolean;
  commentInput: string;
  votedOption: string | undefined;
  currentUser: string;
  onToggleComments: () => void;
  onCommentChange: (v: string) => void;
  onCommentSubmit: () => void;
  onLike: () => void;
  onVote: (optionId: string) => void;
  onPin: () => void;
  onDelete: () => void;
}

function PostCard({
  post,
  isCommentExpanded,
  commentInput,
  votedOption,
  currentUser,
  onToggleComments,
  onCommentChange,
  onCommentSubmit,
  onLike,
  onVote,
  onPin,
  onDelete,
}: PostCardProps) {
  const typeCfg = POST_TYPE_CONFIG[post.type];
  const hasLiked = post.likes.includes(currentUser);
  const totalPollVotes =
    post.pollOptions?.reduce((s, o) => s + o.votes.length, 0) ?? 0;

  return (
    <div
      className={
        post.isPinned ? "bg-indigo-50/40 dark:bg-indigo-950/10" : "bg-card"
      }
    >
      <div className="flex gap-3 px-5 pt-4 pb-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          {post.authorInitials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0">
              <span className="text-sm font-bold text-foreground leading-tight">
                {post.authorName}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                Â· {post.authorDept}
              </span>
              <span className="text-xs text-muted-foreground leading-tight">
                Â· {post.createdAt}
              </span>
              {post.isPinned && (
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-1.5 py-px text-[10px] font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Pin className="h-2.5 w-2.5" />
                  Pinned
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium ${typeCfg.bg} ${typeCfg.color} ${typeCfg.border}`}
              >
                {typeCfg.label}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 -mr-1 -mt-0.5"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onPin}>
                  {post.isPinned ? (
                    <PinOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Pin className="mr-2 h-4 w-4" />
                  )}
                  {post.isPinned ? "Unpin Post" : "Pin Post"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <p className="mt-1.5 text-sm leading-relaxed text-foreground whitespace-pre-line">
            {post.content}
          </p>

          {post.type === "event" && (post.eventDate || post.eventLocation) && (
            <div className="mt-3 flex flex-wrap gap-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs dark:border-violet-800/60 dark:bg-violet-950/20">
              {post.eventDate && (
                <span className="flex items-center gap-1.5 font-medium text-violet-700 dark:text-violet-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {post.eventDate}
                </span>
              )}
              {post.eventLocation && (
                <span className="flex items-center gap-1.5 font-medium text-violet-700 dark:text-violet-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {post.eventLocation}
                </span>
              )}
            </div>
          )}

          {post.type === "poll" && post.pollOptions && (
            <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/60 dark:bg-amber-950/10">
              {post.pollQuestion && (
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="text-sm font-semibold text-foreground">
                    {post.pollQuestion}
                  </p>
                </div>
              )}
              {post.pollOptions.map((opt) => {
                const pct =
                  totalPollVotes > 0
                    ? Math.round((opt.votes.length / totalPollVotes) * 100)
                    : 0;
                const isVoted = votedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onVote(opt.id)}
                    disabled={!!votedOption}
                    className={`relative w-full overflow-hidden rounded-lg border text-left transition-all ${
                      isVoted
                        ? "border-amber-400 dark:border-amber-600"
                        : "border-amber-200 dark:border-amber-800/60"
                    } ${!votedOption ? "hover:border-amber-400 cursor-pointer" : "cursor-default"}`}
                  >
                    {votedOption && (
                      <div
                        className="absolute inset-y-0 left-0 bg-amber-100 dark:bg-amber-900/30 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    )}
                    <div className="relative flex items-center justify-between px-3 py-2.5">
                      <span className="text-sm text-foreground">
                        {opt.label}
                      </span>
                      {votedOption && (
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                          {pct}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              <p className="text-xs text-muted-foreground pt-1">
                {totalPollVotes} vote{totalPollVotes !== 1 ? "s" : ""}
                {!votedOption && " Â· Click to vote"}
              </p>
            </div>
          )}

          <div className="mt-3 flex items-center gap-5">
            <button
              type="button"
              onClick={onLike}
              className={`group flex items-center gap-1.5 text-xs transition-colors ${
                hasLiked
                  ? "text-pink-600 dark:text-pink-400"
                  : "text-muted-foreground hover:text-pink-600 dark:hover:text-pink-400"
              }`}
            >
              <Heart
                className={`h-4 w-4 transition-transform group-hover:scale-110 ${hasLiked ? "fill-pink-500" : ""}`}
              />
              <span>{post.likes.length > 0 ? post.likes.length : ""} Like</span>
            </button>
            <button
              type="button"
              onClick={onToggleComments}
              className="group flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
              <span>
                {post.comments.length > 0 ? post.comments.length : ""} Comment
              </span>
            </button>
          </div>
        </div>
      </div>

      {isCommentExpanded && (
        <div className="border-t border-border px-5 pb-4 pt-3 space-y-3 bg-muted/30">
          {post.comments.length > 0 && (
            <div className="space-y-3">
              {post.comments.map((c: PostComment) => (
                <CommentItem key={c.id} comment={c} />
              ))}
            </div>
          )}
          <div className="flex gap-2.5 items-start pt-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              HA
            </div>
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={commentInput}
                onChange={(e) => onCommentChange(e.target.value)}
                rows={1}
                className="resize-none text-sm"
              />
              <Button
                size="sm"
                onClick={onCommentSubmit}
                disabled={!commentInput.trim()}
                className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: PostComment }) {
  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        {comment.authorInitials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-lg bg-card border border-border px-3 py-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-foreground">
              {comment.authorName}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {comment.authorDept}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-foreground">
            {comment.message}
          </p>
        </div>
        <p className="mt-0.5 pl-1 text-[10px] text-muted-foreground">
          {comment.createdAt}
        </p>
      </div>
    </div>
  );
}

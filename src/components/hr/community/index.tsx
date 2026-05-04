"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  PartyPopper,
  BookUser,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { POSTS, CELEBRATIONS, DIRECTORY_EMPLOYEES } from "./data";
import { computeFeedStats } from "./data";
import type { CommunityPost, NewPost } from "./types";
import { CommunityFeed } from "./components/community-feed";
import { Celebrations } from "./components/celebrations";
import { Directory } from "./components/directory";
import { PostFormModal } from "./components/post-form-modal";

export function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(POSTS);
  const [formOpen, setFormOpen] = useState(false);

  const handleCreate = (newPost: NewPost) => {
    const pollOptions =
      newPost.type === "poll" && newPost.pollOptions
        ? newPost.pollOptions.map((label, i) => ({
            id: `opt-new-${i}`,
            label,
            votes: [] as string[],
          }))
        : undefined;

    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      type: newPost.type,
      authorName: "You",
      authorInitials: "YO",
      authorDept: "hr",
      content: newPost.content,
      isPinned: false,
      likes: [],
      comments: [],
      eventDate: newPost.eventDate,
      eventLocation: newPost.eventLocation,
      pollQuestion: newPost.pollQuestion,
      pollOptions,
      celebrationKind: newPost.celebrationKind as
        | import("@/src/lib/types/community").CelebrationKind
        | undefined,
      celebrationPerson: newPost.celebrationPerson,
      celebrationDetail: newPost.celebrationDetail,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setPosts((prev) => [post, ...prev]);
  };

  const handleDelete = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleTogglePin = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p)),
    );
  };

  const CURRENT_USER = "You";

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const hasLiked = p.likes.includes(CURRENT_USER);
        return {
          ...p,
          likes: hasLiked
            ? p.likes.filter((u) => u !== CURRENT_USER)
            : [...p.likes, CURRENT_USER],
        };
      }),
    );
  };

  const handleComment = (id: string, message: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `comment-${Date.now()}`,
              authorName: "You",
              authorInitials: "YO",
              authorDept: "hr",
              message,
              createdAt: new Date().toISOString().slice(0, 10),
            },
          ],
        };
      }),
    );
  };

  const handlePollVote = (postId: string, optionId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId || !p.pollOptions) return p;
        return {
          ...p,
          pollOptions: p.pollOptions.map((opt) => ({
            ...opt,
            votes:
              opt.id === optionId
                ? opt.votes.includes(CURRENT_USER)
                  ? opt.votes
                  : [...opt.votes, CURRENT_USER]
                : opt.votes.filter((v) => v !== CURRENT_USER),
          })),
        };
      }),
    );
  };

  const stats = computeFeedStats(posts);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Community</h1>
            <p className="text-sm text-muted-foreground">
              Connect, celebrate, and engage with your team
            </p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)} className="shrink-0" size={"lg"}>
          <Plus className="mr-2 h-4 w-4" />
          New Post
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="feed">
            <PageTabsList
              tabs={[
                { value: "feed", label: "Feed" },
                { value: "celebrations", label: "Celebrations" },
                { value: "directory", label: "Directory" },
              ]}
            />

            <TabsContent value="feed" className="mt-5">
              <CommunityFeed
                posts={posts}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
                onLike={handleLike}
                onComment={handleComment}
                onPollVote={handlePollVote}
              />
            </TabsContent>

            <TabsContent value="celebrations" className="mt-5">
              <Celebrations celebrations={CELEBRATIONS} />
            </TabsContent>

            <TabsContent value="directory" className="mt-5">
              <Directory employees={DIRECTORY_EMPLOYEES} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">
              Community Stats
            </p>
            <div className="space-y-2.5">
              {[
                {
                  label: "Team Members",
                  value: DIRECTORY_EMPLOYEES.length,
                  icon: Users,
                  color: "text-indigo-500",
                  bg: "bg-indigo-500/10",
                },
                {
                  label: "Total Posts",
                  value: stats.totalPosts,
                  icon: MessageSquare,
                  color: "text-violet-500",
                  bg: "bg-violet-500/10",
                },
                {
                  label: "Reactions",
                  value: stats.totalLikes,
                  icon: ThumbsUp,
                  color: "text-pink-500",
                  bg: "bg-pink-500/10",
                },
                {
                  label: "Poll Votes",
                  value: stats.totalPollVotes,
                  icon: BarChart3,
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

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-amber-500" />
              This Month
            </p>
            <div className="space-y-2">
              {CELEBRATIONS.filter((c) => c.date.startsWith("2026-04"))
                .slice(0, 4)
                .map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                      {c.personInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {c.personName}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {c.headline}
                      </p>
                    </div>
                  </div>
                ))}
              {CELEBRATIONS.filter((c) => c.date.startsWith("2026-04"))
                .length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No celebrations this month.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <BookUser className="h-4 w-4 text-indigo-500" />
              Active Members
            </p>
            <div className="flex flex-wrap gap-2">
              {DIRECTORY_EMPLOYEES.slice(0, 8).map((e) => (
                <div
                  key={e.id}
                  title={e.name}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                >
                  {e.initials}
                </div>
              ))}
              {DIRECTORY_EMPLOYEES.length > 8 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  +{DIRECTORY_EMPLOYEES.length - 8}
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <PostFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { Star, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { StatCards } from "./components/stat-cards";
import { KudosFeed } from "./components/kudos-feed";
import { Leaderboard } from "./components/leaderboard";
import { SendKudosModal } from "./components/send-kudos-modal";
import { KUDOS_POSTS, LEADERBOARD } from "./data";
import type { KudosPost, NewKudos, ReactionType } from "./types";

export function KudosPage() {
  const [posts, setPosts] = useState<KudosPost[]>(KUDOS_POSTS);
  const [leaderboard] = useState(LEADERBOARD);
  const [sendOpen, setSendOpen] = useState(false);
  const [myReactions, setMyReactions] = useState<
    Record<string, ReactionType | null>
  >({});

  function handleSendKudos(data: NewKudos) {
    const now = new Date().toISOString().split("T")[0];
    const id = `KUD-${String(posts.length + 1).padStart(3, "0")}`;
    const newPost: KudosPost = {
      id,
      senderName: "HR Admin",
      senderInitials: "HA",
      senderDept: "HR",
      recipientName: data.recipientName,
      recipientInitials: data.recipientInitials,
      recipientDept: data.recipientDept,
      kudosType: data.kudosType,
      customTypeName: data.customTypeName,
      companyValue: data.companyValue,
      message: data.message,
      isBroadcast: data.isBroadcast,
      isPinned: data.isBroadcast,
      isPublic: !data.isPrivate,
      isPrivate: data.isPrivate,
      reactions: [
        { type: "heart", count: 0, reactedBy: [], users: [] },
        { type: "celebrate", count: 0, reactedBy: [], users: [] },
        { type: "clap", count: 0, reactedBy: [], users: [] },
        { type: "fire", count: 0, reactedBy: [], users: [] },
        { type: "star", count: 0, reactedBy: [], users: [] },
      ],
      comments: [],
      createdAt: now,
    };
    setPosts((prev) => [newPost, ...prev]);
    setSendOpen(false);
    toast.success(`Kudos sent to ${data.recipientName}! 🌟`);
  }

  function handleReact(postId: string, reaction: ReactionType) {
    const prev = myReactions[postId] ?? null;
    const isSame = prev === reaction;
    const next = isSame ? null : reaction;
    setMyReactions((m) => ({ ...m, [postId]: next }));
    setPosts((posts) =>
      posts.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          reactions: p.reactions.map((r) => {
            if (r.type === prev && prev !== null) {
              return {
                ...r,
                count: Math.max(0, r.count - 1),
                reactedBy: r.reactedBy.filter((x) => x !== "You"),
              };
            }
            if (r.type === reaction && !isSame) {
              return {
                ...r,
                count: r.count + 1,
                reactedBy: [...r.reactedBy, "You"],
              };
            }
            return r;
          }),
        };
      }),
    );
  }

  function handleAddComment(postId: string, message: string) {
    const now = new Date().toISOString().split("T")[0];
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `C-${postId}-${p.comments.length + 1}`,
              authorName: "HR Admin",
              authorInitials: "HA",
              authorDept: "HR",
              message,
              createdAt: now,
            },
          ],
        };
      }),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-4xl font-semibold text-foreground">
              Kudos & Recognition
            </h1>
            <p className="text-sm text-muted-foreground">
              Celebrate your colleagues and build a culture of appreciation
            </p>
          </div>
        </div>
        <Button
          onClick={() => setSendOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Send Kudos
        </Button>
      </div>

      <StatCards posts={posts} />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
        <KudosFeed
          posts={posts}
          onReact={handleReact}
          myReactions={myReactions}
          onAddComment={handleAddComment}
        />
        <Leaderboard entries={leaderboard} />
      </div>

      <SendKudosModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSave={handleSendKudos}
      />
    </div>
  );
}

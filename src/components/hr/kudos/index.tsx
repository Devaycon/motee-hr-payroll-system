"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useKudos } from "./hooks";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import {
  StatCards,
  matchesKudosCardFilter,
  kudosCardFilterLabel,
  type KudosCardFilter,
} from "./components/stat-cards";
import { KudosFeed } from "./components/kudos-feed";
import { Leaderboard } from "./components/leaderboard";
import { SendKudosModal } from "./components/send-kudos-modal";
import type { KudosPost, NewKudos, ReactionType } from "./types";

export function KudosPage() {
  const { data, loading } = useKudos();
  const [posts, setPosts] = useState<KudosPost[]>([]);
  const leaderboard = data?.leaderboard ?? [];
  useEffect(() => {
    if (data) setPosts(data.posts);
  }, [data]);
  const [sendOpen, setSendOpen] = useState(false);
  /** Drill-down set by the KPI cards; "all" shows the whole feed. */
  const [cardFilter, setCardFilter] = useState<KudosCardFilter>({
    kind: "all",
  });
  const visiblePosts = posts.filter((p) =>
    matchesKudosCardFilter(p, cardFilter),
  );
  const [myReactions, setMyReactions] = useState<
    Record<string, ReactionType | null>
  >({});
  const user = useAppSelector((s) => s.auth.user);
  // HR admins can moderate (delete) any kudos; demo links (no user) fall open.
  const canDelete = !user || user.roleId === "ROLE-HRADMIN";
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleDeleteKudos(postId: string) {
    setConfirmDeleteId(postId);
  }

  function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    setPosts((prev) => prev.filter((p) => p.id !== confirmDeleteId));
    setConfirmDeleteId(null);
    toast.success("Kudos deleted");
  }

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

  if (loading && !posts.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
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

      <StatCards
        posts={posts}
        cardFilter={cardFilter}
        onDrillDown={setCardFilter}
      />

      {cardFilter.kind !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {kudosCardFilterLabel(cardFilter)}{" "}
            <span className="text-muted-foreground">
              ({visiblePosts.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter({ kind: "all" })}
          >
            ← Whole feed
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6 items-start">
        <KudosFeed
          posts={visiblePosts}
          onReact={handleReact}
          myReactions={myReactions}
          onAddComment={handleAddComment}
          canDelete={canDelete}
          onDelete={handleDeleteKudos}
        />
        <Leaderboard entries={leaderboard} />
      </div>

      <SendKudosModal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        onSave={handleSendKudos}
      />

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(o) => { if (!o) setConfirmDeleteId(null); }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete kudos?</AlertDialogTitle>
            <AlertDialogDescription>
              This kudos post will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

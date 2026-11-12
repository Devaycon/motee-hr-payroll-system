"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useKudos, useKudosActions } from "./hooks";
import { Plus, Trash2 } from "lucide-react";
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
import type { NewKudos, ReactionType } from "./types";

export function KudosPage() {
  const { data, loading } = useKudos();
  const posts = useMemo(() => data?.posts ?? [], [data]);
  const leaderboard = data?.leaderboard ?? [];
  const myReactions = data?.myReactions ?? {};
  const { send, remove, toggleReaction, addComment } = useKudosActions(posts);
  const [sendOpen, setSendOpen] = useState(false);
  /** Drill-down set by the KPI cards; "all" shows the whole feed. */
  const [cardFilter, setCardFilter] = useState<KudosCardFilter>({
    kind: "all",
  });
  const visiblePosts = posts.filter((p) =>
    matchesKudosCardFilter(p, cardFilter),
  );
  // The server decides who may moderate: HR admins and each post's sender.
  const canDelete = (postId: string) => !!data?.canRemove[postId];
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function handleDeleteKudos(postId: string) {
    setConfirmDeleteId(postId);
  }

  function handleConfirmDelete() {
    if (!confirmDeleteId) return;
    void remove(confirmDeleteId);
    setConfirmDeleteId(null);
  }

  async function handleSendKudos(form: NewKudos) {
    if (await send(form)) setSendOpen(false);
  }

  function handleReact(postId: string, reaction: ReactionType) {
    void toggleReaction(postId, reaction);
  }

  function handleAddComment(postId: string, message: string) {
    void addComment(postId, message);
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
        leaderboard={data ? leaderboard : undefined}
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

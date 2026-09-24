"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/src/components/ui/skeleton";
import { usePerformance, usePerformanceActions } from "./hooks";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  StatCards,
  matchesReviewCardFilter,
  matchesGoalCardFilter,
  PERFORMANCE_CARD_FILTER_LABELS,
  type PerformanceCardFilter,
} from "./components/stat-cards";
import { Button } from "@/src/components/ui/button";
import { ReviewsTable } from "./components/reviews-table";
import { GoalsTable } from "./components/goals-table";
import { ReviewModal } from "./components/review-modal";
import { GoalModal } from "./components/goal-modal";
import type {
  PerformanceReview,
  PerformanceGoal,
  NewReview,
  NewGoal,
  PerformanceRating,
  GoalStatus,
} from "./types";

export function PerformancePage() {
  const { data, loading } = usePerformance();
  const actions = usePerformanceActions();
  const reviews = data?.reviews ?? [];
  const goals = data?.goals ?? [];
  const departments = data?.departments ?? [];

  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("reviews");
  /** Drill-down set by the KPI cards; "all" shows every row. */
  const [cardFilter, setCardFilter] = useState<PerformanceCardFilter>("all");

  const visibleReviews = reviews.filter((r) =>
    matchesReviewCardFilter(r, cardFilter),
  );
  const visibleGoals = goals.filter((g) =>
    matchesGoalCardFilter(g, cardFilter),
  );

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  // Read from the live list so the modal reflects edits made while it's open.
  const viewingReview = viewingId
    ? (reviews.find((r) => r.id === viewingId) ?? null)
    : null;

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);

  function handleAddReview() {
    setViewingId(null);
    setReviewModalOpen(true);
  }

  function handleViewReview(review: PerformanceReview) {
    setViewingId(review.id);
    setReviewModalOpen(true);
  }

  function handleSaveReview(input: NewReview) {
    actions.createReview(input);
    toast.success(`Review created for ${input.employeeName}.`);
  }

  function handleCompleteReview(
    id: string,
    input: {
      rating: PerformanceRating;
      strengths?: string;
      improvements?: string;
      comments?: string;
    },
  ) {
    actions.completeReview(id, input);
    toast.success("Review marked as complete.");
  }

  function handleDeleteReview(id: string) {
    actions.deleteReview(id);
    toast.success("Review deleted.");
  }

  function handleAddGoal() {
    setEditingGoal(null);
    setGoalModalOpen(true);
  }

  function handleEditGoal(goal: PerformanceGoal) {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  }

  function handleSaveGoal(input: NewGoal) {
    actions.createGoal(input);
    toast.success(`Goal added for ${input.employeeName}.`);
  }

  function handleUpdateGoal(
    id: string,
    updates: { progress: number; status: GoalStatus },
  ) {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    actions.updateGoalProgress(goal, updates);
    toast.success("Goal updated.");
  }

  function handleDeleteGoal(id: string) {
    actions.deleteGoal(id);
    toast.success("Goal deleted.");
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold">Performance Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track performance reviews, ratings, and employee goals across your
          organisation.
        </p>
      </div>

      <StatCards
        reviews={reviews}
        goals={goals}
        cardFilter={cardFilter}
        onDrillDown={(tab, filter) => {
          setActiveTab(tab);
          setCardFilter(filter);
        }}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {PERFORMANCE_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              (
              {cardFilter === "goals_on_track"
                ? visibleGoals.length
                : visibleReviews.length}
              )
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← Show all
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "reviews", label: `Reviews (${visibleReviews.length})` },
            { value: "goals", label: `Goals (${visibleGoals.length})` },
          ]}
        />

        <TabsContent value="reviews" className="mt-4">
          <ReviewsTable
            reviews={visibleReviews}
            departments={departments}
            onView={handleViewReview}
            onDelete={handleDeleteReview}
            onAddReview={handleAddReview}
          />
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <GoalsTable
            goals={visibleGoals}
            departments={departments}
            onEdit={handleEditGoal}
            onDelete={handleDeleteGoal}
            onAddGoal={handleAddGoal}
          />
        </TabsContent>
      </Tabs>

      <ReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        viewingReview={viewingReview}
        departments={departments}
        onSave={handleSaveReview}
        onComplete={handleCompleteReview}
      />

      <GoalModal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        editingGoal={editingGoal}
        departments={departments}
        onSave={handleSaveGoal}
        onUpdate={handleUpdateGoal}
      />
    </div>
  );
}

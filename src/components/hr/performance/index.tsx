"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { usePerformance } from "./hooks";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { StatCards } from "./components/stat-cards";
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
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  useEffect(() => {
    if (data) {
      setReviews(data.reviews);
      setGoals(data.goals);
    }
  }, [data]);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [viewingReview, setViewingReview] = useState<PerformanceReview | null>(
    null,
  );

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);

  function handleAddReview() {
    setViewingReview(null);
    setReviewModalOpen(true);
  }

  function handleViewReview(review: PerformanceReview) {
    setViewingReview(review);
    setReviewModalOpen(true);
  }

  function handleSaveReview(data: NewReview) {
    const newReview: PerformanceReview = {
      ...data,
      id: `pr-${Date.now()}`,
      status: "not_started",
    };
    setReviews((prev) => [newReview, ...prev]);
  }

  function handleCompleteReview(
    id: string,
    data: {
      rating: PerformanceRating;
      strengths?: string;
      improvements?: string;
      comments?: string;
    },
  ) {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "completed",
              rating: data.rating,
              strengths: data.strengths,
              improvements: data.improvements,
              comments: data.comments,
              completedDate: new Date().toISOString().split("T")[0],
            }
          : r,
      ),
    );
  }

  function handleDeleteReview(id: string) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  function handleAddGoal() {
    setEditingGoal(null);
    setGoalModalOpen(true);
  }

  function handleEditGoal(goal: PerformanceGoal) {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  }

  function handleSaveGoal(data: NewGoal) {
    const today = new Date().toISOString().split("T")[0];
    const newGoal: PerformanceGoal = {
      ...data,
      id: `pg-${Date.now()}`,
      progress: 0,
      status: "on_track",
      createdAt: today,
    };
    setGoals((prev) => [newGoal, ...prev]);
  }

  function handleUpdateGoal(
    id: string,
    updates: { progress: number; status: GoalStatus },
  ) {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    );
  }

  function handleDeleteGoal(id: string) {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }

  if (loading && !reviews.length && !goals.length) {
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

      <StatCards reviews={reviews} goals={goals} />

      <Tabs defaultValue="reviews">
        <PageTabsList
          tabs={[
            { value: "reviews", label: `Reviews (${reviews.length})` },
            { value: "goals", label: `Goals (${goals.length})` },
          ]}
        />

        <TabsContent value="reviews" className="mt-4">
          <ReviewsTable
            reviews={reviews}
            onView={handleViewReview}
            onDelete={handleDeleteReview}
            onAddReview={handleAddReview}
          />
        </TabsContent>

        <TabsContent value="goals" className="mt-4">
          <GoalsTable
            goals={goals}
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
        onSave={handleSaveReview}
        onComplete={handleCompleteReview}
      />

      <GoalModal
        open={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        editingGoal={editingGoal}
        onSave={handleSaveGoal}
        onUpdate={handleUpdateGoal}
      />
    </div>
  );
}

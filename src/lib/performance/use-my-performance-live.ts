"use client";

/**
 * Self-service performance on the API: your goals (`/performance/goals/mine`)
 * and reviews (`/performance/reviews/mine`), and the writes the My Performance
 * page makes. Null data signed out (the page keeps the demo records).
 */
import { useMemo } from "react";
import { useIsLive, useLiveSender } from "@/src/lib/live/use-is-live";
import { goalToRequest, toPerformanceGoal, toPerformanceReview } from "./api-mapping";
import {
  useAskForFeedbackMutation,
  useCreateMyGoalMutation,
  useGetMyGoalsQuery,
  useGetMyReviewsQuery,
  useSaveSelfAssessmentMutation,
  useSubmitSelfAssessmentMutation,
  useUpdateGoalProgressMutation,
} from "@/src/store/services/performance";
import type {
  NewGoal,
  PerformanceGoal,
  PerformanceRating,
  PerformanceReview,
  SelfAssessment,
} from "@/src/lib/types/performance";

export function useMyPerformanceLive(): {
  live: boolean;
  goals: PerformanceGoal[] | null;
  reviews: PerformanceReview[] | null;
} {
  const live = useIsLive();
  const goalsQ = useGetMyGoalsQuery(undefined, { skip: !live });
  const reviewsQ = useGetMyReviewsQuery(undefined, { skip: !live });
  return useMemo(
    () => ({
      live,
      goals: goalsQ.data?.data ? goalsQ.data.data.map(toPerformanceGoal) : null,
      reviews: reviewsQ.data?.data ? reviewsQ.data.data.map(toPerformanceReview) : null,
    }),
    [live, goalsQ.data, reviewsQ.data],
  );
}

export function useMyPerformanceActions() {
  const live = useIsLive();
  const send = useLiveSender(["PerformanceGoals", "PerformanceReviews", "PerformanceFeedback"]);
  const [createGoal] = useCreateMyGoalMutation();
  const [progress] = useUpdateGoalProgressMutation();
  const [saveSelf] = useSaveSelfAssessmentMutation();
  const [submitSelf] = useSubmitSelfAssessmentMutation();
  const [ask] = useAskForFeedbackMutation();

  return useMemo(
    () => ({
      live,
      createGoal: (input: NewGoal) =>
        send(() => createGoal(goalToRequest(input)).unwrap(), "Could not add the goal."),
      updateGoalProgress: (goal: PerformanceGoal, value: number, note?: string) =>
        send(
          () =>
            progress({
              id: goal.id,
              body: { progress: Math.max(0, Math.min(100, Math.round(value))), note: note?.trim() || null },
            }).unwrap(),
          "Could not update the goal.",
        ),
      selfAssessment: (
        reviewId: string,
        a: SelfAssessment,
        opts: { submit: boolean; selfRating?: PerformanceRating | null },
      ) => {
        const body = {
          achievements: a.achievements || null,
          challenges: a.challenges || null,
          developmentAreas: a.developmentAreas || null,
          managerFeedback: a.managerFeedback || null,
          selfRating: opts.selfRating ?? null,
        };
        return send(
          () => (opts.submit ? submitSelf({ id: reviewId, body }) : saveSelf({ id: reviewId, body })).unwrap(),
          opts.submit ? "Could not submit your self-assessment." : "Could not save the draft.",
        );
      },
      requestFeedback: (colleagueId: string, context: string) =>
        send(
          () => ask({ colleagueId, context: context || null }).unwrap(),
          "Could not request the feedback.",
        ),
    }),
    [live, send, createGoal, progress, saveSelf, submitSelf, ask],
  );
}

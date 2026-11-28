"use client";

/**
 * Self-service performance on the API: your goals (`/performance/goals/mine`)
 * and reviews (`/performance/reviews/mine`), feedback you received
 * (`/performance/feedback/mine`), the requests you made
 * (`/feedback/requests/mine`) and the ones waiting on you
 * (`/feedback/requests/awaiting-me`), and the writes the My Performance page
 * makes. Null data signed out (the page keeps the demo records).
 */
import { useMemo } from "react";
import { useIsLive, useLiveSender } from "@/src/lib/live/use-is-live";
import { goalToRequest, toPerformanceGoal, toPerformanceReview } from "./api-mapping";
import {
  useAskForFeedbackMutation,
  useDeclineFeedbackRequestMutation,
  useGetFeedbackRequestsAwaitingMeQuery,
  useGetMyFeedbackQuery,
  useGetMyFeedbackRequestsQuery,
  useGiveFeedbackMutation,
  useCreateMyGoalMutation,
  useGetMyGoalsQuery,
  useGetMyReviewsQuery,
  useSaveSelfAssessmentMutation,
  useSubmitSelfAssessmentMutation,
  useUpdateGoalProgressMutation,
} from "@/src/store/services/performance";
import type { FeedbackRequestDto, PerformanceFeedbackDto } from "@/src/types/performance";
import type {
  FeedbackRequest,
  NewGoal,
  PerformanceFeedback,
  PerformanceGoal,
  PerformanceRating,
  PerformanceReview,
  SelfAssessment,
} from "@/src/lib/types/performance";

/** Feedback someone gave you, in the page's shape. */
function feedbackFromApi(f: PerformanceFeedbackDto): PerformanceFeedback {
  return {
    id: f.id,
    toEmployeeId: f.aboutEmployeeId,
    fromEmployeeId: f.fromEmployeeId,
    fromName: f.fromName,
    type: f.type,
    message: f.message,
    createdAt: f.createdAt,
  };
}

/** A request you made: `fromEmployeeId` is the colleague asked to answer. */
function requestFromApi(r: FeedbackRequestDto): FeedbackRequest {
  return {
    id: r.id,
    toEmployeeId: r.askedByEmployeeId,
    fromEmployeeId: r.askedOfEmployeeId,
    fromName: r.askedOfName,
    context: r.context ?? undefined,
    createdAt: r.createdAt,
  };
}

/** A colleague asking you for feedback. */
export interface FeedbackAsk {
  id: string;
  askedById: string;
  askedByName: string;
  context?: string;
  createdAt: string;
}

export function useMyPerformanceLive(): {
  live: boolean;
  goals: PerformanceGoal[] | null;
  reviews: PerformanceReview[] | null;
  feedback: PerformanceFeedback[];
  feedbackRequests: FeedbackRequest[];
  awaitingMe: FeedbackAsk[];
} {
  const live = useIsLive();
  const goalsQ = useGetMyGoalsQuery(undefined, { skip: !live });
  const reviewsQ = useGetMyReviewsQuery(undefined, { skip: !live });
  const feedbackQ = useGetMyFeedbackQuery(undefined, { skip: !live });
  const requestsQ = useGetMyFeedbackRequestsQuery(undefined, { skip: !live });
  const awaitingQ = useGetFeedbackRequestsAwaitingMeQuery(undefined, { skip: !live });
  return useMemo(
    () => ({
      live,
      goals: goalsQ.data?.data ? goalsQ.data.data.map(toPerformanceGoal) : null,
      reviews: reviewsQ.data?.data ? reviewsQ.data.data.map(toPerformanceReview) : null,
      feedback: (feedbackQ.data?.data ?? []).map(feedbackFromApi),
      // Still waiting for an answer; answered ones show up as feedback.
      feedbackRequests: (requestsQ.data?.data ?? [])
        .filter((r) => r.status === "pending")
        .map(requestFromApi),
      awaitingMe: (awaitingQ.data?.data ?? [])
        .filter((r) => r.status === "pending")
        .map((r) => ({
          id: r.id,
          askedById: r.askedByEmployeeId,
          askedByName: r.askedByName,
          context: r.context ?? undefined,
          createdAt: r.createdAt,
        })),
    }),
    [live, goalsQ.data, reviewsQ.data, feedbackQ.data, requestsQ.data, awaitingQ.data],
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
  const [give] = useGiveFeedbackMutation();
  const [decline] = useDeclineFeedbackRequestMutation();

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
      /** POST /performance/feedback — with `requestId` when answering a request. */
      giveFeedback: (aboutEmployeeId: string, message: string, requestId?: string) =>
        send(
          () => give({ aboutEmployeeId, message, requestId: requestId ?? null }).unwrap(),
          "Could not send the feedback.",
        ),
      declineFeedbackRequest: (id: string) =>
        send(() => decline(id).unwrap(), "Could not decline the request."),
    }),
    [live, send, createGoal, progress, saveSelf, submitSelf, ask, give, decline],
  );
}

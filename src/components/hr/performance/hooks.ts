"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useAppSelector } from "@/src/lib/stores/hooks";
import type { PerformanceData } from "@/src/lib/performance/records";
import type {
  CompleteReviewInput,
  GoalProgressInput,
} from "@/src/lib/performance/use-performance";
import {
  goalStatusToApi,
  goalToRequest,
  reviewToOpenRequest,
  toPerformanceGoal,
  toPerformanceReview,
} from "@/src/lib/performance/api-mapping";
import type {
  GoalStatus,
  NewGoal,
  NewReview,
  PerformanceGoal,
} from "@/src/lib/types/performance";
import { getApiErrorMessage } from "@/src/lib/utils";
import {
  useGetAllPerformanceGoalsQuery,
  useGetAllPerformanceReviewsQuery,
} from "@/src/store/services/collections";
import {
  useChangeGoalStatusMutation,
  useCompleteReviewMutation,
  useCreateEmployeeGoalMutation,
  useDeleteGoalMutation,
  useDeleteReviewMutation,
  useOpenReviewMutation,
  useSaveManagerReviewMutation,
  useUpdateGoalProgressMutation,
} from "@/src/store/services/performance";

/**
 * Reviews and goals from the API. The server applies the viewer's access
 * scope, so every row it returns is shown. Feedback has no place on the HR
 * screen, so it is not read here.
 */
export function usePerformance() {
  const skip = useAppSelector(
    (s) => !s.session.is_loggedIn || !s.session.tenant_id,
  );
  const reviews = useGetAllPerformanceReviewsQuery(undefined, { skip });
  const goals = useGetAllPerformanceGoalsQuery(undefined, { skip });
  const departments = useAppSelector((s) => s.locale.data?.departments);

  const data = useMemo<PerformanceData | null>(() => {
    if (!reviews.data || !goals.data) return null;
    return {
      reviews: reviews.data.map(toPerformanceReview),
      goals: goals.data.map(toPerformanceGoal),
      feedback: [],
      feedbackRequests: [],
      departments: [...new Set((departments ?? []).map((d) => d.name))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    };
  }, [reviews.data, goals.data, departments]);

  const error = reviews.error ?? goals.error;
  return {
    data,
    loading: (reviews.isLoading || goals.isLoading) && !data,
    error: error ? getApiErrorMessage(error) : null,
  };
}

/** Each action resolves true once the server has accepted it. */
export function usePerformanceActions() {
  const [openReview] = useOpenReviewMutation();
  const [saveManagerReview] = useSaveManagerReviewMutation();
  const [completeReview] = useCompleteReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const [createGoal] = useCreateEmployeeGoalMutation();
  const [updateProgress] = useUpdateGoalProgressMutation();
  const [changeStatus] = useChangeGoalStatusMutation();
  const [deleteGoal] = useDeleteGoalMutation();

  return useMemo(() => {
    const attempt = async (run: () => Promise<unknown>, fallback: string) => {
      try {
        await run();
        return true;
      } catch (err) {
        toast.error(getApiErrorMessage(err, fallback));
        return false;
      }
    };

    return {
      createReview(input: NewReview) {
        const { employeeId } = input;
        if (!employeeId) {
          toast.error("Choose an employee for the review.");
          return Promise.resolve(false);
        }
        return attempt(
          () => openReview(reviewToOpenRequest({ ...input, employeeId })).unwrap(),
          "Could not create the review.",
        );
      },

      /** The manager's assessment is saved first, then the review is closed. */
      completeReview(id: string, input: CompleteReviewInput) {
        return attempt(async () => {
          await saveManagerReview({
            id,
            body: {
              managerRating: input.rating,
              strengths: input.strengths || null,
              improvements: input.improvements || null,
              comments: input.comments || null,
            },
          }).unwrap();
          await completeReview(id).unwrap();
        }, "Could not complete the review.");
      },

      deleteReview(id: string) {
        return attempt(
          () => deleteReview(id).unwrap(),
          "Could not delete the review.",
        );
      },

      createGoal(input: NewGoal & { goalType?: string }) {
        const { employeeId } = input;
        if (!employeeId) {
          toast.error("Choose an employee for the goal.");
          return Promise.resolve(false);
        }
        return attempt(
          () => createGoal({ employeeId, body: goalToRequest(input) }).unwrap(),
          "Could not add the goal.",
        );
      },

      /**
       * Progress and status are separate calls on the API. Reaching 100% is
       * left to the server to complete; an explicit status change is sent on
       * its own.
       */
      updateGoalProgress(goal: PerformanceGoal, input: GoalProgressInput) {
        const progress = Math.max(0, Math.min(100, Math.round(input.progress)));
        const status: GoalStatus | undefined = input.status;
        const apiStatus = status ? goalStatusToApi(status) : null;
        return attempt(async () => {
          if (progress !== goal.progress || input.note?.trim()) {
            await updateProgress({
              id: goal.id,
              body: { progress, note: input.note?.trim() || null },
            }).unwrap();
          }
          if (apiStatus && status !== goal.status) {
            await changeStatus({ id: goal.id, body: { status: apiStatus } }).unwrap();
          }
        }, "Could not update the goal.");
      },

      deleteGoal(id: string) {
        return attempt(() => deleteGoal(id).unwrap(), "Could not delete the goal.");
      },
    };
  }, [
    openReview,
    saveManagerReview,
    completeReview,
    deleteReview,
    createGoal,
    updateProgress,
    changeStatus,
    deleteGoal,
  ]);
}

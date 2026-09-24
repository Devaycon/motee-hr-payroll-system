"use client";

import { useMemo } from "react";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  addRecord,
  removeRecord,
  updateRecord,
} from "@/src/lib/stores/collection-edits-slice";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type {
  GoalStatus,
  NewGoal,
  NewReview,
  PerformanceGoal,
  PerformanceRating,
  SelfAssessment,
} from "@/src/lib/types/performance";
import {
  PERF_KEYS,
  buildPerformance,
  todayIso,
  type PerformanceData,
  type RawFeedbackRequest,
  type RawGoal,
  type RawReview,
} from "./records";

/**
 * Performance records for the viewer. `scope: false` skips the navbar's branch
 * view (self-service is one person's record); role data scope always applies.
 */
export function usePerformanceData(options?: { scope?: boolean }) {
  const edits = useAppSelector((s) => s.collectionEdits);
  // Names resolve against the whole directory: a self-service user's scope is
  // only their own record, but they still need to see who reviews them.
  const directory = useAppSelector((s) => s.locale.data?.employees);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>(
    (b) => b,
    { scope: options?.scope ?? true },
  );
  const data = useMemo<PerformanceData | null>(
    () => (bundle ? buildPerformance(bundle, edits, directory) : null),
    [bundle, edits, directory],
  );
  return { data, loading: loading && !data, error };
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export interface CompleteReviewInput {
  rating: PerformanceRating;
  strengths?: string;
  improvements?: string;
  comments?: string;
}

export interface GoalProgressInput {
  progress: number;
  /** Omit to derive from progress (100% completes the goal). */
  status?: GoalStatus;
  note?: string;
}

/** Writes go through collection edits, so they persist and reach every screen. */
export function usePerformanceActions() {
  const dispatch = useAppDispatch();
  return useMemo(() => {
    const patchReview = (id: string, patch: Partial<RawReview>) =>
      dispatch(updateRecord({ key: PERF_KEYS.reviews, id, patch }));
    const patchGoal = (id: string, patch: Partial<RawGoal>) =>
      dispatch(updateRecord({ key: PERF_KEYS.goals, id, patch }));

    return {
      createReview(input: NewReview) {
        const record: RawReview = {
          id: newId("REV"),
          employeeId: input.employeeId,
          reviewerId: input.reviewerId,
          type: input.reviewType,
          period: input.period,
          dueDate: input.dueDate,
          status: "not_started",
        };
        dispatch(addRecord({ key: PERF_KEYS.reviews, record: { ...record } }));
        return record.id!;
      },

      completeReview(id: string, input: CompleteReviewInput) {
        patchReview(id, {
          managerRating: input.rating,
          strengths: input.strengths,
          improvements: input.improvements,
          comments: input.comments,
          status: "completed",
          completedAt: todayIso(),
        });
      },

      deleteReview(id: string) {
        dispatch(removeRecord({ key: PERF_KEYS.reviews, id }));
      },

      saveSelfAssessment(
        id: string,
        assessment: SelfAssessment,
        opts: { submit: boolean; selfRating?: PerformanceRating },
      ) {
        patchReview(id, {
          selfAssessment: assessment,
          ...(opts.selfRating ? { selfRating: opts.selfRating } : {}),
          ...(opts.submit
            ? { selfSubmittedAt: todayIso(), status: "in_progress" }
            : {}),
        });
      },

      createGoal(input: NewGoal & { cycleId?: string; goalType?: string }) {
        const record: RawGoal = {
          id: newId("GOAL"),
          employeeId: input.employeeId,
          title: input.goalTitle,
          description: input.description,
          category: input.category,
          type: input.goalType ?? "SMART",
          cycleId: input.cycleId,
          dueDate: input.dueDate,
          createdAt: todayIso(),
          progress: 0,
          status: "on_track",
        };
        dispatch(addRecord({ key: PERF_KEYS.goals, record: { ...record } }));
        return record.id!;
      },

      updateGoalProgress(goal: PerformanceGoal, input: GoalProgressInput) {
        const progress = Math.max(0, Math.min(100, Math.round(input.progress)));
        let status: GoalStatus =
          input.status ??
          (progress >= 100
            ? "completed"
            : goal.status === "completed"
              ? "on_track"
              : goal.status);
        // A goal marked complete is fully done; one at 100% is complete.
        if (status === "completed" || progress >= 100) status = "completed";
        const today = todayIso();
        patchGoal(goal.id, {
          progress: status === "completed" ? 100 : progress,
          status,
          completedAt:
            status === "completed" ? (goal.completedAt ?? today) : undefined,
          updates: [
            {
              date: today,
              progress: status === "completed" ? 100 : progress,
              ...(input.note?.trim() ? { note: input.note.trim() } : {}),
            },
            ...(goal.updates ?? []),
          ],
        });
      },

      deleteGoal(id: string) {
        dispatch(removeRecord({ key: PERF_KEYS.goals, id }));
      },

      requestFeedback(input: {
        toEmployeeId: string;
        fromEmployeeId: string;
        context?: string;
      }) {
        const record: RawFeedbackRequest = {
          id: newId("FBR"),
          toEmployeeId: input.toEmployeeId,
          fromEmployeeId: input.fromEmployeeId,
          context: input.context?.trim() || undefined,
          createdAt: todayIso(),
        };
        dispatch(addRecord({ key: PERF_KEYS.feedbackRequests, record: { ...record } }));
      },
    };
  }, [dispatch]);
}

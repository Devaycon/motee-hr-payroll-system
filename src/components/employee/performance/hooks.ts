"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  usePerformanceActions,
  usePerformanceData,
} from "@/src/lib/performance/use-performance";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { useMyPerformanceLive } from "@/src/lib/performance/use-my-performance-live";

export { usePerformanceActions };

export interface Colleague {
  id: string;
  name: string;
  initials: string;
  title: string;
}

/**
 * The signed-in employee's own performance record. Self-service shows one
 * person their own record, so it is never narrowed by the admin shell's
 * branch switcher.
 */
export function useMyPerformance() {
  const employeeId = useAppSelector((s) => s.auth.user?.employeeId);
  const directory = useAppSelector((s) => s.locale.data?.employees);
  const demo = usePerformanceData({ scope: false });
  // Signed in: your goals and reviews from the `/mine` endpoints.
  const liveMine = useMyPerformanceLive();
  const data = useMemo(
    () =>
      liveMine.live
        ? liveMine.goals && liveMine.reviews
          ? {
              goals: liveMine.goals,
              reviews: liveMine.reviews,
              feedback: liveMine.feedback,
              feedbackRequests: liveMine.feedbackRequests,
            }
          : null
        : demo.data,
    [liveMine, demo.data],
  );
  const loading = liveMine.live ? !data : demo.loading;

  const mine = useMemo(() => {
    if (!data || !employeeId) return null;
    const reviews = data.reviews.filter((r) => r.employeeId === employeeId);
    const open = reviews
      .filter((r) => r.status !== "completed")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const past = reviews
      .filter((r) => r.status === "completed")
      .sort((a, b) =>
        (b.completedDate ?? b.dueDate).localeCompare(
          a.completedDate ?? a.dueDate,
        ),
      );
    return {
      goals: data.goals
        .filter((g) => g.employeeId === employeeId)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      /** The review awaiting the employee's input, soonest due first. */
      currentReview: open[0] ?? null,
      pastReviews: past,
      feedback: data.feedback
        .filter((f) => f.toEmployeeId === employeeId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      feedbackRequests: data.feedbackRequests.filter(
        (r) => r.toEmployeeId === employeeId,
      ),
    };
  }, [data, employeeId]);

  const me = useMemo(
    () => directory?.find((e) => e.id === employeeId),
    [directory, employeeId],
  );

  // People who work closely enough to give useful feedback: the line manager,
  // direct reports and the rest of the department.
  const colleagues = useMemo<Colleague[]>(() => {
    if (!directory || !me) return [];
    const toColleague = (e: LocaleEmployee): Colleague => ({
      id: e.id,
      name: e.fullName,
      initials: e.initials,
      title: e.jobTitle,
    });
    return directory
      .filter(
        (e) =>
          e.id !== me.id &&
          e.status !== "terminated" &&
          (e.id === me.managerId ||
            e.managerId === me.id ||
            e.departmentId === me.departmentId),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName))
      .map(toColleague);
  }, [directory, me]);

  return { employeeId, me, data: mine, colleagues, loading, awaitingMe: liveMine.awaitingMe };
}

"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { addRecord } from "@/src/lib/stores/onboarding-records-slice";
import { updateCandidate } from "@/src/lib/stores/recruitment-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { onboardingStarted } from "@/src/lib/notifications/onboarding";
import type { Candidate, JobRequisition } from "@/src/lib/types/recruitment";
import { candidateToOnboardingRecord } from "./to-onboarding";

/**
 * The single "send this hire to onboarding" path.
 *
 * The stage table and the candidate drawer each had their own version: the
 * drawer rebuilt the record inline and pushed no notification, and both parked
 * the record in a module-global array that vanished on reload. This creates the
 * record in the store, stamps the candidate so a reload still shows them as
 * invited, and notifies — once, from one place.
 */
export function useOnboardingInvite(country: string) {
  const dispatch = useAppDispatch();
  const templates = useAppSelector((s) => s.approvals.templates);
  const roles = useAppSelector((s) => s.locale.data?.roles ?? []);

  return useCallback(
    (candidate: Candidate, requisition: JobRequisition | undefined) => {
      if (candidate.onboardingInvitedAt) return false;
      const record = candidateToOnboardingRecord(
        candidate,
        requisition,
        templates,
        roles,
      );
      dispatch(addRecord(record));
      dispatch(
        updateCandidate({
          country,
          id: candidate.id,
          patch: { onboardingInvitedAt: new Date().toISOString().slice(0, 10) },
        }),
      );
      // §2.10 — HR sees that onboarding has begun without watching the pipeline.
      dispatch(
        pushNotification(
          onboardingStarted(candidate.name, record.jobTitle, record.startDate),
        ),
      );
      return true;
    },
    [country, dispatch, roles, templates],
  );
}

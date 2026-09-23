"use client";

import { useMemo } from "react";
import {
  RaciStrip,
  type RaciPerson,
} from "@/src/components/shared/raci-strip";
import type { OnboardingRecord } from "@/src/lib/types/onboarding";

/**
 * Who a hire's onboarding is waiting on, read off the first task still open.
 *
 * Its own component because the detail page returns early when the record is
 * missing, and a hook after an early return is a conditional hook.
 */
export function RecordRaciStrip({ record }: { record: OnboardingRecord }) {
  const pending = record.tasks.find((t) => t.status !== "completed");

  const waitingOn = useMemo(() => {
    if (!pending?.dueDate) return null;
    const due = new Date(`${pending.dueDate}T00:00:00`);
    if (Number.isNaN(due.getTime())) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((today.getTime() - due.getTime()) / 86_400_000);
    if (days <= 0) return null;
    return { name: pending.assigneeName ?? pending.reviewer, days };
  }, [pending]);

  if (!pending) return null;

  const people: RaciPerson[] = [
    {
      slot: "Owner",
      name: pending.assigneeName ?? pending.reviewer,
      employeeId: pending.assigneeEmployeeId,
      note: pending.taskName,
    },
    ...(pending.reviewer && pending.reviewer !== pending.assigneeName
      ? [
          {
            slot: "Approver" as const,
            name: pending.reviewer,
            employeeId: pending.reviewerEmployeeId,
            note: "Signs this task off",
          },
        ]
      : []),
  ];

  return <RaciStrip people={people} waitingOn={waitingOn} />;
}

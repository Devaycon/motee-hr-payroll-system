"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";
import { RaciStrip, type RaciPerson } from "@/src/components/shared/raci-strip";
import { selectRunForSubject } from "@/src/lib/stores/workflow-runs-selectors";
import { isRunTaskOpen, daysOverdue } from "@/src/lib/types/workflow-runs";
import type { JobRequisition } from "@/src/lib/types/recruitment";

/**
 * The hiring team for a vacancy, plus whoever currently holds its work.
 *
 * Mounted on the vacancy because that is the first thing anyone opens about a
 * role - the people were previously only on the source requisition, a module
 * away, and the current holder was nowhere.
 */
export function HiringTeamStrip({
  requisition,
}: {
  requisition: JobRequisition;
}) {
  const country = useAppSelector((s) => s.locale.country);
  const runs = useAppSelector((s) => s.workflowRuns.byCountry[country]);

  const run = requisition.sourceRequisitionId
    ? selectRunForSubject(runs ?? [], "requisition", requisition.sourceRequisitionId)
    : undefined;

  // The oldest task still open is what the vacancy is actually waiting on.
  const open = (run?.tasks ?? [])
    .filter(isRunTaskOpen)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const current = open[0];

  const people: RaciPerson[] = [
    {
      slot: "Hiring Manager",
      name: requisition.hiringManager,
      employeeId: requisition.hiringManagerId,
    },
    ...(requisition.recruiter
      ? [
          {
            slot: "Recruiter" as const,
            name: requisition.recruiter,
            employeeId: requisition.recruiterId,
          },
        ]
      : []),
    ...(requisition.hrBusinessPartner
      ? [
          {
            slot: "HR Partner" as const,
            name: requisition.hrBusinessPartner,
            employeeId: requisition.hrBusinessPartnerId,
          },
        ]
      : []),
    ...(current
      ? [
          {
            slot: "Owner" as const,
            name: current.assigneeName,
            employeeId: current.assigneeEmployeeId ?? undefined,
            note: current.title,
          },
        ]
      : []),
  ];

  const overdueBy = current ? daysOverdue(current) : 0;

  return (
    <RaciStrip
      people={people}
      waitingOn={
        current && overdueBy > 0
          ? { name: current.assigneeName, days: overdueBy }
          : null
      }
    />
  );
}

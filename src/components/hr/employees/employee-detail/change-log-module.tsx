"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";
import { useDemoChangeRequests } from "./use-demo-change-requests";
import {
  ChangeRequestsTable,
  RequestProfileChangeButton,
} from "@/src/components/shared/profile-fields";
import { useProfileVariant } from "./variant";
import { Section } from "./ui";
import type { ModuleProps } from "./modules";

/**
 * The full history of profile changes for one employee — pending, approved and
 * rejected alike. This used to be a fifth sub-tab inside the Profile card; it
 * is now its own module so the "Pending approvals" stat tile has somewhere real
 * to land, and so the log reads as a record rather than a queue.
 */
export function ChangeLogModule({ employeeId, employee }: ModuleProps) {
  const variant = useProfileVariant();
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const requests = useAppSelector((s) =>
    s.profileEdits.requests.filter((r) => r.employeeId === employeeId),
  );
  useDemoChangeRequests(employeeId, employee.fullName);

  const requestChangeButton = (
    <RequestProfileChangeButton
      employee={employee}
      employeeId={employeeId}
      mode={variant.mode}
    />
  );

  return (
    <Section title="Profile Change Request Log" action={requestChangeButton}>
      <ChangeRequestsTable
        requests={requests}
        audience={variant.audience}
        actorName={actorName}
        onRequestChange={requestChangeButton}
      />
    </Section>
  );
}

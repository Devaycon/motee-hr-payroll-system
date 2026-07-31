"use client";

import { TeamView } from "@/src/components/employee/team/team-view";
import { useProfileVariant } from "./variant";
import type { ModuleProps } from "./modules";

/**
 * The employee's team: who they report to, their team list, the organogram and
 * where they sit in the department (client feedback round 2, §G1/§G2).
 *
 * "My Team" used to be a page of its own in the employee portal, which left HR
 * with no way to see anyone else's team or org chart. It lives here now, scoped
 * to whichever employee the profile is showing — the same view serves the
 * employee reading their own record and HR reading someone else's.
 */
export function TeamModule({ employeeId, employee }: ModuleProps) {
  const variant = useProfileVariant();
  return (
    <TeamView
      employeeId={employeeId}
      audience={variant.audience === "employee" ? "self" : "hr"}
      subjectName={employee.fullName}
    />
  );
}

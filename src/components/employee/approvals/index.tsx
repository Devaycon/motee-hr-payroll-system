"use client";

import { ApprovalsPage } from "@/src/components/hr/approvals";

// Exported as `MyApprovalsPage` to keep the existing route imports intact;
// surfaces to the user as "My Submissions".
export function MyApprovalsPage() {
  return (
    <ApprovalsPage variant="employee" basePath="/employee/submissions" />
  );
}

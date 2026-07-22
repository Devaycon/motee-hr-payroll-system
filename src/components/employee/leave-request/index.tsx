"use client";

import { LeaveRequestPanel } from "./panel";

export function MyLeaveRequestPage() {
  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6">
        <h1 className="text-4xl font-bold text-foreground">Leave & Absence</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View your leave balances, submit requests and track approval status.
        </p>
      </div>

      <LeaveRequestPanel />
    </div>
  );
}

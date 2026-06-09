"use client";

import { Skeleton } from "@/src/components/ui/skeleton";
import { useEmployeeStats } from "@/src/components/hr/employees/employee-detail/hooks";
import { EmployeeProfileWorkspace } from "@/src/components/hr/employees/employee-detail/workspace";
import { useMyEmployeeRecord } from "./hooks";

export function EmployeeProfilePage() {
  const { data: rec } = useMyEmployeeRecord();
  const { data: stats } = useEmployeeStats(rec?.id ?? "");

  if (!rec) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-2">
        <h1 className="text-4xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View your details and request changes — HR reviews and approves them.
        </p>
      </div>

      <EmployeeProfileWorkspace
        id={rec.id}
        employee={rec.employee}
        stats={stats}
        variant="self"
      />
    </div>
  );
}

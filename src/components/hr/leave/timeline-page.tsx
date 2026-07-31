"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Skeleton } from "@/src/components/ui/skeleton";
import { isOpenLeaveStatus } from "@/src/lib/types/leave";
import { useLeaveData } from "./hooks";
import { DEPARTMENTS } from "./data";
import { PeopleTimeline } from "./components/people-timeline";
import type { LeaveTypeName } from "./types";

const LEAVE_PAGE = "/time-payroll/leave";

/**
 * The full "People's time off" view, on its own page rather than in a dialog —
 * it needs the whole viewport to be readable, and a URL so a scoped view
 * (`?department=…`) can be linked to and come back to.
 *
 * Decisions stay in the Leave module: reviewing a request returns to the
 * Leave page with that request open, so there is one approval flow, not two.
 */
export function LeaveTimelinePage() {
  const router = useRouter();
  const params = useSearchParams();
  const { data, loading } = useLeaveData();

  const requests = useMemo(
    () =>
      (data?.requests ?? []).filter(
        (r) => r.status === "approved" || isOpenLeaveStatus(r.status),
      ),
    [data],
  );

  if (loading && !data) {
    return (
      <div className="flex flex-col gap-4 pb-10">
        <Skeleton className="h-14 w-80" />
        <Skeleton className="h-[70vh] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 mb-1 h-7 gap-1.5 px-2 text-xs text-muted-foreground"
          >
            <Link href={LEAVE_PAGE}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Leave Management
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold">People&apos;s time off</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {requests.length} booking{requests.length === 1 ? "" : "s"} across
            the team — day by day, person by person.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="flex h-[calc(100vh-15rem)] min-h-125 flex-col p-0">
          <PeopleTimeline
            requests={requests}
            departments={DEPARTMENTS}
            initialDepartment={params.get("department") ?? "all"}
            initialType={(params.get("type") as LeaveTypeName | null) ?? "all"}
            onReview={(request) =>
              router.push(`${LEAVE_PAGE}?request=${request.id}`)
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

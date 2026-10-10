"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { formatDate } from "@/src/lib/utils/format-date";
import { useGetMyLeaveRequestsQuery } from "@/src/store/services/leave";
import { useGetMyLeaveBalancesQuery } from "@/src/store/services/leave-balances";
import { useGetMyOnboardingQuery } from "@/src/store/services/onboarding";

/**
 * The signed-in person's own leave and onboarding. Shown only to accounts
 * that are also an employee — the company owner often is not.
 */
export function MyWorkspace() {
  const isEmployee = useAppSelector((s) => Boolean(s.auth.user?.employeeId));
  const skip = !isEmployee;
  const { data: balances } = useGetMyLeaveBalancesQuery(undefined, { skip });
  const { data: requests } = useGetMyLeaveRequestsQuery(
    { PageSize: 5 },
    { skip },
  );
  const { data: onboarding } = useGetMyOnboardingQuery(undefined, { skip });

  if (!isEmployee) return null;

  const myBalances = balances?.data ?? [];
  const myRequests = requests?.data?.items ?? [];
  const myOnboarding = onboarding?.data;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <h3 className="text-sm font-semibold text-foreground">
            My leave balance
          </h3>
          {myBalances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave set up yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {myBalances.map((balance) => (
                <li
                  key={balance.leaveTypeId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground">{balance.leaveTypeName}</span>
                  <span className="text-muted-foreground">
                    {balance.available} of {balance.entitlement} days left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <h3 className="text-sm font-semibold text-foreground">
            My leave requests
          </h3>
          {myRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You have not requested any leave.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {myRequests.map((request) => (
                <li key={request.id} className="flex flex-col text-sm">
                  <span className="text-foreground">
                    {request.leaveTypeName} · {request.totalDays} day(s)
                  </span>
                  <span className="text-xs capitalize text-muted-foreground">
                    {formatDate(request.startDate)} –{" "}
                    {formatDate(request.endDate)} · {request.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <h3 className="text-sm font-semibold text-foreground">
            My onboarding
          </h3>
          {!myOnboarding ? (
            <p className="text-sm text-muted-foreground">
              Nothing outstanding.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Stage:{" "}
              <span className="capitalize text-foreground">
                {myOnboarding.stage.replace(/([A-Z])/g, " $1").toLowerCase()}
              </span>
              {myOnboarding.completedAt
                ? ` · completed ${formatDate(myOnboarding.completedAt)}`
                : myOnboarding.isOverdue
                  ? " · overdue"
                  : ""}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

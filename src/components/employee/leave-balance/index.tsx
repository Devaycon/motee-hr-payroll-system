"use client";

import { useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { LEAVE_POLICIES, LEAVE_REQUESTS, LEAVE_TYPE_LABELS } from "@/src/data/leave-demo";
import { MY_BALANCES as SEED_BALANCES, MY_HISTORY as SEED_HISTORY, TYPE_COLORS } from "./components/data";
import { useMyLeaveBalances, useMyLeaveHistory } from "./hooks";
import { LeaveStatCards } from "./components/stat-cards";
import { EntitlementCard } from "./components/entitlement-card";
import { HistoryRow } from "./components/history-row";
import { PolicyModal } from "./components/policy-modal";
import { SmartLeaveAssistant } from "./components/smart-leave-assistant";
import {
  LeaveCalendar,
  COVER_COLOR,
  type CalendarLeave,
} from "@/src/components/shared/leave-calendar";
import type { LeaveTypeName } from "@/src/lib/types/leave";

export function MyLeaveBalancePage() {
  useMyLeaveBalances();
  useMyLeaveHistory();
  const MY_BALANCES = SEED_BALANCES;
  const MY_HISTORY = SEED_HISTORY;
  const [policyPlan, setPolicyPlan] = useState<(typeof LEAVE_POLICIES)[0] | null>(null);
  const [expandedType, setExpandedType] = useState<LeaveTypeName | null>(null);

  const myCalendarLeave: CalendarLeave[] = MY_HISTORY.filter(
    (h) => h.status === "approved" || h.status === "pending",
  ).map((h) => ({
    id: h.id,
    label: LEAVE_TYPE_LABELS[h.leaveType] ?? h.leaveType,
    startDate: h.startDate,
    endDate: h.endDate,
    status: h.status as "approved" | "pending",
    color: TYPE_COLORS[h.leaveType]?.bar,
  }));

  const visibleTeamLeave = LEAVE_REQUESTS.filter(
    (r) => r.status === "approved" || r.status === "pending",
  );

  const teamCalendarLeave: CalendarLeave[] = [
    ...visibleTeamLeave.map((r) => ({
      id: r.id,
      label: r.employeeName.split(" ")[0],
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status as "approved" | "pending",
      color: TYPE_COLORS[r.leaveType as LeaveTypeName]?.bar,
    })),
    // Relief assignments show alongside the absence they cover (§3.2).
    ...visibleTeamLeave
      .filter((r) => r.reliefEmployeeName)
      .map((r) => ({
        id: `cover-${r.id}`,
        label: `${r.reliefEmployeeName!.split(" ")[0]} covering ${r.employeeName.split(" ")[0]}`,
        startDate: r.startDate,
        endDate: r.endDate,
        status: r.status as "approved" | "pending",
        kind: "cover" as const,
        color: COVER_COLOR,
      })),
  ];

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Leave Balance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your leave entitlements and usage for the current leave year.
        </p>
      </div>

      <LeaveStatCards />

      <SmartLeaveAssistant />

      <Tabs defaultValue="entitlements">
        <PageTabsList
          tabs={[
            { value: "entitlements", label: "Leave Entitlements" },
            { value: "history", label: "Leave History" },
            { value: "calendar", label: "Calendar" },
            { value: "team-calendar", label: "Team Calendar" },
          ]}
        />

        <TabsContent value="entitlements" className="mt-4">
          <div className="flex flex-col gap-3">
            {MY_BALANCES.map((b) => (
              <EntitlementCard
                key={b.type}
                balance={b}
                expanded={expandedType === b.type}
                onToggleExpand={() =>
                  setExpandedType(expandedType === b.type ? null : b.type)
                }
                onViewPolicy={setPolicyPlan}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {MY_HISTORY.map((h) => (
                  <HistoryRow key={h.id} request={h} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <LeaveCalendar leave={myCalendarLeave} />
        </TabsContent>

        <TabsContent value="team-calendar" className="mt-4">
          <p className="mb-3 text-xs text-muted-foreground">
            See who else on your team is away before you book. Approved and
            pending leave, public holidays and company shutdowns are shown.
          </p>
          <LeaveCalendar leave={teamCalendarLeave} showLabels />
        </TabsContent>
      </Tabs>

      <PolicyModal policy={policyPlan} onClose={() => setPolicyPlan(null)} />
    </div>
  );
}

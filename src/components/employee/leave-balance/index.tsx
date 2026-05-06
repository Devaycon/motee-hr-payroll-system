"use client";

import { useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { LEAVE_POLICIES } from "@/src/data/leave-demo";
import { MY_BALANCES, MY_HISTORY } from "./components/data";
import { LeaveStatCards } from "./components/stat-cards";
import { EntitlementCard } from "./components/entitlement-card";
import { HistoryRow } from "./components/history-row";
import { PolicyModal } from "./components/policy-modal";
import type { LeaveTypeName } from "@/src/lib/types/leave";

export function MyLeaveBalancePage() {
  const [policyPlan, setPolicyPlan] = useState<(typeof LEAVE_POLICIES)[0] | null>(null);
  const [expandedType, setExpandedType] = useState<LeaveTypeName | null>(null);

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Leave Balance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your leave entitlements and usage for the current leave year.
        </p>
      </div>

      <LeaveStatCards />

      <Tabs defaultValue="entitlements">
        <PageTabsList
          tabs={[
            { value: "entitlements", label: "Leave Entitlements" },
            { value: "history", label: "Leave History" },
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
      </Tabs>

      <PolicyModal policy={policyPlan} onClose={() => setPolicyPlan(null)} />
    </div>
  );
}

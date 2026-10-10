"use client";

import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { DelegationsTab } from "./delegations-tab";
import { QueueTab } from "./queue-tab";
import { TemplatesTab } from "./templates-tab";

/**
 * Submissions & Approvals, on the API: what is waiting on you, the chains
 * requests run through, and who is covering whose approvals.
 */
export function LiveApprovalsPage({ basePath }: { basePath: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-bold text-foreground">
          Submissions &amp; Approvals
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Decide what is waiting on you, and manage how requests are approved.
        </p>
      </div>

      <Tabs defaultValue="queue">
        <PageTabsList
          tabs={[
            { value: "queue", label: "My Queue" },
            { value: "chains", label: "Approval Chains" },
            { value: "delegations", label: "Delegations" },
          ]}
        />
        <TabsContent value="queue" className="mt-5">
          <QueueTab basePath={basePath} />
        </TabsContent>
        <TabsContent value="chains" className="mt-5">
          <TemplatesTab />
        </TabsContent>
        <TabsContent value="delegations" className="mt-5">
          <DelegationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

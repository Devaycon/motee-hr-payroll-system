"use client";

import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { Users } from "lucide-react";
import { CommunityTab } from "./components/community-tab";
import { KudosTab } from "./components/kudos-tab";
import { SuggestionsTab } from "./components/suggestions-tab";
import { NotIntegrated } from "@/src/components/shared/not-integrated";

export function EmployeeCommunityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Community</h1>
          <p className="text-sm text-muted-foreground">
            Connect, recognise, and share ideas with your team
          </p>
        </div>
      </div>

      <Tabs defaultValue="community">
        <PageTabsList
          tabs={[
            { value: "community", label: "Community Feed" },
            { value: "kudos", label: "Kudos" },
            { value: "suggestions", label: "Suggestions" },
          ]}
        />
        <TabsContent value="community" className="mt-6">
          {/* The community feed is not on the API yet. */}
          <NotIntegrated label="Community feed">
            <CommunityTab />
          </NotIntegrated>
        </TabsContent>
        <TabsContent value="kudos" className="mt-6">
          <KudosTab />
        </TabsContent>
        <TabsContent value="suggestions" className="mt-6">
          <NotIntegrated label="Suggestions">
            <SuggestionsTab />
          </NotIntegrated>
        </TabsContent>
      </Tabs>
    </div>
  );
}

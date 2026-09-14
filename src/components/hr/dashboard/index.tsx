"use client";

import { useState, type ComponentType } from "react";
import { WelcomeBanner } from "./components/welcome-banner";
import { DASHBOARD_TABS, type DashboardTabKey } from "./widgets";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { DashboardTabsList } from "./components/dashboard-tabs";
import {
  PeopleTabLayout,
  AttendanceTabLayout,
  SicknessTabLayout,
  PrioritiesTabLayout,
  EventsTabLayout,
  ResourcingTabLayout,
  EngagementTabLayout,
} from "./components/tab-layouts";

const TAB_LAYOUTS: Record<DashboardTabKey, ComponentType> = {
  people: PeopleTabLayout,
  attendance: AttendanceTabLayout,
  sickness: SicknessTabLayout,
  priorities: PrioritiesTabLayout,
  events: EventsTabLayout,
  resourcing: ResourcingTabLayout,
  engagement: EngagementTabLayout,
};

const HrDashboard = () => {
  const [tab, setTab] = useState<DashboardTabKey>(DASHBOARD_TABS[0].key);

  return (
    // `gap-2` throughout, matching the grid's gutter, so the spacing between
    // the header, the tab strip and the tiles is the same everywhere.
    <div className="flex flex-col gap-2">
      <WelcomeBanner />

      {/* Self-service widgets ("My Profile Stats") used to sit here. They now
          live only in the employee portal, reachable via the Self-Service
          toggle in the navbar (client feedback §4.3). */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as DashboardTabKey)}>
        <DashboardTabsList />
        {DASHBOARD_TABS.map((t) => {
          const Layout = TAB_LAYOUTS[t.key];
          return (
            <TabsContent key={t.key} value={t.key} className="mt-2">
              <Layout />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default HrDashboard;

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
    // `dashboard-corners` (globals.css) gives the cards and tab strip 5px
    // corners on this page only.
    <div className="dashboard-corners flex flex-col gap-2">
      <WelcomeBanner />

      {/* Self-service widgets ("My Profile Stats") used to sit here. They now
          live only in the employee portal, reachable via the Self-Service
          toggle in the navbar (client feedback §4.3). */}
      {/* `-mx-4` trims HrLayout's 24px side padding down to 8px (the same as
          the gutter between tiles) for the strip and the tiles together, so
          they stay aligned with each other. Tied to that `p-6`, like the
          banner's negative margins. */}
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as DashboardTabKey)}
        className="-mx-4"
      >
        <DashboardTabsList />
        {DASHBOARD_TABS.map((t) => {
          const Layout = TAB_LAYOUTS[t.key];
          return (
            // No top margin: the Tabs container's own `gap-2` already puts 8px
            // between the strip and the tiles, the same as between tiles. A
            // `mt-2` here doubled it to 16px.
            <TabsContent key={t.key} value={t.key}>
              <Layout />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default HrDashboard;

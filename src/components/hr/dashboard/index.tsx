"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CustomisableGrid } from "./components/customisable-grid";
import { WelcomeBanner } from "./components/welcome-banner";
import { DASHBOARD_TABS, type DashboardTabKey } from "./widgets";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { DashboardTabsList } from "./components/dashboard-tabs";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { resetLayout } from "@/src/lib/stores/dashboard-layout-slice";

const HrDashboard = () => {
  const dispatch = useAppDispatch();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<DashboardTabKey>(DASHBOARD_TABS[0].key);

  function finishEditing() {
    setEditing(false);
    toast.success("Dashboard saved", {
      description: "Your layout will be here next time you sign in.",
    });
  }

  return (
    // `gap-2` throughout, matching the grid's gutter, so the spacing between
    // the header, the tab strip and the tiles is the same everywhere.
    <div className="flex flex-col gap-2">
      <WelcomeBanner
        editing={editing}
        onEdit={() => setEditing(true)}
        onDone={finishEditing}
        onReset={() => dispatch(resetLayout())}
      />

      {editing && (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm text-foreground">
          Drag a widget by its handle to move it, use the arrows to resize, and
          the eye to hide it. Widgets move within their own tab, and changes
          save as you make them.
        </p>
      )}

      {/* Self-service widgets ("My Profile Stats") used to sit here. They now
          live only in the employee portal, reachable via the Self-Service
          toggle in the navbar (client feedback §4.3). */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as DashboardTabKey)}>
        <DashboardTabsList />
        {DASHBOARD_TABS.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-2">
            <CustomisableGrid tab={t.key} editing={editing} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default HrDashboard;

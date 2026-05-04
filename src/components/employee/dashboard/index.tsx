"use client";

import { WelcomeBanner } from "./components/welcome-banner";
import { DayAtAGlance } from "./components/day-at-a-glance";
import { LeaveBalanceCards } from "./components/leave-balance-cards";
import { PendingItems } from "./components/pending-items";
import { AnnouncementsFeed } from "./components/announcements-feed";
import { UpcomingEvents } from "./components/upcoming-events";
import { RecentKudos } from "./components/recent-kudos";
import { TeamOnLeave } from "./components/team-on-leave";
import { RecentActivity } from "./components/recent-activity";
import { QuickLinks } from "./components/quick-links";
import { MyTasks } from "./components/my-tasks";

export function EmployeeDashboard() {
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner name="Adeyemi" dayName={dayName} dateStr={dateStr} />

      <DayAtAGlance />

      <div className="grid grid-cols-2 gap-4">
        <LeaveBalanceCards />
        <QuickLinks />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <PendingItems />
        <MyTasks />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AnnouncementsFeed />
        <UpcomingEvents />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <RecentKudos />
        <TeamOnLeave />
        <RecentActivity />
      </div>
    </div>
  );
}

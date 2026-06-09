"use client";

import { useAppSelector } from "@/src/lib/stores/hooks";
import { WelcomeBanner } from "./components/welcome-banner";
import { StatCards } from "./components/stat-cards";
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
  const user = useAppSelector((s) => s.auth.user);
  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-GB", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-6">
      <WelcomeBanner name={firstName} dayName={dayName} dateStr={dateStr} />

      <StatCards />

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

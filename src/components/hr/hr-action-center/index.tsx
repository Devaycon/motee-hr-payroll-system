"use client";

import { useState } from "react";
import { MY_TASKS, PENDING_LEAVES } from "./data";
import { StatCards } from "./components/stat-cards";
import { MyTasks } from "./components/my-tasks";
// import { UpcomingEvents } from "./components/upcoming-events";
import { RecentActivity } from "./components/recent-activity";
import { HrAlertsCard } from "@/src/components/hr/hr-alerts";
import { UpcomingEventsCard } from "./components/upcoming-events-card";

export function MyWorkspacePage() {
  const [tasks, setTasks] = useState(MY_TASKS);

  const pendingLeaveCount = PENDING_LEAVES.length;
  const openTaskCount = tasks.filter((t) => !t.done).length;

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-GB", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">HR Action Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          It&apos;s {dayName}, {dateStr}
        </p>
      </div>

      <StatCards
        pendingLeaveCount={pendingLeaveCount}
        openTaskCount={openTaskCount}
      />

      <div id="alerts" className="scroll-mt-24">
        <HrAlertsCard />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <UpcomingEventsCard />
        <div id="tasks" className="scroll-mt-24">
          <MyTasks tasks={tasks} setTasks={setTasks} />
        </div>
      </div>

      <RecentActivity />
    </div>
  );
}

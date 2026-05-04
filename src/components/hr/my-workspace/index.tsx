"use client";

import { useState } from "react";
import { MY_TASKS, PENDING_LEAVES } from "./data";
import { StatCards } from "./components/stat-cards";
import { PendingApprovals } from "./components/pending-approvals";
import { MyTasks } from "./components/my-tasks";
import { UpcomingEvents } from "./components/upcoming-events";
import { RecentActivity } from "./components/recent-activity";

export function MyWorkspacePage() {
  const [tasks, setTasks] = useState(MY_TASKS);
  const [approvedLeaves, setApprovedLeaves] = useState<string[]>([]);
  const [rejectedLeaves, setRejectedLeaves] = useState<string[]>([]);

  const pendingLeaveCount = PENDING_LEAVES.filter(
    (l) => !approvedLeaves.includes(l.id) && !rejectedLeaves.includes(l.id),
  ).length;
  const openTaskCount = tasks.filter((t) => !t.done).length;

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">My Workspace</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          It&apos;s {dayName}, {dateStr}
        </p>
      </div>

      <StatCards
        pendingLeaveCount={pendingLeaveCount}
        openTaskCount={openTaskCount}
      />

      <div className="grid grid-cols-3 gap-4">
        <PendingApprovals
          approvedLeaves={approvedLeaves}
          rejectedLeaves={rejectedLeaves}
          onApproveLeave={(id) => setApprovedLeaves((p) => [...p, id])}
          onRejectLeave={(id) => setRejectedLeaves((p) => [...p, id])}
          pendingLeaveCount={pendingLeaveCount}
        />
        <MyTasks tasks={tasks} setTasks={setTasks} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <UpcomingEvents />
        <RecentActivity />
      </div>
    </div>
  );
}

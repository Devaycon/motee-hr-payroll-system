"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleDollarSign, Clock, Target, Users } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { cn } from "@/src/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
  approvedHours,
  projectProgress,
  projectSpend,
  totalAllocation,
} from "@/src/lib/types/projects";
import { GanttChart } from "../components/gantt-chart";
import { TasksPanel } from "./tasks-panel";
import { MilestonesPanel } from "./milestones-panel";
import { TeamPanel } from "./team-panel";
import { TimesheetsPanel } from "./timesheets-panel";

export function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { format } = useCurrency();
  const project = useAppSelector((s) =>
    s.projects.projects.find((p) => p.id === projectId),
  );
  const timesheets = useAppSelector((s) => s.projects.timesheets);
  // Controlled so each KPI card can open the panel behind its number.
  const [activeTab, setActiveTab] = useState("timeline");

  const stats = useMemo<HrStatCardItem[]>(() => {
    if (!project) return [];
    const spend = projectSpend(project, timesheets);
    const budget = project.budget ?? 0;
    const card = (tab: string) => ({
      active: activeTab === tab,
      onClick: () => setActiveTab(tab),
    });
    return [
      {
        icon: Target,
        label: "Progress",
        value: `${projectProgress(project)}%`,
        sub: `${project.tasks.filter((t) => t.status === "completed").length} of ${project.tasks.length} tasks done`,
        tone: "violet",
        ...card("tasks"),
      },
      {
        icon: Users,
        label: "Team",
        value: project.allocations.length,
        sub: `${totalAllocation(project).toFixed(1)} FTE committed`,
        tone: "blue",
        ...card("team"),
      },
      {
        icon: Clock,
        label: "Hours Logged",
        value: approvedHours(timesheets, project.id),
        sub: "Approved time only",
        tone: "emerald",
        ...card("time"),
      },
      {
        icon: CircleDollarSign,
        label: "Spend",
        value: format(spend, { compact: true }),
        sub: budget
          ? `${Math.round((spend / budget) * 100)}% of ${format(budget, { compact: true })}`
          : "No budget set",
        // Over budget is the one number that should shout.
        tone: budget && spend > budget ? "red" : "amber",
        // Spend is derived from approved time, so it opens the same panel.
        onClick: () => setActiveTab("time"),
      },
    ];
  }, [project, timesheets, format, activeTab]);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="font-medium text-muted-foreground">Project not found</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => router.push("/workspace/projects")}
        >
          Back to projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-1 h-8 w-8"
          onClick={() => router.push("/workspace/projects")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold text-foreground">
              {project.name}
            </h1>
            <Badge
              variant="outline"
              className={cn("text-[10px]", PROJECT_STATUS_STYLES[project.status])}
            >
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px]">
              {project.code}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {project.startDate} → {project.endDate}
            {project.ownerName && ` · Owned by ${project.ownerName}`}
            {project.client && ` · ${project.client}`}
          </p>
        </div>
      </div>

      <HrStatCardsGrid stats={stats} columns={4} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "timeline", label: "Timeline" },
            { value: "tasks", label: `Tasks (${project.tasks.length})` },
            {
              value: "milestones",
              label: `Milestones (${project.milestones.length})`,
            },
            { value: "team", label: `Team (${project.allocations.length})` },
            { value: "time", label: "Timesheets" },
          ]}
        />

        <TabsContent value="timeline" className="mt-5">
          <GanttChart
            tasks={project.tasks}
            milestones={project.milestones}
            projectStart={project.startDate}
            projectEnd={project.endDate}
          />
        </TabsContent>

        <TabsContent value="tasks" className="mt-5">
          <TasksPanel project={project} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-5">
          <MilestonesPanel project={project} />
        </TabsContent>

        <TabsContent value="team" className="mt-5">
          <TeamPanel project={project} />
        </TabsContent>

        <TabsContent value="time" className="mt-5">
          <TimesheetsPanel project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

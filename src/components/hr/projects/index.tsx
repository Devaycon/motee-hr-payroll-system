"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  Briefcase,
  CircleDollarSign,
  Eye,
  MoreHorizontal,
  Plus,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  DataTable,
  actionsColumn,
  sortableHeader,
} from "@/src/components/shared/data-table";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { deleteProject } from "@/src/lib/stores/projects-slice";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import { cn } from "@/src/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_STYLES,
  findOverAllocations,
  projectProgress,
  projectSpend,
  totalAllocation,
  type Project,
} from "@/src/lib/types/projects";
import { ProjectFormModal } from "./components/project-form-modal";

/** The slice a KPI card drills the projects tabs down to. */
type ProjectCardFilter = "all" | "assigned" | "budgeted";

const PROJECT_CARD_FILTER_LABELS: Record<
  Exclude<ProjectCardFilter, "all">,
  string
> = {
  assigned: "Projects with people assigned",
  budgeted: "Projects with a budget",
};

/** Single source of truth for what each card counts and the table then shows. */
function matchesProjectCardFilter(
  project: Project,
  filter: ProjectCardFilter,
): boolean {
  switch (filter) {
    case "assigned":
      return project.allocations.length > 0;
    case "budgeted":
      return (project.budget ?? 0) > 0;
    default:
      return true;
  }
}

export function ProjectsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { format } = useCurrency();
  const projects = useAppSelector((s) => s.projects.projects);
  const timesheets = useAppSelector((s) => s.projects.timesheets);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("active");
  /** Drill-down set by the KPI cards; "all" shows every project. */
  const [cardFilter, setCardFilter] = useState<ProjectCardFilter>("all");

  /** Drill-down: opens the tab holding these rows and filters to them. */
  function drillDown(tab: string, filter: ProjectCardFilter) {
    setActiveTab(tab);
    setCardFilter(filter);
  }

  const active = useMemo(
    () =>
      projects.filter(
        (p) =>
          (p.status === "active" || p.status === "planning") &&
          matchesProjectCardFilter(p, cardFilter),
      ),
    [projects, cardFilter],
  );
  const closed = useMemo(
    () =>
      projects.filter(
        (p) =>
          (p.status === "completed" || p.status === "cancelled") &&
          matchesProjectCardFilter(p, cardFilter),
      ),
    [projects, cardFilter],
  );

  /** §10 — the resourcing warning that makes allocation mean something. */
  const overAllocations = useMemo(
    () => findOverAllocations(projects),
    [projects],
  );

  /** The "All" rows, narrowed to whichever KPI card is selected. */
  const visibleProjects = useMemo(
    () => projects.filter((p) => matchesProjectCardFilter(p, cardFilter)),
    [projects, cardFilter],
  );

  const stats = useMemo<HrStatCardItem[]>(() => {
    const budget = projects.reduce((s, p) => s + (p.budget ?? 0), 0);
    const spend = projects.reduce((s, p) => s + projectSpend(p, timesheets), 0);
    const people = new Set(
      projects.flatMap((p) => p.allocations.map((a) => a.employeeId)),
    );
    const staffed = projects.filter((p) => p.allocations.length > 0).length;
    const budgeted = projects.filter((p) => (p.budget ?? 0) > 0).length;
    return [
      {
        icon: Briefcase,
        label: "Active Projects",
        value: active.length,
        sub: `${projects.length} in total`,
        tone: "violet",
        active: activeTab === "active" && cardFilter === "all",
        onClick: () => drillDown("active", "all"),
      },
      {
        icon: Users,
        label: "People Assigned",
        value: people.size,
        sub: `across ${staffed} project${staffed !== 1 ? "s" : ""}`,
        tone: overAllocations.length > 0 ? "amber" : "emerald",
        active: cardFilter === "assigned",
        onClick: () => drillDown("all", "assigned"),
      },
      {
        icon: CircleDollarSign,
        label: "Total Budget",
        value: format(budget, { compact: true }),
        sub: `${format(spend, { compact: true })} logged to date`,
        tone: "blue",
        active: cardFilter === "budgeted",
        onClick: () => drillDown("all", "budgeted"),
      },
      {
        icon: TrendingUp,
        label: "Avg Progress",
        value: `${
          active.length
            ? Math.round(
                active.reduce((s, p) => s + projectProgress(p), 0) /
                  active.length,
              )
            : 0
        }%`,
        // An average over the active projects — opens that same list, so it
        // deliberately carries no selected state of its own.
        sub: `Across ${active.length} active projects`,
        tone: "emerald",
        onClick: () => drillDown("active", "all"),
      },
    ];
  }, [
    projects,
    active,
    timesheets,
    overAllocations,
    format,
    activeTab,
    cardFilter,
  ]);

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "code",
        header: sortableHeader("Code"),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: sortableHeader("Project"),
        cell: ({ row }) => (
          <div>
            <span className="font-medium text-foreground">
              {row.original.name}
            </span>
            {row.original.client && (
              <p className="text-[11px] text-muted-foreground">
                {row.original.client}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "owner",
        header: "Owner",
        accessorFn: (p) => p.ownerName ?? "—",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.ownerName ?? "Unassigned"}
          </span>
        ),
      },
      {
        id: "progress",
        header: sortableHeader("Progress"),
        accessorFn: (p) => projectProgress(p),
        cell: ({ row }) => {
          const pct = projectProgress(row.original);
          return (
            <div className="w-28 space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{pct}%</span>
                <span>
                  {row.original.tasks.filter((t) => t.status === "completed").length}
                  /{row.original.tasks.length}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: "team",
        header: "Team",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.allocations.length} ·{" "}
            {totalAllocation(row.original).toFixed(1)} FTE
          </span>
        ),
      },
      {
        id: "dates",
        header: sortableHeader("Timeline"),
        accessorFn: (p) => p.endDate,
        cell: ({ row }) => (
          <span className="text-[11px] text-muted-foreground">
            {row.original.startDate}
            <br />→ {row.original.endDate}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (p) => p.status,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("text-[10px]", PROJECT_STATUS_STYLES[row.original.status])}
          >
            {PROJECT_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      actionsColumn<Project>((project) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/workspace/projects/${project.id}`)}
            >
              <Eye className="mr-2 h-3.5 w-3.5" />
              Open project
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setEditing(project);
                setFormOpen(true);
              }}
            >
              Edit details
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                dispatch(deleteProject(project.id));
                toast.success(`"${project.name}" deleted`);
              }}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [router, dispatch],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4 py-2">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Projects</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Plan work, schedule tasks and see who is committed to what.
          </p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      <HrStatCardsGrid stats={stats} columns={4} />

      {/* Over-allocation is the whole point of tracking percentages, so it is
          stated on the landing page rather than hidden in a project. */}
      {overAllocations.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-medium text-foreground">
              {overAllocations.length} person
              {overAllocations.length === 1 ? " is" : "s are"} committed beyond
              full time
            </p>
          </div>
          {overAllocations.map((a) => (
            <p key={a.employeeId} className="text-[11px] text-muted-foreground">
              <span className="text-foreground">{a.employeeName}</span> at{" "}
              {a.totalPercent}% across{" "}
              {a.projects.map((p) => `${p.projectName} (${p.percent}%)`).join(", ")}
            </p>
          ))}
        </div>
      )}

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {PROJECT_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              ({visibleProjects.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All projects
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "active", label: `Active (${active.length})` },
            { value: "closed", label: `Closed (${closed.length})` },
            { value: "all", label: `All (${visibleProjects.length})` },
          ]}
        />
        {[
          { value: "active", data: active },
          { value: "closed", data: closed },
          { value: "all", data: visibleProjects },
        ].map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="mt-5">
            <DataTable
              exportTitle="Projects"
              columns={columns}
              data={tab.data}
              getRowId={(p) => p.id}
              onRowClick={(p) => router.push(`/workspace/projects/${p.id}`)}
              searchPlaceholder="Search projects…"
              emptyMessage="No projects here yet."
            />
          </TabsContent>
        ))}
      </Tabs>

      <ProjectFormModal
        open={formOpen}
        editing={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

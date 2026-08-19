"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  DoorOpen,
  CheckCircle2,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useCan } from "@/src/lib/permissions/use-can";
import { cn } from "@/src/lib/utils";
import {
  HIRING_PRIORITY_LABELS,
  HIRING_PRIORITY_STYLES,
  REQUISITION_DISPLAY_STATUS,
  REQUISITION_DISPLAY_TONE_STYLES,
} from "@/src/data/recruitment-demo";
import type {
  HiringPriority,
  JobRequisition,
} from "@/src/lib/types/recruitment";
import { useRecruitment } from "./hooks";

/**
 * The slice a KPI card drills the recruitment tabs down to. Applicants and
 * hires live on candidates, so those cards narrow to the *openings* that have
 * them — the card value stays the headline number, the sub says what opens.
 */
type RecruitmentCardFilter =
  | "all"
  | "open_roles"
  | "with_applicants"
  | "with_hires";

const RECRUITMENT_CARD_FILTER_LABELS: Record<
  Exclude<RecruitmentCardFilter, "all">,
  string
> = {
  open_roles: "Open roles",
  with_applicants: "Openings with applicants",
  with_hires: "Openings with hires",
};

export function RecruitmentPage() {
  const router = useRouter();
  const { loading, bucket } = useRecruitment();
  const canCreate = useCan("talent.recruitment", "create");
  const canEdit = useCan("talent.recruitment", "edit");

  const activeCountByReq = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of bucket.candidates) {
      if (c.status === "rejected") continue;
      m.set(c.requisitionId, (m.get(c.requisitionId) ?? 0) + 1);
    }
    return m;
  }, [bucket.candidates]);

  /** Requisitions with at least one hire, for the "Hired" card drill-down. */
  const hiredCountByReq = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of bucket.candidates) {
      if (c.stage !== "hired" || c.status === "rejected") continue;
      m.set(c.requisitionId, (m.get(c.requisitionId) ?? 0) + 1);
    }
    return m;
  }, [bucket.candidates]);

  /** Drill-down set by the KPI cards; "all" shows every recruitment. */
  const [cardFilter, setCardFilter] = useState<RecruitmentCardFilter>("all");
  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("approved");

  // Toolbar filters. These compose with the KPI drill-down rather than
  // replacing it — the cards narrow to a slice, these narrow within it.
  const [deptFilter, setDeptFilter] = useState("all");
  const [managerFilter, setManagerFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const departments = useMemo(
    () =>
      [...new Set(bucket.requisitions.map((r) => r.department))]
        .filter(Boolean)
        .sort(),
    [bucket.requisitions],
  );
  const managers = useMemo(
    () =>
      [...new Set(bucket.requisitions.map((r) => r.hiringManager))]
        .filter((m) => m && m !== "—")
        .sort(),
    [bucket.requisitions],
  );

  const matches = useCallback(
    (r: JobRequisition) => {
      if (deptFilter !== "all" && r.department !== deptFilter) return false;
      if (managerFilter !== "all" && r.hiringManager !== managerFilter)
        return false;
      if (priorityFilter !== "all" && r.hiringPriority !== priorityFilter)
        return false;
      switch (cardFilter) {
        case "open_roles":
          return ["approved", "open", "interviewing", "offer_stage"].includes(
            r.status,
          );
        case "with_applicants":
          return (activeCountByReq.get(r.id) ?? 0) > 0;
        case "with_hires":
          return (hiredCountByReq.get(r.id) ?? 0) > 0;
        default:
          return true;
      }
    },
    [
      cardFilter,
      activeCountByReq,
      hiredCountByReq,
      deptFilter,
      managerFilter,
      priorityFilter,
    ],
  );

  const filtersActive =
    deptFilter !== "all" || managerFilter !== "all" || priorityFilter !== "all";

  function clearFilters() {
    setDeptFilter("all");
    setManagerFilter("all");
    setPriorityFilter("all");
  }

  // Requested = drafts being built; Approved = published/active recruitments.
  const requestedList = useMemo(
    () =>
      bucket.requisitions.filter((r) => r.status === "draft" && matches(r)),
    [bucket.requisitions, matches],
  );
  const approvedList = useMemo(
    () =>
      bucket.requisitions.filter((r) => r.status !== "draft" && matches(r)),
    [bucket.requisitions, matches],
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Select value={deptFilter} onValueChange={setDeptFilter}>
        <SelectTrigger className="h-9 w-44">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All departments</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={managerFilter} onValueChange={setManagerFilter}>
        <SelectTrigger className="h-9 w-48">
          <SelectValue placeholder="Hiring manager" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All hiring managers</SelectItem>
          {managers.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
        <SelectTrigger className="h-9 w-36">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any priority</SelectItem>
          {(Object.keys(HIRING_PRIORITY_LABELS) as HiringPriority[]).map((p) => (
            <SelectItem key={p} value={p}>
              {HIRING_PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {filtersActive && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-muted-foreground"
          onClick={clearFilters}
        >
          Clear
        </Button>
      )}
    </div>
  );

  const stats = useMemo(() => {
    const openRoles = bucket.requisitions.filter((r) =>
      ["approved", "open", "interviewing", "offer_stage"].includes(r.status),
    ).length;
    const hired = bucket.candidates.filter(
      (c) => c.stage === "hired" && c.status !== "rejected",
    ).length;
    const activeApplicants = bucket.candidates.filter(
      (c) => c.status !== "rejected",
    ).length;
    return {
      reqs: bucket.requisitions.length,
      openRoles,
      applicants: activeApplicants,
      hired,
      // How many openings each candidate-level number spreads across, so the
      // card can say what the drill-down will actually list.
      reqsWithApplicants: activeCountByReq.size,
      reqsWithHires: hiredCountByReq.size,
    };
  }, [bucket, activeCountByReq, hiredCountByReq]);

  /** Drill-down: opens the tab holding these rows and filters to them. */
  function drillDown(tab: string, filter: RecruitmentCardFilter) {
    setActiveTab(tab);
    setCardFilter(filter);
  }

  const columns = useMemo<ColumnDef<JobRequisition>[]>(
    () => [
      {
        id: "requisitionNumber",
        header: sortableHeader("Req. No."),
        accessorFn: (r) => r.requisitionNumber ?? r.id,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.requisitionNumber ?? row.original.id}
          </span>
        ),
      },
      {
        accessorKey: "positionTitle",
        header: sortableHeader("Role"),
        cell: ({ row }) => (
          <div className="font-medium text-foreground">
            {row.original.positionTitle}
            <p className="text-xs text-muted-foreground font-normal">
              {row.original.department}
            </p>
          </div>
        ),
      },
      {
        id: "applicants",
        header: sortableHeader("Applicants"),
        accessorFn: (r) => activeCountByReq.get(r.id) ?? 0,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-sm text-foreground">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            {activeCountByReq.get(row.original.id) ?? 0}
          </span>
        ),
      },
      {
        accessorKey: "openings",
        header: "Openings",
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.openings}
          </span>
        ),
      },
      {
        accessorKey: "targetStartDate",
        header: sortableHeader("Target start"),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.targetStartDate || "—"}
          </span>
        ),
      },
      {
        id: "priority",
        header: sortableHeader("Priority"),
        accessorFn: (r) => r.hiringPriority,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              HIRING_PRIORITY_STYLES[row.original.hiringPriority],
            )}
          >
            {HIRING_PRIORITY_LABELS[row.original.hiringPriority]}
          </Badge>
        ),
      },
      {
        id: "status",
        // Named for what it reports, not the generic word — this table also
        // carries candidate counts, so "Status" alone is ambiguous.
        header: "Vacancy status",
        cell: ({ row }) => {
          const d = REQUISITION_DISPLAY_STATUS[row.original.status];
          return (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                REQUISITION_DISPLAY_TONE_STYLES[d.tone],
              )}
            >
              {d.label}
            </Badge>
          );
        },
      },
      actionsColumn<JobRequisition>((req) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push(`/talent/recruitment/${req.id}`)}
            >
              <Eye className="w-3.5 h-3.5 mr-2" />
              View details
            </DropdownMenuItem>
            {canEdit && (
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/talent/recruitment/new?req=${req.id}`)
                }
              >
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Edit recruitment
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )),
    ],
    [activeCountByReq, router, canEdit],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap py-2">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Recruitment</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Each requisition runs its own pipeline. Open one to manage its
            applicants, interviews and hires.
          </p>
        </div>
        {canCreate && (
          <Button
            className="gap-1.5"
            onClick={() => router.push("/talent/recruitment/new")}
          >
            <Plus className="w-4 h-4" />
            Create Recruitment
          </Button>
        )}
      </div>

      <HrStatCardsGrid
        columns={4}
        stats={[
          {
            label: "Requisitions",
            value: stats.reqs,
            sub: "Every recruitment raised",
            icon: Briefcase,
            tone: "blue",
            active: cardFilter === "all",
            onClick: () => drillDown("approved", "all"),
          },
          {
            label: "Open Roles",
            value: stats.openRoles,
            sub: "Actively recruiting",
            icon: DoorOpen,
            tone: "emerald",
            active: cardFilter === "open_roles",
            onClick: () => drillDown("approved", "open_roles"),
          },
          {
            label: "Applicants",
            value: stats.applicants,
            sub: `across ${stats.reqsWithApplicants} openings`,
            icon: Users,
            tone: "violet",
            active: cardFilter === "with_applicants",
            onClick: () => drillDown("approved", "with_applicants"),
          },
          {
            label: "Hired",
            value: stats.hired,
            sub: `across ${stats.reqsWithHires} openings`,
            icon: CheckCircle2,
            tone: "amber",
            active: cardFilter === "with_hires",
            onClick: () => drillDown("approved", "with_hires"),
          },
        ]}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {RECRUITMENT_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              ({requestedList.length + approvedList.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All recruitments
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "requested", label: `Requested Recruitment (${requestedList.length})` },
            { value: "approved", label: `Approved Recruitment (${approvedList.length})` },
          ]}
        />

        <TabsContent value="requested" className="mt-5">
          <DataTable
            exportTitle="Recruitments"
            columns={columns}
            data={requestedList}
            getRowId={(r) => r.id}
            onRowClick={(r) => router.push(`/talent/recruitment/${r.id}`)}
            toolbarActions={toolbar}
            searchPlaceholder="Search recruitments…"
            emptyMessage="No draft recruitments. Create one from an approved requisition."
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-5">
          <DataTable
            exportTitle="Recruitments"
            columns={columns}
            data={approvedList}
            getRowId={(r) => r.id}
            onRowClick={(r) => router.push(`/talent/recruitment/${r.id}`)}
            toolbarActions={toolbar}
            searchPlaceholder="Search recruitments…"
            emptyMessage="No published recruitments yet."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

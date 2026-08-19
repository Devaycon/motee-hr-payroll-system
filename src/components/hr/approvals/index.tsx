"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Inbox,
  Send,
  FileCheck2,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import { DateRangeFilter } from "@/src/components/shared/date-range-filter";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  ALL_DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  STATUS_LABELS,
  type ApprovalDocumentType,
  type ApprovalStatus,
} from "@/src/lib/types/approvals";
import { QueueTable } from "./components/queue-table";
import { IntakeModal } from "./components/intake-modal";
import { currentApproverName, isCurrentApprover, isSubmitter } from "./utils";
import { useDemoApprovalSeed } from "./use-demo-seed";
import { useCan } from "@/src/lib/permissions/use-can";

/** The slice a KPI card drills the submission queues down to. */
type ApprovalCardFilter = "all" | "in_progress" | "approved_week";

const APPROVAL_CARD_FILTER_LABELS: Record<
  Exclude<ApprovalCardFilter, "all">,
  string
> = {
  // "In flight" is document-management jargon; HR users expect "In Progress"
  // (client feedback — terminology).
  in_progress: "In Progress",
  approved_week: "Approved this week",
};

/** Single source of truth for what each card counts and the queue then shows. */
function matchesApprovalCardFilter(
  request: { status: ApprovalStatus; submittedAt: string },
  filter: ApprovalCardFilter,
  weekAgoMs: number,
): boolean {
  switch (filter) {
    case "in_progress":
      return request.status === "in_progress";
    case "approved_week":
      return (
        request.status === "approved" &&
        new Date(request.submittedAt).getTime() > weekAgoMs
      );
    default:
      return true;
  }
}

interface ApprovalsPageProps {
  /**
   * Controls page chrome: the HR variant gets the wider "All submissions"
   * tab and admin-leaning copy. Employee view is more personal. In both
   * variants any user with `submissions.queue / create` can submit.
   */
  variant?: "hr" | "employee";
  /** Base path used for detail-page links. */
  basePath?: string;
}

export function ApprovalsPage({
  variant = "hr",
  basePath = "/hr-action-center/submissions",
}: ApprovalsPageProps) {
  useDemoApprovalSeed();
  const user = useAppSelector((s) => s.auth.user);
  const requests = useAppSelector((s) => s.approvals.requests);
  const canSubmit = useCan("submissions.queue", "create");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ApprovalDocumentType | "all">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">(
    "all",
  );
  // Filters the client asked for once an org has hundreds of submissions.
  const [submitterFilter, setSubmitterFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [approverFilter, setApproverFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState(
    variant === "employee" ? "mine" : "inbox",
  );
  /** Drill-down set by the KPI cards; "all" shows every submission. */
  const [cardFilter, setCardFilter] = useState<ApprovalCardFilter>("all");

  const myEmployeeId = user?.employeeId;
  const myRoleId = user?.roleId;

  // Captured once on mount so the memos stay pure across re-renders.
  const [nowMs] = useState(() => Date.now());
  const weekAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;

  /** Distinct values for the people/department filters, drawn from the data. */
  const filterOptions = useMemo(() => {
    const submitters = new Set<string>();
    const departments = new Set<string>();
    const approvers = new Set<string>();
    for (const r of requests) {
      submitters.add(r.submittedBy.name);
      if (r.submittedBy.departmentName)
        departments.add(r.submittedBy.departmentName);
      const approver = currentApproverName(r);
      if (approver) approvers.add(approver);
    }
    const sorted = (s: Set<string>) => Array.from(s).sort();
    return {
      submitters: sorted(submitters),
      departments: sorted(departments),
      approvers: sorted(approvers),
    };
  }, [requests]);

  const activeFilterCount =
    (submitterFilter !== "all" ? 1 : 0) +
    (departmentFilter !== "all" ? 1 : 0) +
    (approverFilter !== "all" ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0);

  /** Search and the dropdowns only — the shared base every tab narrows from. */
  const searchFiltered = useMemo(() => {
    const q = search.toLowerCase();
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;
    return requests.filter((r) => {
      if (
        q &&
        !r.documentTitle.toLowerCase().includes(q) &&
        !r.documentSummary.toLowerCase().includes(q) &&
        !r.submittedBy.name.toLowerCase().includes(q)
      ) {
        return false;
      }
      if (typeFilter !== "all" && r.documentType !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (submitterFilter !== "all" && r.submittedBy.name !== submitterFilter)
        return false;
      if (
        departmentFilter !== "all" &&
        r.submittedBy.departmentName !== departmentFilter
      )
        return false;
      if (approverFilter !== "all" && currentApproverName(r) !== approverFilter)
        return false;
      if (fromMs !== null || toMs !== null) {
        const submitted = new Date(r.submittedAt).getTime();
        if (fromMs !== null && submitted < fromMs) return false;
        if (toMs !== null && submitted > toMs) return false;
      }
      return true;
    });
  }, [
    requests,
    search,
    typeFilter,
    statusFilter,
    submitterFilter,
    departmentFilter,
    approverFilter,
    dateFrom,
    dateTo,
  ]);

  const filtered = useMemo(
    () =>
      // The card drill-down composes with search and the dropdowns.
      searchFiltered.filter((r) =>
        matchesApprovalCardFilter(r, cardFilter, weekAgoMs),
      ),
    [searchFiltered, cardFilter, weekAgoMs],
  );

  const inbox = useMemo(
    () => filtered.filter((r) => isCurrentApprover(r, myEmployeeId, myRoleId)),
    [filtered, myEmployeeId, myRoleId],
  );
  const submittedByMe = useMemo(
    () => filtered.filter((r) => isSubmitter(r, myEmployeeId)),
    [filtered, myEmployeeId],
  );

  /**
   * The Approved tab scopes itself, rather than relying on the card drill-down:
   * the tab means the same thing whether you arrive by clicking its KPI card or
   * by clicking the tab directly. HR sees the org; an employee sees their own.
   */
  const approvedRecent = useMemo(() => {
    const base = searchFiltered.filter((r) =>
      matchesApprovalCardFilter(r, "approved_week", weekAgoMs),
    );
    return variant === "hr"
      ? base
      : base.filter((r) => isSubmitter(r, myEmployeeId));
  }, [searchFiltered, weekAgoMs, variant, myEmployeeId]);

  /**
   * Org-wide in-progress work. Self-scoping for the same reason the Approved tab
   * is: the tab means the same thing whether you arrive by its KPI card or by
   * clicking the tab directly.
   */
  const inProgressOrg = useMemo(
    () =>
      searchFiltered.filter((r) =>
        matchesApprovalCardFilter(r, "in_progress", weekAgoMs),
      ),
    [searchFiltered, weekAgoMs],
  );

  const stats = useMemo(() => {
    const waitingOnMe = requests.filter((r) =>
      isCurrentApprover(r, myEmployeeId, myRoleId),
    ).length;
    const mine = requests.filter((r) => isSubmitter(r, myEmployeeId)).length;
    const inProgress = requests.filter(
      (r) => r.status === "in_progress",
    ).length;
    const approvedThisWeek = requests.filter((r) =>
      matchesApprovalCardFilter(r, "approved_week", weekAgoMs),
    ).length;
    return { waitingOnMe, mine, inProgress, approvedThisWeek };
  }, [requests, myEmployeeId, myRoleId, weekAgoMs]);

  /** Drill-down: opens the queue holding these requests and filters to them. */
  function drillDown(tab: string, filter: ApprovalCardFilter) {
    setActiveTab(tab);
    setCardFilter(filter);
  }

  const statCards: HrStatCardItem[] = [
    {
      icon: Inbox,
      // "Waiting on my desk" — younger users don't associate digital work with
      // a desk (client feedback — terminology).
      label: "Pending My Approval",
      value: stats.waitingOnMe,
      sub: "Awaiting your decision",
      zeroSub: "Nothing needs your decision",
      tone: "amber",
      active: activeTab === "inbox" && cardFilter === "all",
      onClick: () => drillDown("inbox", "all"),
    },
    {
      icon: Send,
      label: "Submitted by Me",
      value: stats.mine,
      sub: "Everything you've sent",
      zeroSub: "You haven't submitted anything yet",
      tone: "blue",
      active: activeTab === "mine" && cardFilter === "all",
      onClick: () => drillDown("mine", "all"),
    },
    ...(variant === "hr"
      ? [
          {
            icon: Clock,
            label: "In Progress (Organisation-wide)",
            value: stats.inProgress,
            sub: "Moving through approval",
            zeroSub: "Nothing is moving through approval",
            tone: "violet" as const,
            // Its own tab now, so the card just switches to it — the tab scopes
            // itself and the two cannot disagree.
            active: activeTab === "inprogress",
            onClick: () => drillDown("inprogress", "all"),
          },
        ]
      : []),
    {
      icon: FileCheck2,
      label: "Approved this week",
      value: stats.approvedThisWeek,
      sub: "Cleared in the last 7 days",
      zeroSub: "Nothing cleared in the last 7 days",
      tone: "emerald",
      // Its own tab, so the card only has to switch to it — the tab already
      // scopes to approved-this-week without a card filter.
      active: activeTab === "approved",
      onClick: () => drillDown("approved", "all"),
    },
  ];

  const headerTitle =
    variant === "employee"
      ? "My Submissions"
      : "Submissions & Approvals";
  const headerSub =
    variant === "employee"
      ? "Submit new requests and track exactly who they're waiting on."
      : "Every formal submission across the system — your inbox, what you've sent, and the full org queue.";

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">{headerTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{headerSub}</p>
        </div>
        {canSubmit && (
          <Button className="mt-1 gap-1.5" onClick={() => setIntakeOpen(true)}>
            <Plus className="w-4 h-4" />
            New Submission
          </Button>
        )}
      </div>

      <HrStatCardsGrid stats={statCards} columns={4} />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {APPROVAL_CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">({filtered.length})</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All submissions
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Search stays put while the rest of the filter row scrolls away on a
            phone (client feedback — mobile considerations). */}
        {/* Solid while stuck: the rows scrolling underneath must be occluded,
            and a translucent bar also lets the page watermark through. */}
        <div className="sticky top-0 z-20 -mx-1 flex items-center gap-2 bg-background px-1 py-1 md:static md:mx-0 md:bg-transparent md:px-0 md:py-0">
          <Input
            placeholder="Search title, summary, or submitter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:max-w-sm"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1.5 md:hidden"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        <div
          className={cn(
            "flex-wrap items-center gap-3",
            filtersOpen ? "flex" : "hidden md:flex",
          )}
        >
        <Select
          value={typeFilter}
          onValueChange={(v) =>
            setTypeFilter(v as ApprovalDocumentType | "all")
          }
        >
          <SelectTrigger className="h-9 w-44 text-xs">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ALL_DOCUMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {DOCUMENT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as ApprovalStatus | "all")}
        >
          <SelectTrigger className="h-9 w-40 text-xs">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABELS) as ApprovalStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={submitterFilter} onValueChange={setSubmitterFilter}>
          <SelectTrigger className="h-9 w-44 text-xs">
            <SelectValue placeholder="Submitted by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Submitted by (anyone)</SelectItem>
            {filterOptions.submitters.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="h-9 w-44 text-xs">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {filterOptions.departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={approverFilter} onValueChange={setApproverFilter}>
          <SelectTrigger className="h-9 w-48 text-xs">
            <SelectValue placeholder="Current approver" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any current approver</SelectItem>
            {filterOptions.approvers.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          placeholder="Submitted: any date"
          className="w-56"
          onChange={({ from, to }) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs text-muted-foreground"
            onClick={() => {
              setSubmitterFilter("all");
              setDepartmentFilter("all");
              setApproverFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear filters
          </Button>
        )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Every KPI card has a tab that means the same thing, in the same
            order (client feedback — "replicate everything in the card above").
            "All submissions" trails as the catch-all. */}
        <PageTabsList
          tabs={
            variant === "hr"
              ? [
                  {
                    value: "inbox",
                    label: `Pending My Approval (${inbox.length})`,
                  },
                  {
                    value: "mine",
                    label: `Submitted by Me (${submittedByMe.length})`,
                  },
                  {
                    value: "inprogress",
                    label: `In Progress (${inProgressOrg.length})`,
                  },
                  {
                    value: "approved",
                    label: `Approved this week (${approvedRecent.length})`,
                  },
                  {
                    value: "all",
                    label: `All submissions (${filtered.length})`,
                  },
                ]
              : [
                  {
                    value: "inbox",
                    label: `Pending My Approval (${inbox.length})`,
                  },
                  {
                    value: "mine",
                    label: `Submitted by Me (${submittedByMe.length})`,
                  },
                  {
                    value: "approved",
                    label: `Approved this week (${approvedRecent.length})`,
                  },
                ]
          }
        />

        <TabsContent value="mine" className="mt-5">
          <QueueTable
            requests={submittedByMe}
            basePath={basePath}
            emptyLabel={
              canSubmit
                ? "You haven't submitted anything yet. Click “New Submission” to start."
                : "You haven't submitted anything yet."
            }
          />
        </TabsContent>

        <TabsContent value="inbox" className="mt-5">
          <QueueTable
            requests={inbox}
            basePath={basePath}
            emptyLabel="Nothing is waiting on your approval right now."
          />
        </TabsContent>

        {variant === "hr" && (
          <TabsContent value="inprogress" className="mt-5">
            <QueueTable
              requests={inProgressOrg}
              basePath={basePath}
              emptyLabel="Nothing is moving through approval right now."
            />
          </TabsContent>
        )}

        {variant === "hr" && (
          <TabsContent value="all" className="mt-5">
            <QueueTable
              requests={filtered}
              basePath={basePath}
              emptyLabel="No submissions match your filters."
            />
          </TabsContent>
        )}

        <TabsContent value="approved" className="mt-5">
          <QueueTable
            requests={approvedRecent}
            basePath={basePath}
            emptyLabel={
              variant === "hr"
                ? "Nothing has been approved in the last 7 days."
                : "None of your submissions were approved in the last 7 days."
            }
          />
        </TabsContent>
      </Tabs>

      <IntakeModal open={intakeOpen} onOpenChange={setIntakeOpen} />
    </div>
  );
}

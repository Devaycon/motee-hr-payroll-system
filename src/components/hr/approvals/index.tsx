"use client";

import { useMemo, useState } from "react";
import { Plus, Inbox, Send, FileCheck2, Clock } from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
import { isCurrentApprover, isSubmitter } from "./utils";
import { useDemoApprovalSeed } from "./use-demo-seed";
import { useCan } from "@/src/lib/permissions/use-can";

/** The slice a KPI card drills the submission queues down to. */
type ApprovalCardFilter = "all" | "in_progress" | "approved_week";

const APPROVAL_CARD_FILTER_LABELS: Record<
  Exclude<ApprovalCardFilter, "all">,
  string
> = {
  in_progress: "In flight",
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
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
      // The card drill-down composes with search and the dropdowns.
      if (!matchesApprovalCardFilter(r, cardFilter, weekAgoMs)) return false;
      return true;
    });
  }, [requests, search, typeFilter, statusFilter, cardFilter, weekAgoMs]);

  const inbox = useMemo(
    () => filtered.filter((r) => isCurrentApprover(r, myEmployeeId, myRoleId)),
    [filtered, myEmployeeId, myRoleId],
  );
  const submittedByMe = useMemo(
    () => filtered.filter((r) => isSubmitter(r, myEmployeeId)),
    [filtered, myEmployeeId],
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

  // The org-wide queue only exists on the HR variant; employees drill into
  // their own submissions instead.
  const orgTab = variant === "hr" ? "all" : "mine";

  const statCards: HrStatCardItem[] = [
    {
      icon: Inbox,
      label: "Waiting on my desk",
      value: stats.waitingOnMe,
      sub: "Awaiting your decision",
      tone: "amber",
      active: activeTab === "inbox" && cardFilter === "all",
      onClick: () => drillDown("inbox", "all"),
    },
    {
      icon: Send,
      label: "My submissions",
      value: stats.mine,
      sub: "Everything you've sent",
      tone: "blue",
      active: activeTab === "mine" && cardFilter === "all",
      onClick: () => drillDown("mine", "all"),
    },
    ...(variant === "hr"
      ? [
          {
            icon: Clock,
            label: "In flight (org)",
            value: stats.inProgress,
            sub: "Moving through approval",
            tone: "violet" as const,
            active: cardFilter === "in_progress",
            onClick: () => drillDown("all", "in_progress"),
          },
        ]
      : []),
    {
      icon: FileCheck2,
      label: "Approved this week",
      value: stats.approvedThisWeek,
      sub: "Cleared in the last 7 days",
      tone: "emerald",
      active: cardFilter === "approved_week",
      onClick: () => drillDown(orgTab, "approved_week"),
    },
  ];

  const headerTitle =
    variant === "employee"
      ? "My Submissions"
      : "Submissions & Approvals";
  const headerSub =
    variant === "employee"
      ? "Submit new requests and track exactly whose desk they're sitting on."
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

      <div className="flex items-center gap-3 flex-wrap">
        <Input
          placeholder="Search title, summary, or submitter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
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
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={
            variant === "hr"
              ? [
                  {
                    value: "mine",
                    label: `My submissions (${submittedByMe.length})`,
                  },
                  {
                    value: "inbox",
                    label: `On my desk (${inbox.length})`,
                  },
                  {
                    value: "all",
                    label: `All submissions (${filtered.length})`,
                  },
                ]
              : [
                  {
                    value: "mine",
                    label: `My submissions (${submittedByMe.length})`,
                  },
                  {
                    value: "inbox",
                    label: `On my desk (${inbox.length})`,
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
            emptyLabel="Nothing is sitting on your desk right now."
          />
        </TabsContent>

        {variant === "hr" && (
          <TabsContent value="all" className="mt-5">
            <QueueTable
              requests={filtered}
              basePath={basePath}
              emptyLabel="No submissions match your filters."
            />
          </TabsContent>
        )}
      </Tabs>

      <IntakeModal open={intakeOpen} onOpenChange={setIntakeOpen} />
    </div>
  );
}

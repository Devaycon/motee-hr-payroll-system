"use client";

import { useMemo, useState } from "react";
import { Plus, Inbox, Send, FileCheck2, Clock } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
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

  const myEmployeeId = user?.employeeId;
  const myRoleId = user?.roleId;

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
      return true;
    });
  }, [requests, search, typeFilter, statusFilter]);

  const inbox = useMemo(
    () => filtered.filter((r) => isCurrentApprover(r, myEmployeeId, myRoleId)),
    [filtered, myEmployeeId, myRoleId],
  );
  const submittedByMe = useMemo(
    () => filtered.filter((r) => isSubmitter(r, myEmployeeId)),
    [filtered, myEmployeeId],
  );

  // Captured once on mount so the memo stays pure across re-renders.
  const [nowMs] = useState(() => Date.now());

  const stats = useMemo(() => {
    const waitingOnMe = requests.filter((r) =>
      isCurrentApprover(r, myEmployeeId, myRoleId),
    ).length;
    const mine = requests.filter((r) => isSubmitter(r, myEmployeeId)).length;
    const inProgress = requests.filter((r) => r.status === "in_progress")
      .length;
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const since = nowMs - oneWeekMs;
    const approvedThisWeek = requests.filter(
      (r) =>
        r.status === "approved" && new Date(r.submittedAt).getTime() > since,
    ).length;
    return { waitingOnMe, mine, inProgress, approvedThisWeek };
  }, [requests, myEmployeeId, myRoleId, nowMs]);

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

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Inbox className="w-3.5 h-3.5" />}
          label="Waiting on my desk"
          value={stats.waitingOnMe}
        />
        <StatCard
          icon={<Send className="w-3.5 h-3.5" />}
          label="My submissions"
          value={stats.mine}
        />
        {variant === "hr" && (
          <StatCard
            icon={<Clock className="w-3.5 h-3.5" />}
            label="In flight (org)"
            value={stats.inProgress}
          />
        )}
        <StatCard
          icon={<FileCheck2 className="w-3.5 h-3.5" />}
          label="Approved this week"
          value={stats.approvedThisWeek}
        />
      </div>

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

      <Tabs defaultValue={variant === "employee" ? "mine" : "inbox"}>
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

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="px-4 py-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

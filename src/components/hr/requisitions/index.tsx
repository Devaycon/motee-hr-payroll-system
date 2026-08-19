"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Send,
  ArrowRightLeft,
  Pencil,
  Eye,
  Trash2,
  ClipboardList,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { store } from "@/src/lib/stores/store";
import { useCan } from "@/src/lib/permissions/use-can";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { formatDate } from "@/src/lib/utils/format-date";
import {
  submitApproval,
  seedRequestsForType,
} from "@/src/lib/stores/approvals-slice";
import {
  seedCountry,
  updateRequest,
  removeRequest,
  type Requisition,
  type RequisitionLifecycle,
} from "@/src/lib/stores/requisitions-slice";
import { buildRequisitionDemo } from "@/src/data/requisitions-demo";
import { cn } from "@/src/lib/utils";
import { RequisitionDetailModal } from "./components/requisition-detail-modal";
import { RequisitionBuilderModal } from "./components/requisition-builder-modal";

type DisplayStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Returned"
  | "Converted to Recruitment";

const STATUS_STYLES: Record<DisplayStatus, string> = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  "Pending Approval": "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  Approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  Returned: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
  "Converted to Recruitment": "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
};

/** The slice a KPI card drills the requisition tabs down to. */
type CardFilter = "all" | "in_chain" | "approved" | "converted";

const CARD_FILTER_LABELS: Record<Exclude<CardFilter, "all">, string> = {
  in_chain: "In approval chain",
  approved: "Approved",
  converted: "Converted to recruitment",
};

/** Single source of truth for what each card counts and the tab then shows. */
function matchesCardFilter(status: DisplayStatus, filter: CardFilter): boolean {
  switch (filter) {
    case "in_chain":
      return status === "Pending Approval" || status === "Returned";
    case "approved":
      return status === "Approved";
    case "converted":
      return status === "Converted to Recruitment";
    default:
      return true;
  }
}

const LIFECYCLE_LABELS: Record<RequisitionLifecycle, string> = {
  active: "Active",
  closed: "Closed",
  on_hold: "On Hold",
};
const LIFECYCLE_STYLES: Record<RequisitionLifecycle, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  closed: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  on_hold: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
};

export function RequisitionsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const country = useAppSelector((s) => s.locale.country);
  const user = useAppSelector((s) => s.auth.user);
  const requisitions = useAppSelector((s) => s.requisitions.byCountry[country]);
  const approvalRequests = useAppSelector((s) => s.approvals.requests);

  const canCreate = useCan("talent.workforce-requests", "create");

  useEffect(() => {
    const demo = buildRequisitionDemo();
    if (!requisitions) {
      dispatch(seedCountry({ country, requisitions: demo.requisitions }));
    }
    dispatch(
      seedRequestsForType({
        documentType: "job_requisition",
        requests: demo.approvals,
      }),
    );
  }, [requisitions, country, dispatch]);

  const list = useMemo(() => requisitions ?? [], [requisitions]);

  const approvalById = useMemo(
    () => new Map(approvalRequests.map((r) => [r.id, r])),
    [approvalRequests],
  );

  const displayStatus = useMemo(() => {
    return (req: Requisition): DisplayStatus => {
      if (req.status === "converted") return "Converted to Recruitment";
      if (!req.approvalRequestId) return "Draft";
      const ar = approvalById.get(req.approvalRequestId);
      if (!ar) return "Pending Approval";
      switch (ar.status) {
        case "approved": return "Approved";
        case "rejected": return "Rejected";
        case "returned": return "Returned";
        default: return "Pending Approval";
      }
    };
  }, [approvalById]);

  const approvedDate = useMemo(() => {
    return (req: Requisition): string => {
      if (!req.approvalRequestId) return "—";
      const ar = approvalById.get(req.approvalRequestId);
      if (!ar || ar.status !== "approved") return "—";
      const approvedEvents = ar.history.filter((h) => h.type === "approved");
      const last = approvedEvents[approvedEvents.length - 1];
      return last ? formatDate(last.at) : "—";
    };
  }, [approvalById]);

  // Controlled so the KPI cards can drill into a tab, not just a filter.
  const [activeTab, setActiveTab] = useState("request");
  /** Drill-down set by the KPI cards; "all" shows every requisition. */
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");

  /** Drill-down: opens the tab holding these rows and filters to them. */
  function drillDown(tab: string, filter: CardFilter) {
    setActiveTab(tab);
    setCardFilter(filter);
  }

  const requestList = useMemo(
    () =>
      list.filter((r) => {
        const s = displayStatus(r);
        const inTab =
          s === "Draft" || s === "Pending Approval" || s === "Returned" || s === "Rejected";
        return inTab && matchesCardFilter(s, cardFilter);
      }),
    [list, displayStatus, cardFilter],
  );
  const approvedList = useMemo(
    () =>
      list.filter((r) => {
        const s = displayStatus(r);
        const inTab = s === "Approved" || s === "Converted to Recruitment";
        return inTab && matchesCardFilter(s, cardFilter);
      }),
    [list, displayStatus, cardFilter],
  );

  const stats = useMemo(() => {
    let pending = 0, approved = 0, converted = 0;
    for (const r of list) {
      const s = displayStatus(r);
      if (s === "Pending Approval" || s === "Returned") pending++;
      else if (s === "Approved") approved++;
      else if (s === "Converted to Recruitment") converted++;
    }
    return { total: list.length, pending, approved, converted };
  }, [list, displayStatus]);

  const [detail, setDetail] = useState<Requisition | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<Requisition | null>(null);

  function openCreate() {
    setEditing(null);
    setBuilderOpen(true);
  }
  function openEdit(req: Requisition) {
    setEditing(req);
    setBuilderOpen(true);
  }

  async function submit(req: Requisition) {
    if (!user) {
      toast.error("You must be logged in to submit.");
      return;
    }
    await dispatch(
      submitApproval({
        documentType: "job_requisition",
        documentId: req.id,
        documentTitle: `${req.title} — ${req.department}`,
        documentSummary: req.jobDescription,
        payloadSnapshot: {
          title: req.title,
          department: req.department,
          location: req.location,
          numberOfPositions: req.numberOfPositions,
          salaryMin: req.salaryMin,
          salaryMax: req.salaryMax,
        },
        submitter: {
          employeeId: user.employeeId,
          name: user.name,
          initials: user.initials,
          departmentName: user.departmentName,
        },
      }),
    );
    const created = store
      .getState()
      .approvals.requests.find(
        (r) => r.documentType === "job_requisition" && r.documentId === req.id,
      );
    if (created) {
      dispatch(updateRequest({ country, id: req.id, patch: { approvalRequestId: created.id } }));
      toast.success("Submitted for approval (Manager → HR → Finance)");
    } else {
      toast.error("Could not submit — no job-requisition workflow found.");
    }
  }

  function createRecruitment(req: Requisition) {
    router.push(`/talent/recruitment/new?requisition=${req.id}`);
  }

  const requestColumns = useMemo<ColumnDef<Requisition>[]>(
    () => [
      {
        accessorKey: "title",
        header: sortableHeader("Requisition"),
        cell: ({ row }) => (
          <div className="font-medium text-foreground">
            {row.original.title}
            <p className="text-xs text-muted-foreground font-normal line-clamp-1 max-w-xs">
              {row.original.workforceLabel}
            </p>
          </div>
        ),
      },
      { accessorKey: "department", header: sortableHeader("Department"), cell: ({ row }) => row.original.department },
      { accessorKey: "numberOfPositions", header: sortableHeader("Positions"), cell: ({ row }) => row.original.numberOfPositions },
      {
        id: "salary",
        header: "Salary range",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatMoneyLocale(row.original.salaryMin)} – {formatMoneyLocale(row.original.salaryMax)}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = displayStatus(row.original);
          return (
            <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[status])}>
              {status}
            </Badge>
          );
        },
      },
      actionsColumn<Requisition>((req) => {
        const status = displayStatus(req);
        const isDraft = status === "Draft";
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetail(req)}>
              <Eye className="w-3.5 h-3.5" />
            </Button>
            {isDraft && canCreate && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(req)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-600" onClick={() => { dispatch(removeRequest({ country, id: req.id })); toast.success("Draft deleted"); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={() => submit(req)}>
                  <Send className="w-3 h-3" /> Submit
                </Button>
              </>
            )}
          </div>
        );
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayStatus, canCreate, country],
  );

  const approvedColumns = useMemo<ColumnDef<Requisition>[]>(
    () => [
      {
        accessorKey: "id",
        header: sortableHeader("Requisition ID"),
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>,
      },
      { accessorKey: "workforceLabel", header: "Workforce", cell: ({ row }) => <span className="text-muted-foreground">{row.original.workforceLabel}</span> },
      {
        accessorKey: "title",
        header: sortableHeader("Job title"),
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.title}</span>,
      },
      { accessorKey: "department", header: sortableHeader("Department"), cell: ({ row }) => row.original.department },
      { accessorKey: "numberOfPositions", header: "Positions", cell: ({ row }) => row.original.numberOfPositions },
      { id: "approvedDate", header: "Approved", cell: ({ row }) => <span className="text-muted-foreground">{approvedDate(row.original)}</span> },
      {
        id: "lifecycle",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant="outline" className={cn("text-[10px]", LIFECYCLE_STYLES[row.original.lifecycleStatus])}>
            {LIFECYCLE_LABELS[row.original.lifecycleStatus]}
          </Badge>
        ),
      },
      actionsColumn<Requisition>((req) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetail(req)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {canCreate && (
            <Button size="sm" className="h-7 gap-1 text-[11px]" onClick={() => createRecruitment(req)}>
              <ArrowRightLeft className="w-3 h-3" /> Create Recruitment
            </Button>
          )}
        </div>
      )),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [approvedDate, canCreate],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap py-2">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">Requisition</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Raise a hiring requisition against an approved workforce. It routes Manager → HR →
            Finance; once approved, create a recruitment from it.
          </p>
        </div>
        {canCreate && (
          <Button className="gap-1.5" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Create Requisition
          </Button>
        )}
      </div>

      <HrStatCardsGrid
        columns={4}
        stats={[
          {
            label: "Total Requisitions",
            value: stats.total,
            sub: "All raised requisitions",
            icon: ClipboardList,
            tone: "blue",
            active: cardFilter === "all",
            onClick: () => drillDown("request", "all"),
          },
          {
            label: "In Approval Chain",
            value: stats.pending,
            sub: "Awaiting a decision",
            icon: Clock,
            tone: "amber",
            active: cardFilter === "in_chain",
            onClick: () => drillDown("request", "in_chain"),
          },
          {
            label: "Approved",
            value: stats.approved,
            sub: "Cleared to recruit",
            icon: CheckCircle2,
            tone: "emerald",
            active: cardFilter === "approved",
            onClick: () => drillDown("approved", "approved"),
          },
          {
            label: "Converted",
            value: stats.converted,
            sub: "Now a recruitment",
            icon: ArrowRightLeft,
            tone: "violet",
            active: cardFilter === "converted",
            onClick: () => drillDown("approved", "converted"),
          },
        ]}
      />

      {cardFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">
            {CARD_FILTER_LABELS[cardFilter]}{" "}
            <span className="text-muted-foreground">
              ({requestList.length + approvedList.length})
            </span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setCardFilter("all")}
          >
            ← All requisitions
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "request", label: `Requested Requisition (${requestList.length})` },
            { value: "approved", label: `Approved Requisition (${approvedList.length})` },
            { value: "approval_chain", label: "Approval Chain" },
          ]}
        />

        <TabsContent value="request" className="mt-5">
          <DataTable
            exportTitle="Requisitions"
            columns={requestColumns}
            data={requestList}
            getRowId={(r) => r.id}
            onRowClick={(r) => setDetail(r)}
            searchPlaceholder="Search requisitions…"
            emptyMessage="No requisitions in the approval chain."
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-5">
          <DataTable
            exportTitle="Requisitions"
            columns={approvedColumns}
            data={approvedList}
            getRowId={(r) => r.id}
            onRowClick={(r) => setDetail(r)}
            searchPlaceholder="Search approved…"
            emptyMessage="No approved requisitions yet."
          />
        </TabsContent>

        <TabsContent value="approval_chain" className="mt-5">
          <ApprovalChainTab documentType="job_requisition" />
        </TabsContent>
      </Tabs>

      <RequisitionDetailModal
        open={Boolean(detail)}
        onOpenChange={(v) => !v && setDetail(null)}
        requisition={detail}
      />

      <RequisitionBuilderModal
        open={builderOpen}
        onOpenChange={(v) => {
          setBuilderOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
      />
    </div>
  );
}

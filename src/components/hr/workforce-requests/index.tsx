"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Send,
  ArrowRightLeft,
  Pencil,
  Eye,
  ClipboardList,
  Hourglass,
  CircleCheck,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  DataTable,
  sortableHeader,
  actionsColumn,
} from "@/src/components/shared/data-table";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { HrStatCardsGrid } from "@/src/components/shared/hr-stat-card";
import { ApprovalChainTab } from "@/src/components/hr/approvals/components/approval-chain-tab";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { store } from "@/src/lib/stores/store";
import { useCan } from "@/src/lib/permissions/use-can";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { DEPARTMENT_OPTIONS } from "@/src/data/recruitment-demo";
import {
  submitApproval,
  seedRequestsForType,
} from "@/src/lib/stores/approvals-slice";
import {
  seedCountry,
  addRequest,
  updateRequest,
  setApproval,
  uid,
  HIRING_REASON_LABELS,
  VACANCY_TYPE_LABELS,
  type WorkforceRequest,
  type WorkforceUrgency,
  type HiringReasonKind,
  type VacancyType,
} from "@/src/lib/stores/workforce-requests-slice";
import { useCostCentres } from "@/src/lib/hooks/use-cost-centres";
import {
  costCentreLabel,
  selectableCostCentres,
} from "@/src/lib/types/cost-centres";
import { buildWorkforceDemo } from "@/src/data/workforce-requests-demo";
import { cn } from "@/src/lib/utils";
import { RequestDetailModal } from "./components/request-detail-modal";

const URGENCY: WorkforceUrgency[] = ["low", "medium", "high", "critical"];
const URGENCY_STYLES: Record<WorkforceUrgency, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  medium: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
};

type DisplayStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Returned"
  | "Converted to Requisition";

const STATUS_STYLES: Record<DisplayStatus, string> = {
  Draft: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  "Pending Approval":
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
  Approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  Returned:
    "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
  "Converted to Requisition":
    "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
};

interface DraftForm {
  department: string;
  numberOfHires: number;
  reason: string;
  budgetEstimate: number;
  urgency: WorkforceUrgency;
  expectedStartDate: string;
  // §7.2 / §7.3 / §7.5
  position: string;
  grade: string;
  hiringReason: HiringReasonKind;
  vacancyType: VacancyType;
  costCentreCode: string;
  businessUnit: string;
}

const EMPTY_FORM: DraftForm = {
  department: DEPARTMENT_OPTIONS[0],
  numberOfHires: 1,
  reason: "",
  budgetEstimate: 0,
  urgency: "medium",
  expectedStartDate: "",
  position: "",
  grade: "",
  hiringReason: "new_position",
  vacancyType: "permanent",
  costCentreCode: "",
  businessUnit: "",
};

export function WorkforceRequestsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const costCentres = useCostCentres();
  const country = useAppSelector((s) => s.locale.country);
  const user = useAppSelector((s) => s.auth.user);
  const requests = useAppSelector(
    (s) => s.workforceRequests.byCountry[country],
  );
  const approvalRequests = useAppSelector((s) => s.approvals.requests);

  const canCreate = useCan("talent.workforce-requests", "create");

  useEffect(() => {
    const demo = buildWorkforceDemo();
    if (!requests) {
      dispatch(seedCountry({ country, requests: demo.requests }));
    }
    // Idempotent: only adds workforce_request approvals if none exist yet.
    dispatch(
      seedRequestsForType({
        documentType: "workforce_request",
        requests: demo.approvals,
      }),
    );
  }, [requests, country, dispatch]);

  const list = useMemo(() => requests ?? [], [requests]);

  const displayStatus = useMemo(() => {
    const byId = new Map(approvalRequests.map((r) => [r.id, r]));
    return (wfr: WorkforceRequest): DisplayStatus => {
      if (wfr.status === "converted") return "Converted to Requisition";
      if (!wfr.approvalRequestId) return "Draft";
      const ar = byId.get(wfr.approvalRequestId);
      if (!ar) return "Pending Approval";
      switch (ar.status) {
        case "approved":
          return "Approved";
        case "rejected":
          return "Rejected";
        case "returned":
          return "Returned";
        default:
          return "Pending Approval";
      }
    };
  }, [approvalRequests]);

  // Request tab = still moving through the chain (or pre-chain drafts).
  // Approved tab = fully approved (and already converted) requests.
  // Tab + status filter are driven by the KPI cards (client feedback §7.1).
  const [activeTab, setActiveTab] = useState("request");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "all">("all");

  const requestList = useMemo(
    () =>
      list.filter((r) => {
        const s = displayStatus(r);
        const inTab =
          s === "Draft" ||
          s === "Pending Approval" ||
          s === "Returned" ||
          s === "Rejected";
        return inTab && (statusFilter === "all" || s === statusFilter);
      }),
    [list, displayStatus, statusFilter],
  );
  const approvedList = useMemo(
    () =>
      list.filter((r) => {
        const s = displayStatus(r);
        const inTab = s === "Approved" || s === "Converted to Requisition";
        return inTab && (statusFilter === "all" || s === statusFilter);
      }),
    [list, displayStatus, statusFilter],
  );

  function drillDown(tab: string, status: DisplayStatus | "all") {
    setActiveTab(tab);
    setStatusFilter(status);
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM);
  const [detail, setDetail] = useState<WorkforceRequest | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  }

  /**
   * §6.36 — the Gap Report links here with the department and shortfall
   * already worked out, so the user doesn't have to carry the numbers across
   * in their head. Consumed once, then the params are cleared.
   */
  const prefillHandled = useRef(false);
  useEffect(() => {
    if (prefillHandled.current) return;
    const dept = searchParams.get("department");
    if (!dept) return;
    prefillHandled.current = true;
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      department: dept,
      numberOfHires: Math.max(1, Number(searchParams.get("hires")) || 1),
      reason: searchParams.get("reason") ?? "",
    });
    setModalOpen(true);
    router.replace("/talent/workforce-requests");
  }, [searchParams, router]);

  function openEdit(wfr: WorkforceRequest) {
    setEditingId(wfr.id);
    setForm({
      department: wfr.department,
      numberOfHires: wfr.numberOfHires,
      reason: wfr.reason,
      budgetEstimate: wfr.budgetEstimate,
      urgency: wfr.urgency,
      expectedStartDate: wfr.expectedStartDate,
      position: wfr.position ?? "",
      grade: wfr.grade ?? "",
      hiringReason: wfr.hiringReason ?? "new_position",
      vacancyType: wfr.vacancyType ?? "permanent",
      costCentreCode: wfr.costCentreCode ?? "",
      businessUnit: wfr.businessUnit ?? "",
    });
    setModalOpen(true);
  }

  function saveDraft() {
    if (form.reason.trim().length < 4) {
      toast.error("Please add a reason for hiring.");
      return;
    }
    // §7.3 — mandatory, so Finance always has something to book against.
    if (!form.costCentreCode) {
      toast.error("Select a cost centre", {
        description: "Finance allocates this request's spend against it.",
      });
      return;
    }
    if (editingId) {
      dispatch(updateRequest({ country, id: editingId, patch: { ...form } }));
      toast.success("Workforce request updated");
    } else {
      const request: WorkforceRequest = {
        id: uid("WFR"),
        ...form,
        status: "draft",
        createdById: user?.employeeId ?? "",
        createdByName: user?.name ?? "—",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      dispatch(addRequest({ country, request }));
      toast.success("Draft workforce request created");
    }
    setModalOpen(false);
  }

  async function submit(wfr: WorkforceRequest) {
    if (!user) {
      toast.error("You must be logged in to submit.");
      return;
    }
    await dispatch(
      submitApproval({
        documentType: "workforce_request",
        documentId: wfr.id,
        documentTitle: `${wfr.numberOfHires} hire${wfr.numberOfHires === 1 ? "" : "s"} — ${wfr.department}`,
        documentSummary: wfr.reason,
        payloadSnapshot: {
          department: wfr.department,
          numberOfHires: wfr.numberOfHires,
          reason: wfr.reason,
          budgetEstimate: wfr.budgetEstimate,
          urgency: wfr.urgency,
          expectedStartDate: wfr.expectedStartDate,
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
        (r) =>
          r.documentType === "workforce_request" && r.documentId === wfr.id,
      );
    if (created) {
      dispatch(
        setApproval({ country, id: wfr.id, approvalRequestId: created.id }),
      );
      toast.success("Submitted for approval (HR → Finance → Executive)");
    } else {
      toast.error("Could not submit — no workforce-request workflow found.");
    }
  }

  function startRequisition() {
    router.push(`/talent/requisition`);
  }

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let converted = 0;
    for (const r of list) {
      const s = displayStatus(r);
      if (s === "Pending Approval" || s === "Returned") pending++;
      else if (s === "Approved") approved++;
      else if (s === "Converted to Requisition") converted++;
    }
    return { total: list.length, pending, approved, converted };
  }, [list, displayStatus]);

  function buildColumns(variant: "request" | "approved") {
    const cols: ColumnDef<WorkforceRequest>[] = [
      {
        accessorKey: "department",
        header: sortableHeader("Department"),
        cell: ({ row }) => (
          <div className="font-medium text-foreground">
            {row.original.department}
            <p className="text-xs text-muted-foreground font-normal line-clamp-1 max-w-xs">
              {row.original.reason}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "numberOfHires",
        header: sortableHeader("Hires"),
        cell: ({ row }) => row.original.numberOfHires,
      },
      {
        accessorKey: "urgency",
        header: sortableHeader("Urgency"),
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn("text-[10px]", URGENCY_STYLES[row.original.urgency])}
          >
            {row.original.urgency}
          </Badge>
        ),
      },
      {
        accessorKey: "budgetEstimate",
        header: sortableHeader("Budget"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatMoneyLocale(row.original.budgetEstimate)}
          </span>
        ),
      },
      {
        accessorKey: "expectedStartDate",
        header: sortableHeader("Expected start"),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.expectedStartDate || "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = displayStatus(row.original);
          return (
            <Badge
              variant="outline"
              className={cn("text-[10px]", STATUS_STYLES[status])}
            >
              {status}
            </Badge>
          );
        },
      },
      actionsColumn<WorkforceRequest>((wfr) => {
        const status = displayStatus(wfr);
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setDetail(wfr)}
            >
              <Eye className="w-3.5 h-3.5" />
            </Button>
            {variant === "request" && status === "Draft" && canCreate && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openEdit(wfr)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => submit(wfr)}
                >
                  <Send className="w-3 h-3" />
                  Submit
                </Button>
              </>
            )}
            {variant === "approved" &&
              status === "Approved" &&
              canCreate && (
                <Button
                  size="sm"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => startRequisition()}
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  Create requisition
                </Button>
              )}
          </div>
        );
      }),
    ];
    return cols;
  }

  const requestColumns = useMemo(
    () => buildColumns("request"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayStatus, canCreate],
  );
  const approvedColumns = useMemo(
    () => buildColumns("approved"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [displayStatus, canCreate],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap py-2">
        <div>
          <h1 className="text-4xl font-semibold text-foreground">
            Workforce Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Raise a pre-recruitment headcount request. It routes HR → Finance →
            Executive; once approved, start a requisition from it.
          </p>
        </div>
        {canCreate && (
          <Button className="gap-1.5" onClick={openCreate}>
            <Plus className="w-4 h-4" />
            New request
          </Button>
        )}
      </div>

      <HrStatCardsGrid
        columns={4}
        stats={[
          {
            label: "Total Requests",
            value: stats.total,
            sub: "All workforce requests",
            icon: ClipboardList,
            tone: "blue",
            active: statusFilter === "all",
            onClick: () => drillDown("request", "all"),
          },
          {
            label: "In Approval Chain",
            value: stats.pending,
            sub: "Awaiting a decision",
            icon: Hourglass,
            tone: "amber",
            active: statusFilter === "Pending Approval",
            onClick: () => drillDown("request", "Pending Approval"),
          },
          {
            label: "Approved",
            value: stats.approved,
            sub: "Ready for requisition",
            icon: CircleCheck,
            tone: "emerald",
            active: statusFilter === "Approved",
            onClick: () => drillDown("approved", "Approved"),
          },
          {
            label: "Converted",
            value: stats.converted,
            sub: "Requisition created",
            icon: ArrowRightLeft,
            tone: "violet",
            active: statusFilter === "Converted to Requisition",
            onClick: () => drillDown("approved", "Converted to Requisition"),
          },
        ]}
      />

      {statusFilter !== "all" && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 py-1">
            Filtered to {statusFilter}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setStatusFilter("all")}
          >
            Clear filter
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <PageTabsList
          tabs={[
            { value: "request", label: `Request (${requestList.length})` },
            { value: "approved", label: `Approved (${approvedList.length})` },
            { value: "approval_chain", label: "Approval Chain" },
          ]}
        />

        <TabsContent value="request" className="mt-5">
          <DataTable
            exportTitle="Workforce Requests"
            columns={requestColumns}
            data={requestList}
            getRowId={(r) => r.id}
            onRowClick={(r) => setDetail(r)}
            searchPlaceholder="Search requests…"
            emptyMessage="No workforce requests in the approval chain."
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-5">
          <DataTable
            exportTitle="Workforce Requests"
            columns={approvedColumns}
            data={approvedList}
            getRowId={(r) => r.id}
            onRowClick={(r) => setDetail(r)}
            searchPlaceholder="Search approved…"
            emptyMessage="No approved workforce requests yet."
          />
        </TabsContent>

        <TabsContent value="approval_chain" className="mt-5">
          <ApprovalChainTab documentType="workforce_request" />
        </TabsContent>
      </Tabs>

      <RequestDetailModal
        open={Boolean(detail)}
        onOpenChange={(v) => !v && setDetail(null)}
        request={detail}
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit workforce request" : "New workforce request"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-1">
            <div className="col-span-2 space-y-1.5">
              <Label>Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) => setForm((f) => ({ ...f, department: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENT_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* §7.3 — mandatory. Finance allocates payroll, recruitment and
                training spend against this code, and a free-text version put
                the cost in the wrong place whenever it was mistyped. */}
            <div className="col-span-2 space-y-1.5">
              <Label>
                Cost Centre <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.costCentreCode}
                onValueChange={(v) => {
                  const centre = costCentres.find((c) => c.code === v);
                  setForm((f) => ({
                    ...f,
                    costCentreCode: v,
                    businessUnit: centre?.businessUnit ?? f.businessUnit,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a cost centre" />
                </SelectTrigger>
                <SelectContent>
                  {selectableCostCentres(costCentres).map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      {costCentreLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.businessUnit && (
                <p className="text-[11px] text-muted-foreground">
                  Business unit: {form.businessUnit}
                </p>
              )}
            </div>

            {/* §7.2 — what the role actually is, not just a headcount number. */}
            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input
                value={form.position}
                placeholder="e.g. Senior HR Advisor"
                onChange={(e) =>
                  setForm((f) => ({ ...f, position: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Grade</Label>
              <Input
                value={form.grade}
                placeholder="e.g. Band 5"
                onChange={(e) =>
                  setForm((f) => ({ ...f, grade: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reason for hire</Label>
              <Select
                value={form.hiringReason}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, hiringReason: v as HiringReasonKind }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(HIRING_REASON_LABELS) as HiringReasonKind[]
                  ).map((r) => (
                    <SelectItem key={r} value={r}>
                      {HIRING_REASON_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* §7.5 — contract shape drives the requisition that follows. */}
            <div className="space-y-1.5">
              <Label>Vacancy type</Label>
              <Select
                value={form.vacancyType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, vacancyType: v as VacancyType }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(VACANCY_TYPE_LABELS) as VacancyType[]).map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {VACANCY_TYPE_LABELS[t]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Number of hires</Label>
              <Input
                type="number"
                min={1}
                value={form.numberOfHires}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    numberOfHires: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Urgency</Label>
              <Select
                value={form.urgency}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, urgency: v as WorkforceUrgency }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY.map((u) => (
                    <SelectItem key={u} value={u} className="capitalize">
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Budget estimate</Label>
              <Input
                type="number"
                min={0}
                value={form.budgetEstimate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    budgetEstimate: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expected start date</Label>
              <Input
                type="date"
                value={form.expectedStartDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expectedStartDate: e.target.value }))
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Reason for hiring</Label>
              <Textarea
                rows={3}
                placeholder="Expansion, backfill, new project…"
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDraft}>
              {editingId ? "Save changes" : "Create draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

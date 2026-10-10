"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, LayoutGrid, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { EmployeeRow } from "./types";
import type { EmployeeStatus } from "@/src/lib/types/employees";
import { StatCards } from "./components/stat-cards";
import { EmployeesToolbar } from "./components/employees-toolbar";
import { AdvancedEmployeesTable } from "./components/advanced-employees-table";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { OverflowTabsList } from "@/src/components/shared/overflow-tabs";
import { useEmployees } from "./hooks";
import { PermissionGate } from "@/src/components/shared/permission-gate";
import { useEmployeeActions } from "@/src/lib/employees/use-employee-actions";
import { useEmployeeExport } from "@/src/lib/employees/use-employee-export";
import { useGetEmployeeStatsQuery } from "@/src/store/services/employees";
import { getApiErrorMessage } from "@/src/lib/utils";
import { useInitiateOffboardingMutation } from "@/src/store/services/offboarding";
import { SendKudosModal } from "@/src/components/hr/kudos/components/send-kudos-modal";
import type { NewKudos } from "@/src/components/hr/kudos/types";
import type { ExitDetails } from "./components/employee-row-actions";

/** Query-param value → the display value `toEmployeeRow` puts on the row. */
const WORK_MODE_PARAM_TO_ROW: Record<string, string> = {
  remote: "Remotely",
  hybrid: "Hybrid",
  office: "At Office",
};

/**
 * Tabs requested in client feedback §1.1. "all" spans every category; every
 * other tab maps to a single lifecycle status.
 */
const TABS: { value: string; label: string; status?: EmployeeStatus }[] = [
  { value: "active", label: "Active Employees", status: "active" },
  { value: "on_leave", label: "On Leave", status: "on_leave" },
  { value: "probation", label: "On Probation", status: "probation" },
  { value: "offboarding", label: "Offboarding Notice", status: "offboarding" },
  { value: "pending", label: "Pending", status: "pending" },
  { value: "onboarded", label: "Onboarded", status: "onboarded" },
  { value: "inactive", label: "Inactive", status: "inactive" },
  { value: "deleted", label: "Deleted", status: "deleted" },
  { value: "all", label: "All" },
];

/** Employees tab → Workforce Lens lifecycle filter. Absent tabs open on the default. */
const LENS_LIFECYCLE_BY_TAB: Record<string, string> = {
  active: "active",
  on_leave: "on_leave",
  probation: "probation",
  offboarding: "offboarding",
  onboarded: "onboarded",
  inactive: "inactive",
  all: "all",
};

export function EmployeesPage() {
  const router = useRouter();
  const { setStatus, remove, sendInvitation } = useEmployeeActions();
  const [initiateOffboarding] = useInitiateOffboardingMutation();
  const { exportEmployees, exporting } = useEmployeeExport();
  const { data: stats } = useGetEmployeeStatsQuery();
  const searchParams = useSearchParams();
  const { data, loading } = useEmployees();

  // Deep-linkable filters so the Headcount demographics breakdowns can land
  // here pre-filtered (client feedback §6.25). A department/type deep link
  // spans every lifecycle status, so it opens on the "All" tab.
  const [activeTab, setActiveTab] = useState(() => {
    const status = searchParams.get("status");
    if (status && TABS.some((t) => t.value === status)) return status;
    if (
      searchParams.get("department") ||
      searchParams.get("employmentType") ||
      searchParams.get("branch")
    ) {
      return "all";
    }
    return "active";
  });
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState(
    () => searchParams.get("department") ?? "all",
  );
  const [typeFilter, setTypeFilter] = useState(
    () => searchParams.get("employmentType") ?? "all",
  );
  const [kudosFor, setKudosFor] = useState<EmployeeRow | null>(null);
  // Deep-linkable so dashboard cards can land here pre-filtered
  // (e.g. "Employees Working Remotely Today" → ?workMode=remote).
  const [workModeFilter, setWorkModeFilter] = useState(
    () => WORK_MODE_PARAM_TO_ROW[searchParams.get("workMode") ?? ""] ?? "all",
  );
  // Deep-linkable so the branches table, branch detail page and the Headcount
  // location breakdown can all land here pre-filtered.
  const [branchFilter, setBranchFilter] = useState(
    () => searchParams.get("branch") ?? "all",
  );

  const employees = useMemo(() => data ?? [], [data]);

  /** Search + toolbar filters, applied before the tab split. */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter((e) => {
      const matchSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q) ||
        // Both identifiers are searchable now that both are on show.
        e.id.toLowerCase().includes(q) ||
        (e.referenceId?.toLowerCase().includes(q) ?? false);
      const matchDept = deptFilter === "all" || e.department === deptFilter;
      const matchType = typeFilter === "all" || e.employmentType === typeFilter;
      const matchWorkMode =
        workModeFilter === "all" || e.workMode === workModeFilter;
      const matchBranch =
        branchFilter === "all" || e.branchId === branchFilter;
      return (
        matchSearch && matchDept && matchType && matchWorkMode && matchBranch
      );
    });
  }, [employees, search, deptFilter, typeFilter, workModeFilter, branchFilter]);

  // Hand the current view to the Workforce Lens. Only non-default filters travel,
  // and the pending / deleted tabs have no Workforce Lens equivalent.
  const lensQuery = {
    ...(LENS_LIFECYCLE_BY_TAB[activeTab] && {
      lifecycle: LENS_LIFECYCLE_BY_TAB[activeTab],
    }),
    ...(deptFilter !== "all" && { department: deptFilter }),
    ...(typeFilter !== "all" && { employmentType: typeFilter }),
    ...(branchFilter !== "all" && { branch: branchFilter }),
  };

  const rowsByTab = useMemo(
    () =>
      TABS.map((tab) => ({
        ...tab,
        rows: tab.status
          ? filtered.filter((e) => e.status === tab.status)
          : filtered,
      })),
    [filtered],
  );

  const tabItems = useMemo(
    () =>
      rowsByTab.map((t) => ({
        value: t.value,
        label: `${t.label} (${t.rows.length})`,
      })),
    [rowsByTab],
  );

  const handleView = useCallback(
    (e: EmployeeRow) => router.push(`/organization/employees/${e.id}`),
    [router],
  );

  const handleEdit = useCallback(
    (e: EmployeeRow) =>
      router.push(`/organization/employees/${e.id}?module=profile`),
    [router],
  );

  const handleSendCredentials = useCallback(
    async (e: EmployeeRow) => {
      try {
        await sendInvitation(e.id);
        toast.success(`Sign-in link sent to ${e.email || e.name}`);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not send the sign-in link."));
      }
    },
    [sendInvitation],
  );

  /** The record's own history, filtered out of the audit trail. */
  const handleViewActivityLog = useCallback(
    (e: EmployeeRow) => router.push(`/admin/audit-trail?entityId=${e.id}`),
    [router],
  );

  /** §3.1 — reissue the onboarding link for a hire still in the pipeline. */
  const handleResendInvite = useCallback(
    async (e: EmployeeRow) => {
      try {
        await sendInvitation(e.id);
        toast.success(`Onboarding invitation resent to ${e.name}`);
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not resend the invitation."));
      }
    },
    [sendInvitation],
  );

  const handleSendKudos = useCallback((e: EmployeeRow) => setKudosFor(e), []);

  const handleDeactivate = useCallback(
    async (e: EmployeeRow) => {
      try {
        await setStatus(e.id, "inactive");
        toast.success(`${e.name} has been deactivated`);
      } catch (err) {
        toast.error(getApiErrorMessage(err, `Could not deactivate ${e.name}.`));
      }
    },
    [setStatus],
  );

  const handleReactivate = useCallback(
    async (e: EmployeeRow) => {
      try {
        await setStatus(e.id, "active");
        toast.success(`${e.name} has been reactivated`);
      } catch (err) {
        toast.error(getApiErrorMessage(err, `Could not reactivate ${e.name}.`));
      }
    },
    [setStatus],
  );

  /**
   * Exit Employee — opens a record on the Offboarding pipeline with the reason
   * and last working date from the "Start Offboarding" dialog (§1.2).
   */
  const handleExit = useCallback(
    async (e: EmployeeRow, details: ExitDetails) => {
      try {
        await initiateOffboarding({
          employeeId: e.id,
          exitReason:
            details.exitReason === "contract_end"
              ? "contractEnd"
              : details.exitReason,
          lastWorkingDate: details.lastWorkingDate,
        }).unwrap();
        toast.success(`Offboarding initiated for ${e.name}`, {
          description: "Awaiting approval on the Offboarding pipeline.",
          action: {
            label: "View",
            onClick: () => router.push("/talent/offboarding"),
          },
        });
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Could not start offboarding."));
      }
    },
    [initiateOffboarding, router],
  );

  const handleDelete = useCallback(
    async (e: EmployeeRow) => {
      try {
        await remove(e.id);
        toast.success(`${e.name} moved to Deleted`, {
          description: "Their record is kept and can be restored.",
        });
      } catch (err) {
        toast.error(getApiErrorMessage(err, `Could not delete ${e.name}.`));
      }
    },
    [remove],
  );

  const handleRestore = useCallback(
    async (e: EmployeeRow) => {
      try {
        await setStatus(e.id, "active");
        toast.success(`${e.name} restored`);
      } catch (err) {
        toast.error(getApiErrorMessage(err, `Could not restore ${e.name}.`));
      }
    },
    [setStatus],
  );

  function handleKudosSave(data: NewKudos) {
    toast.success(`Kudos sent to ${data.recipientName}! 🌟`);
    setKudosFor(null);
  }

  if (loading && !employees.length) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-16 w-72" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="py-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your workforce, track employee details and reporting lines.
            {stats?.data ? ` Headcount: ${stats.data.headcount}.` : ""}
          </p>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <PermissionGate module="organization.workforce-lens" action="view">
            <Button variant="secondary" className="gap-1.5" asChild>
              <Link href={{ pathname: "/organization/workforce-lens", query: lensQuery }}>
                <LayoutGrid className="w-4 h-4" />
                Workforce Lens
              </Link>
            </Button>
          </PermissionGate>
          <PermissionGate module="organization.employees" action="export">
            <Button
              variant="secondary"
              className="gap-1.5"
              disabled={exporting}
              onClick={() => exportEmployees()}
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exporting…" : "Export"}
            </Button>
          </PermissionGate>
          <PermissionGate module="organization.employees" action="create">
            <Button
              className="gap-1.5"
              onClick={() => router.push("/talent/onboarding")}
            >
              <UserPlus className="w-4 h-4" />
              Onboard Employee
            </Button>
          </PermissionGate>
        </div>
      </div>

      <StatCards
        employees={employees}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <EmployeesToolbar
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        workModeFilter={workModeFilter}
        onWorkModeFilterChange={setWorkModeFilter}
        branchFilter={branchFilter}
        onBranchFilterChange={setBranchFilter}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <OverflowTabsList
          tabs={tabItems}
          value={activeTab}
          onValueChange={setActiveTab}
        />
        {rowsByTab.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            <AdvancedEmployeesTable
              employees={t.rows}
              emptyMessage={`No employees in ${t.label}.`}
              onView={handleView}
              onEdit={handleEdit}
              onSendCredentials={handleSendCredentials}
              onResendInvite={handleResendInvite}
              onViewActivityLog={handleViewActivityLog}
              onSendKudos={handleSendKudos}
              onDeactivate={handleDeactivate}
              onReactivate={handleReactivate}
              onExit={handleExit}
              onDelete={handleDelete}
              onRestore={handleRestore}
            />
          </TabsContent>
        ))}
      </Tabs>

      <SendKudosModal
        open={!!kudosFor}
        onClose={() => setKudosFor(null)}
        onSave={handleKudosSave}
        recipient={
          kudosFor
            ? {
                name: kudosFor.name,
                initials: kudosFor.initials,
                department: kudosFor.department,
              }
            : undefined
        }
      />
    </div>
  );
}

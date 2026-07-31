"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UserPlus } from "lucide-react";
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
import { useAppDispatch } from "@/src/lib/stores/hooks";
import {
  markCredentialsSent,
  restoreEmployee,
  setEmployeeStatus,
  softDeleteEmployee,
} from "@/src/lib/stores/employees-slice";
import { addRecord } from "@/src/lib/stores/offboarding-slice";
import { buildClearanceItems } from "@/src/components/hr/offboarding/instantiate";
import { SendKudosModal } from "@/src/components/hr/kudos/components/send-kudos-modal";
import type { NewKudos } from "@/src/components/hr/kudos/types";
import type { OffboardingRecord } from "@/src/lib/types/offboarding";

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

export function EmployeesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { data, loading } = useEmployees();

  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [kudosFor, setKudosFor] = useState<EmployeeRow | null>(null);
  // Deep-linkable so dashboard cards can land here pre-filtered
  // (e.g. "Employees Working Remotely Today" → ?workMode=remote).
  const [workModeFilter, setWorkModeFilter] = useState(
    () => WORK_MODE_PARAM_TO_ROW[searchParams.get("workMode") ?? ""] ?? "all",
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
      return matchSearch && matchDept && matchType && matchWorkMode;
    });
  }, [employees, search, deptFilter, typeFilter, workModeFilter]);

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

  const activeRows =
    rowsByTab.find((t) => t.value === activeTab)?.rows ?? filtered;

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
    (e: EmployeeRow) => {
      dispatch(markCredentialsSent(e.id));
      toast.success(`Login credentials sent to ${e.email || e.name}`);
    },
    [dispatch],
  );

  const handleSendKudos = useCallback((e: EmployeeRow) => setKudosFor(e), []);

  const handleDeactivate = useCallback(
    (e: EmployeeRow) => {
      dispatch(setEmployeeStatus({ employeeId: e.id, status: "inactive" }));
      toast.success(`${e.name} has been deactivated`);
    },
    [dispatch],
  );

  const handleReactivate = useCallback(
    (e: EmployeeRow) => {
      dispatch(setEmployeeStatus({ employeeId: e.id, status: "active" }));
      toast.success(`${e.name} has been reactivated`);
    },
    [dispatch],
  );

  /**
   * Exit Employee — creates a pending record on the Offboarding pipeline and
   * moves the employee to the Offboarding Notice tab (client feedback §1.2).
   */
  const handleExit = useCallback(
    (e: EmployeeRow) => {
      const id = `off-${Date.now()}`;
      const record: OffboardingRecord = {
        id,
        employeeId: e.id,
        employeeName: e.name,
        employeeInitials: e.initials,
        jobTitle: e.jobTitle,
        department: e.department,
        lastWorkingDate: new Date().toISOString().slice(0, 10),
        exitReason: "resignation",
        status: "pending",
        clearanceItems: buildClearanceItems(id),
        exitInterviewCompleted: false,
        initiatedAt: new Date().toISOString().slice(0, 10),
      };
      dispatch(addRecord(record));
      dispatch(setEmployeeStatus({ employeeId: e.id, status: "offboarding" }));
      toast.success(`Offboarding initiated for ${e.name}`, {
        description: "Awaiting approval on the Offboarding pipeline.",
        action: {
          label: "View",
          onClick: () => router.push("/talent/offboarding"),
        },
      });
    },
    [dispatch, router],
  );

  const handleDelete = useCallback(
    (e: EmployeeRow) => {
      dispatch(softDeleteEmployee(e.id));
      toast.success(`${e.name} moved to Deleted`, {
        description: "Their record is kept and can be restored.",
      });
    },
    [dispatch],
  );

  const handleRestore = useCallback(
    (e: EmployeeRow) => {
      dispatch(restoreEmployee(e.id));
      toast.success(`${e.name} restored`);
    },
    [dispatch],
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
          </p>
        </div>
        <PermissionGate module="organization.employees" action="create">
          <Button
            className="mt-1 gap-1.5"
            onClick={() => router.push("/talent/onboarding")}
          >
            <UserPlus className="w-4 h-4" />
            Onboard Employee
          </Button>
        </PermissionGate>
      </div>

      <StatCards employees={employees} />

      <EmployeesToolbar
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        workModeFilter={workModeFilter}
        onWorkModeFilterChange={setWorkModeFilter}
        exportRows={activeRows}
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

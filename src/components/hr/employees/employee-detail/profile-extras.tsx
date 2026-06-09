"use client";

import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { useCan } from "@/src/lib/permissions/use-can";
import { COLLECTION_SCHEMAS } from "@/src/lib/profile/collections";
import { ProfileFieldsEditor } from "@/src/components/shared/profile-fields";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  useRecordForm,
  AddButton,
  EditButton,
} from "@/src/components/shared/profile-fields/record-form";
import { useProfileVariant } from "./variant";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import {
  Section,
  StatStrip,
  InfoGrid,
  DataTable,
  Row,
  Cell,
  Empty,
  fmtDate,
  titleCase,
  formatDuration,
} from "./ui";
import {
  useEmployeeRecurringDeductions,
  useEmployeeOneTimePayments,
  useEmployeeOneTimeDeductions,
  useEmployeePay,
  type RawPayItem,
} from "./hooks";

interface SectionProps {
  employeeId: string;
  employee: LocaleEmployee;
}

const money = (n?: number | null) => (n == null ? "—" : formatMoneyLocale(n));

// ── Employment overview (read-only computed: IDs, age, service, line manager) ─
export function EmploymentOverview({ employee }: { employee: LocaleEmployee }) {
  const { data: manager } = useLocaleSection<LocaleEmployee | null>((b) =>
    employee.managerId ? (b.employees.find((e) => e.id === employee.managerId) ?? null) : null,
  );
  return (
    <div className="flex flex-col gap-4">
      <InfoGrid
        rows={[
          { label: "Employee ID", value: employee.id },
          { label: "Reference number", value: employee.employeeNumber },
          { label: "Age", value: formatDuration(employee.dateOfBirth) },
          { label: "Length of service", value: formatDuration(employee.startDate) },
        ]}
      />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
          Line manager
        </p>
        {manager ? (
          <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-xs ring-1 ring-foreground/10">
            <PersonAvatar
              name={manager.fullName}
              initials={manager.initials}
              gender={manager.gender}
              className="w-11 h-11 shrink-0"
              fallbackClassName="bg-primary/10 text-sm font-bold text-primary/70"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{manager.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {manager.jobTitle}
                {manager.employeeNumber ? ` · ${manager.employeeNumber}` : ""}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No line manager assigned.</p>
        )}
      </div>
    </div>
  );
}

// ── Compensation (computed rates + editor + repeatable pay items) ───────────--
function PayItemTable({
  title,
  singularKey,
  rows,
  loading,
  employeeId,
  withFrequency,
}: {
  title: string;
  singularKey: "recurringDeductions" | "oneTimePayments" | "oneTimeDeductions";
  rows: RawPayItem[] | null;
  loading: boolean;
  employeeId: string;
  withFrequency?: boolean;
}) {
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS[singularKey], employeeId);
  const list = rows ?? [];
  const cols = withFrequency
    ? ["Label", "Amount", "Frequency", "Start", ...(canEdit ? [""] : [])]
    : ["Label", "Amount", "Date", ...(canEdit ? [""] : [])];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        {canEdit && <AddButton label="Add" onClick={rf.openCreate} />}
      </div>
      {rf.node}
      {loading && !rows ? null : list.length === 0 ? (
        <Empty label="None." />
      ) : (
        <DataTable columns={cols}>
          {list.map((r) => (
            <Row key={r.id}>
              <Cell>{r.label ?? "—"}</Cell>
              <Cell>{money(r.amount)}</Cell>
              {withFrequency ? (
                <>
                  <Cell className="capitalize">{r.frequency ?? "—"}</Cell>
                  <Cell>{fmtDate(r.startDate)}</Cell>
                </>
              ) : (
                <Cell>{fmtDate(r.date)}</Cell>
              )}
              {canEdit && <Cell><EditButton onClick={() => rf.openEdit(r)} /></Cell>}
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}

/** Salary-change history with the current effective date and edit/add support. */
function SalaryHistory({ employeeId }: { employeeId: string }) {
  const { data, loading } = useEmployeePay(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.payHistory, employeeId);
  const history = data?.history ?? [];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Salary change history
        </p>
        {canEdit && <AddButton label="Add pay change" onClick={rf.openCreate} />}
      </div>
      {rf.node}
      {loading && !data ? null : history.length === 0 ? (
        <Empty label="No salary changes recorded." />
      ) : (
        <DataTable
          columns={["Effective", "Type", "Previous", "New", "Reason", ...(canEdit ? [""] : [])]}
        >
          {history.map((p) => (
            <Row key={p.id}>
              <Cell>{fmtDate(p.effectiveDate)}</Cell>
              <Cell className="capitalize">{titleCase(p.changeType)}</Cell>
              <Cell>{money(p.previousAmount)}</Cell>
              <Cell className="font-semibold">{money(p.newAmount)}</Cell>
              <Cell>{p.reason}</Cell>
              {canEdit && (
                <Cell>
                  <EditButton onClick={() => rf.openEdit(p)} />
                </Cell>
              )}
            </Row>
          ))}
        </DataTable>
      )}
    </div>
  );
}

export function CompensationSection({ employeeId, employee }: SectionProps) {
  const variant = useProfileVariant();
  const annual = employee.salary?.amount ?? 0;
  const weeklyHours = employee.workPattern?.weeklyHours ?? 40;
  const recurring = useEmployeeRecurringDeductions(employeeId);
  const onePay = useEmployeeOneTimePayments(employeeId);
  const oneDed = useEmployeeOneTimeDeductions(employeeId);

  return (
    <Section title="Compensation" description="Rates are calculated from the annual salary.">
      <StatStrip
        items={[
          { label: "Annual", value: money(annual), accent: "text-emerald-600" },
          { label: "Monthly", value: money(annual / 12) },
          { label: "Weekly", value: money(annual / 52) },
          { label: "Daily", value: money(annual / 260) },
          { label: "Hourly", value: money(weeklyHours ? annual / (52 * weeklyHours) : 0) },
        ]}
      />
      <ProfileFieldsEditor
        employee={employee}
        employeeId={employeeId}
        mode={variant.mode}
        groups={["compensation"]}
        bulkEditLabel="Compensation"
      />
      <SalaryHistory employeeId={employeeId} />
      <PayItemTable
        title="Recurring deductions"
        singularKey="recurringDeductions"
        rows={recurring.data}
        loading={recurring.loading}
        employeeId={employeeId}
        withFrequency
      />
      <PayItemTable
        title="One-time payments"
        singularKey="oneTimePayments"
        rows={onePay.data}
        loading={onePay.loading}
        employeeId={employeeId}
      />
      <PayItemTable
        title="One-time deductions"
        singularKey="oneTimeDeductions"
        rows={oneDed.data}
        loading={oneDed.loading}
        employeeId={employeeId}
      />
    </Section>
  );
}

// ── Offboarding (exit interview fields) ─────────────────────────────────────--
export function OffboardingSection({ employeeId, employee }: SectionProps) {
  const variant = useProfileVariant();
  return (
    <Section title="Offboarding" description="Exit interview & leaver details.">
      <ProfileFieldsEditor
        employee={employee}
        employeeId={employeeId}
        mode={variant.mode}
        groups={["offboarding"]}
        bulkEditLabel="Offboarding"
      />
    </Section>
  );
}

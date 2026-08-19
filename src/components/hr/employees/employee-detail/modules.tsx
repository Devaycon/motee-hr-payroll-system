"use client";

import * as React from "react";
import { AlertTriangle, Pin, ChevronRight, Check, TriangleAlert } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { OverflowTabsList } from "@/src/components/shared/overflow-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { toast } from "sonner";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { removeRecord } from "@/src/lib/stores/collection-edits-slice";
import {
  ProfileFieldsEditor,
  RequestProfileChangeButton,
  ChangeRequestsTable,
  type ProfileReadOnlyRow,
} from "@/src/components/shared/profile-fields";
import { useDemoChangeRequests } from "./use-demo-change-requests";
import {
  useRecordForm,
  AddButton,
  EditButton,
} from "@/src/components/shared/profile-fields/record-form";
import { COLLECTION_SCHEMAS } from "@/src/lib/profile/collections";
import { regionWordForCountry, profileFieldGroupOf } from "@/src/lib/profile/fields";
import { useCan } from "@/src/lib/permissions/use-can";
import { useProfileVariant } from "./variant";
import { RowActions } from "./row-actions";
import { RecordDetailModal } from "./record-detail-modal";
import { LeaveRequestPanel } from "@/src/components/employee/leave-request/panel";
import { LeaveInsights } from "@/src/components/employee/leave-request/components/leave-insights";
import { EmployeeTraining } from "@/src/components/employee/training";
import { MY_ENROLLMENTS } from "@/src/components/employee/training/components/data";
import {
  EmploymentOverview,
  CompensationSection,
  OffboardingSection,
} from "./profile-extras";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import {
  Section,
  StatStrip,
  Empty,
  LoadingPanel,
  StatusBadge,
  Pill,
  DataTable,
  Row,
  Cell,
  InfoGrid,
  fmtDate,
  titleCase,
  daysUntil,
  formatDuration,
} from "./ui";
import {
  ONBOARDING_METHOD_LABELS,
  ONBOARDING_METHOD_DESCRIPTIONS,
} from "@/src/lib/constants/onboarding-methods";
import { employmentTypeLabel } from "@/src/lib/constants/employment-types";
import { sicknessReasonDisplay } from "@/src/lib/constants/sickness";
import {
  useEmployeeLeave,
  useEmployeeSickness,
  useEmployeeLearn,
  useEmployeeTraining,
  useEmployeePerformance,
  useEmployeeDbs,
  useEmployeeDisciplinaries,
  useEmployeeAssets,
  useEmployeeGrievances,
  useEmployeeHistory,
  useEmployeeJobs,
  useEmployeeKudos,
  useEmployeeBookings,
  useEmployeeMedical,
  useEmployeeNotes,
  useEmployeePay,
  useEmployeePayslips,
  useEmployeePermissions,
  useEmployeeTasks,
  useEmployeeTimeLogs,
  useEmployeeExpenses,
  type RawCertification,
} from "./hooks";
import { AssignAssetModal } from "./assign-asset-modal";

export interface ModuleProps {
  employeeId: string;
  employee: LocaleEmployee;
}

const money = (n?: number | null) => (n == null ? "—" : formatMoneyLocale(n));

// ── Address preview (home summary + "View all" modal) ────────────────────────
function AddressTabContent({
  employee,
  employeeId,
  mode,
}: {
  employee: LocaleEmployee;
  employeeId: string;
  mode: "edit" | "request";
}) {
  const [open, setOpen] = React.useState(false);
  const home = (employee.addresses?.home ?? {}) as Record<string, string>;
  const regionWord = regionWordForCountry(home.country);
  const regionLabel = regionWord.charAt(0).toUpperCase() + regionWord.slice(1);
  const summaryRows = [
    { label: "Address line 1", value: home.line1 },
    { label: "Address line 2", value: home.line2 },
    { label: "City", value: home.city },
    { label: regionLabel, value: home.region },
    { label: "Postal code", value: home.postalCode },
    { label: "Country", value: home.country },
  ].filter((r) => r.value);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-semibold text-foreground">Home Address</h3>
          {summaryRows.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              {summaryRows.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center gap-2 py-1.5 border-b border-border/50"
                >
                  <span className="text-xs text-muted-foreground">
                    {r.label}:
                  </span>
                  <span className="text-xs font-medium text-foreground flex-1 truncate">
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No home address recorded.
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="self-start h-8 gap-1.5 text-xs"
          onClick={() => setOpen(true)}
        >
          View all addresses
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Addresses</DialogTitle>
          </DialogHeader>
          <ProfileFieldsEditor
            employee={employee}
            employeeId={employeeId}
            mode={mode}
            groups={["address"]}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Both identifiers, how the record was created (§D1) and tenure — read-only
 * system facts, listed alongside the editable Details fields rather than
 * sitting in their own card.
 */
function identityRows(employee: LocaleEmployee): ProfileReadOnlyRow[] {
  const rows: ProfileReadOnlyRow[] = [
    { label: "Employee ID", value: employee.employeeNumber, className: "tabular-nums" },
    { label: "System ID", value: employee.id, className: "font-mono" },
  ];
  if (employee.onboardingMethod) {
    rows.push({
      label: "Onboarded via",
      value: ONBOARDING_METHOD_LABELS[employee.onboardingMethod],
      title: ONBOARDING_METHOD_DESCRIPTIONS[employee.onboardingMethod],
    });
  }
  if (employee.startDate) {
    rows.push({
      label: "Employee since",
      value: `${new Date(employee.startDate).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })} · ${formatDuration(employee.startDate)}`,
    });
  }
  return rows;
}

// ── Profile (sub-tabs) ───────────────────────────────────────────────────────
export function ProfileModule({
  employeeId,
  employee,
  onPhotoRequest,
}: ModuleProps & { onPhotoRequest?: () => void }) {
  const variant = useProfileVariant();
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const allRequests = useAppSelector((s) =>
    s.profileEdits.requests.filter((r) => r.employeeId === employeeId),
  );
  useDemoChangeRequests(employeeId, employee.fullName);
  const pendingRequests = React.useMemo(
    () => allRequests.filter((r) => r.status === "pending"),
    [allRequests],
  );
  // Per-tab pending counts so each tab flags its own outstanding changes (§B4).
  const pendingByGroup = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of pendingRequests) {
      const group = profileFieldGroupOf(r.field);
      if (group) counts[group] = (counts[group] ?? 0) + 1;
    }
    return counts;
  }, [pendingRequests]);
  const tabLabel = (label: string, count?: number) =>
    count && count > 0 ? `${label} (${count})` : label;

  const [tab, setTab] = React.useState("details");
  const requestChangeButton = (
    <RequestProfileChangeButton
      employee={employee}
      employeeId={employeeId}
      mode={variant.mode}
      onPhotoRequest={onPhotoRequest}
    />
  );
  // No per-tab edit button here — the Section header's "Edit Profile Details"
  // picker already covers every one of these groups.
  const editor = (
    groups: Parameters<typeof ProfileFieldsEditor>[0]["groups"],
    readOnlyRows?: ProfileReadOnlyRow[],
  ) => (
    <ProfileFieldsEditor
      employee={employee}
      employeeId={employeeId}
      mode={variant.mode}
      groups={groups}
      readOnlyRows={readOnlyRows}
    />
  );
  return (
    <Section title="Profile" action={requestChangeButton}>
      <Tabs value={tab} onValueChange={setTab}>
        <OverflowTabsList
          value={tab}
          onValueChange={setTab}
          tabs={[
            { value: "details", label: tabLabel("Details", pendingByGroup.personal) },
            { value: "contact", label: tabLabel("Contact", pendingByGroup.contact) },
            { value: "address", label: tabLabel("Address", pendingByGroup.address) },
            { value: "bank", label: tabLabel("Bank", pendingByGroup.bank) },
            // Where a change went after it was submitted — sits with the fields
            // it applies to, not only in the standalone Change Log module.
            {
              value: "requests",
              label: tabLabel("Profile Change Request Log", pendingRequests.length),
            },
          ]}
        />

        <TabsContent value="details" className="mt-4">
          {editor(["personal"], identityRows(employee))}
        </TabsContent>
        <TabsContent value="contact" className="mt-4">
          {editor(["contact"])}
        </TabsContent>
        <TabsContent value="address" className="mt-4">
          <AddressTabContent
            employee={employee}
            employeeId={employeeId}
            mode={variant.mode}
          />
        </TabsContent>
        <TabsContent value="bank" className="mt-4">
          {editor(["bank"])}
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          <ChangeRequestsTable
            requests={allRequests}
            audience={variant.audience}
            actorName={actorName}
            onRequestChange={requestChangeButton}
          />
        </TabsContent>
      </Tabs>
    </Section>
  );
}

// ── Job (employment overview + system-driven employment fields) ───────────────
export function JobModule({ employeeId, employee }: ModuleProps) {
  const variant = useProfileVariant();
  return (
    <Section title="Job">
      <div className="flex flex-col gap-5">
        <EmploymentOverview employee={employee} />
        <ProfileFieldsEditor
          employee={employee}
          employeeId={employeeId}
          mode={variant.mode}
          groups={["employment"]}
          bulkEditLabel="Job"
        />
      </div>
    </Section>
  );
}

// ── Compensation / Offboarding (self-titled sections promoted to modules) ─────
export function CompensationModule({ employeeId, employee }: ModuleProps) {
  return <CompensationSection employeeId={employeeId} employee={employee} />;
}

export function OffboardingModule({ employeeId, employee }: ModuleProps) {
  return <OffboardingSection employeeId={employeeId} employee={employee} />;
}

// ── Preferences / Access (self-service + system access fields) ────────────────
export function PreferencesModule({ employeeId, employee }: ModuleProps) {
  const variant = useProfileVariant();
  return (
    <Section title="Preferences">
      <ProfileFieldsEditor
        employee={employee}
        employeeId={employeeId}
        mode={variant.mode}
        groups={["preferences"]}
        bulkEditLabel="Preferences"
      />
    </Section>
  );
}

export function AccessModule({ employeeId, employee }: ModuleProps) {
  const variant = useProfileVariant();
  return (
    <Section title="Access">
      <ProfileFieldsEditor
        employee={employee}
        employeeId={employeeId}
        mode={variant.mode}
        groups={["access"]}
        bulkEditLabel="Access"
      />
    </Section>
  );
}

// ── Leave ─────────────────────────────────────────────────────────────────--
export function LeaveModule({ employeeId, employee }: ModuleProps) {
  const variant = useProfileVariant();
  // On the self profile, this is where the employee requests & manages leave.
  if (variant.mode === "request") {
    return (
      <Section
        title="Leave Management"
        description="View your leave balances, submit requests and track approval status."
      >
        <LeaveRequestPanel />
      </Section>
    );
  }
  return <HrLeaveSummary employeeId={employeeId} employee={employee} />;
}

/**
 * HR view: read-only leave balances & history for the viewed employee.
 *
 * Terminology follows how people actually reason about leave —
 * Entitlement → Booked → Taken → Remaining — rather than the five-value model
 * that produced two cards ("Available (all)" and "Remaining") showing the same
 * number with no way to tell them apart. "Remaining" is now the single answer
 * to "how much can still be booked?"; "Taken" is used everywhere the tabs use
 * it, so a column never disagrees with the tab above it.
 */
function HrLeaveSummary({ employeeId, employee }: ModuleProps) {
  const { data, loading } = useEmployeeLeave(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rfReq = useRecordForm(COLLECTION_SCHEMAS.leaveRequests, employeeId);
  const rfAdj = useRecordForm(COLLECTION_SCHEMAS.leaveAdjustments, employeeId);
  const [policyFilter, setPolicyFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  if (loading && !data) return <LoadingPanel />;
  if (!data) return <Empty />;

  const totalEntitlement = data.rows.reduce((s, r) => s + r.entitlement, 0);
  const totalTaken = data.rows.reduce((s, r) => s + r.taken, 0);
  const totalBooked = data.rows.reduce((s, r) => s + r.booked, 0);
  // What can still be booked — entitlement less what's already spoken for.
  const totalRemaining = data.rows.reduce((s, r) => s + r.available, 0);
  // The assistant reasons about annual leave specifically, not the sum of every
  // policy — carry-over and expiry only apply to that one.
  const annualAvailable =
    data.rows.find((r) => /annual/i.test(r.policyName))?.available ?? 0;

  const leaveYear = `1 January ${new Date().getFullYear()} – 31 December ${new Date().getFullYear()}`;
  const policies = [...new Set(data.rows.map((r) => r.policyName))];
  const matches = (r: { leaveType: string; status: string }) =>
    (policyFilter === "all" ||
      r.leaveType.toLowerCase().includes(policyFilter.toLowerCase())) &&
    (statusFilter === "all" || r.status === statusFilter);
  const booked = data.booked.filter(matches);
  const taken = data.taken.filter(matches);
  const filtered = policyFilter !== "all" || statusFilter !== "all";

  return (
    <Section
      title="Leave Management"
      description="Leave balances, booked and taken history, and adjustments."
      action={canEdit ? <AddButton label="Add leave" onClick={rfReq.openCreate} /> : undefined}
    >
      {rfReq.node}
      {rfAdj.node}

      {/* Which year these figures describe — otherwise every number is
          ambiguous the moment a leave year rolls over. */}
      <p className="-mt-1 text-xs text-muted-foreground">
        Leave year <span className="font-medium text-foreground">{leaveYear}</span>
      </p>

      {/* No accent colour: these are neutral measurements, and green on a
          summary figure reads as "good" when a high balance may not be. */}
      <StatStrip
        items={[
          { label: "Total Entitlement", value: totalEntitlement },
          { label: "Booked", value: totalBooked },
          { label: "Taken", value: totalTaken },
          { label: "Remaining", value: totalRemaining },
        ]}
      />

      <LeaveInsights
        annualRemaining={annualAvailable}
        audience="hr"
        subject={{
          name: employee.fullName,
          department: employee.departmentName,
        }}
      />

      {/* Allocated → Booked → Taken → Remaining, the order people read it in. */}
      <DataTable columns={["Policy", "Entitlement", "Booked", "Taken", "Remaining"]}>
        {data.rows.map((r) => (
          <Row key={r.policyId}>
            <Cell>{r.policyName}</Cell>
            <Cell>
              <span className="font-medium">{r.entitlement}</span>
              {r.adjustments ? (
                <span className="block text-[11px] text-muted-foreground">
                  {r.allowance} base{" "}
                  {r.adjustments > 0
                    ? `+ ${r.adjustments} adjustment`
                    : `− ${Math.abs(r.adjustments)} adjustment`}
                </span>
              ) : null}
            </Cell>
            <Cell>{r.booked}</Cell>
            <Cell>{r.taken}</Cell>
            <Cell className="font-semibold">{r.available}</Cell>
          </Row>
        ))}
      </DataTable>

      <Tabs defaultValue="booked">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="booked">Booked</TabsTrigger>
            <TabsTrigger value="taken">Taken</TabsTrigger>
            <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          {/* Filters apply to the Booked and Taken lists, which are the two
              that grow unmanageable over a full leave year. */}
          <div className="flex items-center gap-2">
            <Select value={policyFilter} onValueChange={setPolicyFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="All policies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All policies</SelectItem>
                {policies.map((p) => (
                  <SelectItem key={p} value={p} className="text-xs">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All statuses</SelectItem>
                {["approved", "pending", "rejected", "cancelled"].map((s) => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">
                    {titleCase(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="booked" className="mt-4">
          {booked.length === 0 ? (
            <Empty
              label="No booked leave"
              description={
                filtered
                  ? "No bookings match the current filters."
                  : "This employee has no upcoming leave bookings."
              }
            />
          ) : (
            <DataTable columns={["Type", "From", "To", "Days", "Status"]}>
              {booked.map((r) => (
                <Row key={r.id}>
                  <Cell>{r.leaveType}</Cell>
                  <Cell>{fmtDate(r.startDate)}</Cell>
                  <Cell>{fmtDate(r.endDate)}</Cell>
                  <Cell>{r.days}</Cell>
                  <Cell><StatusBadge status={r.status} /></Cell>
                </Row>
              ))}
            </DataTable>
          )}
        </TabsContent>
        <TabsContent value="taken" className="mt-4">
          {taken.length === 0 ? (
            <Empty
              label="No leave taken"
              description={
                filtered
                  ? "No records match the current filters."
                  : "This employee hasn't taken any leave in this leave year."
              }
            />
          ) : (
            <DataTable columns={["Type", "From", "To", "Days", "Status"]}>
              {taken.map((r) => (
                <Row key={r.id}>
                  <Cell>{r.leaveType}</Cell>
                  <Cell>{fmtDate(r.startDate)}</Cell>
                  <Cell>{fmtDate(r.endDate)}</Cell>
                  <Cell>{r.days}</Cell>
                  <Cell><StatusBadge status={r.status} /></Cell>
                </Row>
              ))}
            </DataTable>
          )}
        </TabsContent>
        <TabsContent value="adjustments" className="mt-4">
          {canEdit && (
            <div className="mb-3 flex justify-end">
              <AddButton label="Add adjustment" onClick={rfAdj.openCreate} />
            </div>
          )}
          {data.adjustments.length === 0 ? (
            <Empty
              label="No adjustments"
              description="Nobody has manually added to or deducted from this employee's entitlement."
            />
          ) : (
            <DataTable columns={["Date", "Policy", "Delta", "Reason", "Added by", ...(canEdit ? [""] : [])]}>
              {data.adjustments.map((a) => (
                <Row key={a.id}>
                  <Cell>{fmtDate(a.date)}</Cell>
                  <Cell>{a.policyId}</Cell>
                  <Cell className={a.delta < 0 ? "text-rose-600" : "text-emerald-600"}>
                    {a.delta > 0 ? `+${a.delta}` : a.delta}
                  </Cell>
                  <Cell>{a.reason}</Cell>
                  <Cell>{a.addedBy}</Cell>
                  {canEdit && <Cell><EditButton onClick={() => rfAdj.openEdit(a)} /></Cell>}
                </Row>
              ))}
            </DataTable>
          )}
        </TabsContent>
        {/* "Usage" said nothing about what was inside — this is the month-by-
            month record of leave taken. */}
        <TabsContent value="history" className="mt-4">
          {data.usage.length === 0 ? (
            <Empty
              label="No leave history"
              description="Leave taken will appear here, broken down by month."
            />
          ) : (
            <DataTable columns={["Month", "Breakdown", "Total days"]}>
              {data.usage.map((u) => (
                <Row key={u.month}>
                  <Cell>{u.month}</Cell>
                  <Cell>
                    {Object.entries(u.byType)
                      .map(([t, d]) => `${t}: ${d}`)
                      .join(" · ")}
                  </Cell>
                  <Cell className="font-semibold">{u.total}</Cell>
                </Row>
              ))}
            </DataTable>
          )}
        </TabsContent>
      </Tabs>
    </Section>
  );
}

// ── Sickness ──────────────────────────────────────────────────────────────--
/**
 * Bradford Factor banding (§17.5). Colour-codes the score so managers grasp
 * severity without knowing the formula. Higher = greater absence disruption.
 *
 * The client rated the score highly but noted "most employees won't know what
 * the number means" — and this module is on the employee's own profile too, so
 * each band carries a plain-language reading rather than a bare integer.
 */
function bradfordBand(score: number): {
  label: string;
  text: string;
  pill: string;
  meaning: string;
} {
  if (score >= 400)
    return {
      label: "Very High",
      text: "text-rose-600",
      pill: "bg-rose-500/10 text-rose-600",
      meaning: "Frequent short absences — expect a formal absence review.",
    };
  if (score >= 100)
    return {
      label: "High",
      text: "text-orange-600",
      pill: "bg-orange-500/10 text-orange-600",
      meaning: "Above the usual pattern — a manager conversation is likely.",
    };
  if (score >= 50)
    return {
      label: "Moderate",
      text: "text-amber-600",
      pill: "bg-amber-500/10 text-amber-600",
      meaning: "Slightly above typical, but not a concern on its own.",
    };
  return {
    label: "Low",
    text: "text-emerald-600",
    pill: "bg-emerald-500/10 text-emerald-600",
    meaning: "Within the normal range — no action needed.",
  };
}

/**
 * What the score is, spelled out. It weights *frequency* over duration —
 * episodes² × days — which is unintuitive enough that showing the number
 * without this reads as an unexplained judgement.
 */
const BRADFORD_EXPLAINER =
  "The Bradford Factor scores absence as episodes × episodes × total days, so several " +
  "short absences count for far more than one long one — it measures disruption, not illness.";

// Absences of this length or more trigger a formal return-to-work interview.
const RTW_THRESHOLD_DAYS = 5;

export function SicknessModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeSickness(employeeId);
  const variant = useProfileVariant();
  const isSelf = variant.audience === "employee";
  const canEdit = useCan("organization.employees", "edit");
  // The redaction exists to keep clinical detail from line managers — not from
  // the person it describes. On My Profile you always see your own reasons.
  const canViewMedical = canEdit || isSelf;

  /**
   * An employee reporting their own absence files it as `pending` for HR to
   * confirm; HR recording one is already the confirmation.
   */
  const schema = React.useMemo(
    () =>
      isSelf
        ? {
            ...COLLECTION_SCHEMAS.sickness,
            defaults: (id: string) => ({
              ...COLLECTION_SCHEMAS.sickness.defaults!(id),
              status: "pending",
            }),
          }
        : COLLECTION_SCHEMAS.sickness,
    [isSelf],
  );
  const rf = useRecordForm(schema, employeeId);
  const dispatch = useAppDispatch();
  const [detail, setDetail] = React.useState<SicknessRecord | null>(null);
  if (loading && !data) return <LoadingPanel />;
  if (!data) return <Empty />;
  const band = bradfordBand(data.summary.bradfordFactor);
  // Records are sorted newest-first; treat the most recent qualifying absence as
  // an outstanding return-to-work interview, earlier ones as completed (§17.7).
  const firstRtwIdx = data.records.findIndex((r) => r.days >= RTW_THRESHOLD_DAYS);
  const rtwPending = firstRtwIdx >= 0 ? 1 : 0;
  const rtwCompleted =
    data.records.filter((r) => r.days >= RTW_THRESHOLD_DAYS).length - rtwPending;
  return (
    <Section
      title="Sickness & Absence"
      description="View sickness history, absence trends, Bradford Factor and return-to-work records."
      action={
        canEdit || isSelf ? (
          <AddButton
            label={isSelf ? "Report absence" : "Record absence"}
            onClick={rf.openCreate}
          />
        ) : undefined
      }
    >
      {rf.node}
      {/* Units belong on the figure, not left implied by the label (§17.3). */}
      <StatStrip
        items={[
          {
            label: "Sick Days This Year",
            value: `${data.summary.totalDaysThisYear} ${
              data.summary.totalDaysThisYear === 1 ? "Day" : "Days"
            }`,
          },
          { label: "Sickness Episodes", value: data.summary.episodes },
          {
            label: "Longest Absence",
            value: `${data.summary.longestAbsenceDays} ${
              data.summary.longestAbsenceDays === 1 ? "Day" : "Days"
            }`,
          },
          {
            label: "Bradford Factor",
            accent: band.text,
            ariaLabel: `Bradford Factor ${data.summary.bradfordFactor}, ${band.label}. ${band.meaning}`,
            value: (
              <span className="inline-flex items-center gap-2">
                {data.summary.bradfordFactor}
                <span
                  className={
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold " + band.pill
                  }
                  title={BRADFORD_EXPLAINER}
                >
                  {band.label}
                </span>
              </span>
            ),
          },
        ]}
      />

      {/* The score is meaningless without this, and employees see it too. */}
      <p className="-mt-2 text-xs text-muted-foreground">
        <span className={cn("font-medium", band.text)}>
          {band.label} ({data.summary.bradfordFactor}) — {band.meaning}
        </span>{" "}
        {BRADFORD_EXPLAINER}
      </p>
      {data.records.length === 0 ? (
        <Empty label="No sickness records." />
      ) : (
        <>
          <DataTable
            columns={["From", "To", "Days", "Reason", "Certification", "Return to Work", "Status", ""]}
          >
            {data.records.map((r, i) => {
              const needsRtw = r.days >= RTW_THRESHOLD_DAYS;
              const rtwDone = needsRtw && i !== firstRtwIdx;
              return (
                <Row key={r.id}>
                  <Cell>{fmtDate(r.startDate)}</Cell>
                  <Cell>{fmtDate(r.endDate)}</Cell>
                  <Cell>{r.days}</Cell>
                  <Cell>{sicknessReasonDisplay(r.reason, canViewMedical)}</Cell>
                  <Cell className="text-muted-foreground">
                    {r.days > 7 ? "Fit note" : "Self-certified"}
                  </Cell>
                  <Cell>
                    {!needsRtw ? (
                      <span className="text-muted-foreground">—</span>
                    ) : rtwDone ? (
                      <span className="text-emerald-600">Completed</span>
                    ) : (
                      <span className="text-amber-600">Pending</span>
                    )}
                  </Cell>
                  <Cell><StatusBadge status={r.status} /></Cell>
                  <Cell>
                    <RowActions
                      onView={() =>
                        setDetail({ ...r, needsRtw, rtwDone, canViewMedical })
                      }
                      onEdit={canEdit ? () => rf.openEdit(r) : undefined}
                      onDelete={
                        canEdit
                          ? () => {
                              dispatch(
                                removeRecord({ key: "leaveRequests", id: r.id }),
                              );
                              toast.success("Absence removed");
                            }
                          : undefined
                      }
                    />
                  </Cell>
                </Row>
              );
            })}
          </DataTable>
          <p className="text-xs text-muted-foreground">
            Return-to-work interviews: {rtwCompleted} completed · {rtwPending} pending
            — triggered for absences of {RTW_THRESHOLD_DAYS}+ days.
          </p>
        </>
      )}

      {detail && (
        <RecordDetailModal
          open
          onClose={() => setDetail(null)}
          title={`${sicknessReasonDisplay(detail.reason, detail.canViewMedical)} absence`}
          subtitle={`${fmtDate(detail.startDate)} – ${fmtDate(detail.endDate)}`}
          status={detail.status}
          about={{
            what: `A recorded sickness absence of ${detail.days} working day${
              detail.days === 1 ? "" : "s"
            }.`,
            why:
              detail.days > 7
                ? "Absences over 7 days need a fit note from a doctor — self-certification only covers the first week."
                : "Absences of a week or less are self-certified: no medical evidence is required.",
            consequence: detail.needsRtw
              ? detail.rtwDone
                ? `A return-to-work interview was required (${RTW_THRESHOLD_DAYS}+ days) and has been completed.`
                : `A return-to-work interview is required for absences of ${RTW_THRESHOLD_DAYS}+ days and is still outstanding.`
              : `No return-to-work interview is triggered — those start at ${RTW_THRESHOLD_DAYS} days.`,
          }}
          outcome={
            detail.needsRtw
              ? {
                  tone: detail.rtwDone ? "positive" : "pending",
                  heading: detail.rtwDone
                    ? "Return-to-work interview completed"
                    : "Return-to-work interview pending",
                  body: detail.rtwDone
                    ? "The conversation has taken place and the absence is closed out."
                    : "Book the conversation before this absence can be closed out. It covers fitness to return and any adjustments needed.",
                }
              : null
          }
          fields={[
            { label: "First day absent", value: fmtDate(detail.startDate) },
            { label: "Last day absent", value: fmtDate(detail.endDate) },
            { label: "Working days lost", value: detail.days },
            {
              label: "Reason",
              value: sicknessReasonDisplay(detail.reason, detail.canViewMedical),
            },
            {
              label: "Certification",
              value: detail.days > 7 ? "Fit note required" : "Self-certified",
            },
            { label: "Recorded", value: fmtDate(detail.submittedAt) },
          ]}
        />
      )}
    </Section>
  );
}

/** A sickness row plus the derived flags the detail view explains. */
type SicknessRecord = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
  submittedAt?: string;
  needsRtw: boolean;
  rtwDone: boolean;
  canViewMedical: boolean;
};

// ── Learn ─────────────────────────────────────────────────────────────────--
export function LearnModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeLearn(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS["learning.enrollments"], employeeId);
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  return (
    <Section
      title="Learning"
      description="Course enrolments."
      action={canEdit ? <AddButton label="Add enrolment" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      {rows.length === 0 ? (
        <Empty label="No course enrolments." />
      ) : (
        <DataTable columns={["Course", "Progress", "Status", "Enrolled", "Completed", ...(canEdit ? [""] : [])]}>
          {rows.map((e) => (
            <Row key={e.id}>
              <Cell>{e.courseTitle}</Cell>
              <Cell>{e.progress}%</Cell>
              <Cell><StatusBadge status={e.status} /></Cell>
              <Cell>{fmtDate(e.enrolledAt)}</Cell>
              <Cell>{fmtDate(e.completedAt)}</Cell>
              {canEdit && <Cell><EditButton onClick={() => rf.openEdit(e)} /></Cell>}
            </Row>
          ))}
        </DataTable>
      )}
    </Section>
  );
}

// ── Certifications ──────────────────────────────────────────────────────────
export function TrainingModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeTraining(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS["learning.certifications"], employeeId);

  const certs = React.useMemo(() => data ?? [], [data]);

  // Every completed course grants a certificate, so surface completed courses
  // from the learning history — the same data shown in the Training tab — as
  // certifications, instead of showing "No certifications" for trained staff.
  const derived = React.useMemo<RawCertification[]>(() => {
    const covered = new Set(certs.map((c) => c.courseId));
    return MY_ENROLLMENTS.filter(
      (e) => e.status === "completed" && !covered.has(e.courseId),
    ).map((e) => ({
      id: `enr-cert-${e.id}`,
      employeeId,
      courseId: e.courseId,
      title: `${e.courseName} — Certificate`,
      issuedAt: e.completedAt ?? "",
      expiresAt: null,
      certificateUrl: `/files/certs/${employeeId}-${e.courseId}.pdf`,
    }));
  }, [certs, employeeId]);

  if (loading && !data) return <LoadingPanel />;

  const formalIds = new Set(certs.map((c) => c.id));
  const rows = [...certs, ...derived];

  return (
    <Section
      title="Certifications"
      description="Formal certifications and completed-course certificates."
      action={canEdit ? <AddButton label="Add certification" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      {rows.length === 0 ? (
        <Empty label="No certifications." />
      ) : (
        <DataTable columns={["Certification", "Issued", "Expires", "Renewal", "Certificate", ...(canEdit ? [""] : [])]}>
          {rows.map((c) => {
            const d = daysUntil(c.expiresAt);
            const due = d != null && d <= 60;
            const editable = formalIds.has(c.id);
            return (
              <Row key={c.id}>
                <Cell>{c.title}</Cell>
                <Cell>{fmtDate(c.issuedAt)}</Cell>
                <Cell>{fmtDate(c.expiresAt)}</Cell>
                <Cell>
                  {d == null ? "—" : due ? (
                    <Pill className="border-rose-500/30 bg-rose-500/10 text-rose-600">
                      Due in {d}d
                    </Pill>
                  ) : "OK"}
                </Cell>
                <Cell>
                  <span
                    className="cursor-not-allowed text-muted-foreground/60"
                    title="File not available in this demo"
                  >
                    View
                  </span>
                </Cell>
                {canEdit && (
                  <Cell>
                    {editable ? <EditButton onClick={() => rf.openEdit(c)} /> : null}
                  </Cell>
                )}
              </Row>
            );
          })}
        </DataTable>
      )}
    </Section>
  );
}

// ── Training (assigned videos + dashboard) ──────────────────────────────────
export function TrainingDashboardModule() {
  return (
    <Section title="Training" description="Assigned training videos, progress, and history.">
      <EmployeeTraining embedded />
    </Section>
  );
}

// ── Performance ─────────────────────────────────────────────────────────────
export function PerformanceModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeePerformance(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rfGoal = useRecordForm(COLLECTION_SCHEMAS["perf.goals"], employeeId);
  const rfReview = useRecordForm(COLLECTION_SCHEMAS["perf.reviews"], employeeId);
  const rfOne = useRecordForm(COLLECTION_SCHEMAS["perf.oneOnOnes"], employeeId);
  const rfFb = useRecordForm(COLLECTION_SCHEMAS["perf.feedback"], employeeId);
  if (loading && !data) return <LoadingPanel />;
  if (!data) return <Empty />;
  const addBtn = (label: string, onClick: () => void) =>
    canEdit ? (
      <div className="mb-3 flex justify-end">
        <AddButton label={label} onClick={onClick} />
      </div>
    ) : null;
  return (
    <Section title="Performance">
      {rfGoal.node}
      {rfReview.node}
      {rfOne.node}
      {rfFb.node}
      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="oneonones">1:1s</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="goals" className="mt-4">
          {addBtn("Add goal", rfGoal.openCreate)}
          {data.goals.length === 0 ? <Empty label="No goals." /> : (
            <DataTable columns={["Goal", "Type", "Progress", "Status", ...(canEdit ? [""] : [])]}>
              {data.goals.map((g) => (
                <Row key={g.id}>
                  <Cell>{g.title}</Cell>
                  <Cell>{g.type}</Cell>
                  <Cell>{g.progress}%</Cell>
                  <Cell><StatusBadge status={g.status} /></Cell>
                  {canEdit && <Cell><EditButton onClick={() => rfGoal.openEdit(g)} /></Cell>}
                </Row>
              ))}
            </DataTable>
          )}
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          {addBtn("Add review", rfReview.openCreate)}
          {data.reviews.length === 0 ? <Empty label="No reviews." /> : (
            <DataTable columns={["Cycle", "Self", "Manager", "Calibrated", "Summary", "Completed", ...(canEdit ? [""] : [])]}>
              {data.reviews.map((r) => (
                <Row key={r.id}>
                  <Cell>{r.cycleId}</Cell>
                  <Cell>{r.selfRating ?? "—"}</Cell>
                  <Cell>{r.managerRating ?? "—"}</Cell>
                  <Cell>{r.calibratedRating ?? "—"}</Cell>
                  <Cell className="max-w-xs">{r.summary}</Cell>
                  <Cell>{fmtDate(r.completedAt)}</Cell>
                  {canEdit && <Cell><EditButton onClick={() => rfReview.openEdit(r)} /></Cell>}
                </Row>
              ))}
            </DataTable>
          )}
        </TabsContent>
        <TabsContent value="oneonones" className="mt-4">
          {addBtn("Add 1:1 note", rfOne.openCreate)}
          {data.oneOnOnes.length === 0 ? <Empty label="No 1:1 notes." /> : (
            <DataTable columns={["Date", "Notes", ...(canEdit ? [""] : [])]}>
              {data.oneOnOnes.map((o) => (
                <Row key={o.id}>
                  <Cell>{fmtDate(o.date)}</Cell>
                  <Cell>{o.notes}</Cell>
                  {canEdit && <Cell><EditButton onClick={() => rfOne.openEdit(o)} /></Cell>}
                </Row>
              ))}
            </DataTable>
          )}
        </TabsContent>
        <TabsContent value="feedback" className="mt-4">
          {addBtn("Add feedback", rfFb.openCreate)}
          {data.feedback.length === 0 ? <Empty label="No feedback received." /> : (
            <DataTable columns={["Date", "Type", "Message", ...(canEdit ? [""] : [])]}>
              {data.feedback.map((f) => (
                <Row key={f.id}>
                  <Cell>{fmtDate(f.createdAt)}</Cell>
                  <Cell>{titleCase(f.type)}</Cell>
                  <Cell>{f.message}</Cell>
                  {canEdit && <Cell><EditButton onClick={() => rfFb.openEdit(f)} /></Cell>}
                </Row>
              ))}
            </DataTable>
          )}
        </TabsContent>
      </Tabs>
    </Section>
  );
}

// ── DBS / Background check (country-aware) ──────────────────────────────────
export function DbsModule({ employeeId }: ModuleProps) {
  const country = useAppSelector((s) => s.locale.country);
  const { data, loading } = useEmployeeDbs(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.dbsChecks, employeeId);
  const title = country === "uk" ? "DBS Checks" : "Background Checks";
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  return (
    <Section
      title={title}
      action={canEdit ? <AddButton label="Add check" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      {rows.length === 0 ? (
        <Empty label="No checks on file." />
      ) : (
      <div className="flex flex-col gap-3">
        {rows.map((c) => {
          const d = daysUntil(c.expiryDate);
          const due = d != null && d <= 60;
          return (
            <Card key={c.id}>
              <CardContent className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {c.type}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {c.certificateNumber}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Issued {fmtDate(c.issuedDate)} · Expires {fmtDate(c.expiryDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {due && (
                    <Pill className="gap-1 border-rose-500/30 bg-rose-500/10 text-rose-600">
                      <AlertTriangle className="w-3 h-3" /> Renew in {d}d
                    </Pill>
                  )}
                  <StatusBadge status={c.status} />
                  {canEdit && <EditButton onClick={() => rf.openEdit(c)} />}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}
    </Section>
  );
}

// ── Expenses ────────────────────────────────────────────────────────────────
export function ExpensesModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeExpenses(employeeId);
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  const fmt = (amount: number, currency: string) =>
    `${currency} ${amount.toLocaleString()}`;
  const pending = rows.filter((e) => e.status === "submitted");
  const reimbursed = rows.filter((e) => e.status === "reimbursed");
  const pendingTotal = pending.reduce((s, e) => s + e.amount, 0);
  const currency = rows[0]?.currency ?? "";
  return (
    <Section title="Expenses">
      {rows.length === 0 ? (
        <Empty label="No expense claims on record." />
      ) : (
        <div className="flex flex-col gap-4">
          <StatStrip
            items={[
              { label: "Total claims", value: rows.length },
              {
                label: "Pending approval",
                value: pending.length,
                accent: "text-amber-600",
              },
              {
                label: "Pending amount",
                value: fmt(pendingTotal, currency),
              },
              {
                label: "Reimbursed",
                value: reimbursed.length,
                accent: "text-emerald-600",
              },
            ]}
          />
          <DataTable
            columns={["Date", "Description", "Category", "Amount", "Status"]}
          >
            {rows.map((e) => (
              <Row key={e.id}>
                <Cell className="whitespace-nowrap text-muted-foreground">
                  {fmtDate(e.date)}
                </Cell>
                <Cell>{e.description}</Cell>
                <Cell className="capitalize">{e.category}</Cell>
                <Cell className="whitespace-nowrap font-medium tabular-nums">
                  {fmt(e.amount, e.currency)}
                </Cell>
                <Cell>
                  <StatusBadge status={e.status} />
                </Cell>
              </Row>
            ))}
          </DataTable>
        </div>
      )}
    </Section>
  );
}

// ── Disciplinaries (sensitive) ──────────────────────────────────────────────
export function DisciplinariesModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeDisciplinaries(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.disciplinaries, employeeId);
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  return (
    <Section
      title="Disciplinaries"
      action={canEdit ? <AddButton label="Add record" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      {rows.length === 0 ? (
        <Empty label="No disciplinary records — clean history." />
      ) : (
        <DataTable columns={["Date", "Type", "Reason", "Issued by", "Outcome", "Status", "Doc", ...(canEdit ? [""] : [])]}>
          {rows.map((d) => (
            <Row key={d.id}>
              <Cell>{fmtDate(d.date)}</Cell>
              <Cell>{titleCase(d.type)}</Cell>
              <Cell>{d.reason}</Cell>
              <Cell>{d.issuedBy}</Cell>
              <Cell>{d.outcome}</Cell>
              <Cell><StatusBadge status={d.status} /></Cell>
              <Cell><span className="cursor-not-allowed text-muted-foreground/60" title="File not available in this demo">View</span></Cell>
              {canEdit && <Cell><EditButton onClick={() => rf.openEdit(d)} /></Cell>}
            </Row>
          ))}
        </DataTable>
      )}
    </Section>
  );
}


// ── Emergency contacts ──────────────────────────────────────────────────────
export function EmergencyContactModule({ employeeId, employee }: ModuleProps) {
  return (
    <Section title="Emergency Contact" description="Edit a contact or fill the spare slot to add one.">
      <ProfileFieldsEditor
        employee={employee}
        employeeId={employeeId}
        mode="edit"
        groups={["emergency"]}
        bulkEditLabel="Emergency Contact"
      />
    </Section>
  );
}

// ── Assigned assets ─────────────────────────────────────────────────────────
export function AssetsModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeAssets(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.assets, employeeId);
  const [assignOpen, setAssignOpen] = React.useState(false);
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  return (
    <Section
      title="Assigned Assets"
      action={canEdit ? <AddButton label="Assign asset" onClick={() => setAssignOpen(true)} /> : undefined}
    >
      {rf.node}
      <AssignAssetModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        employeeId={employeeId}
      />
      {rows.length === 0 ? (
        <Empty label="No assets assigned." />
      ) : (
        <DataTable columns={["Tag", "Name", "Category", "Serial", "Assigned", "Condition", "Value", ...(canEdit ? [""] : [])]}>
          {rows.map((a) => (
            <Row key={a.id}>
              <Cell className="font-mono text-xs">{a.assetTag}</Cell>
              <Cell>{a.name}</Cell>
              <Cell>{titleCase(a.category)}</Cell>
              <Cell className="font-mono text-xs">{a.serialNumber ?? "—"}</Cell>
              <Cell>{fmtDate(a.assignedDate)}</Cell>
              <Cell>{titleCase(a.condition)}</Cell>
              <Cell>{money(a.value)}</Cell>
              {canEdit && <Cell><EditButton onClick={() => rf.openEdit(a)} /></Cell>}
            </Row>
          ))}
        </DataTable>
      )}
    </Section>
  );
}

// ── Payslips ────────────────────────────────────────────────────────────────
export function PayslipsModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeePayslips(employeeId);
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  const ytdGross = rows.reduce((s, p) => s + p.gross, 0);
  const ytdDeductions = rows.reduce((s, p) => s + p.deductions, 0);
  const ytdNet = rows.reduce((s, p) => s + p.net, 0);
  const latestNet = rows[0]?.net ?? null;
  return (
    <Section
      title="Payslips"
      description="Monthly payslips generated from the employee's salary."
    >
      {rows.length === 0 ? (
        <Empty label="No payslips available." />
      ) : (
        <div className="flex flex-col gap-4">
          <StatStrip
            items={[
              { label: `Gross (last ${rows.length} mo)`, value: money(ytdGross) },
              { label: "Total deductions", value: money(ytdDeductions), accent: "text-amber-600" },
              { label: "Net paid", value: money(ytdNet), accent: "text-emerald-600" },
              { label: "Latest net", value: money(latestNet) },
            ]}
          />
        <DataTable columns={["Period", "Gross", "Deductions", "Net", "Paid", ""]}>
          {rows.map((p) => (
            <Row key={p.id}>
              <Cell>{p.period}</Cell>
              <Cell>{money(p.gross)}</Cell>
              <Cell>{money(p.deductions)}</Cell>
              <Cell className="font-semibold">{money(p.net)}</Cell>
              <Cell>{fmtDate(p.paidDate)}</Cell>
              <Cell>
                <a
                  href={p.downloadUrl}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Download
                </a>
              </Cell>
            </Row>
          ))}
        </DataTable>
        </div>
      )}
    </Section>
  );
}

// ── Grievances (sensitive) ──────────────────────────────────────────────────
export function GrievancesModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeGrievances(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.grievances, employeeId);
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  return (
    <Section
      title="Grievances"
      description="Restricted — HR only."
      action={canEdit ? <AddButton label="Log grievance" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      {rows.length === 0 ? (
        <Empty label="No grievances." />
      ) : (
        <DataTable columns={["Opened", "Category", "Severity", "Summary", "Status", ...(canEdit ? [""] : [])]}>
          {rows.map((g) => (
            <Row key={g.id}>
              <Cell>{fmtDate(g.openedAt)}</Cell>
              <Cell>{g.category}</Cell>
              <Cell>{titleCase(g.severity)}</Cell>
              <Cell>{g.summary}</Cell>
              <Cell><StatusBadge status={g.status} /></Cell>
              {canEdit && <Cell><EditButton onClick={() => rf.openEdit(g)} /></Cell>}
            </Row>
          ))}
        </DataTable>
      )}
    </Section>
  );
}

// ── History ─────────────────────────────────────────────────────────────────
export function HistoryModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeHistory(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.employmentHistory, employeeId);
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  return (
    <Section
      title="Employment History"
      action={canEdit ? <AddButton label="Add event" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      {rows.length === 0 ? (
        <Empty label="No history." />
      ) : (
        <ol className="relative border-l border-border ml-2 flex flex-col gap-4 pl-5 pt-1">
          {rows.map((h) => (
            <li key={h.id} className="relative">
              <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-primary/70 ring-4 ring-background" />
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{titleCase(h.type)}</p>
                {canEdit && <EditButton onClick={() => rf.openEdit(h)} />}
              </div>
              <p className="text-xs text-muted-foreground">
                {fmtDate(h.date)} · {h.from ? `${h.from} → ` : ""}{h.to ?? ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{h.reason}</p>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}


// ── Jobs ──────────────────────────────────────────────────────────────────--
export function JobsModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeJobs(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.jobPostings, employeeId);
  if (loading && !data) return <LoadingPanel />;
  if (!data) return <Empty />;
  return (
    <Section
      title="Jobs"
      description="Postings this employee owns + their internal moves."
      action={canEdit ? <AddButton label="Add posting" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hiring for</p>
        {data.postings.length === 0 ? (
          <Empty label="Not a hiring manager on any open role." />
        ) : (
          <DataTable columns={["Title", "Location", "Type", "Status", "Posted", "Closes", ...(canEdit ? [""] : [])]}>
            {data.postings.map((j) => (
              <Row key={j.id}>
                <Cell>{j.title}</Cell>
                <Cell>{j.location ?? "—"}</Cell>
                <Cell>{titleCase(j.employmentType)}</Cell>
                <Cell><StatusBadge status={j.status} /></Cell>
                <Cell>{fmtDate(j.postedAt)}</Cell>
                <Cell>{fmtDate(j.closingDate)}</Cell>
                {canEdit && <Cell><EditButton onClick={() => rf.openEdit(j)} /></Cell>}
              </Row>
            ))}
          </DataTable>
        )}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-2">Internal moves</p>
        {data.history.filter((h) => h.type !== "hired").length === 0 ? (
          <Empty label="No internal role changes." />
        ) : (
          <DataTable columns={["Date", "Change", "From", "To"]}>
            {data.history
              .filter((h) => h.type !== "hired")
              .map((h) => (
                <Row key={h.id}>
                  <Cell>{fmtDate(h.date)}</Cell>
                  <Cell>{titleCase(h.type)}</Cell>
                  <Cell>{h.from ?? "—"}</Cell>
                  <Cell>{h.to ?? "—"}</Cell>
                </Row>
              ))}
          </DataTable>
        )}
      </div>
    </Section>
  );
}

// ── Kudos ─────────────────────────────────────────────────────────────────--
export function KudosModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeKudos(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.kudos, employeeId);
  if (loading && !data) return <LoadingPanel />;
  if (!data) return <Empty />;
  const list = (items: typeof data.received, dir: "received" | "given") =>
    items.length === 0 ? (
      <Empty label={`No kudos ${dir}.`} />
    ) : (
      <div className="flex flex-col gap-2">
        {items.map((k) => (
          <Card key={k.id}>
            <CardContent className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-foreground">
                  {dir === "received" ? `From ${k.fromName}` : `To ${k.toName}`}
                </p>
                <div className="flex items-center gap-1">
                  <Pill className="border-primary/30 bg-primary/10 text-primary">{k.value}</Pill>
                  {canEdit && <EditButton onClick={() => rf.openEdit(k)} />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{k.message}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {fmtDate(k.createdAt)} · {k.reactions} reactions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  return (
    <Section
      title="Kudos"
      action={canEdit ? <AddButton label="Add kudos" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">Received ({data.received.length})</TabsTrigger>
          <TabsTrigger value="given">Given ({data.given.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="mt-4">{list(data.received, "received")}</TabsContent>
        <TabsContent value="given" className="mt-4">{list(data.given, "given")}</TabsContent>
      </Tabs>
    </Section>
  );
}

// ── Location bookings ───────────────────────────────────────────────────────
export function BookingsModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeBookings(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.locationBookings, employeeId);
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  return (
    <Section
      title="Location Bookings"
      action={canEdit ? <AddButton label="Add booking" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      {rows.length === 0 ? (
        <Empty label="No bookings." />
      ) : (
        <DataTable columns={["Date", "Type", "Location", "Time", "Status", ...(canEdit ? [""] : [])]}>
          {rows.map((b) => (
            <Row key={b.id}>
              <Cell>{fmtDate(b.date)}</Cell>
              <Cell>{titleCase(b.locationType)}</Cell>
              <Cell>{b.locationName}</Cell>
              <Cell>{b.startTime}–{b.endTime}</Cell>
              <Cell><StatusBadge status={b.status} /></Cell>
              {canEdit && <Cell><EditButton onClick={() => rf.openEdit(b)} /></Cell>}
            </Row>
          ))}
        </DataTable>
      )}
    </Section>
  );
}

// ── Medical facts (sensitive) ───────────────────────────────────────────────
export function MedicalModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeMedical(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.medicalFacts, employeeId);
  if (loading && !data) return <LoadingPanel />;
  if (!data)
    return <Section title="Medical Facts"><Empty label="No medical facts on file." /></Section>;
  const list = (v: unknown) =>
    Array.isArray(v) ? (v.length ? v.join(", ") : "None") : v ? String(v) : "None";
  return (
    <Section
      title="Medical Facts"
      description="Sensitive — HR only."
      action={canEdit ? <AddButton label="Edit" onClick={() => rf.openEdit(data)} /> : undefined}
    >
      {rf.node}
      <InfoGrid
        rows={[
          { label: "Allergies", value: list(data.allergies) },
          { label: "Conditions", value: list(data.conditions) },
          { label: "Medications", value: list(data.medications) },
          { label: "Dietary", value: list(data.dietaryRequirements) },
          { label: "Accessibility", value: data.accessibilityNeeds || "None" },
          {
            label: "Doctor",
            value: `${data.doctorContact.name} · ${data.doctorContact.phone} · ${data.doctorContact.practice}`,
          },
        ]}
      />
    </Section>
  );
}

// ── Notes & reminders (sensitive) ───────────────────────────────────────────
export function NotesModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeNotes(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.employeeNotes, employeeId);
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  return (
    <Section
      title="Notes & Reminders"
      description="HR private notes."
      action={canEdit ? <AddButton label="Add note" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      {rows.length === 0 ? (
        <Empty label="No notes." />
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((n) => (
            <Card key={n.id}>
              <CardContent className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {n.pinned && <Pin className="w-3 h-3 text-amber-500" />}
                  <Pill className="border-border bg-muted text-muted-foreground">{titleCase(n.type)}</Pill>
                  <Pill className="border-border bg-muted text-muted-foreground">{titleCase(n.visibility)}</Pill>
                  <span className="text-[11px] text-muted-foreground ml-auto">{fmtDate(n.createdAt)}</span>
                  {canEdit && <EditButton onClick={() => rf.openEdit(n)} />}
                </div>
                <p className="text-sm text-foreground mt-1.5">{n.body}</p>
                {n.type === "reminder" && n.remindAt && (
                  <p className="text-[11px] text-amber-600 mt-1">Remind: {fmtDate(n.remindAt)}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── Pay ───────────────────────────────────────────────────────────────────--
export function PayModule({ employeeId, employee }: ModuleProps) {
  const { data, loading } = useEmployeePay(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.payHistory, employeeId);
  if (loading && !data) return <LoadingPanel />;
  if (!data) return <Empty />;
  const bank = employee.bankDetails ?? {};
  return (
    <Section
      title="Pay"
      action={canEdit ? <AddButton label="Add pay change" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      <StatStrip
        items={[
          { label: "Current salary", value: money(data.current?.amount), accent: "text-emerald-600" },
          { label: "Period", value: titleCase(data.current?.period) },
          { label: "Changes", value: data.history.length },
          { label: "Bonuses", value: data.bonuses.length },
        ]}
      />
      <InfoGrid
        rows={[
          { label: "Bank name", value: bank.bankName },
          { label: "Account name", value: bank.accountName },
          { label: "Account number", value: bank.accountNumber },
          { label: "Sort code", value: bank.sortCode },
        ]}
      />
      {data.history.length === 0 ? (
        <Empty label="No pay history." />
      ) : (
        <DataTable columns={["Effective", "Type", "Previous", "New", "Reason", "Approved by", ...(canEdit ? [""] : [])]}>
          {data.history.map((p) => (
            <Row key={p.id}>
              <Cell>{fmtDate(p.effectiveDate)}</Cell>
              <Cell>{titleCase(p.changeType)}</Cell>
              <Cell>{money(p.previousAmount)}</Cell>
              <Cell className="font-semibold">{money(p.newAmount)}</Cell>
              <Cell>{p.reason}</Cell>
              <Cell>{p.approvedBy}</Cell>
              {canEdit && <Cell><EditButton onClick={() => rf.openEdit(p)} /></Cell>}
            </Row>
          ))}
        </DataTable>
      )}
    </Section>
  );
}

// ── Permissions ─────────────────────────────────────────────────────────────
export function PermissionsModule({ employeeId }: ModuleProps) {
  const rows = useEmployeePermissions(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.permissions, employeeId);
  const mark = (b: boolean) =>
    b ? <span className="text-emerald-600">✓</span> : <span className="text-muted-foreground/40">—</span>;
  return (
    <Section title="Permissions" description="Effective access resolved from the employee's role — override per module.">
      {rf.node}
      <DataTable columns={["Module", "View", "Create", "Edit", "Delete", "Approve", ...(canEdit ? [""] : [])]}>
        {rows.map((r) => (
          <Row key={r.module}>
            <Cell>{r.label}</Cell>
            <Cell>{mark(r.view)}</Cell>
            <Cell>{mark(r.create)}</Cell>
            <Cell>{mark(r.edit)}</Cell>
            <Cell>{mark(r.delete)}</Cell>
            <Cell>{mark(r.approve)}</Cell>
            {canEdit && <Cell><EditButton onClick={() => rf.openEdit(r)} /></Cell>}
          </Row>
        ))}
      </DataTable>
    </Section>
  );
}

// ── Tasks (My Tasks: Ongoing / Completed) ───────────────────────────────────-
export function TasksModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeTasks(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.tasks, employeeId);
  if (loading && !data) return <LoadingPanel />;
  const rows = data ?? [];
  const ongoing = rows.filter((t) => t.status !== "done");
  const completed = rows.filter((t) => t.status === "done");

  const renderTable = (list: typeof rows, emptyLabel: string) =>
    list.length === 0 ? (
      <Empty label={emptyLabel} />
    ) : (
      <DataTable columns={["Task", "Due", "Priority", "Linked", "Status", ...(canEdit ? [""] : [])]}>
        {list.map((t) => (
          <Row key={t.id}>
            <Cell>{t.title}</Cell>
            <Cell>{fmtDate(t.dueDate)}</Cell>
            <Cell>{titleCase(t.priority)}</Cell>
            <Cell>{t.linkedTo ? titleCase(t.linkedTo) : "—"}</Cell>
            <Cell><StatusBadge status={t.status} /></Cell>
            {canEdit && <Cell><EditButton onClick={() => rf.openEdit(t)} /></Cell>}
          </Row>
        ))}
      </DataTable>
    );

  return (
    <Section
      title="My Tasks"
      action={canEdit ? <AddButton label="Add task" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      <Tabs defaultValue="ongoing">
        <TabsList>
          <TabsTrigger value="ongoing">Ongoing ({ongoing.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="ongoing" className="mt-4">
          {renderTable(ongoing, "No ongoing tasks.")}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {renderTable(completed, "No completed tasks.")}
        </TabsContent>
      </Tabs>
    </Section>
  );
}

// ── Time logs ───────────────────────────────────────────────────────────────
export function TimeLogsModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeTimeLogs(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.attendance, employeeId);
  if (loading && !data) return <LoadingPanel />;
  if (!data) return <Empty />;
  return (
    <Section
      title="Time Logs"
      description="Last 30 days."
      action={canEdit ? <AddButton label="Add log" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      <StatStrip
        items={[
          { label: "Hours (30d)", value: data.summary.monthlyHours },
          { label: "Present", value: data.summary.daysPresent },
          { label: "Late", value: data.summary.daysLate },
          { label: "Absent", value: data.summary.daysAbsent },
        ]}
      />
      {data.records.length === 0 ? (
        <Empty label="No attendance in the last 30 days." />
      ) : (
        <DataTable columns={["Date", "Clock in", "Clock out", "Hours", "Status", "Location", ...(canEdit ? [""] : [])]}>
          {data.records.map((r) => (
            <Row key={r.id}>
              <Cell>{fmtDate(r.date)}</Cell>
              <Cell>{r.clockIn ?? "—"}</Cell>
              <Cell>{r.clockOut ?? "—"}</Cell>
              <Cell>{r.hoursWorked ?? "—"}</Cell>
              <Cell><StatusBadge status={r.status} /></Cell>
              <Cell>{r.location ?? "—"}</Cell>
              {canEdit && <Cell><EditButton onClick={() => rf.openEdit(r)} /></Cell>}
            </Row>
          ))}
        </DataTable>
      )}
    </Section>
  );
}

// ── Work pattern & holiday allowance ────────────────────────────────────────
const WORK_PATTERN_DAYS: ReadonlyArray<readonly [string, string]> = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
  ["sat", "Saturday"],
  ["sun", "Sunday"],
];

const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

/**
 * Paid hours for one day: the start→end span minus the unpaid break (§A1).
 * A 09:00–17:30 day with a 60-minute lunch is 7.5 paid hours, not 8.5 — the
 * break has its own column, so Hours reads as the figure that reconciles.
 */
function scheduleHours(
  slot?: { start: string; end: string } | null,
  breakMinutes = 0,
): number | null {
  if (!slot?.start || !slot?.end) return null;
  const mins = toMinutes(slot.end) - toMinutes(slot.start) - breakMinutes;
  return mins > 0 ? Math.round((mins / 60) * 10) / 10 : null;
}

/** "1 hour" / "30 minutes" / "1 hour 30 minutes" — for the break note (§A2). */
function formatBreak(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} minutes`);
  return parts.join(" ");
}

const DAY_KEY_BY_INDEX = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * Weekly schedule (§13.3, reworked for §A1–A3/A7/A8).
 *
 * Day / Start / End / Unpaid Lunch / Hours — the break gets a column of its own
 * rather than a parenthetical hanging off the times, and Hours is the paid
 * figure after it. Non-working days show dashes and "Off", today's row is
 * marked, and the footer asserts the total against the contracted weekly figure
 * so the two can never silently disagree. Below `sm` it becomes a card stack.
 */
function WorkScheduleTable({
  schedule,
  breakMinutes = 0,
  weeklyHours,
}: {
  schedule: Record<string, { start: string; end: string } | null>;
  breakMinutes?: number;
  weeklyHours?: number;
}) {
  const todayKey = DAY_KEY_BY_INDEX[new Date().getDay()];

  // The break reads as a column of its own; only a worked day loses one.
  const breakText = breakMinutes > 0 ? formatBreak(breakMinutes) : null;

  const days = WORK_PATTERN_DAYS.map(([key, label]) => {
    const slot = schedule[key];
    const hrs = scheduleHours(slot, breakMinutes);
    const off = !slot || hrs == null;
    return { key, label, slot, hrs, off, isToday: key === todayKey };
  });

  const total = Math.round(days.reduce((s, d) => s + (d.hrs ?? 0), 0) * 10) / 10;
  const contracted = weeklyHours;
  const reconciles = contracted == null || Math.abs(total - contracted) < 0.05;

  return (
    <div className="flex flex-col gap-2">
      {/* Table — sm and up */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Weekly working pattern: start time, end time, unpaid break and paid hours
            for each day of the week. Paid hours are the figure after the break has
            been deducted.
          </caption>
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Day", "Start", "End", "Break", "Paid Hours"].map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={cn(
                    "px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
                    i === 0 ? "text-left" : "text-right",
                  )}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr
                key={d.key}
                className={cn(
                  "border-b border-border/50 last:border-0",
                  d.isToday && "bg-primary/5",
                )}
              >
                <th
                  scope="row"
                  className="px-3 py-2 text-left align-top text-sm font-medium text-foreground"
                >
                  <span className="flex items-center gap-2">
                    {d.label}
                    {d.isToday && (
                      <Pill className="border-primary/30 bg-primary/10 text-primary">Today</Pill>
                    )}
                  </span>
                </th>
                <Cell
                  className={cn(
                    "text-right tabular-nums",
                    d.off && "text-muted-foreground/50",
                  )}
                >
                  {d.off ? "—" : d.slot!.start}
                </Cell>
                <Cell
                  className={cn(
                    "text-right tabular-nums",
                    d.off && "text-muted-foreground/50",
                  )}
                >
                  {d.off ? "—" : d.slot!.end}
                </Cell>
                <Cell
                  className={cn(
                    "text-right",
                    d.off || !breakText ? "text-muted-foreground/50" : "text-muted-foreground",
                  )}
                >
                  {d.off || !breakText ? "—" : breakText}
                </Cell>
                <Cell
                  className={cn(
                    "text-right",
                    d.off ? "text-muted-foreground" : "font-medium tabular-nums",
                  )}
                >
                  {d.off ? "Off" : d.hrs}
                </Cell>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <th scope="row" className="px-3 py-2 text-left text-sm font-semibold text-foreground">
                Total contracted
              </th>
              <Cell className="text-xs text-muted-foreground" colSpan={3}>
                {contracted != null &&
                  (reconciles
                    ? `Matches the ${contracted}-hour weekly contract`
                    : `Does not match the ${contracted}-hour weekly contract`)}
              </Cell>
              <Cell className="font-semibold tabular-nums">
                <span className="flex items-center justify-end gap-1.5">
                  {total}
                  {contracted != null &&
                    (reconciles ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" aria-label="Reconciled" />
                    ) : (
                      <TriangleAlert className="w-3.5 h-3.5 text-amber-600" aria-hidden />
                    ))}
                </span>
              </Cell>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Card stack — below sm (§A8) */}
      <ul className="sm:hidden flex flex-col gap-2">
        {days.map((d) => (
          <li
            key={d.key}
            className={cn(
              "rounded-xl border border-border px-3 py-2.5",
              d.isToday && "border-primary/40 bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                {d.label}
                {d.isToday && (
                  <Pill className="border-primary/30 bg-primary/10 text-primary">Today</Pill>
                )}
              </span>
              <span
                className={cn(
                  "text-sm tabular-nums",
                  d.off ? "text-muted-foreground" : "font-semibold text-foreground",
                )}
              >
                {d.off ? "Off" : `${d.hrs} hrs`}
              </span>
            </div>
            {!d.off && (
              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                {d.slot!.start}–{d.slot!.end}
              </p>
            )}
            {!d.off && breakText && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Break: {breakText}
              </p>
            )}
          </li>
        ))}
        <li className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">Total contracted</span>
          <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-foreground">
            {total} hrs
            {contracted != null &&
              (reconciles ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" aria-label="Reconciled" />
              ) : (
                <TriangleAlert className="w-3.5 h-3.5 text-amber-600" aria-hidden />
              ))}
          </span>
        </li>
      </ul>

      {contracted != null && !reconciles && (
        <p className="flex items-start gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <TriangleAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            The daily schedule totals <strong>{total} hours</strong> but the contract records{" "}
            <strong>{contracted} hours</strong> a week. Check the start/end times and the unpaid
            break before relying on either figure.
          </span>
        </p>
      )}
    </div>
  );
}

export function WorkPatternModule({ employeeId, employee }: ModuleProps) {
  const wp = employee.workPattern;
  const { data: leave } = useEmployeeLeave(employeeId);
  // Annual-leave policy drives the holiday breakdown (§13.4).
  const annualRow = leave?.rows.find((r) => /annual|holiday/i.test(r.policyName));
  const holidayEntitlement = annualRow?.entitlement ?? wp?.holidayEntitlementDays ?? 0;
  const holidayTaken = annualRow?.taken ?? 0;
  const holidayBooked = annualRow?.booked ?? 0;
  const holidayCarryOver = annualRow?.carryOver ?? 0;
  const holidayRemaining = annualRow?.remaining ?? holidayEntitlement - holidayTaken;
  const holidayAvailable = annualRow?.available ?? holidayRemaining - holidayBooked;
  const treatment = wp?.publicHolidayTreatment ?? "in_addition";
  const treatmentNote =
    treatment === "included"
      ? "included in annual leave"
      : "in addition to annual leave";
  return (
    <Section
      title="Work Pattern & Holiday Allowance"
      description="View and manage an employee's working pattern, contracted hours and holiday entitlement."
    >
      {wp && (
        <StatStrip
          items={[
            { label: "Weekly Hours", value: wp.weeklyHours },
            { label: "Working Days per Week", value: wp.daysPerWeek },
            { label: "Contract Type", value: employmentTypeLabel(wp.contractType) },
          ]}
        />
      )}
      {wp?.schedule && (
        <WorkScheduleTable
          schedule={wp.schedule}
          breakMinutes={wp.breakMinutes ?? 0}
          weeklyHours={wp.weeklyHours}
        />
      )}
      {wp && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">Holiday Allowance</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Annual Entitlement", value: `${holidayEntitlement} Days` },
              { label: "Carried Over", value: `${holidayCarryOver} Days` },
              { label: "Booked", value: `${holidayBooked} Days` },
              { label: "Taken", value: `${holidayTaken} Days` },
              {
                label: "Remaining",
                value: `${holidayRemaining} Days`,
                note: `${holidayAvailable} still bookable`,
              },
              {
                label: "Public Holidays",
                value: `${wp.publicHolidayDays} Days`,
                note: treatmentNote,
              },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-lg font-bold tabular-nums text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
                {s.note && (
                  <p className="text-[10px] text-muted-foreground/80">({s.note})</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <ProfileFieldsEditor
        employee={employee}
        employeeId={employeeId}
        mode="edit"
        groups={["work"]}
        bulkEditLabel="Work Pattern"
      />
    </Section>
  );
}

"use client";

import * as React from "react";
import { AlertTriangle, Pin, ChevronRight } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { OverflowTabsList } from "@/src/components/shared/overflow-tabs";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { formatMoneyLocale } from "@/src/lib/hooks/use-currency";
import { useAppSelector } from "@/src/lib/stores/hooks";
import {
  ProfileFieldsEditor,
  ChangeRequestsTable,
} from "@/src/components/shared/profile-fields";
import {
  useRecordForm,
  AddButton,
  EditButton,
} from "@/src/components/shared/profile-fields/record-form";
import { COLLECTION_SCHEMAS } from "@/src/lib/profile/collections";
import { regionWordForCountry } from "@/src/lib/profile/fields";
import { useCan } from "@/src/lib/permissions/use-can";
import { useProfileVariant } from "./variant";
import { LeaveRequestPanel } from "@/src/components/employee/leave-request/panel";
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
} from "./ui";
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
            bulkEditLabel="Address"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Profile (sub-tabs) ───────────────────────────────────────────────────────
export function ProfileModule({ employeeId, employee }: ModuleProps) {
  const variant = useProfileVariant();
  const actorName = useAppSelector((s) => s.auth.user?.name) ?? "HR";
  const requests = useAppSelector((s) =>
    s.profileEdits.requests.filter((r) => r.employeeId === employeeId),
  );
  const pending = requests.filter((r) => r.status === "pending").length;
  const [tab, setTab] = React.useState("details");
  const editor = (
    groups: Parameters<typeof ProfileFieldsEditor>[0]["groups"],
    bulkEditLabel: string,
  ) => (
    <ProfileFieldsEditor
      employee={employee}
      employeeId={employeeId}
      mode={variant.mode}
      groups={groups}
      bulkEditLabel={bulkEditLabel}
    />
  );
  return (
    <Section title="Profile">
      <Tabs value={tab} onValueChange={setTab}>
        <OverflowTabsList
          value={tab}
          onValueChange={setTab}
          tabs={[
            { value: "details", label: "Details" },
            { value: "contact", label: "Contact" },
            { value: "address", label: "Address" },
            { value: "bank", label: "Bank" },
            {
              value: "requests",
              label: `My Requests${pending > 0 ? ` (${pending})` : ""}`,
            },
          ]}
        />

        <TabsContent value="details" className="mt-4">
          {editor(["personal"], "Details")}
        </TabsContent>
        <TabsContent value="contact" className="mt-4">
          {editor(["contact"], "Contact")}
        </TabsContent>
        <TabsContent value="address" className="mt-4">
          <AddressTabContent
            employee={employee}
            employeeId={employeeId}
            mode={variant.mode}
          />
        </TabsContent>
        <TabsContent value="bank" className="mt-4">
          {editor(["bank"], "Bank")}
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          <ChangeRequestsTable requests={requests} audience={variant.audience} actorName={actorName} />
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
      <Section title="Leave">
        <LeaveRequestPanel />
      </Section>
    );
  }
  return <HrLeaveSummary employeeId={employeeId} employee={employee} />;
}

// HR view: read-only leave balances & history for the viewed employee.
function HrLeaveSummary({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeLeave(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rfReq = useRecordForm(COLLECTION_SCHEMAS.leaveRequests, employeeId);
  const rfAdj = useRecordForm(COLLECTION_SCHEMAS.leaveAdjustments, employeeId);
  if (loading && !data) return <LoadingPanel />;
  if (!data) return <Empty />;
  const totalRemaining = data.rows.reduce((s, r) => s + r.remaining, 0);
  const totalTaken = data.rows.reduce((s, r) => s + r.taken, 0);
  const totalBooked = data.rows.reduce((s, r) => s + r.booked, 0);
  return (
    <Section
      title="Leave"
      action={canEdit ? <AddButton label="Add leave" onClick={rfReq.openCreate} /> : undefined}
    >
      {rfReq.node}
      {rfAdj.node}
      <StatStrip
        items={[
          { label: "Remaining (all)", value: totalRemaining, accent: "text-emerald-600" },
          { label: "Booked", value: totalBooked },
          { label: "Taken", value: totalTaken },
        ]}
      />
      <DataTable columns={["Policy", "Allowance", "Adjustments", "Booked", "Taken", "Remaining"]}>
        {data.rows.map((r) => (
          <Row key={r.policyId}>
            <Cell>{r.policyName}</Cell>
            <Cell>{r.allowance}</Cell>
            <Cell>{r.adjustments > 0 ? `+${r.adjustments}` : r.adjustments}</Cell>
            <Cell>{r.booked}</Cell>
            <Cell>{r.taken}</Cell>
            <Cell className="font-semibold">{r.remaining}</Cell>
          </Row>
        ))}
      </DataTable>
      <Tabs defaultValue="booked">
        <TabsList>
          <TabsTrigger value="booked">Booked</TabsTrigger>
          <TabsTrigger value="taken">Taken</TabsTrigger>
          <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>
        <TabsContent value="booked" className="mt-4">
          {data.booked.length === 0 ? (
            <Empty label="No upcoming booked leave." />
          ) : (
            <DataTable columns={["Type", "From", "To", "Days", "Status"]}>
              {data.booked.map((r) => (
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
          {data.taken.length === 0 ? (
            <Empty label="No leave taken yet." />
          ) : (
            <DataTable columns={["Type", "From", "To", "Days", "Status"]}>
              {data.taken.map((r) => (
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
            <Empty label="No manual adjustments." />
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
        <TabsContent value="usage" className="mt-4">
          {data.usage.length === 0 ? (
            <Empty label="No usage recorded." />
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
export function SicknessModule({ employeeId }: ModuleProps) {
  const { data, loading } = useEmployeeSickness(employeeId);
  if (loading && !data) return <LoadingPanel />;
  if (!data) return <Empty />;
  return (
    <Section title="Sickness" description="Sick-leave absences and Bradford Factor.">
      <StatStrip
        items={[
          { label: "Sick days (yr)", value: data.summary.totalDaysThisYear },
          { label: "Episodes", value: data.summary.episodes },
          { label: "Longest absence", value: `${data.summary.longestAbsenceDays}` },
          {
            label: "Bradford Factor",
            value: data.summary.bradfordFactor,
            accent: data.summary.bradfordFactor >= 100 ? "text-rose-600" : undefined,
          },
        ]}
      />
      {data.records.length === 0 ? (
        <Empty label="No sickness records." />
      ) : (
        <DataTable columns={["From", "To", "Days", "Reason", "Status"]}>
          {data.records.map((r) => (
            <Row key={r.id}>
              <Cell>{fmtDate(r.startDate)}</Cell>
              <Cell>{fmtDate(r.endDate)}</Cell>
              <Cell>{r.days}</Cell>
              <Cell>{r.reason ?? "—"}</Cell>
              <Cell><StatusBadge status={r.status} /></Cell>
            </Row>
          ))}
        </DataTable>
      )}
    </Section>
  );
}

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
export function WorkPatternModule({ employeeId, employee }: ModuleProps) {
  const wp = employee.workPattern;
  return (
    <Section title="Work Pattern & Holiday Allowance">
      {wp && (
        <StatStrip
          items={[
            { label: "Weekly hours", value: wp.weeklyHours },
            { label: "Days/week", value: wp.daysPerWeek },
            { label: "Holiday days", value: wp.holidayEntitlementDays },
            { label: "Public holidays", value: wp.publicHolidayDays },
            { label: "Contract", value: titleCase(wp.contractType) },
          ]}
        />
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

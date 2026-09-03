"use client";

import { useMemo } from "react";
// The detail page is about one named person, so it must resolve even when the
// navbar is scoped to a different branch — every read here is unscoped.
import { useUnscopedLocaleSection as useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { applyEmployeeOverrides } from "@/src/lib/profile/overrides";
import { applyCollection } from "@/src/lib/profile/collection-edits";
import { ALL_MODULES, MODULE_LABELS } from "@/src/lib/permissions/modules";
import {
  activeLeaveFromBundle,
  type ActiveLeave,
} from "@/src/lib/utils/active-leave";
import type { PermissionAction } from "@/src/lib/types/access-levels";
import type {
  LocaleBundle,
  LocaleEmployee,
  LocaleTenant,
  LocaleLeaveAdjustment,
  LocaleDbsCheck,
  LocaleDisciplinary,
  LocaleEmploymentEvent,
  LocaleLocationBooking,
  LocaleMedicalFacts,
  LocaleEmployeeNote,
  LocalePayChange,
  LocaleExpense,
} from "@/src/lib/types/locale";
import type {
  EmployeeStats,
  LeaveSummaryRow,
  SicknessSummary,
  TimeLogsSummary,
  LeaveUsageBucket,
  EffectivePermissionRow,
} from "@/src/lib/types/employee-detail";

// ── loose-collection raw shapes ─────────────────────────────────────────────
interface RawLeaveRequest {
  id: string;
  employeeId: string;
  leavePolicyId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: string;
  approverId?: string;
  submittedAt?: string;
}
interface RawLeavePolicy {
  id: string;
  name: string;
  defaultDays?: number;
  carryOverDays?: number;
}
interface RawLeaveBalance {
  employeeId: string;
  leavePolicyId: string;
  entitlement: number;
  used: number;
  pending: number;
  remaining: number;
  year?: number;
}
interface RawAttendance {
  id: string;
  employeeId: string;
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
  hoursWorked?: number;
  status: string;
  location?: string;
  source?: string;
}
export interface RawAsset {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  serialNumber?: string;
  value?: number;
  currency?: string;
  condition?: string;
  assignedTo?: string | null;
  assignedDate?: string;
  status?: string;
}
export interface RawDocument {
  id: string;
  employeeId: string;
  category: string;
  name: string;
  fileUrl: string;
  uploadedAt: string;
  expiresAt?: string | null;
  kyc?: boolean;
  status?: string;
  issuer?: string | null;
  /** Why HR could not accept it — set when `status` is "rejected". */
  rejectionReason?: string | null;
  /** Who made the accept/reject decision, and when. */
  reviewedBy?: string | null;
  reviewedAt?: string | null;
}
export interface RawTask {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  dueDate: string;
  priority: string;
  status: string;
  linkedTo?: string | null;
}
export interface RawKudos {
  id: string;
  fromEmployeeId: string;
  fromName: string;
  toEmployeeId: string;
  toName: string;
  message: string;
  value: string;
  reactions: number;
  createdAt: string;
}
export interface RawGrievance {
  id: string;
  raisedBy: string;
  category: string;
  severity: string;
  status: string;
  assignedTo?: string;
  openedAt: string;
  summary: string;
  resolution?: string | null;
}
export interface RawGoal {
  id: string;
  employeeId: string;
  cycleId: string;
  title: string;
  type: string;
  progress: number;
  status: string;
}
export interface RawReview {
  id: string;
  employeeId: string;
  cycleId: string;
  selfRating?: number;
  managerRating?: number;
  calibratedRating?: number;
  summary: string;
  completedAt?: string;
}
export interface RawOneOnOne {
  id: string;
  employeeId: string;
  managerId: string | null;
  date: string;
  notes: string;
}
export interface RawFeedback {
  id: string;
  toEmployeeId: string;
  fromEmployeeId: string;
  type: string;
  message: string;
  createdAt: string;
}
export interface RawEnrollment {
  id: string;
  employeeId: string;
  courseId: string;
  courseTitle: string;
  progress: number;
  status: string;
  enrolledAt: string;
  completedAt?: string | null;
}
export interface RawCertification {
  id: string;
  employeeId: string;
  courseId: string;
  title: string;
  issuedAt: string;
  expiresAt?: string | null;
  certificateUrl: string;
}
export interface RawJobPosting {
  id: string;
  title: string;
  location?: string;
  workMode?: string;
  employmentType?: string;
  salaryRange?: { min: number; max: number; currency: string };
  status: string;
  postedAt: string;
  closingDate?: string;
  hiringManagerId?: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Generic per-employee collection read: merges session edits (added + per-id
 * patches) over the locale collection, then filters to the employee.
 */
function useEmployeeCollection<T>(
  key: string,
  employeeId: string,
  pick: (b: LocaleBundle) => T[],
  filter: (r: T, id: string) => boolean = (r, id) =>
    (r as { employeeId?: string }).employeeId === id,
  idField = "id",
) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo(
    () =>
      bundle
        ? applyCollection(pick(bundle), key, edits, idField).filter((r) =>
            filter(r, employeeId),
          )
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bundle, edits, employeeId],
  );
  return { data, loading, error };
}

// ── core record ─────────────────────────────────────────────────────────────
export interface EmployeeRecordResult {
  employee: LocaleEmployee;
  tenant: LocaleTenant;
}
export function useEmployeeRecord(id: string) {
  const ov = useAppSelector((s) => s.profileEdits.overrides[id]);
  const res = useLocaleSection<EmployeeRecordResult | null>((b) => {
    const employee = b.employees.find((e) => e.id === id);
    if (!employee) return null;
    return { employee, tenant: b.tenant };
  });
  const data = useMemo<EmployeeRecordResult | null>(
    () =>
      res.data
        ? { employee: applyEmployeeOverrides(res.data.employee, ov), tenant: res.data.tenant }
        : null,
    [res.data, ov],
  );
  return { ...res, data };
}

/**
 * Whether `id` is a real employee that the viewer's role simply cannot see, as
 * opposed to one that does not exist.
 *
 * Reads the raw bundle on purpose. "Outside your access" is a far more useful
 * answer than "not found", and an employee's *existence* is not confidential in
 * a system that already publishes an org chart and a staff directory — no field
 * of the record is exposed here, only the fact that the id resolves.
 */
export function useIsHiddenByScope(id: string): boolean {
  const existsInTenant = useAppSelector((s) =>
    Boolean(s.locale.data?.employees.some((e) => e.id === id)),
  );
  const { data, loading } = useEmployeeRecord(id);
  return !loading && !data && existsInTenant;
}

// ── stats strip ───────────────────────────────────────────────────────────--
export function useEmployeeStats(id: string) {
  const edits = useAppSelector((s) => s.collectionEdits);
  // The tile opens the Profile Change Log, so it has to count the same thing
  // that module shows — it used to count pending *leave* requests instead.
  const pendingApprovals = useAppSelector(
    (s) =>
      s.profileEdits.requests.filter(
        (r) => r.employeeId === id && r.status === "pending",
      ).length,
  );
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<EmployeeStats | null>(() => {
    if (!bundle) return null;
    const b = bundle;
    const balances = (b.leaveBalances as unknown as RawLeaveBalance[]) ?? [];
    const tasks = applyCollection((b.tasks as unknown as RawTask[]) ?? [], "tasks", edits);
    const assets = applyCollection((b.assets as unknown as RawAsset[]) ?? [], "assets", edits);
    const kudos = applyCollection((b.kudos as unknown as RawKudos[]) ?? [], "kudos", edits);
    return {
      leaveRemaining: balances
        .filter((x) => x.employeeId === id)
        .reduce((s, x) => s + (x.remaining ?? 0), 0),
      openTasks: tasks.filter(
        (t) => t.assigneeId === id && t.status !== "done",
      ).length,
      pendingApprovals,
      assignedAssets: assets.filter((a) => a.assignedTo === id).length,
      kudosReceived: kudos.filter((k) => k.toEmployeeId === id).length,
    };
  }, [bundle, edits, id, pendingApprovals]);
  return { data, loading, error };
}

// ── leave ─────────────────────────────────────────────────────────────────--
export interface EmployeeLeaveData {
  rows: LeaveSummaryRow[];
  booked: RawLeaveRequest[];
  taken: RawLeaveRequest[];
  adjustments: LocaleLeaveAdjustment[];
  usage: LeaveUsageBucket[];
}
/**
 * The leave an employee is on right now, if any — so the profile can say which
 * kind of leave rather than a bare "On Leave" (client feedback round 2, §C1).
 */
export function useActiveLeave(id: string) {
  return useLocaleSection<ActiveLeave | null>(
    (b) => activeLeaveFromBundle(b).get(id) ?? null,
  );
}

export function useEmployeeLeave(id: string) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<EmployeeLeaveData | null>(() => {
    if (!bundle) return null;
    const b = bundle;
    const today = todayIso();
    const policies = (b.leavePolicies as unknown as RawLeavePolicy[]) ?? [];
    const balances = ((b.leaveBalances as unknown as RawLeaveBalance[]) ?? []).filter(
      (x) => x.employeeId === id,
    );
    const requests = applyCollection(
      (b.leaveRequests as unknown as RawLeaveRequest[]) ?? [],
      "leaveRequests",
      edits,
    ).filter((r) => r.employeeId === id);
    const adjustments = applyCollection(
      b.leaveAdjustments ?? [],
      "leaveAdjustments",
      edits,
    ).filter((a) => a.employeeId === id);
    const booked = requests.filter((r) => r.status === "approved" && r.startDate >= today);
    const taken = requests.filter((r) => r.endDate < today);

    const rows: LeaveSummaryRow[] = policies.map((p) => {
      const bal = balances.find((x) => x.leavePolicyId === p.id);
      const adj = adjustments
        .filter((a) => a.policyId === p.id)
        .reduce((s, a) => s + a.delta, 0);
      const bookedDays = booked
        .filter((r) => r.leavePolicyId === p.id)
        .reduce((s, r) => s + (r.days ?? 0), 0);
      const takenDays = taken
        .filter((r) => r.leavePolicyId === p.id)
        .reduce((s, r) => s + (r.days ?? 0), 0);
      const allowance = bal?.entitlement ?? p.defaultDays ?? 0;
      const carryOver = p.carryOverDays ?? 0;
      const entitlement = allowance + adj;
      const remaining = entitlement - takenDays; // excludes booked future leave
      const available = remaining - bookedDays; // still bookable
      return {
        policyId: p.id,
        policyName: p.name,
        allowance,
        adjustments: adj,
        carryOver,
        entitlement,
        booked: bookedDays,
        taken: takenDays,
        remaining,
        available,
      };
    });

    const usageMap = new Map<string, LeaveUsageBucket>();
    for (const r of taken) {
      const month = r.startDate.slice(0, 7);
      const bucket =
        usageMap.get(month) ?? { month, byType: {}, total: 0 };
      bucket.byType[r.leaveType] = (bucket.byType[r.leaveType] ?? 0) + (r.days ?? 0);
      bucket.total += r.days ?? 0;
      usageMap.set(month, bucket);
    }
    const usage = [...usageMap.values()].sort((a, c) => a.month.localeCompare(c.month));

    return { rows, booked, taken, adjustments, usage };
  }, [bundle, edits, id]);
  return { data, loading, error };
}

// ── sickness ──────────────────────────────────────────────────────────────--
export interface EmployeeSicknessData {
  records: RawLeaveRequest[];
  summary: SicknessSummary;
}
export function useEmployeeSickness(id: string) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<EmployeeSicknessData | null>(() => {
    if (!bundle) return null;
    const year = new Date().getFullYear();
    const records = applyCollection(
      (bundle.leaveRequests as unknown as RawLeaveRequest[]) ?? [],
      "leaveRequests",
      edits,
    ).filter((r) => r.employeeId === id && /sick/i.test(r.leaveType));
    const thisYear = records.filter((r) => r.startDate.startsWith(String(year)));
    const totalDaysThisYear = thisYear.reduce((s, r) => s + (r.days ?? 0), 0);
    const episodes = thisYear.length;
    const longestAbsenceDays = thisYear.reduce((m, r) => Math.max(m, r.days ?? 0), 0);
    return {
      records: [...records].sort((a, c) => c.startDate.localeCompare(a.startDate)),
      summary: {
        totalDaysThisYear,
        longestAbsenceDays,
        episodes,
        bradfordFactor: episodes * episodes * totalDaysThisYear,
      },
    };
  }, [bundle, edits, id]);
  return { data, loading, error };
}

// ── learn / training / performance ─────────────────────────────────────────--
export function useEmployeeLearn(id: string) {
  return useEmployeeCollection<RawEnrollment>(
    "learning.enrollments",
    id,
    (b) => (b.learning as { enrollments?: RawEnrollment[] })?.enrollments ?? [],
  );
}
export function useEmployeeTraining(id: string) {
  return useEmployeeCollection<RawCertification>(
    "learning.certifications",
    id,
    (b) => (b.learning as { certifications?: RawCertification[] })?.certifications ?? [],
  );
}
export interface EmployeePerformanceData {
  goals: RawGoal[];
  reviews: RawReview[];
  oneOnOnes: RawOneOnOne[];
  feedback: RawFeedback[];
}
export function useEmployeePerformance(id: string) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<EmployeePerformanceData | null>(() => {
    if (!bundle) return null;
    const p = bundle.performance as {
      goals?: RawGoal[];
      reviews?: RawReview[];
      oneOnOnes?: RawOneOnOne[];
      feedback?: RawFeedback[];
    };
    return {
      goals: applyCollection(p?.goals ?? [], "perf.goals", edits).filter((g) => g.employeeId === id),
      reviews: applyCollection(p?.reviews ?? [], "perf.reviews", edits).filter((r) => r.employeeId === id),
      oneOnOnes: applyCollection(p?.oneOnOnes ?? [], "perf.oneOnOnes", edits).filter((o) => o.employeeId === id),
      feedback: applyCollection(p?.feedback ?? [], "perf.feedback", edits).filter((f) => f.toEmployeeId === id),
    };
  }, [bundle, edits, id]);
  return { data, loading, error };
}

// ── compliance / records ────────────────────────────────────────────────────
export function useEmployeeDbs(id: string) {
  return useEmployeeCollection<LocaleDbsCheck>("dbsChecks", id, (b) => b.dbsChecks ?? []);
}
export function useEmployeeDisciplinaries(id: string) {
  return useEmployeeCollection<LocaleDisciplinary>("disciplinaries", id, (b) => b.disciplinaries ?? []);
}
export function useEmployeeDocuments(id: string) {
  return useEmployeeCollection<RawDocument>(
    "documents",
    id,
    (b) => (b.documents as unknown as RawDocument[]) ?? [],
  );
}
export function useEmployeeAssets(id: string) {
  return useEmployeeCollection<RawAsset>(
    "assets",
    id,
    (b) => (b.assets as unknown as RawAsset[]) ?? [],
    (a, i) => a.assignedTo === i,
  );
}
export function useEmployeeGrievances(id: string) {
  return useEmployeeCollection<RawGrievance>(
    "grievances",
    id,
    (b) => (b.grievances as unknown as RawGrievance[]) ?? [],
    (g, i) => g.raisedBy === i || g.assignedTo === i,
  );
}
export function useEmployeeExpenses(id: string) {
  return useEmployeeCollection<LocaleExpense>(
    "expenses",
    id,
    (b) => b.expenses ?? [],
  );
}
export function useEmployeeHistory(id: string) {
  const res = useEmployeeCollection<LocaleEmploymentEvent>(
    "employmentHistory",
    id,
    (b) => b.employmentHistory ?? [],
  );
  const data = useMemo(
    () => (res.data ? [...res.data].sort((a, c) => c.date.localeCompare(a.date)) : null),
    [res.data],
  );
  return { ...res, data };
}
export interface EmployeeJobsData {
  postings: RawJobPosting[];
  history: LocaleEmploymentEvent[];
}
export function useEmployeeJobs(id: string) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<EmployeeJobsData | null>(() => {
    if (!bundle) return null;
    const rec = bundle.recruitment as { jobPostings?: RawJobPosting[] };
    return {
      postings: applyCollection(rec?.jobPostings ?? [], "jobPostings", edits).filter(
        (j) => j.hiringManagerId === id,
      ),
      history: applyCollection(bundle.employmentHistory ?? [], "employmentHistory", edits).filter(
        (h) => h.employeeId === id,
      ),
    };
  }, [bundle, edits, id]);
  return { data, loading, error };
}
export interface EmployeeKudosData {
  received: RawKudos[];
  given: RawKudos[];
}
export function useEmployeeKudos(id: string) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<EmployeeKudosData | null>(() => {
    if (!bundle) return null;
    const all = applyCollection((bundle.kudos as unknown as RawKudos[]) ?? [], "kudos", edits);
    return {
      received: all.filter((k) => k.toEmployeeId === id),
      given: all.filter((k) => k.fromEmployeeId === id),
    };
  }, [bundle, edits, id]);
  return { data, loading, error };
}
export function useEmployeeBookings(id: string) {
  const res = useEmployeeCollection<LocaleLocationBooking>(
    "locationBookings",
    id,
    (b) => b.locationBookings ?? [],
  );
  const data = useMemo(
    () => (res.data ? [...res.data].sort((a, c) => c.date.localeCompare(a.date)) : null),
    [res.data],
  );
  return { ...res, data };
}
export function useEmployeeMedical(id: string) {
  const res = useEmployeeCollection<LocaleMedicalFacts>(
    "medicalFacts",
    id,
    (b) => b.medicalFacts ?? [],
    (m, i) => m.employeeId === i,
    "employeeId",
  );
  const data = useMemo(() => (res.data ? (res.data[0] ?? null) : null), [res.data]);
  return { ...res, data };
}
export function useEmployeeNotes(id: string) {
  const res = useEmployeeCollection<LocaleEmployeeNote>(
    "employeeNotes",
    id,
    (b) => b.employeeNotes ?? [],
  );
  const data = useMemo(
    () =>
      res.data
        ? [...res.data].sort(
            (a, c) => Number(c.pinned) - Number(a.pinned) || c.createdAt.localeCompare(a.createdAt),
          )
        : null,
    [res.data],
  );
  return { ...res, data };
}
export interface EmployeePayData {
  current: { amount: number; currency: string; period: string } | null;
  history: LocalePayChange[];
  bonuses: LocalePayChange[];
}
export function useEmployeePay(id: string) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<EmployeePayData | null>(() => {
    if (!bundle) return null;
    const emp = bundle.employees.find((e) => e.id === id);
    const history = applyCollection(bundle.payHistory ?? [], "payHistory", edits)
      .filter((p) => p.employeeId === id)
      .sort((a, c) => c.effectiveDate.localeCompare(a.effectiveDate));
    return {
      current: emp?.salary ?? null,
      history,
      bonuses: history.filter((p) => p.changeType === "bonus"),
    };
  }, [bundle, edits, id]);
  return { data, loading, error };
}
export function useEmployeeTasks(id: string) {
  return useEmployeeCollection<RawTask>(
    "tasks",
    id,
    (b) => (b.tasks as unknown as RawTask[]) ?? [],
    (t, i) => t.assigneeId === i,
  );
}

// ── payslips (generated from the employee's salary) ─────────────────────────--
export interface EmployeePayslip {
  id: string;
  period: string;
  gross: number;
  deductions: number;
  net: number;
  paidDate: string;
  downloadUrl: string;
}
/**
 * Demo payslips: the last 6 months derived from the employee's annual salary
 * (monthly gross = annual/12, ~20% statutory deductions). No payslip fixtures
 * exist yet, so these are generated deterministically per employee.
 */
export function useEmployeePayslips(id: string) {
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<EmployeePayslip[] | null>(() => {
    if (!bundle) return null;
    const emp = bundle.employees.find((e) => e.id === id);
    const annual = emp?.salary?.amount ?? 0;
    const monthlyGross = Math.round(annual / 12);
    const now = new Date();
    const out: EmployeePayslip[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
      const deductions = Math.round(monthlyGross * 0.2);
      // Last calendar day of the month is the pay date.
      const paidDate = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);
      out.push({
        id: `PS-${id}-${ym}`,
        period: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        gross: monthlyGross,
        deductions,
        net: monthlyGross - deductions,
        paidDate,
        downloadUrl: "#",
      });
    }
    return out;
  }, [bundle, id]);
  return { data, loading, error };
}
export interface EmployeeTimeLogsData {
  records: RawAttendance[];
  summary: TimeLogsSummary;
}
export function useEmployeeTimeLogs(id: string) {
  const edits = useAppSelector((s) => s.collectionEdits);
  const { data: bundle, loading, error } = useLocaleSection<LocaleBundle>((b) => b);
  const data = useMemo<EmployeeTimeLogsData | null>(() => {
    if (!bundle) return null;
    // Anchor the window on the bundle's reference date, not on wall-clock today:
    // the demo fixtures stop months before the real date, so a real-today window
    // showed an empty tab. Rows clocked today are later than this cutoff, so a
    // live punch still appears alongside the history.
    const cutoff = new Date(
      bundle._meta?.referenceDate ?? new Date().toISOString().slice(0, 10),
    );
    cutoff.setDate(cutoff.getDate() - 30);
    const cut = cutoff.toISOString().slice(0, 10);
    const records = applyCollection(
      (bundle.attendance as unknown as RawAttendance[]) ?? [],
      "attendance",
      edits,
    )
      .filter((a) => a.employeeId === id && a.date >= cut)
      .sort((a, c) => c.date.localeCompare(a.date));
    return {
      records,
      summary: {
        monthlyHours: Math.round(records.reduce((s, r) => s + (r.hoursWorked ?? 0), 0)),
        daysPresent: records.filter((r) => r.status === "present" || r.status === "remote").length,
        daysLate: records.filter((r) => r.status === "late").length,
        daysAbsent: records.filter((r) => r.status === "absent").length,
      },
    };
  }, [bundle, edits, id]);
  return { data, loading, error };
}
// ── permissions (resolve access level → matrix) ─────────────────────────────--
const ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "approve"];
export function useEmployeePermissions(id: string) {
  // Prefer the access level linked to the employee's role(s); the bare
  // employee.accessLevelId in the fixtures doesn't map to the seeded matrix ids.
  const accessLevelId = useLocaleSection<string | null>((b) => {
    const emp = b.employees.find((e) => e.id === id);
    if (!emp) return null;
    const linked = (emp.roleIds ?? [])
      .map((rid) => b.roles.find((r) => r.id === rid)?.linkedAccessLevelId)
      .find((x): x is string => !!x);
    return linked ?? emp.accessLevelId ?? null;
  }).data;
  const levels = useAppSelector((s) => s.accessLevels.levels);
  const edits = useAppSelector((s) => s.collectionEdits);

  return useMemo<EffectivePermissionRow[]>(() => {
    const level = levels.find((l) => l.id === accessLevelId);
    const rows = ALL_MODULES.map((m) => {
      const perm = level?.permissions.find((p) => p.module === m.id);
      const can = (a: PermissionAction) =>
        !!perm?.access && perm.actions.includes(a);
      const row: EffectivePermissionRow = {
        id: `${id}::${m.id}`,
        module: m.id,
        label: MODULE_LABELS[m.id] ?? m.label,
        view: can("view"),
        create: can("create"),
        edit: can("edit"),
        delete: can("delete"),
        approve: can("approve"),
      };
      return row;
    });
    // Layer any per-employee permission overrides on top of the role matrix.
    return applyCollection(rows, "permissions", edits, "id");
  }, [levels, accessLevelId, edits, id]);
}

export { ACTIONS as PERMISSION_ACTIONS };

// ── compensation pay items (added-only collections) ─────────────────────────
export interface RawPayItem {
  id: string;
  employeeId: string;
  label?: string;
  amount?: number;
  currency?: string;
  date?: string;
  frequency?: string;
  startDate?: string;
}
const pickPay = (key: keyof LocaleBundle | string) => (b: LocaleBundle) =>
  ((b as unknown as Record<string, RawPayItem[] | undefined>)[key as string] ?? []);

export function useEmployeeRecurringDeductions(id: string) {
  return useEmployeeCollection<RawPayItem>("recurringDeductions", id, pickPay("recurringDeductions"));
}
export function useEmployeeOneTimePayments(id: string) {
  return useEmployeeCollection<RawPayItem>("oneTimePayments", id, pickPay("oneTimePayments"));
}
export function useEmployeeOneTimeDeductions(id: string) {
  return useEmployeeCollection<RawPayItem>("oneTimeDeductions", id, pickPay("oneTimeDeductions"));
}

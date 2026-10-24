import type { LocaleBundle } from "@/src/lib/types/locale";
import type { LocaleBranch } from "@/src/lib/types/branches";
import type { PerfInput, PerfSickness } from "./performance";

type Rec = Record<string, unknown>;
const arr = (v: unknown): Rec[] => (Array.isArray(v) ? (v as Rec[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const nullable = (v: unknown) => (typeof v === "string" ? v : null);

/**
 * Maps a locale bundle onto the performance engine's input. `sickness`
 * overrides the bundle's sick leave once the Sickness & Absence module holds
 * records; until then approved sick leave stands in.
 */
export function buildPerfInput(
  bundle: LocaleBundle,
  branches: LocaleBranch[],
  sickness?: PerfSickness[],
): PerfInput {
  const learning = (bundle.learning ?? {}) as Rec;
  const performance = (bundle.performance ?? {}) as Rec;
  const asOf = bundle._meta?.referenceDate ?? new Date().toISOString().slice(0, 10);

  return {
    asOf,
    branches: branches.map((x) => ({
      id: x.id,
      name: x.name,
      code: x.code,
      region: x.region,
      city: x.city,
      status: x.status,
      headcountTarget: x.headcountTarget,
      managerEmployeeId: x.managerEmployeeId,
    })),
    employees: bundle.employees.map((e) => ({ id: e.id, fullName: e.fullName, branchId: e.branchId })),
    tasks: arr(bundle.tasks).map((t) => ({
      id: str(t.id),
      title: str(t.title),
      assigneeId: str(t.assigneeId),
      dueDate: str(t.dueDate),
      status: str(t.status),
      priority: str(t.priority),
    })),
    attendance: arr(bundle.attendance).map((a) => ({
      employeeId: str(a.employeeId),
      date: str(a.date),
      status: str(a.status),
    })),
    enrollments: arr(learning.enrollments).map((e) => ({
      employeeId: str(e.employeeId),
      courseTitle: str(e.courseTitle),
      status: str(e.status),
      enrolledAt: str(e.enrolledAt) || undefined,
      completedAt: nullable(e.completedAt),
    })),
    documents: arr(bundle.documents).map((d) => ({
      employeeId: str(d.employeeId),
      name: str(d.name),
      status: str(d.status),
      expiresAt: nullable(d.expiresAt),
    })),
    dbsChecks: (bundle.dbsChecks ?? []).map((d) => ({
      employeeId: d.employeeId,
      status: d.status,
      expiryDate: d.expiryDate,
    })),
    sickness:
      sickness ??
      arr(bundle.leaveRequests)
        .filter((r) => /sick/i.test(str(r.leaveType) || str(r.type)) && r.status === "approved")
        .map((r) => ({ employeeId: str(r.employeeId), startDate: str(r.startDate), endDate: str(r.endDate) })),
    tickets: arr(bundle.helpdeskTickets).map((t) => ({
      id: str(t.id),
      subject: str(t.subject),
      requesterId: str(t.requesterId),
      status: str(t.status),
      openedAt: str(t.openedAt),
      resolvedAt: nullable(t.resolvedAt),
    })),
    grievances: arr(bundle.grievances).map((g) => ({
      id: str(g.id),
      raisedBy: str(g.raisedBy),
      status: str(g.status),
      openedAt: str(g.openedAt),
    })),
    reviews: arr(performance.reviews).map((r) => ({
      employeeId: str(r.employeeId),
      calibratedRating: typeof r.calibratedRating === "number" ? r.calibratedRating : null,
      managerRating: typeof r.managerRating === "number" ? r.managerRating : null,
      completedAt: nullable(r.completedAt),
    })),
  };
}

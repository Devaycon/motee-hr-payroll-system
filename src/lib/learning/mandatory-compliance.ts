/**
 * Mandatory training compliance: every current employee must complete every
 * mandatory course. An assignment is overdue once its due date has passed (or
 * when the employee was never enrolled at all) without a completion.
 */

/** A department below this completion rate is flagged "at risk". */
export const DEPARTMENT_AT_RISK_THRESHOLD = 80;

export interface ComplianceEmployee {
  id: string;
  fullName: string;
  departmentName: string;
  status: string;
}

export interface ComplianceEnrollment {
  employeeId?: string;
  courseId: string;
  status: string;
  dueDate?: string | null;
}

export interface ComplianceCourse {
  id: string;
  title: string;
}

export interface OverdueAssignment {
  employeeId: string;
  employeeName: string;
  departmentName: string;
  courseId: string;
  courseTitle: string;
  /** Null when the employee was never enrolled. */
  dueDate: string | null;
}

export interface DepartmentCompliance {
  department: string;
  required: number;
  completed: number;
  rate: number;
  overdue: number;
  atRisk: boolean;
}

export interface MandatoryComplianceSummary {
  /** Required assignments (current employees × mandatory courses). */
  required: number;
  completed: number;
  /** 0–100; 100 when nothing is required. */
  completionRate: number;
  overdue: OverdueAssignment[];
  /** Distinct employees with at least one overdue assignment. */
  employeesOverdue: number;
  departments: DepartmentCompliance[];
  departmentsAtRisk: number;
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 100);

export function mandatoryCompliance(
  employees: ComplianceEmployee[],
  mandatoryCourses: ComplianceCourse[],
  enrollments: ComplianceEnrollment[],
  today: Date = new Date(),
): MandatoryComplianceSummary {
  const todayIso = today.toISOString().slice(0, 10);
  const current = employees.filter((e) => e.status !== "terminated");
  const byKey = new Map<string, ComplianceEnrollment>();
  for (const e of enrollments) {
    if (!e.employeeId) continue;
    const key = `${e.employeeId}|${e.courseId}`;
    // A completion wins over any other attempt at the same course.
    if (!byKey.has(key) || e.status === "completed") byKey.set(key, e);
  }

  const overdue: OverdueAssignment[] = [];
  const dept = new Map<string, { required: number; completed: number; overdue: number }>();
  let completed = 0;

  for (const emp of current) {
    const d = dept.get(emp.departmentName) ?? { required: 0, completed: 0, overdue: 0 };
    for (const course of mandatoryCourses) {
      d.required += 1;
      const e = byKey.get(`${emp.id}|${course.id}`);
      if (e?.status === "completed") {
        completed += 1;
        d.completed += 1;
        continue;
      }
      const due = e?.dueDate ?? null;
      if (!e || (due != null && due < todayIso)) {
        d.overdue += 1;
        overdue.push({
          employeeId: emp.id,
          employeeName: emp.fullName,
          departmentName: emp.departmentName,
          courseId: course.id,
          courseTitle: course.title,
          dueDate: due,
        });
      }
    }
    dept.set(emp.departmentName, d);
  }

  const required = current.length * mandatoryCourses.length;
  const departments = [...dept.entries()]
    .map(([department, v]) => {
      const rate = pct(v.completed, v.required);
      return { department, ...v, rate, atRisk: rate < DEPARTMENT_AT_RISK_THRESHOLD };
    })
    .sort((a, b) => a.rate - b.rate);

  return {
    required,
    completed,
    completionRate: pct(completed, required),
    overdue,
    employeesOverdue: new Set(overdue.map((o) => o.employeeId)).size,
    departments,
    departmentsAtRisk: departments.filter((d) => d.atRisk).length,
  };
}

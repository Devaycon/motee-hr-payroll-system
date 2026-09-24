import type { LeaveRequest } from "@/src/lib/types/leave";

/**
 * Leave taken per department — the report behind the "Most Leave Taken" card.
 *
 * Ranks use standard competition ranking: departments with equal totals share
 * a rank and the next one skips (1, 1, 3), so a tie is shown as a tie rather
 * than one department silently winning on sort order.
 */

export type DepartmentRankBy = "days" | "perEmployee";

export interface DepartmentLeaveRow {
  department: string;
  rank: number;
  /** True when another department has the same value for the ranking measure. */
  tied: boolean;
  /** Approved leave days starting in the year. */
  days: number;
  requests: number;
  /** Distinct people in the department who took leave. */
  people: number;
  /** Current employees in the department (0 when unknown). */
  headcount: number;
  /** days ÷ headcount, one decimal — the fair comparison between departments of different size. */
  daysPerEmployee: number;
  /** Share of all approved days in the year, 0–100. */
  share: number;
  /** Days by leave type, largest first. */
  byType: { leaveType: string; days: number }[];
}

export interface DepartmentLeaveReport {
  year: string;
  rows: DepartmentLeaveRow[];
  totalDays: number;
  /** Every department sharing the highest total — more than one on a tie. */
  leaders: string[];
  leaderDays: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function departmentLeaveReport(
  requests: Pick<LeaveRequest, "status" | "startDate" | "department" | "totalDays" | "leaveType" | "employeeId" | "employeeName">[],
  year: string,
  headcounts: Map<string, number> = new Map(),
  rankBy: DepartmentRankBy = "days",
): DepartmentLeaveReport {
  const acc = new Map<string, { days: number; requests: number; people: Set<string>; byType: Map<string, number> }>();
  // Departments with nobody off still belong in the report, at the bottom.
  for (const d of headcounts.keys()) acc.set(d, { days: 0, requests: 0, people: new Set(), byType: new Map() });

  for (const r of requests) {
    if (r.status !== "approved" || r.startDate.slice(0, 4) !== year) continue;
    const row = acc.get(r.department) ?? { days: 0, requests: 0, people: new Set<string>(), byType: new Map<string, number>() };
    row.days += r.totalDays;
    row.requests += 1;
    row.people.add(r.employeeId ?? r.employeeName);
    row.byType.set(r.leaveType, (row.byType.get(r.leaveType) ?? 0) + r.totalDays);
    acc.set(r.department, row);
  }

  const totalDays = [...acc.values()].reduce((s, r) => s + r.days, 0);
  const measure = (r: { days: number; daysPerEmployee: number }) =>
    rankBy === "days" ? r.days : r.daysPerEmployee;

  const unranked = [...acc.entries()].map(([department, r]) => {
    const headcount = headcounts.get(department) ?? 0;
    return {
      department,
      days: round1(r.days),
      requests: r.requests,
      people: r.people.size,
      headcount,
      daysPerEmployee: headcount ? round1(r.days / headcount) : 0,
      share: totalDays ? Math.round((r.days / totalDays) * 100) : 0,
      byType: [...r.byType.entries()]
        .map(([leaveType, days]) => ({ leaveType, days: round1(days) }))
        .sort((a, b) => b.days - a.days),
    };
  });

  const sorted = unranked.sort(
    (a, b) => measure(b) - measure(a) || b.days - a.days || a.department.localeCompare(b.department),
  );
  const rows: DepartmentLeaveRow[] = sorted.map((r) => {
    const value = measure(r);
    return {
      ...r,
      rank: sorted.findIndex((x) => measure(x) === value) + 1,
      tied: sorted.filter((x) => measure(x) === value).length > 1,
    };
  });

  const leaderDays = Math.max(0, ...rows.map((r) => r.days));
  return {
    year,
    rows,
    totalDays: round1(totalDays),
    leaders: leaderDays > 0 ? rows.filter((r) => r.days === leaderDays).map((r) => r.department).sort() : [],
    leaderDays,
  };
}

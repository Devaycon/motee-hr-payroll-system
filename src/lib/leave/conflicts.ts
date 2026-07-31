import { isOpenLeaveStatus, type LeaveRequest } from "@/src/lib/types/leave";

/**
 * Leave conflict / coverage detection (client feedback round 2, §F8).
 *
 * Previously this lived inside the review modal against a hardcoded
 * `DEPARTMENT_SIZE` map and only fired at the moment of approval. It now takes
 * real department headcount and is surfaced wherever a request is inspected.
 */

/** Minimum share of a department that must remain at work. */
export const MIN_COVERAGE_RATIO = 0.75;

export interface LeaveConflict {
  severity: "warning" | "info";
  message: string;
}

export interface ConflictInput {
  request: LeaveRequest;
  /** Every other request to check overlaps against. */
  allRequests: readonly LeaveRequest[];
  /** Headcount per department name. */
  departmentSizes: ReadonlyMap<string, number>;
}

function overlaps(a: LeaveRequest, b: LeaveRequest): boolean {
  return a.startDate <= b.endDate && a.endDate >= b.startDate;
}

/** Requests from the same department that overlap this one and still count. */
export function overlappingRequests(
  request: LeaveRequest,
  allRequests: readonly LeaveRequest[],
): LeaveRequest[] {
  return allRequests.filter(
    (r) =>
      r.id !== request.id &&
      r.department === request.department &&
      (r.status === "approved" || isOpenLeaveStatus(r.status)) &&
      overlaps(r, request),
  );
}

/** Formats an inclusive date range the way the warnings read. */
function formatRange(start: string, end: string): string {
  return start === end ? start : `${start} – ${end}`;
}

/**
 * Warns when the nominated relief colleague is themselves off over the same
 * dates (client feedback §3.2).
 *
 * Deliberately not department-scoped, unlike `overlappingRequests` — cover can
 * be nominated from another team, and that case still needs catching.
 */
export function reliefConflict(
  request: Pick<
    LeaveRequest,
    "id" | "startDate" | "endDate" | "reliefEmployeeId" | "reliefEmployeeName"
  >,
  allRequests: readonly LeaveRequest[],
): LeaveConflict | null {
  const { reliefEmployeeId, reliefEmployeeName } = request;
  if (!reliefEmployeeId && !reliefEmployeeName) return null;

  const clash = allRequests.find((r) => {
    if (r.id === request.id) return false;
    if (r.status !== "approved" && !isOpenLeaveStatus(r.status)) return false;
    const sameEmployee = reliefEmployeeId
      ? r.employeeId === reliefEmployeeId
      : r.employeeName === reliefEmployeeName;
    if (!sameEmployee) return false;
    return r.startDate <= request.endDate && r.endDate >= request.startDate;
  });
  if (!clash) return null;

  return {
    severity: "warning",
    message:
      `${reliefEmployeeName ?? "The relief employee"} is assigned as cover but ` +
      `is also on leave ${formatRange(clash.startDate, clash.endDate)}.`,
  };
}

/**
 * Warnings to show against a request — who else is off, whether the nominated
 * cover is also away, and whether approving would push the department below its
 * minimum coverage.
 */
export function detectConflicts({
  request,
  allRequests,
  departmentSizes,
}: ConflictInput): LeaveConflict[] {
  const conflicts: LeaveConflict[] = [];
  const overlapping = overlappingRequests(request, allRequests);

  const relief = reliefConflict(request, allRequests);
  if (relief) conflicts.push(relief);

  if (overlapping.length > 0) {
    const names = overlapping.slice(0, 3).map((r) => r.employeeName);
    const extra = overlapping.length - names.length;
    conflicts.push({
      severity: "warning",
      message:
        `${overlapping.length} other member${overlapping.length === 1 ? "" : "s"} of the ` +
        `${request.department} team ${overlapping.length === 1 ? "is" : "are"} already ` +
        `off during these dates — ${names.join(", ")}${extra > 0 ? ` and ${extra} more` : ""}.`,
    });
  }

  const teamSize = departmentSizes.get(request.department);
  if (teamSize && teamSize > 0) {
    const minCoverage = Math.ceil(teamSize * MIN_COVERAGE_RATIO);
    const availableIfApproved = teamSize - (overlapping.length + 1);
    if (availableIfApproved < minCoverage) {
      conflicts.push({
        severity: "warning",
        message:
          `Approving this request would leave only ${availableIfApproved} of ${teamSize} ` +
          `employees available in ${request.department}, below the minimum of ${minCoverage}.`,
      });
    }
  }

  return conflicts;
}

/** Builds the headcount map the detector needs from a list of employees. */
export function departmentSizesFrom(
  employees: readonly { departmentName: string }[],
): Map<string, number> {
  const sizes = new Map<string, number>();
  for (const e of employees) {
    sizes.set(e.departmentName, (sizes.get(e.departmentName) ?? 0) + 1);
  }
  return sizes;
}

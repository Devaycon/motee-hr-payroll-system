import { describe, expect, it } from "vitest";
import {
  approvedHours,
  availableProjectTasks,
  criticalPath,
  findOverAllocations,
  findScheduleConflicts,
  isTaskBlocked,
  projectProgress,
  projectSpend,
  totalAllocation,
  type Project,
  type ProjectTask,
  type TimesheetEntry,
} from "./projects";

function task(
  id: string,
  over: Partial<ProjectTask> = {},
): ProjectTask {
  return {
    id,
    name: id,
    status: "not_started",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    percentComplete: 0,
    ...over,
  };
}

function project(over: Partial<Project> = {}): Project {
  return {
    id: "P1",
    code: "P1",
    name: "Project One",
    status: "active",
    priority: "medium",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    tasks: [],
    milestones: [],
    allocations: [],
    createdAt: "2026-01-01",
    createdBy: "test",
    ...over,
  };
}

describe("dependencies", () => {
  const tasks = [
    task("A", { status: "completed" }),
    task("B", { dependsOn: ["A"] }),
    task("C", { dependsOn: ["B"] }),
  ];

  it("blocks a task whose dependency is unfinished", () => {
    expect(isTaskBlocked(tasks[1], tasks)).toBe(false);
    expect(isTaskBlocked(tasks[2], tasks)).toBe(true);
  });

  it("offers only the tasks that can actually be started", () => {
    expect(availableProjectTasks(tasks).map((t) => t.id)).toEqual(["B"]);
  });

  it("treats a missing dependency as unmet rather than crashing", () => {
    const orphan = [task("X", { dependsOn: ["ghost"] })];
    expect(isTaskBlocked(orphan[0], orphan)).toBe(true);
  });
});

describe("schedule conflicts", () => {
  it("flags a task starting before its dependency finishes", () => {
    const tasks = [
      task("A", { startDate: "2026-01-01", endDate: "2026-03-31" }),
      task("B", {
        startDate: "2026-03-01",
        endDate: "2026-04-30",
        dependsOn: ["A"],
      }),
    ];
    const conflicts = findScheduleConflicts(tasks);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].task.id).toBe("B");
    expect(conflicts[0].overlapDays).toBe(30);
  });

  it("reports nothing when the dates line up", () => {
    const tasks = [
      task("A", { startDate: "2026-01-01", endDate: "2026-02-28" }),
      task("B", {
        startDate: "2026-03-01",
        endDate: "2026-04-30",
        dependsOn: ["A"],
      }),
    ];
    expect(findScheduleConflicts(tasks)).toHaveLength(0);
  });
});

describe("criticalPath", () => {
  it("finds the longest dependency chain", () => {
    const tasks = [
      task("A"),
      task("B", { dependsOn: ["A"] }),
      task("C", { dependsOn: ["B"] }),
      task("D", { dependsOn: ["A"] }),
    ];
    expect(criticalPath(tasks)).toEqual(["A", "B", "C"]);
  });

  it("terminates on a dependency cycle instead of recursing forever", () => {
    const tasks = [
      task("A", { dependsOn: ["B"] }),
      task("B", { dependsOn: ["A"] }),
    ];
    // The exact answer doesn't matter; not hanging does.
    expect(() => criticalPath(tasks)).not.toThrow();
    expect(criticalPath(tasks).length).toBeLessThanOrEqual(2);
  });

  it("returns an empty path when there are no tasks", () => {
    expect(criticalPath([])).toEqual([]);
  });
});

describe("progress", () => {
  it("averages across tasks, counting completed ones as 100", () => {
    const p = project({
      tasks: [
        task("A", { status: "completed", percentComplete: 40 }),
        task("B", { percentComplete: 50 }),
      ],
    });
    expect(projectProgress(p)).toBe(75);
  });

  it("is zero for a project with no tasks rather than NaN", () => {
    expect(projectProgress(project())).toBe(0);
  });
});

describe("allocation", () => {
  const alloc = (employeeId: string, percent: number) => ({
    employeeId,
    employeeName: employeeId,
    projectRole: "Dev",
    allocationPercent: percent,
    startDate: "2026-01-01",
  });

  it("sums a project's allocation into FTE", () => {
    const p = project({ allocations: [alloc("e1", 50), alloc("e2", 100)] });
    expect(totalAllocation(p)).toBe(1.5);
  });

  it("flags someone committed beyond 100% across projects", () => {
    const projects = [
      project({ id: "P1", name: "One", allocations: [alloc("e1", 60)] }),
      project({ id: "P2", name: "Two", allocations: [alloc("e1", 70)] }),
    ];
    const over = findOverAllocations(projects);
    expect(over).toHaveLength(1);
    expect(over[0].totalPercent).toBe(130);
    expect(over[0].projects).toHaveLength(2);
  });

  it("ignores completed and cancelled projects", () => {
    const projects = [
      project({ id: "P1", allocations: [alloc("e1", 60)] }),
      project({
        id: "P2",
        status: "completed",
        allocations: [alloc("e1", 70)],
      }),
      project({
        id: "P3",
        status: "cancelled",
        allocations: [alloc("e1", 70)],
      }),
    ];
    expect(findOverAllocations(projects)).toHaveLength(0);
  });

  it("does not flag someone at exactly 100%", () => {
    const projects = [project({ allocations: [alloc("e1", 100)] })];
    expect(findOverAllocations(projects)).toHaveLength(0);
  });
});

describe("time and cost", () => {
  const entries: TimesheetEntry[] = [
    {
      id: "t1",
      projectId: "P1",
      employeeId: "e1",
      employeeName: "e1",
      date: "2026-01-05",
      hours: 8,
      status: "approved",
    },
    {
      id: "t2",
      projectId: "P1",
      employeeId: "e1",
      employeeName: "e1",
      date: "2026-01-06",
      hours: 5,
      status: "submitted",
    },
    {
      id: "t3",
      projectId: "P2",
      employeeId: "e1",
      employeeName: "e1",
      date: "2026-01-07",
      hours: 4,
      status: "approved",
    },
  ];

  it("counts approved hours only, for the right project", () => {
    expect(approvedHours(entries, "P1")).toBe(8);
  });

  it("costs approved time at each person's project rate", () => {
    const p = project({
      allocations: [
        {
          employeeId: "e1",
          employeeName: "e1",
          projectRole: "Dev",
          allocationPercent: 100,
          startDate: "2026-01-01",
          hourlyRate: 50,
        },
      ],
    });
    // Only the 8 approved hours count: 8 × 50.
    expect(projectSpend(p, entries)).toBe(400);
  });

  it("costs nothing for someone with no rate set", () => {
    expect(projectSpend(project(), entries)).toBe(0);
  });
});

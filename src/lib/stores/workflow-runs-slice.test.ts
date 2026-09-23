import { describe, expect, it } from "vitest";
import reducer, {
  approveRunTask,
  rejectRunTask,
  reassignTask,
  skipTask,
  startRun,
  startTask,
  submitTask,
} from "./workflow-runs-slice";
import type { RunTask, WorkflowRun } from "@/src/lib/types/workflow-runs";

const COUNTRY = "nigeria";

function runTask(over: Partial<RunTask> & { id: string }): RunTask {
  return {
    templateTaskId: over.id,
    order: 1,
    title: `Task ${over.id}`,
    priority: "normal",
    status: "not_started",
    assignee: { kind: "role", roleId: "ROLE-HR" },
    assigneeEmployeeId: "E-1",
    assigneeName: "Amara Okafor",
    reviewer: null,
    reviewerEmployeeId: null,
    reviewerName: null,
    dueDate: "2026-03-10",
    dependsOn: [],
    ...over,
  };
}

function run(tasks: RunTask[]): WorkflowRun {
  return {
    id: "RUN-1",
    workflowId: "WF-TEST",
    workflowTitle: "Test",
    workflowVersion: 1,
    trigger: "manual",
    subject: { kind: "candidate", id: "C-1", name: "Chidi", href: "/x" },
    anchorDate: "2026-03-01",
    context: {},
    status: "active",
    startedAt: "2026-03-01T00:00:00.000Z",
    startedBy: "System",
    tasks,
  };
}

function stateWith(tasks: RunTask[]) {
  return reducer(undefined, startRun({ country: COUNTRY, run: run(tasks) }));
}

const ref = (taskId: string) => ({ country: COUNTRY, runId: "RUN-1", taskId });
const only = (s: ReturnType<typeof stateWith>) => s.byCountry[COUNTRY][0];

describe("workflow runs slice", () => {
  it("ignores a second start of the same run", () => {
    let s = stateWith([runTask({ id: "T1" })]);
    s = reducer(s, startRun({ country: COUNTRY, run: run([runTask({ id: "T9" })]) }));
    expect(s.byCountry[COUNTRY]).toHaveLength(1);
    expect(only(s).tasks[0].id).toBe("T1");
  });

  it("completes a task outright when it has no reviewer", () => {
    let s = stateWith([runTask({ id: "T1" })]);
    s = reducer(s, submitTask({ ...ref("T1"), by: "Amara" }));
    expect(only(s).tasks[0].status).toBe("completed");
    expect(only(s).tasks[0].completedBy).toBe("Amara");
  });

  it("sends a reviewed task for approval instead of completing it", () => {
    let s = stateWith([
      runTask({
        id: "T1",
        reviewer: { kind: "role", roleId: "ROLE-HRMGR" },
        reviewerEmployeeId: "E-2",
      }),
    ]);
    s = reducer(s, submitTask({ ...ref("T1"), by: "Amara" }));
    expect(only(s).tasks[0].status).toBe("awaiting_approval");
    s = reducer(s, approveRunTask({ ...ref("T1"), by: "Tunde" }));
    expect(only(s).tasks[0].status).toBe("completed");
  });

  it("sends a rejected task back to the doer", () => {
    let s = stateWith([
      runTask({ id: "T1", reviewer: { kind: "role", roleId: "ROLE-HRMGR" } }),
    ]);
    s = reducer(s, submitTask({ ...ref("T1"), by: "Amara" }));
    s = reducer(s, rejectRunTask({ ...ref("T1"), note: "Missing the signed copy" }));
    expect(only(s).tasks[0].status).toBe("in_progress");
    expect(only(s).tasks[0].note).toBe("Missing the signed copy");
  });

  it("unblocks a dependant when its dependency completes", () => {
    let s = stateWith([
      runTask({ id: "T1" }),
      runTask({ id: "T2", order: 2, status: "blocked", dependsOn: ["T1"] }),
    ]);
    expect(only(s).tasks[1].status).toBe("blocked");
    s = reducer(s, submitTask({ ...ref("T1"), by: "Amara" }));
    expect(only(s).tasks[1].status).toBe("not_started");
  });

  it("unblocks everything in a parallel group at once", () => {
    let s = stateWith([
      runTask({ id: "T1" }),
      runTask({
        id: "T2",
        order: 2,
        status: "blocked",
        dependsOn: ["T1"],
        parallelGroup: "setup",
      }),
      runTask({
        id: "T3",
        order: 3,
        status: "blocked",
        dependsOn: ["T1"],
        parallelGroup: "setup",
      }),
    ]);
    s = reducer(s, submitTask({ ...ref("T1"), by: "Amara" }));
    expect(only(s).tasks.slice(1).map((t) => t.status)).toEqual([
      "not_started",
      "not_started",
    ]);
  });

  it("treats a skipped task as satisfied, so dependants do not wait forever", () => {
    let s = stateWith([
      runTask({ id: "T1" }),
      runTask({ id: "T2", order: 2, status: "blocked", dependsOn: ["T1"] }),
    ]);
    s = reducer(s, skipTask({ ...ref("T1"), note: "Office based" }));
    expect(only(s).tasks[1].status).toBe("not_started");
  });

  it("completes the run once every task is settled", () => {
    let s = stateWith([runTask({ id: "T1" }), runTask({ id: "T2", order: 2 })]);
    s = reducer(s, submitTask({ ...ref("T1"), by: "Amara" }));
    expect(only(s).status).toBe("active");
    s = reducer(s, submitTask({ ...ref("T2"), by: "Amara" }));
    expect(only(s).status).toBe("completed");
    expect(only(s).completedAt).toBeDefined();
  });

  it("records who a reassigned task came from", () => {
    let s = stateWith([runTask({ id: "T1" })]);
    s = reducer(
      s,
      reassignTask({ ...ref("T1"), employeeId: "E-9", name: "Ngozi Eze" }),
    );
    const task = only(s).tasks[0];
    expect(task.assigneeEmployeeId).toBe("E-9");
    expect(task.assigneeName).toBe("Ngozi Eze");
    expect(task.reassignedFrom).toBe("Amara Okafor");
  });

  it("does not start a task that is blocked", () => {
    let s = stateWith([
      runTask({ id: "T1" }),
      runTask({ id: "T2", order: 2, status: "blocked", dependsOn: ["T1"] }),
    ]);
    s = reducer(s, startTask(ref("T2")));
    expect(only(s).tasks[1].status).toBe("blocked");
  });
});

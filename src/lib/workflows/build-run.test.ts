import { describe, expect, it } from "vitest";
import { buildRun, runIdFor } from "./build-run";
import type { LocaleEmployee, LocaleRole } from "@/src/lib/types/locale";
import type { Workflow, WorkflowTask } from "@/src/lib/types/workflows";
import type { RunSubject } from "@/src/lib/types/workflow-runs";

function employee(id: string, fullName: string): LocaleEmployee {
  return { id, fullName } as LocaleEmployee;
}

function role(id: string, name: string, linkedEmployeeId?: string): LocaleRole {
  return { id, name, linkedEmployeeId } as LocaleRole;
}

function task(over: Partial<WorkflowTask> & { id: string }): WorkflowTask {
  return {
    order: 1,
    title: `Task ${over.id}`,
    assignee: { kind: "role", roleId: "ROLE-HR" },
    reviewer: null,
    priority: "normal",
    ...over,
  } as WorkflowTask;
}

function workflow(tasks: WorkflowTask[]): Workflow {
  return {
    id: "WF-TEST",
    title: "Test Workflow",
    triggerMode: "manual",
    scope: { kind: "all" },
    kind: "system",
    status: "active",
    version: 3,
    tasks,
    lastModifiedBy: "System",
    lastModifiedAt: "2026-01-01",
  };
}

const subject: RunSubject = {
  kind: "candidate",
  id: "CAND-1",
  name: "Chidi Okonkwo",
  href: "/x",
};

// Three roles pointing at one employee is the demo bundle's actual shape, and
// the reason overrides exist.
const EMPLOYEES = [
  employee("E-1", "Amara Okafor"),
  employee("E-2", "Adaeze Eze"),
  employee("E-3", "Tunde Bello"),
];
const ROLES = [
  role("ROLE-HR", "HR Admin", "E-1"),
  role("ROLE-RECRUIT", "Recruiter", "E-1"),
  role("ROLE-FIN", "Finance", "E-3"),
];

function build(tasks: WorkflowTask[], args: Partial<Parameters<typeof buildRun>[0]> = {}) {
  return buildRun({
    workflow: workflow(tasks),
    subject,
    anchorDate: "2026-03-10",
    context: {},
    roles: ROLES,
    employees: EMPLOYEES,
    startedBy: "System",
    trigger: "manual",
    ...args,
  });
}

describe("buildRun", () => {
  it("derives a deterministic id so a repeated trigger is a no-op", () => {
    expect(build([task({ id: "T1" })]).id).toBe(runIdFor("WF-TEST", "CAND-1"));
  });

  it("turns day offsets into real dates from the anchor", () => {
    const run = build([
      task({ id: "T1", dueDayOffset: 0 }),
      task({ id: "T2", order: 2, dueDayOffset: 5 }),
      task({ id: "T3", order: 3, dueDayOffset: -14 }),
    ]);
    expect(run.tasks.map((t) => t.dueDate)).toEqual([
      "2026-03-10",
      "2026-03-15",
      "2026-02-24",
    ]);
  });

  it("resolves a role assignee to the employee holding it", () => {
    const run = build([task({ id: "T1", assignee: { kind: "role", roleId: "ROLE-FIN" } })]);
    expect(run.tasks[0].assigneeEmployeeId).toBe("E-3");
    expect(run.tasks[0].assigneeName).toBe("Tunde Bello");
  });

  it("lets the record's own people beat the role table", () => {
    const run = build(
      [task({ id: "T1", assignee: { kind: "role", roleId: "ROLE-RECRUIT" } })],
      { overrides: { "ROLE-RECRUIT": { employeeId: "E-2", name: "Adaeze Eze" } } },
    );
    // Without the override this resolves to E-1, the same person as ROLE-HR.
    expect(run.tasks[0].assigneeEmployeeId).toBe("E-2");
  });

  it("names the role when nobody holds it, rather than going nowhere", () => {
    const run = build([
      task({ id: "T1", assignee: { kind: "role", roleId: "ROLE-NOBODY" } }),
    ]);
    expect(run.tasks[0].assigneeEmployeeId).toBeNull();
    expect(run.tasks[0].assigneeName).toBe("Unassigned");
  });

  it("opens tasks with no dependencies and blocks the rest", () => {
    const run = build([
      task({ id: "T1" }),
      task({ id: "T2", order: 2, dependsOn: ["T1"] }),
    ]);
    expect(run.tasks[0].status).toBe("not_started");
    expect(run.tasks[1].status).toBe("blocked");
  });

  it("rewrites dependencies to run-task ids", () => {
    const run = build([
      task({ id: "T1" }),
      task({ id: "T2", order: 2, dependsOn: ["T1"] }),
    ]);
    expect(run.tasks[1].dependsOn).toEqual([run.tasks[0].id]);
  });

  it("skips a task whose condition does not hold, and unblocks what waited on it", () => {
    const run = build(
      [
        task({ id: "T1", condition: "remote_worker" }),
        task({ id: "T2", order: 2, dependsOn: ["T1"] }),
      ],
      { context: { remote_worker: false } },
    );
    expect(run.tasks[0].status).toBe("skipped");
    // A skipped task counts as satisfied, or its dependants wait forever.
    expect(run.tasks[1].status).toBe("not_started");
  });

  it("keeps a conditional task when its condition holds", () => {
    const run = build([task({ id: "T1", condition: "remote_worker" })], {
      context: { remote_worker: true },
    });
    expect(run.tasks[0].status).toBe("not_started");
  });
});

import { describe, expect, it } from "vitest";
import { canActOnStep, resolveApprover } from "./approver-resolution";
import type { LocaleBundle } from "@/src/lib/types/locale";
import type { ApprovalSubmitter } from "@/src/lib/types/approvals";

const bundle = {
  employees: [
    { id: "E-1", fullName: "Amara Okafor", managerId: "E-2", departmentId: "D-1" },
    { id: "E-2", fullName: "Tunde Bello", departmentId: "D-1" },
    { id: "E-3", fullName: "Adaeze Eze", departmentId: "D-1" },
  ],
  departments: [{ id: "D-1", headEmployeeId: "E-2" }],
  // The collision this feature exists to escape: two roles, one human.
  roles: [
    { id: "ROLE-HRADMIN", name: "HR Admin", linkedEmployeeId: "E-2" },
    { id: "ROLE-RECRUIT", name: "Recruiter", linkedEmployeeId: "E-2" },
  ],
} as unknown as LocaleBundle;

const submitter = { employeeId: "E-1" } as ApprovalSubmitter;

describe("EMP: approver resolver", () => {
  it("resolves straight to the named person", () => {
    expect(resolveApprover("EMP:E-3", submitter, bundle)).toEqual({
      employeeId: "E-3",
      employeeName: "Adaeze Eze",
    });
  });

  it("resolves to nobody when the employee is unknown", () => {
    expect(resolveApprover("EMP:E-404", submitter, bundle)).toEqual({
      employeeId: null,
      employeeName: null,
    });
  });

  it("names a different person than the colliding roles do", () => {
    const viaRole = resolveApprover("ROLE:ROLE-RECRUIT", submitter, bundle);
    const viaPerson = resolveApprover("EMP:E-3", submitter, bundle);
    expect(viaRole.employeeId).toBe("E-2");
    expect(viaPerson.employeeId).toBe("E-3");
  });

  it("lets only the named person act", () => {
    expect(canActOnStep("EMP:E-3", "E-3", "E-3", "ROLE-HRADMIN")).toBe(true);
  });

  it("does not let a role holder act on a step addressed to a person", () => {
    // The whole point of naming someone is that a role match must not widen it.
    expect(canActOnStep("EMP:E-3", "E-3", "E-2", "ROLE-HRADMIN")).toBe(false);
  });

  it("still lets any holder of a role act on a role step", () => {
    expect(canActOnStep("ROLE:ROLE-HRADMIN", "E-2", "E-9", "ROLE-HRADMIN")).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { mandatoryCompliance } from "./mandatory-compliance";

const TODAY = new Date("2026-09-24T00:00:00Z");
const people = [
  { id: "A", fullName: "Ada", departmentName: "Finance", status: "active" },
  { id: "B", fullName: "Bola", departmentName: "Finance", status: "active" },
  { id: "C", fullName: "Chi", departmentName: "Sales", status: "active" },
  { id: "X", fullName: "Gone", departmentName: "Sales", status: "terminated" },
];
const courses = [
  { id: "AML", title: "AML" },
  { id: "HS", title: "Health & Safety" },
];

describe("mandatoryCompliance", () => {
  it("scores every current employee against every mandatory course", () => {
    const r = mandatoryCompliance(
      people,
      courses,
      [
        { employeeId: "A", courseId: "AML", status: "completed" },
        { employeeId: "A", courseId: "HS", status: "completed" },
        { employeeId: "B", courseId: "AML", status: "completed" },
        // In progress and not yet due — neither complete nor overdue.
        { employeeId: "B", courseId: "HS", status: "in_progress", dueDate: "2026-10-30" },
        // Past due.
        { employeeId: "C", courseId: "AML", status: "in_progress", dueDate: "2026-09-01" },
        // Leavers are out of scope however late they are.
        { employeeId: "X", courseId: "AML", status: "in_progress", dueDate: "2020-01-01" },
      ],
      TODAY,
    );
    expect(r.required).toBe(6);
    expect(r.completed).toBe(3);
    expect(r.completionRate).toBe(50);
    // C was never enrolled on HS — that counts as overdue too.
    expect(r.overdue.map((o) => `${o.employeeId}:${o.courseId}`).sort()).toEqual([
      "C:AML",
      "C:HS",
    ]);
    expect(r.employeesOverdue).toBe(1);
    expect(r.departments.find((d) => d.department === "Sales")).toMatchObject({
      rate: 0,
      atRisk: true,
    });
    expect(r.departments.find((d) => d.department === "Finance")).toMatchObject({
      rate: 75,
      atRisk: true,
    });
    expect(r.departmentsAtRisk).toBe(2);
  });

  it("lets a completion win over another attempt at the same course", () => {
    const r = mandatoryCompliance(
      people.slice(0, 1),
      courses.slice(0, 1),
      [
        { employeeId: "A", courseId: "AML", status: "completed" },
        { employeeId: "A", courseId: "AML", status: "failed", dueDate: "2020-01-01" },
      ],
      TODAY,
    );
    expect(r.completionRate).toBe(100);
    expect(r.overdue).toEqual([]);
  });
});

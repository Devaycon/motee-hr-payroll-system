import { describe, expect, it } from "vitest";
import { departmentLeaveReport } from "./department-ranking";

const req = (department: string, totalDays: number, over: Record<string, unknown> = {}) => ({
  status: "approved" as const,
  startDate: "2026-03-01",
  department,
  totalDays,
  leaveType: "annual" as const,
  employeeId: `${department}-${totalDays}`,
  employeeName: "x",
  ...over,
});

describe("departmentLeaveReport", () => {
  it("names every department tied for the most leave, and gives tied rows the same rank", () => {
    const r = departmentLeaveReport(
      [req("Sales", 10), req("Ops", 6), req("Ops", 4), req("Finance", 3)],
      "2026",
    );
    expect(r.leaders).toEqual(["Ops", "Sales"]);
    expect(r.leaderDays).toBe(10);
    expect(r.rows.map((x) => [x.department, x.rank, x.tied])).toEqual([
      ["Ops", 1, true],
      ["Sales", 1, true],
      ["Finance", 3, false],
    ]);
  });

  it("only counts approved leave starting in the year", () => {
    const r = departmentLeaveReport(
      [
        req("Sales", 5),
        req("Sales", 9, { status: "pending" }),
        req("Sales", 7, { startDate: "2025-12-30" }),
      ],
      "2026",
    );
    expect(r.rows[0]).toMatchObject({ days: 5, requests: 1 });
  });

  it("keeps departments with no leave at the bottom and ranks fairly by days per employee", () => {
    const headcounts = new Map([
      ["Sales", 10],
      ["Ops", 2],
      ["Legal", 3],
    ]);
    const byDays = departmentLeaveReport([req("Sales", 12), req("Ops", 8)], "2026", headcounts);
    expect(byDays.rows.map((x) => x.department)).toEqual(["Sales", "Ops", "Legal"]);
    expect(byDays.rows[2]).toMatchObject({ days: 0, rank: 3 });

    const perHead = departmentLeaveReport([req("Sales", 12), req("Ops", 8)], "2026", headcounts, "perEmployee");
    expect(perHead.rows.map((x) => [x.department, x.daysPerEmployee])).toEqual([
      ["Ops", 4],
      ["Sales", 1.2],
      ["Legal", 0],
    ]);
  });

  it("has no leader when nobody took leave", () => {
    expect(departmentLeaveReport([], "2026", new Map([["Sales", 3]])).leaders).toEqual([]);
  });
});

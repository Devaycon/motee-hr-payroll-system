import { describe, expect, it } from "vitest";
import type { LocaleLoan } from "@/src/lib/types/locale";
import type { ApprovalRequest } from "@/src/lib/types/approvals";
import {
  breakdownByType,
  monthlyRepayment,
  outstandingBalance,
  repaymentSchedule,
  summariseLoans,
  withApproval,
} from "./loans";

const TODAY = new Date("2026-09-24T00:00:00Z");

const loan = (over: Partial<LocaleLoan> = {}): LocaleLoan => ({
  id: "L1",
  employeeId: "E1",
  loanType: "staff_loan",
  amount: 5000,
  currency: "GBP",
  repaymentMonths: 12,
  monthlyRepayment: monthlyRepayment(5000, 12),
  amountRepaid: 0,
  requestedAt: "2026-01-01",
  issuedAt: "2026-01-01",
  status: "active",
  ...over,
});

describe("repaymentSchedule", () => {
  it("splits the loan into equal instalments with the last one absorbing rounding", () => {
    const s = repaymentSchedule(loan(), TODAY);
    expect(s).toHaveLength(12);
    expect(s[0]).toMatchObject({ dueDate: "2026-02-01", amount: 416.67 });
    const total = s.reduce((sum, i) => sum + i.amount, 0);
    expect(Math.round(total * 100) / 100).toBe(5000);
    expect(s[11].balanceAfter).toBe(0);
  });

  it("marks paid instalments in order, the current month due, and missed ones overdue", () => {
    // Seven instalments (Feb–Aug) have fallen; five have been paid.
    const s = repaymentSchedule(loan({ amountRepaid: 416.67 * 5 }), TODAY);
    expect(s.slice(0, 5).every((i) => i.status === "paid")).toBe(true);
    expect(s[5]).toMatchObject({ dueDate: "2026-07-01", status: "overdue" });
    expect(s[6]).toMatchObject({ dueDate: "2026-08-01", status: "overdue" });
    expect(s[7]).toMatchObject({ dueDate: "2026-09-01", status: "due" });
    expect(s[8].status).toBe("upcoming");
  });

  it("has no schedule until the loan is issued", () => {
    expect(repaymentSchedule(loan({ status: "pending", issuedAt: null }), TODAY)).toEqual([]);
  });
});

describe("outstandingBalance", () => {
  it("is principal less repayments, and zero for anything never disbursed", () => {
    expect(outstandingBalance(loan({ amountRepaid: 1000 }))).toBe(4000);
    expect(outstandingBalance(loan({ status: "pending" }))).toBe(0);
    expect(outstandingBalance(loan({ status: "rejected" }))).toBe(0);
  });
});

describe("withApproval", () => {
  const req = (status: ApprovalRequest["status"]): ApprovalRequest =>
    ({
      status,
      submittedAt: "2026-09-01T10:00:00Z",
      history: [{ id: "h", at: "2026-09-03T09:00:00Z", actorEmployeeId: "F", actorName: "Fin", type: "approved" }],
    }) as unknown as ApprovalRequest;

  it("activates a pending loan when its chain approves, issuing it on the approval date", () => {
    expect(withApproval(loan({ status: "pending", issuedAt: null }), req("approved"))).toMatchObject({
      status: "active",
      issuedAt: "2026-09-03",
    });
  });

  it("rejects it when the chain rejects, and leaves it pending while in progress", () => {
    expect(withApproval(loan({ status: "pending", issuedAt: null }), req("rejected")).status).toBe("rejected");
    expect(withApproval(loan({ status: "pending", issuedAt: null }), req("in_progress")).status).toBe("pending");
  });

  it("never overrides a loan that has already moved on", () => {
    expect(withApproval(loan({ status: "closed" }), req("in_progress")).status).toBe("closed");
  });
});

describe("summariseLoans / breakdownByType", () => {
  const book = [
    loan({ id: "A", amount: 1200, repaymentMonths: 12, monthlyRepayment: 100, amountRepaid: 700 }),
    loan({ id: "B", status: "defaulted", amount: 1000, amountRepaid: 200 }),
    loan({ id: "C", status: "closed", amount: 500, amountRepaid: 500, loanType: "salary_advance" }),
    loan({ id: "D", status: "pending", issuedAt: null, amount: 800, loanType: "salary_advance" }),
    loan({ id: "E", status: "rejected", issuedAt: null, amount: 900 }),
  ];

  it("reports the dashboard KPIs", () => {
    expect(summariseLoans(book, TODAY)).toEqual({
      activeLoans: 1,
      loanValue: 2200,
      outstanding: 1300,
      // A has paid Feb–Aug, so September's instalment is the one due now.
      dueThisMonth: 1,
      pending: 1,
      defaulted: 1,
      recoveryRate: Math.round((1400 / 2700) * 100),
    });
  });

  it("groups by loan type, leaving rejected requests out", () => {
    expect(breakdownByType(book)).toEqual([
      { loanType: "staff_loan", count: 2, value: 2200, outstanding: 1300 },
      { loanType: "salary_advance", count: 2, value: 1300, outstanding: 0 },
    ]);
  });
});
